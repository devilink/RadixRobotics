// Virtual lab: a tiny robot-board language, its interpreter and the lab challenges.
// Pure TypeScript with no browser or server APIs, so the same checker runs in the
// browser (instant feedback) and in the server action (before saving a badge).
//
// Language (one command per line, # starts a comment):
//   on red | yellow | green | buzzer | all   (several allowed: on red green)
//   off red | yellow | green | buzzer | all
//   wait 500        milliseconds; also 1s, 0.5s
//   beep 200        buzzer on for that long, then off
//   repeat 3 … end
//   forever … end
//   if dark | light | pressed | released … [else …] end

export type Device = 'red' | 'yellow' | 'green' | 'buzzer';
export const LEDS = ['red', 'yellow', 'green'] as const;
const DEVICES: Device[] = ['red', 'yellow', 'green', 'buzzer'];
type Cond = 'dark' | 'light' | 'pressed' | 'released';

export type Stmt =
  | { kind: 'set'; on: boolean; devices: Device[]; line: number }
  | { kind: 'wait'; ms: number; line: number }
  | { kind: 'beep'; ms: number; line: number }
  | { kind: 'repeat'; times: number; body: Stmt[]; line: number }
  | { kind: 'forever'; body: Stmt[]; line: number }
  | { kind: 'if'; cond: Cond; then: Stmt[]; else: Stmt[]; line: number };

export type ParseResult = { ok: true; program: Stmt[] } | { ok: false; error: string; line: number };

export const MAX_SOURCE = 4000;
const MAX_LINES = 200;

function parseDuration(tok: string | undefined): number | null {
  if (!tok) return null;
  const m = tok.match(/^(\d+(?:\.\d+)?)(ms|s)?$/);
  if (!m) return null;
  const ms = Math.round(Number(m[1]) * (m[2] === 's' ? 1000 : 1));
  return ms >= 1 && ms <= 10_000 ? ms : null;
}

