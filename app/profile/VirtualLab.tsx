"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Check, CircleHelp, Lightbulb, Moon, Play, RotateCcw, Send, Square, Sun, Volume2, VolumeX } from "lucide-react";
import { CHALLENGES, emptyBoard, execute, parse, type BoardState, type Device, type LabChallenge } from "@/lib/student/lab";
import { submitLabSolution } from "@/app/actions/studentHubActions";

const LED_STYLE: Record<"red" | "yellow" | "green", { on: string; glow: string; off: string }> = {
  red: { on: "#ff3b4f", glow: "rgba(255,59,79,0.75)", off: "#4a1a20" },
  yellow: { on: "#ffd23b", glow: "rgba(255,210,59,0.75)", off: "#4a3d14" },
  green: { on: "#2ff58b", glow: "rgba(47,245,139,0.7)", off: "#123a26" },
};

const SNIPPETS = ["on red", "off red", "wait 500", "beep 200", "repeat 3", "forever", "if dark", "if pressed", "else", "end"];

type Msg = { tone: "info" | "error" | "success"; text: string };
const storageKey = (id: string) => `radix-lab:${id}`;

/** The digital classroom: a programmable robot board with challenges. */
export default function VirtualLab({ solved, onSolved }: { solved: Set<string>; onSolved: (id: string) => void }) {
  const [active, setActive] = useState<LabChallenge>(() => CHALLENGES.find((c) => !solved.has(c.id)) ?? CHALLENGES[0]);
  const [source, setSource] = useState(active.starter);
  const [board, setBoard] = useState<BoardState>(emptyBoard);
  const [running, setRunning] = useState(false);
  const [line, setLine] = useState<number | null>(null);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [dark, setDark] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [submitting, startSubmit] = useTransition();

  const darkRef = useRef(dark);
  const pressedRef = useRef(pressed);
  const mutedRef = useRef(muted);
  const stopRef = useRef(false);
  const wakeRef = useRef<(() => void) | null>(null);
  const audioRef = useRef<{ ctx: AudioContext; gain: GainNode } | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  useEffect(() => { darkRef.current = dark; }, [dark]);
  useEffect(() => { pressedRef.current = pressed; }, [pressed]);
  useEffect(() => {
    mutedRef.current = muted;
    if (muted && audioRef.current) audioRef.current.gain.gain.value = 0;
  }, [muted]);

  // Saved code per challenge, so students can come back to their work.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(storageKey(active.id)) : null;
    setSource(saved ?? active.starter);
    setMsg(null);
    setShowHint(false);
    setErrorLine(null);
  }, [active]);
  useEffect(() => {
    const t = setTimeout(() => { try { window.localStorage.setItem(storageKey(active.id), source); } catch { /* storage full or blocked */ } }, 400);
    return () => clearTimeout(t);
  }, [source, active.id]);

  const buzzer = useCallback((on: boolean) => {
    const a = audioRef.current;
    if (!a) return;
    a.gain.gain.setTargetAtTime(on && !mutedRef.current ? 0.06 : 0, a.ctx.currentTime, 0.005);
  }, []);

  const ensureAudio = () => {
    if (audioRef.current || typeof window === "undefined") return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 880;
    gain.gain.value = 0;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    audioRef.current = { ctx, gain };
  };

  const stop = () => {
    stopRef.current = true;
    wakeRef.current?.();
  };

  // Stop the program and silence the buzzer when leaving the lab.
  useEffect(() => () => {
    stopRef.current = true;
    wakeRef.current?.();
    audioRef.current?.ctx.close();
  }, []);

  const run = async () => {
    if (running) return;
    const parsed = parse(source);
    if (!parsed.ok) {
      setErrorLine(parsed.line);
      setMsg({ tone: "error", text: `Line ${parsed.line}: ${parsed.error}` });
      return;
    }
    ensureAudio();
    void audioRef.current?.ctx.resume();
    setErrorLine(null);
    setBoard(emptyBoard());
    setMsg({ tone: "info", text: "Running… try the day/night switch and the button." });
    setRunning(true);
    stopRef.current = false;
    const result = await execute(parsed.program, {
      dark: () => darkRef.current,
      pressed: () => pressedRef.current,
      set: (d: Device, on: boolean) => {
        setBoard((b) => (b[d] === on ? b : { ...b, [d]: on }));
        if (d === "buzzer") buzzer(on);
      },
      wait: (ms) => new Promise<void>((resolve) => {
        const id = setTimeout(() => { wakeRef.current = null; resolve(); }, ms);
        wakeRef.current = () => { clearTimeout(id); wakeRef.current = null; resolve(); };
      }),
      line: setLine,
      stopped: () => stopRef.current,
    });
    buzzer(false);
    setRunning(false);
    setLine(null);
    if (result.error) setMsg({ tone: "error", text: result.error });
    else if (result.status === "stopped") setMsg({ tone: "info", text: "Stopped." });
    else setMsg({ tone: "info", text: "Program finished. Press Check when you think it solves the challenge." });
  };

  const check = () => {
    const parsed = parse(source);
    if (!parsed.ok) {
      setErrorLine(parsed.line);
      setMsg({ tone: "error", text: `Line ${parsed.line}: ${parsed.error}` });
      return;
    }
    startSubmit(async () => {
      const local = await active.check(parsed.program);
      if (!local.pass) { setMsg({ tone: "error", text: local.message }); return; }
      const r = await submitLabSolution(active.id, source);
      if (r.ok) {
        onSolved(active.id);
        setMsg({ tone: "success", text: `${r.message ?? local.message} Challenge saved ✓` });
      } else {
        // Solved locally but not saved (e.g. saving not set up yet): still celebrate.
        setMsg({ tone: "success", text: `${local.message} (${r.error})` });
      }
    });
  };

  const insert = (snippet: string) => {
    const el = editorRef.current;
    if (!el) return setSource((s) => `${s}${s.endsWith("\n") || !s ? "" : "\n"}${snippet}\n`);
    const { selectionStart: a, selectionEnd: b } = el;
    const before = source.slice(0, a);
    const prefix = before && !before.endsWith("\n") ? "\n" : "";
    const indent = (before.split("\n").pop() ?? "").match(/^\s*/)?.[0] ?? "";
    const text = `${prefix}${prefix ? indent : ""}${snippet}\n`;
    const next = before + text + source.slice(b);
    setSource(next);
    requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = a + text.length; });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: a, selectionEnd: b } = el;
      setSource(source.slice(0, a) + "  " + source.slice(b));
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = a + 2; });
    } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void run();
    }
  };

  const lines = source.split("\n").length;
  const msgTone = msg?.tone === "error" ? "border-rose-500/30 bg-rose-500/10 text-rose-200" : msg?.tone === "success" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-sky-400/20 bg-sky-400/5 text-sky-200";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight">Virtual Lab</h1>
        <p className="mt-1 text-zinc-400">Your digital classroom: write a program, run it on the robot board, and solve challenges to earn badges.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[260px_1fr_360px]">
        {/* Challenges */}
        <aside aria-label="Challenges" className="min-w-0">
          <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">Challenges · {solved.size}/{CHALLENGES.length} solved</p>
          {/* A sideways-scrolling row on small screens, a column beside the editor on wide ones. */}
          <div className="max-xl:flex max-xl:gap-2 max-xl:overflow-x-auto max-xl:pb-2 xl:space-y-2">
          {CHALLENGES.map((c, i) => (
            <button key={c.id} type="button" onClick={() => { stop(); setActive(c); }} aria-current={active.id === c.id ? "true" : undefined}
              className={`flex items-center max-xl:w-52 max-xl:shrink-0 xl:w-full gap-3 rounded-2xl border p-3 text-left transition ${active.id === c.id ? "border-sky-400/50 bg-sky-400/10" : "border-white/10 bg-zinc-900/50 hover:border-white/25"}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${solved.has(c.id) ? "bg-emerald-400 text-zinc-950" : "bg-white/10"}`}>
                {solved.has(c.id) ? <Check aria-label="solved" className="h-4 w-4" /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{c.title}</span>
                <span className="text-xs text-amber-300/80" aria-label={`difficulty ${c.difficulty} of 3`}>{"★".repeat(c.difficulty)}<span className="text-zinc-700">{"★".repeat(3 - c.difficulty)}</span></span>
              </span>
            </button>
          ))}
          </div>
        </aside>

        {/* Editor */}
        <section aria-label="Program editor" className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
            <p className="text-sm italic text-zinc-400">{active.story}</p>
            <p className="mt-2 font-semibold">🎯 {active.goal}</p>
            <button type="button" onClick={() => setShowHint((h) => !h)} className="mt-3 flex items-center gap-1.5 text-sm text-amber-300 hover:text-amber-200">
              <Lightbulb aria-hidden className="h-4 w-4" /> {showHint ? "Hide hint" : "Need a hint?"}
            </button>
            {showHint && <p className="mt-2 rounded-xl bg-amber-300/10 px-3 py-2 font-mono text-sm text-amber-100">{active.hint}</p>}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d12]">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/70" /><span className="h-3 w-3 rounded-full bg-amber-400/70" /><span className="h-3 w-3 rounded-full bg-emerald-400/70" />
              <span className="ml-2 font-mono text-xs text-zinc-500">{active.id}.radix</span>
              <button type="button" onClick={() => { stop(); setSource(active.starter); }} className="ml-auto flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
                <RotateCcw aria-hidden className="h-3.5 w-3.5" /> Reset code
              </button>
            </div>
            <div className="flex">
              <div ref={gutterRef} aria-hidden className="h-80 select-none overflow-hidden border-r border-white/5 py-3 text-right font-mono text-sm leading-6 text-zinc-600">
                {Array.from({ length: lines }, (_, i) => (
                  <div key={i} className={`px-3 ${line === i + 1 ? "bg-sky-400/20 text-sky-300" : errorLine === i + 1 ? "bg-rose-500/20 text-rose-300" : ""}`}>
                    {line === i + 1 ? "▶" : i + 1}
                  </div>
                ))}
              </div>
              <label htmlFor="lab-editor" className="sr-only">Program for {active.title}</label>
              <textarea id="lab-editor" ref={editorRef} value={source} spellCheck={false} autoCapitalize="none" autoComplete="off"
                onChange={(e) => { setSource(e.target.value); setErrorLine(null); }}
                onKeyDown={onKeyDown}
                onScroll={(e) => { if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop; }}
                className="h-80 flex-1 resize-none bg-transparent px-4 py-3 font-mono text-sm leading-6 text-zinc-100 outline-none [tab-size:2]" />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5" aria-label="Insert a command">
            {SNIPPETS.map((s) => (
              <button key={s} type="button" onClick={() => insert(s)} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs text-zinc-300 hover:bg-white/10">{s}</button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {running ? (
              <button type="button" onClick={stop} className="flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-400">
                <Square aria-hidden className="h-4 w-4" /> Stop
              </button>
            ) : (
              <button type="button" onClick={run} className="flex items-center gap-2 rounded-full bg-sky-400 px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-sky-300">
                <Play aria-hidden className="h-4 w-4" /> Run
              </button>
            )}
            <button type="button" onClick={check} disabled={submitting} className="flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-emerald-300 disabled:opacity-60">
              <Send aria-hidden className="h-4 w-4" /> {submitting ? "Checking…" : "Check solution"}
            </button>
            <span className="text-xs text-zinc-500 max-sm:hidden">Ctrl + Enter to run</span>
          </div>

          <div aria-live="polite">
            {msg && <p className={`rounded-xl border px-4 py-3 text-sm ${msgTone}`}>{msg.text}</p>}
          </div>

          <details className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 text-sm">
            <summary className="flex cursor-pointer items-center gap-2 font-semibold text-zinc-300"><CircleHelp aria-hidden className="h-4 w-4" /> Command guide</summary>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono text-xs">
              <dt className="text-sky-300">on red / off red</dt><dd className="font-sans text-zinc-400">Turn a part on or off: red, yellow, green, buzzer, all</dd>
              <dt className="text-sky-300">wait 500</dt><dd className="font-sans text-zinc-400">Pause, in milliseconds (1000 ms = 1 second). Also 1s, 0.5s</dd>
              <dt className="text-sky-300">beep 200</dt><dd className="font-sans text-zinc-400">Sound the buzzer for that long</dd>
              <dt className="text-sky-300">repeat 3 … end</dt><dd className="font-sans text-zinc-400">Do the lines inside 3 times</dd>
              <dt className="text-sky-300">forever … end</dt><dd className="font-sans text-zinc-400">Keep doing them until you press Stop (include a wait!)</dd>
              <dt className="text-sky-300">if dark … else … end</dt><dd className="font-sans text-zinc-400">Check a sensor: dark, light, pressed, released</dd>
              <dt className="text-sky-300"># note</dt><dd className="font-sans text-zinc-400">A comment for humans; the robot ignores it</dd>
            </dl>
          </details>
        </section>

        {/* Board */}
        <section aria-label="Robot board" className="space-y-4">
          <Board board={board} dark={dark} running={running} />
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setDark((d) => !d)} aria-pressed={dark}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-4 text-sm font-semibold transition ${dark ? "border-indigo-400/50 bg-indigo-500/20 text-indigo-100" : "border-amber-300/40 bg-amber-300/10 text-amber-100"}`}>
              {dark ? <Moon aria-hidden className="h-5 w-5" /> : <Sun aria-hidden className="h-5 w-5" />} {dark ? "Night (dark)" : "Day (light)"}
            </button>
            <button type="button" aria-pressed={pressed}
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setPressed(true); }}
              onPointerUp={() => setPressed(false)} onPointerCancel={() => setPressed(false)}
              onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setPressed(true); } }}
              onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") setPressed(false); }}
              className={`touch-none select-none rounded-2xl border p-4 text-sm font-semibold transition ${pressed ? "translate-y-0.5 border-rose-400/60 bg-rose-500/30 text-white" : "border-white/15 bg-white/5 text-zinc-200"}`}>
              {pressed ? "Pressed!" : "Hold button"}
            </button>
          </div>
          <button type="button" onClick={() => setMuted((m) => !m)} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white">
            {muted ? <VolumeX aria-hidden className="h-4 w-4" /> : <Volume2 aria-hidden className="h-4 w-4" />} {muted ? "Sound off" : "Sound on"}
          </button>
        </section>
      </div>
    </div>
  );
}

/** The robot board drawing: three LEDs, a buzzer, a light sensor and a button. */
function Board({ board, dark, running }: { board: BoardState; dark: boolean; running: boolean }) {
  const leds = ["red", "yellow", "green"] as const;
  return (
    <svg viewBox="0 0 360 300" className="w-full rounded-3xl border border-white/10" role="img"
      aria-label={`Robot board. ${leds.map((l) => `${l} ${board[l] ? "on" : "off"}`).join(", ")}, buzzer ${board.buzzer ? "on" : "off"}.`}>
      <defs>
        <pattern id="pcb-grid" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M12 0H0V12" fill="none" stroke="rgba(255,255,255,0.05)" />
        </pattern>
        {leds.map((l) => (
          <radialGradient key={l} id={`glow-${l}`}>
            <stop offset="0%" stopColor={LED_STYLE[l].glow} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        ))}
      </defs>
      <rect width="360" height="300" fill={dark ? "#05060a" : "#0b2a22"} style={{ transition: "fill 300ms" }} />
      <rect width="360" height="300" fill="url(#pcb-grid)" />

      {/* Microcontroller */}
      <rect x="120" y="190" width="120" height="70" rx="6" fill="#111827" stroke="#334155" />
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          <rect x={128 + i * 13.5} y="184" width="5" height="8" fill="#94a3b8" />
          <rect x={128 + i * 13.5} y="258" width="5" height="8" fill="#94a3b8" />
        </g>
      ))}
      <text x="180" y="222" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="11" fill="#cbd5e1">RADIX</text>
      <text x="180" y="238" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fill={running ? "#38bdf8" : "#64748b"}>{running ? "● RUNNING" : "○ IDLE"}</text>

      {/* LEDs with traces */}
      {leds.map((l, i) => {
        const x = 70 + i * 110;
        const on = board[l];
        return (
          <g key={l}>
            <path d={`M${x} 110 V150 H${150 + i * 30} V184`} fill="none" stroke="#c9a227" strokeOpacity="0.5" strokeWidth="2" />
            {on && <circle cx={x} cy="70" r="55" fill={`url(#glow-${l})`} />}
            <ellipse cx={x} cy="96" rx="20" ry="6" fill="#1f2937" />
            <path d={`M${x - 18} 96 V68 a18 18 0 0 1 36 0 V96 Z`} fill={on ? LED_STYLE[l].on : LED_STYLE[l].off} stroke="rgba(255,255,255,0.25)" style={{ transition: "fill 80ms" }} />
            <ellipse cx={x - 7} cy="64" rx="4" ry="8" fill="white" fillOpacity={on ? 0.6 : 0.15} />
            <text x={x} y="130" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="10" fill="#94a3b8">{l.toUpperCase()}</text>
          </g>
        );
      })}

      {/* Buzzer */}
      <g>
        <circle cx="300" cy="225" r="22" fill="#0f172a" stroke="#475569" strokeWidth="2" />
        <circle cx="300" cy="225" r="5" fill="#1e293b" />
        {board.buzzer && [30, 40, 50].map((r, i) => (
          <circle key={r} cx="300" cy="225" r={r} fill="none" stroke="#38bdf8" strokeOpacity={0.6 - i * 0.18} strokeWidth="2">
            <animate attributeName="r" from={r - 8} to={r + 4} dur="0.4s" repeatCount="indefinite" />
          </circle>
        ))}
        <text x="300" y="270" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="10" fill="#94a3b8">BUZZER</text>
      </g>

      {/* Light sensor */}
      <g>
        <circle cx="60" cy="225" r="16" fill="#3f2a14" stroke="#a16207" />
        <path d="M50 220 h20 M50 225 h20 M50 230 h20" stroke="#fbbf24" strokeOpacity={dark ? 0.25 : 0.9} />
        <text x="60" y="270" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="10" fill="#94a3b8">LIGHT · {dark ? "DARK" : "BRIGHT"}</text>
      </g>
    </svg>
  );
}
