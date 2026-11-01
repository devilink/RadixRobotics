import { describe, expect, it } from "vitest";
import { CHALLENGES, checkSolution, parse, simulate } from "@/lib/student/lab";
import { PROJECTS, levelForClass, parseClassNumber } from "@/lib/student/projects";
import { badges, summarise } from "@/lib/student/badges";

const program = (src: string) => {
  const p = parse(src);
  if (!p.ok) throw new Error(`line ${p.line}: ${p.error}`);
  return p.program;
};

describe("virtual lab language", () => {
  it("parses blocks and reports errors with line numbers", () => {
    expect(parse("repeat 3\n on red\n wait 1s\nend").ok).toBe(true);
    expect(parse("on purple")).toMatchObject({ ok: false, line: 1 });
    expect(parse("repeat 3\n on red")).toMatchObject({ ok: false, line: 1 });
    expect(parse("on red\nend")).toMatchObject({ ok: false, line: 2 });
    expect(parse("else")).toMatchObject({ ok: false });
    expect(parse("wait 99999")).toMatchObject({ ok: false });
    expect(parse("# just a comment\n\nON Red // shout").ok).toBe(true);
  });

  it("simulates time and sensors", async () => {
    const sim = await simulate(program("on red\nwait 200\nif dark\n on green\nelse\n on yellow\nend"), { dark: true }, 10_000);
    expect(sim.endT).toBe(200);
    expect(sim.final).toMatchObject({ red: true, green: true, yellow: false });
  });

  it("stops loops that never wait instead of freezing", async () => {
    const empty = await simulate(program("forever\nend"), {}, 10_000);
    expect(empty.run.error).toMatch(/without any wait/);
    const busy = await simulate(program("forever\n on red\n off red\nend"), {}, 10_000);
    expect(busy.run.error).toMatch(/without any wait/);
    const timed = await simulate(program("forever\n wait 100\nend"), {}, 1_000);
    expect(timed.run.status).toBe("timeout");
  });
});

const SOLUTIONS: Record<string, string> = {
  blink: "repeat 3\n on red\n wait 300\n off red\n wait 300\nend",
  traffic: "on green\nwait 2s\noff green\non yellow\nwait 1s\noff yellow\non red\nwait 2s\noff red",
  "night-lamp": "forever\n if dark\n  on green\n else\n  off green\n end\n wait 100\nend",
  doorbell: "forever\n if pressed\n  on yellow\n  beep 300\n  off yellow\n end\n wait 50\nend",
  sos: "repeat 3\n beep 150\n wait 150\nend\nrepeat 3\n beep 500\n wait 150\nend\nrepeat 3\n beep 150\n wait 150\nend",
};

describe("lab challenges", () => {
  it("has a working solution for every challenge", async () => {
    for (const c of CHALLENGES) {
      expect(SOLUTIONS[c.id], `solution for ${c.id}`).toBeDefined();
      const r = await checkSolution(c.id, SOLUTIONS[c.id]);
      expect(r, c.id).toMatchObject({ pass: true });
    }
  });

  it("does not accept the starter code as a solution", async () => {
    for (const c of CHALLENGES) expect((await checkSolution(c.id, c.starter)).pass, c.id).toBe(false);
  });

  it("rejects common mistakes", async () => {
    expect((await checkSolution("traffic", "on green\non yellow\non red\nwait 1s")).message).toMatch(/on together/);
    expect((await checkSolution("night-lamp", "forever\n on green\n wait 100\nend")).pass).toBe(false);
    expect((await checkSolution("doorbell", "beep 300\non yellow")).pass).toBe(false);
    expect((await checkSolution("sos", "repeat 9\n beep 150\nend")).message).toMatch(/run together/);
    expect((await checkSolution("nope", "on red")).pass).toBe(false);
  });
});

describe("student projects", () => {
  it("covers every level with valid blueprints", () => {
    for (const level of ["primary", "intermediate", "advanced"] as const) {
      expect(PROJECTS.filter((p) => p.level === level).length).toBeGreaterThanOrEqual(3);
    }
    expect(new Set(PROJECTS.map((p) => p.slug)).size).toBe(PROJECTS.length);
    for (const p of PROJECTS) {
      const ids = new Set(p.blueprint.nodes.map((n) => n.id));
      for (const e of p.blueprint.edges) expect(ids.has(e.from) && ids.has(e.to), `${p.slug}: ${e.from}→${e.to}`).toBe(true);
      // Two edges on the same pair draw on top of each other and their labels collide.
      const pairs = p.blueprint.edges.map((e) => [e.from, e.to].sort().join("|"));
      expect(new Set(pairs).size, `${p.slug} has overlapping edges`).toBe(pairs.length);
      expect(p.steps.length).toBeGreaterThan(0);
    }
  });

  it("reads class numbers from group names", () => {
    expect(parseClassNumber("Class 7 B")).toBe(7);
    expect(parseClassNumber(null, "Grade 10 Robotics")).toBe(10);
    expect(parseClassNumber("Class VIII")).toBe(8);
    expect(parseClassNumber("Robotics Club")).toBeNull();
    expect(levelForClass(4)).toBe("primary");
    expect(levelForClass(9)).toBe("intermediate");
    expect(levelForClass(11)).toBe("advanced");
  });

  it("awards badges from progress", () => {
    const now = new Date("2026-11-01T10:00:00Z");
    const rows = [
      { topic_id: "project:traffic-light", progress_percentage: 100, is_completed: true, last_watched_at: "2026-10-31T10:00:00Z" },
      { topic_id: "project:smart-dustbin", progress_percentage: 40, is_completed: false, last_watched_at: "2026-10-30T10:00:00Z" },
      { topic_id: "lab:blink", progress_percentage: 100, is_completed: true, last_watched_at: "2026-11-01T09:00:00Z" },
    ];
    const s = summarise(rows, now);
    expect(s).toMatchObject({ projectsStarted: 2, projectsDone: 1, labSolved: 1, activeDays: 3 });
    const earned = badges(s, 92).filter((b) => b.earned).map((b) => b.id);
    expect(earned).toEqual(["spark", "maker", "coder", "streak", "present"]);
  });
});