export function parse(source: string): ParseResult {
  if (source.length > MAX_SOURCE) return { ok: false, error: 'Program is too long.', line: 1 };
  const lines = source.split(/\r?\n/);
  if (lines.length > MAX_LINES) return { ok: false, error: `Keep it under ${MAX_LINES} lines.`, line: MAX_LINES };

  type Frame = { stmt: Stmt | null; body: Stmt[]; inElse?: boolean };
  const root: Frame = { stmt: null, body: [] };
  const stack: Frame[] = [root];
  const top = () => stack[stack.length - 1];

  for (let i = 0; i < lines.length; i++) {
    const line = i + 1;
    const text = lines[i].replace(/(#|\/\/).*$/, '').trim().toLowerCase();
    if (!text) continue;
    const [cmd, ...args] = text.split(/\s+/);
    const fail = (error: string): ParseResult => ({ ok: false, error, line });

    switch (cmd) {
      case 'on':
      case 'off': {
        if (!args.length) return fail(`Say what to turn ${cmd}: red, yellow, green, buzzer or all.`);
        const devices = new Set<Device>();
        for (const a of args) {
          if (a === 'all') DEVICES.forEach((d) => devices.add(d));
          else if ((DEVICES as string[]).includes(a)) devices.add(a as Device);
          else return fail(`"${a}" is not a part on this board. Try red, yellow, green, buzzer or all.`);
        }
        top().body.push({ kind: 'set', on: cmd === 'on', devices: [...devices], line });
        break;
      }
      case 'wait':
      case 'beep': {
        const ms = parseDuration(args[0]);
        if (ms === null || args.length > 1) return fail(`${cmd} needs a time from 1 to 10000 ms, e.g. "${cmd} 500" or "${cmd} 1s".`);
        top().body.push({ kind: cmd, ms, line });
        break;
      }
      case 'repeat': {
        const n = Number(args[0]);
        if (!Number.isInteger(n) || n < 1 || n > 100 || args.length > 1) return fail('repeat needs a whole number from 1 to 100, e.g. "repeat 3".');
        const stmt: Stmt = { kind: 'repeat', times: n, body: [], line };
        top().body.push(stmt);
        stack.push({ stmt, body: stmt.body });
        break;
      }
      case 'forever': {
        if (args.length) return fail('forever does not take a number. Use "repeat 5" to loop a fixed number of times.');
        const stmt: Stmt = { kind: 'forever', body: [], line };
        top().body.push(stmt);
        stack.push({ stmt, body: stmt.body });
        break;
      }
      case 'if': {
        const c = args[0];
        if (!c || !['dark', 'light', 'pressed', 'released'].includes(c) || args.length > 1) {
          return fail('if needs a sensor check: dark, light, pressed or released.');
        }
        const stmt: Stmt = { kind: 'if', cond: c as Cond, then: [], else: [], line };
        top().body.push(stmt);
        stack.push({ stmt, body: stmt.then });
        break;
      }
      case 'else': {
        const f = top();
        if (f.stmt?.kind !== 'if' || f.inElse) return fail('else must come inside an if, before its end.');
        f.inElse = true;
        f.body = f.stmt.else;
        break;
      }
      case 'end': {
        if (stack.length === 1) return fail('This end has no repeat, forever or if to close.');
        stack.pop();
        break;
      }
      default:
        return fail(`I don't know "${cmd}". Commands: on, off, wait, beep, repeat, forever, if, else, end.`);
    }
  }
  if (stack.length > 1) {
    const open = top().stmt!;
    return { ok: false, error: `The ${open.kind} on line ${open.line} needs an end.`, line: open.line };
  }
  return { ok: true, program: root.body };
}

/* ------------------------------------------------------------------ running */

export type BoardState = Record<Device, boolean>;
export const emptyBoard = (): BoardState => ({ red: false, yellow: false, green: false, buzzer: false });

export interface LabIO {
  /** Live sensor readings. */
  dark(): boolean;
  pressed(): boolean;
  set(device: Device, on: boolean): void;
  /** Real time in the browser, instant in simulations. */
  wait(ms: number): Promise<void>;
  line?(line: number): void;
  stopped?(): boolean;
}

export type RunStatus = { status: 'done' | 'stopped' | 'timeout'; error?: string };

// A loop that never waits would freeze the page; stop it with a friendly message.
const BUSY_LIMIT = 20_000;

class Halt extends Error {
  constructor(public status: RunStatus) {
    super(status.error ?? status.status);
  }
}

export async function execute(program: Stmt[], io: LabIO, maxTimeMs = Infinity): Promise<RunStatus> {
  let elapsed = 0;
  let busy = 0;

  const pause = async (ms: number) => {
    if (elapsed + ms > maxTimeMs) {
      await io.wait(Math.max(0, maxTimeMs - elapsed));
      elapsed = maxTimeMs;
      throw new Halt({ status: 'timeout' });
    }
    await io.wait(ms);
    elapsed += ms;
    busy = 0;
    if (io.stopped?.()) throw new Halt({ status: 'stopped' });
  };

  const run = async (body: Stmt[]): Promise<void> => {
    for (const s of body) {
      if (io.stopped?.()) throw new Halt({ status: 'stopped' });
      if (++busy > BUSY_LIMIT) {
        throw new Halt({ status: 'done', error: `The loop on line ${s.line} runs without any wait. Add "wait 100" inside it.` });
      }
      io.line?.(s.line);
      switch (s.kind) {
        case 'set':
          s.devices.forEach((d) => io.set(d, s.on));
          break;
        case 'wait':
          await pause(s.ms);
          break;
        case 'beep':
          io.set('buzzer', true);
          try {
            await pause(s.ms);
          } finally {
            io.set('buzzer', false);
          }
          break;
        case 'repeat':
          for (let i = 0; i < s.times; i++) await run(s.body);
          break;
        case 'forever':
          // Ends only through Halt: a stop, the time limit or the busy-loop guard
          // (counted per pass too, so an empty forever cannot spin).
          for (;;) {
            if (++busy > BUSY_LIMIT) throw new Halt({ status: 'done', error: `The loop on line ${s.line} runs without any wait. Add "wait 100" inside it.` });
            await run(s.body);
          }
        case 'if': {
          const v = s.cond === 'dark' ? io.dark() : s.cond === 'light' ? !io.dark() : s.cond === 'pressed' ? io.pressed() : !io.pressed();
          await run(v ? s.then : s.else);
          break;
        }
      }
    }
  };

  try {
    await run(program);
    return { status: 'done' };
  } catch (e) {
    if (e instanceof Halt) return e.status;
    throw e;
  }
}

/* --------------------------------------------------------------- simulation */

export type TraceEvent = { t: number; device: Device; on: boolean };
export type SimResult = { trace: TraceEvent[]; final: BoardState; endT: number; run: RunStatus };

/** Runs a program instantly against fixed sensor readings, recording every change. */
export async function simulate(program: Stmt[], sensors: { dark?: boolean; pressed?: boolean }, maxTimeMs: number): Promise<SimResult> {
  const state = emptyBoard();
  const trace: TraceEvent[] = [];
  let t = 0;
  const run = await execute(
    program,
    {
      dark: () => !!sensors.dark,
      pressed: () => !!sensors.pressed,
      set: (d, on) => {
        if (state[d] !== on) trace.push({ t, device: d, on });
        state[d] = on;
      },
      wait: async (ms) => {
        t += ms;
      },
    },
    maxTimeMs,
  );
  return { trace, final: { ...state }, endT: t, run };
}

type Interval = { device: Device; start: number; end: number };

function intervals(sim: SimResult, device?: Device): Interval[] {
  const open = new Map<Device, number>();
  const out: Interval[] = [];
  for (const e of sim.trace) {
    if (e.on) open.set(e.device, e.t);
    else if (open.has(e.device)) {
      out.push({ device: e.device, start: open.get(e.device)!, end: e.t });
      open.delete(e.device);
    }
  }
  for (const [d, start] of open) out.push({ device: d, start, end: sim.endT });
  return out.filter((i) => !device || i.device === device).sort((a, b) => a.start - b.start || a.end - b.end);
}

/* --------------------------------------------------------------- challenges */

export type CheckResult = { pass: boolean; message: string };

export interface LabChallenge {
  id: string;
  title: string;
  difficulty: 1 | 2 | 3;
  story: string;
  goal: string;
  hint: string;
  starter: string;
  check(program: Stmt[]): Promise<CheckResult>;
}

const ok = (message: string): CheckResult => ({ pass: true, message });
const no = (message: string): CheckResult => ({ pass: false, message });

export const CHALLENGES: LabChallenge[] = [
  {
    id: 'blink',
    title: 'Hello, LED!',
    difficulty: 1,
    story: 'Every robot engineer starts here: make a light blink.',
    goal: 'Blink the red LED at least 3 times.',
    hint: 'Put "on red", "wait", "off red", "wait" inside "repeat 3 … end".',
    starter: '# Blink the red LED\non red\nwait 500\noff red\n',
    async check(p) {
      const sim = await simulate(p, {}, 30_000);
      if (sim.run.error) return no(sim.run.error);
      const blinks = intervals(sim, 'red').filter((i) => i.end - i.start >= 100).length;
      return blinks >= 3 ? ok(`Red blinked ${blinks} times. Your first program works!`) : no(`Red blinked ${blinks} time${blinks === 1 ? '' : 's'}. It needs at least 3, each lasting 100 ms or more.`);
    },
  },
  {
    id: 'traffic',
    title: 'Traffic Light',
    difficulty: 1,
    story: 'The school crossing light is broken. Program a new one.',
    goal: 'Show green, then yellow, then red — only one light on at a time.',
    hint: 'Turn each light on, wait, and turn it off before the next one comes on.',
    starter: '# Green -> yellow -> red\non green\nwait 2s\noff green\n',
    async check(p) {
      const sim = await simulate(p, {}, 60_000);
      if (sim.run.error) return no(sim.run.error);
      const lit = intervals(sim).filter((i) => i.device !== 'buzzer' && i.end - i.start >= 200);
      for (let a = 0; a < lit.length; a++) {
        for (let b = a + 1; b < lit.length; b++) {
          if (lit[a].start < lit[b].end && lit[b].start < lit[a].end) {
            return no(`${cap(lit[a].device)} and ${lit[b].device} were on together. Turn one off before the next comes on.`);
          }
        }
      }
      const order = lit.map((i) => i.device).join(' ');
      return order.includes('green yellow red')
        ? ok('Green, yellow, red. The crossing is safe again!')
        : no(lit.length ? `The lights went: ${order}. They should go green, yellow, red (each 200 ms or more).` : 'No light stayed on for 200 ms. Add a wait after each "on".');
    },
  },
  {
    id: 'night-lamp',
    title: 'Night Lamp',
    difficulty: 2,
    story: 'Little sister is scared of the dark. Build her a lamp that switches itself on.',
    goal: 'Keep checking the light sensor: green on when it is dark, off when it is light.',
    hint: 'Inside "forever": if dark → on green, else → off green, then wait 100.',
    starter: '# Use the day/night switch to test\nforever\n  on green\n  wait 100\nend\n',
    async check(p) {
      for (const dark of [true, false]) {
        const sim = await simulate(p, { dark }, 5_000);
        if (sim.run.error) return no(sim.run.error);
        if (sim.final.green !== dark) {
          return no(dark ? 'In the dark the green lamp should be on.' : 'In daylight the green lamp should be off. Try adding an else.');
        }
      }
      return ok('On at night, off in the day. She can sleep now!');
    },
  },
  {
    id: 'doorbell',
    title: 'Doorbell',
    difficulty: 2,
    story: 'Visitors keep knocking. Give the lab a doorbell.',
    goal: 'When the button is pressed, beep and flash yellow. When it is not pressed, stay quiet and dark.',
    hint: 'forever → if pressed → on yellow, beep 300, off yellow → end → wait 50 → end',
    starter: '# Hold the button to test\nforever\n  if pressed\n    beep 300\n  end\n  wait 50\nend\n',
    async check(p) {
      const pressed = await simulate(p, { pressed: true }, 5_000);
      const idle = await simulate(p, { pressed: false }, 5_000);
      const err = pressed.run.error ?? idle.run.error;
      if (err) return no(err);
      const ever = (s: SimResult, d: Device) => s.trace.some((e) => e.device === d && e.on);
      if (!ever(pressed, 'buzzer')) return no('Pressing the button should make a beep.');
      if (!ever(pressed, 'yellow')) return no('Pressing the button should flash the yellow light.');
      if (ever(idle, 'buzzer') || ever(idle, 'yellow')) return no('Nobody pressed the button, but it still beeped or flashed. Put everything inside "if pressed".');
      return ok('Ding-dong! Visitors can ring now.');
    },
  },
  {
    id: 'sos',
    title: 'SOS Signal',
    difficulty: 3,
    story: 'Your rover is stuck in a crater. Call for help in Morse code!',
    goal: 'Beep SOS: 3 short beeps, 3 long beeps, 3 short beeps. Short is under 300 ms, long is 300 ms or more, with a small wait between beeps.',
    hint: 'repeat 3 → beep 150, wait 150 → end, then the same with beep 500, then short again.',
    starter: '# ... --- ...\nrepeat 3\n  beep 150\n  wait 150\nend\n',
    async check(p) {
      const sim = await simulate(p, {}, 30_000);
      if (sim.run.error) return no(sim.run.error);
      const beeps = intervals(sim, 'buzzer');
      for (let i = 1; i < Math.min(beeps.length, 9); i++) {
        if (beeps[i].start - beeps[i - 1].end < 50) return no(`Beeps ${i} and ${i + 1} run together. Add "wait 100" between beeps.`);
      }
      const code = beeps.slice(0, 9).map((b) => (b.end - b.start < 300 ? '.' : '-')).join('');
      return code === '...---...'
        ? ok('... --- ... Help is on the way, commander!')
        : no(`Your signal was "${code || 'silent'}". SOS is "...---...".`);
    },
  },
];

export const CHALLENGE_BY_ID = new Map(CHALLENGES.map((c) => [c.id, c]));
export const labTopicId = (id: string) => `lab:${id}`;

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Parse + check in one go (used by the server action before saving a badge). */
export async function checkSolution(challengeId: string, source: string): Promise<CheckResult> {
  const ch = CHALLENGE_BY_ID.get(challengeId);
  if (!ch) return no('Unknown challenge.');
  const parsed = parse(source);
  if (!parsed.ok) return no(`Line ${parsed.line}: ${parsed.error}`);
  return ch.check(parsed.program);
}
