"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, ArrowRight, ArrowUp, BookOpen, CheckCircle2, ChevronRight, Circle, GraduationCap,
  Layers, PlayCircle, Search, Sparkles, X,
} from 'lucide-react';
import { curriculumData, levelMeta, Level } from './curriculumData';
import { getTopicDescription } from './topicDescriptions';
import { getStudentProgress, updateStudentProgress } from '@/app/actions/progressActions';
import styles from './CurriculumPage.module.css';

interface CurriculumPageProps {
  schoolName: string;
  userRole: string; // e.g., 'school_admin'
  schoolId: string;
  userId?: string;
}

type Lesson = {
  id: string;          // persisted in student_progress: cls-{class}-p{part}-t{topic}
  cls: number;
  level: Level;
  partIdx: number;
  topicIdx: number;
  session: number;     // 1-based session number within the class
  title: string;
};

type Module = { idx: number; name: string; title: string; range: string; lessons: Lesson[] };
type Progress = { pct: number; done: boolean; last?: string };

const LEVEL_ACCENT: Record<Level, string> = { p: '#fb923c', i: '#38bdf8', a: '#a78bfa' };
const LEVEL_FILTERS: { key: Level | 'all'; label: string; hint: string }[] = [
  { key: 'all', label: 'All classes', hint: '1–10' },
  { key: 'p', label: 'Primary', hint: '1–5' },
  { key: 'i', label: 'Intermediate', hint: '6–9' },
  { key: 'a', label: 'Advanced', hint: '10' },
];

/** "Part 1 — Foundation & Curiosity (Sessions 1–10)" → name, title, range. */
function parsePartLabel(label: string) {
  const m = label.match(/^(.*?)\s+—\s+(.*?)(?:\s+\((.*)\))?$/);
  return m ? { name: m[1], title: m[2], range: m[3] ?? '' } : { name: label, title: '', range: '' };
}

// The whole course, flattened once. Ids use the original part/topic indices so
// they never change with filtering or search.
const CLASSES = curriculumData.map((c) => {
  let session = 0;
  const modules: Module[] = c.parts.map((part, partIdx) => ({
    idx: partIdx,
    ...parsePartLabel(part.label),
    lessons: part.topics.map((title, topicIdx) => ({
      id: `cls-${c.cls}-p${partIdx}-t${topicIdx}`,
      cls: c.cls, level: c.level, partIdx, topicIdx, session: ++session, title,
    })),
  }));
  return { cls: c.cls, level: c.level, modules, lessons: modules.flatMap((m) => m.lessons) };
});
const ALL_LESSONS = CLASSES.flatMap((c) => c.lessons);
const LESSON_BY_ID = new Map(ALL_LESSONS.map((l) => [l.id, l]));

export default function CurriculumPage({ schoolName, userRole, schoolId, userId }: CurriculumPageProps) {
  const isStudent = userRole === 'student' && !!userId;
  const [levelFilter, setLevelFilter] = useState<Level | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState(1);
  const [progress, setProgress] = useState<Map<string, Progress>>(new Map());
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Lesson player, progress and quiz state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const active = activeId ? LESSON_BY_ID.get(activeId) ?? null : null;

  // Fetch progress for students and open on the class they were last working in.
  useEffect(() => {
    if (!isStudent || !userId) return;
    getStudentProgress(userId).then((rows) => {
      const map = new Map<string, Progress>();
      for (const r of rows) map.set(r.topic_id, { pct: r.progress_percentage, done: r.is_completed, last: r.last_watched_at });
      setProgress(map);
      const latest = rows.filter((r) => LESSON_BY_ID.has(r.topic_id))
        .sort((a, b) => (b.last_watched_at ?? '').localeCompare(a.last_watched_at ?? ''))[0];
      if (latest) setSelectedClass(LESSON_BY_ID.get(latest.topic_id)!.cls);
    });
  }, [isStudent, userId]);

  // Video progress tracking (simulated watch time, synced to the backend)
  const progressRef = useRef(0);
  useEffect(() => {
    if (!activeId) return;
    const start = progress.get(activeId)?.pct ?? 0;
    progressRef.current = start;
    setVideoProgress(start);
    setShowQuiz(false);
    setQuizSubmitted(false);
    setQuizScore(null);
    setSelectedAnswers({});
    if (!userId || !isStudent || start >= 100) return;

    const interval = setInterval(() => {
      const next = Math.min(progressRef.current + 2, 100);
      progressRef.current = next;
      setVideoProgress(next);
      updateStudentProgress(userId, activeId, next).then((res) => {
        if (res.success) {
          setProgress((prev) => new Map(prev).set(activeId, { pct: next, done: !!res.isCompleted, last: new Date().toISOString() }));
        }
      });
      if (next >= 100) clearInterval(interval);
    }, 5000); // 2% every 5 seconds (~4 min to complete)
    return () => clearInterval(interval);
    // Progress is read once when a lesson opens; later updates come from this effect itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, userId, isStudent]);

  // Close on Escape and lock page scroll while a lesson is open.
  useEffect(() => {
    if (!activeId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveId(null); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [activeId]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const visibleClasses = useMemo(
    () => CLASSES.filter((c) => levelFilter === 'all' || c.level === levelFilter),
    [levelFilter]
  );
  useEffect(() => {
    if (!visibleClasses.some((c) => c.cls === selectedClass)) setSelectedClass(visibleClasses[0].cls);
  }, [visibleClasses, selectedClass]);

  const query = searchQuery.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!query) return null;
    return visibleClasses
      .map((c) => ({ cls: c.cls, level: c.level, lessons: c.lessons.filter((l) => l.title.toLowerCase().includes(query)) }))
      .filter((c) => c.lessons.length > 0);
  }, [query, visibleClasses]);

  const doneIn = useCallback((lessons: Lesson[]) => lessons.filter((l) => progress.get(l.id)?.done).length, [progress]);
  const totalDone = doneIn(ALL_LESSONS);
  const overallPct = Math.round((100 * totalDone) / ALL_LESSONS.length);

  // "Continue": the most recently watched unfinished lesson, else the next lesson after the last finished one.
  const continueLesson = useMemo(() => {
    if (!isStudent) return null;
    const watched = [...progress.entries()].filter(([id]) => LESSON_BY_ID.has(id))
      .sort((a, b) => (b[1].last ?? '').localeCompare(a[1].last ?? ''));
    const unfinished = watched.find(([, p]) => !p.done);
    if (unfinished) return LESSON_BY_ID.get(unfinished[0])!;
    if (watched.length) {
      const last = LESSON_BY_ID.get(watched[0][0])!;
      return ALL_LESSONS[ALL_LESSONS.indexOf(last) + 1] ?? null;
    }
    return ALL_LESSONS[0];
  }, [isStudent, progress]);

  const current = CLASSES.find((c) => c.cls === selectedClass) ?? CLASSES[0];
  const currentDone = doneIn(current.lessons);

  const openLesson = (l: Lesson) => setActiveId(l.id);
  const siblings = active ? CLASSES.find((c) => c.cls === active.cls)!.lessons : [];
  const activePos = active ? siblings.findIndex((l) => l.id === active.id) : -1;
  const prevLesson = activePos > 0 ? siblings[activePos - 1] : null;
  const nextLesson = activePos >= 0 && activePos < siblings.length - 1 ? siblings[activePos + 1] : null;
  const activeModule = active ? CLASSES.find((c) => c.cls === active.cls)!.modules[active.partIdx] : null;
  const accent = active ? LEVEL_ACCENT[active.level] : LEVEL_ACCENT.p;

  const statusOf = (l: Lesson): 'done' | 'progress' | 'new' => {
    const p = progress.get(l.id);
    return p?.done ? 'done' : p && p.pct > 0 ? 'progress' : 'new';
  };

  const highlight = (text: string) => {
    if (!query) return text;
    const i = text.toLowerCase().indexOf(query);
    if (i < 0) return text;
    return <>{text.slice(0, i)}<mark className={styles.mark}>{text.slice(i, i + query.length)}</mark>{text.slice(i + query.length)}</>;
  };

  const renderLesson = (l: Lesson, showClass = false) => {
    const s = isStudent ? statusOf(l) : 'new';
    const pct = progress.get(l.id)?.pct ?? 0;
    return (
      <button key={l.id} type="button" onClick={() => openLesson(l)} className={`${styles.lesson} ${s === 'done' ? styles.lessonDone : ''}`}
        style={{ '--accent': LEVEL_ACCENT[l.level] } as React.CSSProperties}
        aria-label={`${showClass ? `Class ${l.cls}, ` : ''}session ${l.session}: ${l.title}${isStudent ? `, ${s === 'done' ? 'completed' : s === 'progress' ? `${pct}% watched` : 'not started'}` : ''}`}>
        <span className={styles.lessonNum}>{showClass ? `C${l.cls}·` : ''}{String(l.session).padStart(2, '0')}</span>
        <span className={styles.lessonTitle}>{highlight(l.title)}</span>
        <span className={styles.lessonIcon} aria-hidden>
          {s === 'done' ? <CheckCircle2 size={18} /> : s === 'progress' ? <ProgressDot pct={pct} /> : <PlayCircle size={18} />}
        </span>
        {s === 'progress' && <span className={styles.lessonBar} style={{ width: `${pct}%` }} aria-hidden />}
      </button>
    );
  };

  return (
    <div className={styles.themeContainer}>
      <div className={styles.backdrop} aria-hidden />

      {/* Navbar with role-based links */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navLeft}>
            <Link href="/" className={styles.brand}>
              <Image src="/fav.png" alt="" width={32} height={32} className={styles.brandLogo} />
              <span>RADIX</span>
            </Link>
            <span className={styles.navDivider} aria-hidden />
            <Link href="/" className={`${styles.navLink} ${styles.hideSm}`}>Home</Link>
            <span className={`${styles.navLink} ${styles.navLinkActive}`} aria-current="page">Curriculum</span>
            <Link href="/kits" className={styles.navLink}>Kits</Link>
          </div>
          <div className={styles.navRight}>
            {userRole === 'super_admin' && (
              <Link href="/super-admin" className={`${styles.roleBtn} ${styles.roleSuper}`}>
                <span className={styles.hideSm}>Super </span>Admin <ChevronRight size={16} />
              </Link>
            )}
            {userRole === 'school_admin' && (
              <Link href={`/school-admin/${schoolId}`} className={`${styles.roleBtn} ${styles.roleSchool}`}>
                <span className={styles.hideSm}>School </span>Admin <ChevronRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}><Sparkles size={14} /> NEP 2020 aligned · Robotics, coding & AI</p>
            {schoolName && <p className={styles.school}>{schoolName}</p>}
            <h1 className={styles.title}>Composite <span>Skill Lab</span></h1>
            <p className={styles.lede}>
              A K–10 learning path of <strong>{ALL_LESSONS.length} hands-on sessions</strong>, from simple machines
              to competition-ready autonomous robots and AI systems.
            </p>
            <dl className={styles.heroStats}>
              <div><dt>Sessions</dt><dd>{ALL_LESSONS.length}</dd></div>
              <div><dt>Classes</dt><dd>{CLASSES.length}</dd></div>
              <div><dt>Modules</dt><dd>{CLASSES.reduce((n, c) => n + c.modules.length, 0)}</dd></div>
            </dl>
          </div>

          {isStudent ? (
            <div className={styles.learnCard}>
              <p className={styles.cardLabel}>My learning</p>
              <div className={styles.learnRow}>
                <Ring pct={overallPct} size={104} stroke={9} color="#ff7a38">
                  <strong>{overallPct}%</strong><span>complete</span>
                </Ring>
                <div className={styles.learnFacts}>
                  <p><strong>{totalDone}</strong> of {ALL_LESSONS.length} sessions done</p>
                  <p><strong>{[...progress.values()].filter((p) => !p.done && p.pct > 0).length}</strong> in progress</p>
                  <p><strong>{CLASSES.filter((c) => doneIn(c.lessons) === c.lessons.length).length}</strong> classes finished</p>
                </div>
              </div>
              {continueLesson && (
                <button type="button" className={styles.continueBtn} onClick={() => { setSelectedClass(continueLesson.cls); openLesson(continueLesson); }}>
                  <PlayCircle size={20} />
                  <span className={styles.continueText}>
                    <small>{totalDone || progress.size ? 'Continue learning' : 'Start learning'} · Class {continueLesson.cls}</small>
                    <span>{continueLesson.title}</span>
                  </span>
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          ) : (
            <div className={styles.learnCard}>
              <p className={styles.cardLabel}>Learning path</p>
              <ol className={styles.pathList}>
                {(['p', 'i', 'a'] as const).map((lv) => {
                  const cs = CLASSES.filter((c) => c.level === lv);
                  return (
                    <li key={lv} style={{ '--accent': LEVEL_ACCENT[lv] } as React.CSSProperties}>
                      <span className={styles.pathDot} aria-hidden />
                      <div>
                        <strong>{levelMeta[lv].label}</strong>
                        <span>Class {cs[0].cls}{cs.length > 1 ? `–${cs[cs.length - 1].cls}` : ''} · {cs.reduce((n, c) => n + c.lessons.length, 0)} sessions</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </section>

        {/* Toolbar: level filter + search */}
        <div className={styles.toolbar}>
          <div role="radiogroup" aria-label="Level" className={styles.segmented}>
            {LEVEL_FILTERS.map((f) => (
              <button key={f.key} type="button" role="radio" aria-checked={levelFilter === f.key}
                className={levelFilter === f.key ? styles.segActive : ''} onClick={() => setLevelFilter(f.key)}>
                {f.label} <span>{f.hint}</span>
              </button>
            ))}
          </div>
          <label className={styles.search}>
            <Search size={18} aria-hidden />
            <span className="sr-only">Search sessions</span>
            <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions — e.g. sensor, Arduino, AI" />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search"><X size={16} /></button>
            )}
          </label>
        </div>

        {searchResults ? (
          /* Search results across classes */
          <section aria-live="polite" className={styles.results}>
            <p className={styles.resultsCount}>
              {searchResults.reduce((n, c) => n + c.lessons.length, 0)} session{searchResults.reduce((n, c) => n + c.lessons.length, 0) === 1 ? '' : 's'} match “{searchQuery.trim()}”
            </p>
            {searchResults.length === 0 ? (
              <div className={styles.empty}>
                <Search size={28} aria-hidden />
                <p>No sessions match “{searchQuery.trim()}”.</p>
                <button type="button" onClick={() => setSearchQuery('')}>Clear search</button>
              </div>
            ) : searchResults.map((c) => (
              <div key={c.cls} className={styles.resultGroup}>
                <h3 style={{ '--accent': LEVEL_ACCENT[c.level] } as React.CSSProperties}>
                  <span className={styles.classBadge}>Class {c.cls}</span> {levelMeta[c.level].label}
                </h3>
                <div className={styles.lessonGrid}>
                  {c.lessons.map((l) => renderLesson(l))}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <div className={styles.layout}>
            {/* Class picker: sidebar on desktop, scrolling chips on mobile */}
            <nav aria-label="Classes" className={styles.sidebar}>
              {visibleClasses.map((c) => {
                const done = doneIn(c.lessons);
                const isSel = c.cls === selectedClass;
                return (
                  <button key={c.cls} type="button" aria-current={isSel ? 'true' : undefined}
                    className={`${styles.classTab} ${isSel ? styles.classTabActive : ''}`}
                    style={{ '--accent': LEVEL_ACCENT[c.level] } as React.CSSProperties}
                    onClick={() => setSelectedClass(c.cls)}>
                    <span className={styles.classNum}>{c.cls}</span>
                    <span className={styles.classTabText}>
                      <strong>Class {c.cls}</strong>
                      <small>{isStudent ? `${done}/${c.lessons.length} done` : `${c.lessons.length} sessions`}</small>
                    </span>
                    {isStudent && (
                      <span className={styles.classTabBar} aria-hidden><span style={{ width: `${(100 * done) / c.lessons.length}%` }} /></span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Selected class */}
            <section className={styles.course} style={{ '--accent': LEVEL_ACCENT[current.level] } as React.CSSProperties} aria-labelledby="course-title">
              <header className={styles.courseHead}>
                <div>
                  <span className={styles.classBadge}>{levelMeta[current.level].label}</span>
                  <h2 id="course-title">Class {current.cls}</h2>
                  <p>
                    <Layers size={14} aria-hidden /> {current.modules.length} modules
                    <span aria-hidden>·</span>
                    <BookOpen size={14} aria-hidden /> {current.lessons.length} sessions
                  </p>
                </div>
                {isStudent && (
                  <Ring pct={Math.round((100 * currentDone) / current.lessons.length)} size={72} stroke={7} color={LEVEL_ACCENT[current.level]}>
                    <strong>{currentDone}</strong><span>of {current.lessons.length}</span>
                  </Ring>
                )}
              </header>

              <ol className={styles.modules}>
                {current.modules.map((m) => {
                  const mDone = doneIn(m.lessons);
                  return (
                    <li key={m.idx} className={styles.module}>
                      <div className={styles.moduleHead}>
                        <span className={`${styles.moduleMarker} ${isStudent && mDone === m.lessons.length ? styles.moduleMarkerDone : ''}`} aria-hidden>
                          {isStudent && mDone === m.lessons.length ? <CheckCircle2 size={16} /> : m.idx + 1}
                        </span>
                        <div className={styles.moduleText}>
                          <small>{m.name}{m.range ? ` · ${m.range}` : ''}</small>
                          <h3>{m.title || m.name}</h3>
                        </div>
                        {isStudent && <span className={styles.moduleCount}>{mDone}/{m.lessons.length}</span>}
                      </div>
                      <div className={styles.lessonGrid}>
                        {m.lessons.map((l) => renderLesson(l))}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
        )}
      </main>

      <footer className={styles.footer}>Radix Robotics · Composite Skill Lab</footer>

      <button type="button" className={`${styles.scrollTop} ${showScrollTop ? styles.scrollTopVisible : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Scroll to top">
        <ArrowUp size={20} />
      </button>

      {/* Lesson player */}
      <div className={`${styles.scrim} ${active ? styles.scrimOpen : ''}`} onClick={() => setActiveId(null)} aria-hidden />
      <div role="dialog" aria-modal="true" aria-labelledby="lesson-title" aria-hidden={!active}
        className={`${styles.player} ${active ? styles.playerOpen : ''}`} style={{ '--accent': accent } as React.CSSProperties}>
        {active && activeModule && (
          <>
            <header className={styles.playerHead}>
              <div className={styles.playerTitle}>
                <p>Class {active.cls} · {activeModule.title || activeModule.name} · Session {active.session}</p>
                <h3 id="lesson-title">{active.title}</h3>
              </div>
              <button type="button" onClick={() => setActiveId(null)} className={styles.iconBtn} aria-label="Close lesson" autoFocus>
                <X size={18} />
              </button>
            </header>

            <div className={styles.playerBody}>
              <div className={styles.playerMain}>
                <div className={styles.video}>
                  <iframe
                    src="https://www.youtube.com/embed/MiUHjLxm3V0?autoplay=0&controls=1&rel=0"
                    title={`Lesson video: ${active.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {isStudent && (
                  <div className={styles.watch}>
                    <div className={styles.watchRow}>
                      <span>{videoProgress >= 90 ? <><CheckCircle2 size={14} /> Completed</> : 'Your progress'}</span>
                      <strong>{videoProgress}%</strong>
                    </div>
                    <div className={styles.watchTrack}><span style={{ width: `${videoProgress}%` }} className={videoProgress >= 90 ? styles.watchDone : ''} /></div>
                  </div>
                )}

                {(() => {
                  const desc = getTopicDescription(active.title);
                  return (
                    <div className={styles.overview}>
                      <h4>About this session</h4>
                      <p>{desc.summary}</p>
                      <h4>You will</h4>
                      <ul>{desc.points.map((p, i) => <li key={i}><CheckCircle2 size={16} aria-hidden />{p}</li>)}</ul>
                    </div>
                  );
                })()}
              </div>

              <aside className={styles.playerSide}>
                {!showQuiz ? (
                  <div className={styles.quizIntro}>
                    <GraduationCap size={32} aria-hidden />
                    <h4>Self-check</h4>
                    <p>Two quick questions to test your understanding after the video.</p>
                    <button type="button" disabled={isStudent && videoProgress < 90} onClick={() => setShowQuiz(true)} className={styles.primaryBtn}>
                      {!isStudent || videoProgress >= 90 ? 'Start quiz' : `Watch to unlock (${videoProgress}%)`}
                    </button>
                  </div>
                ) : (
                  <div className={styles.quiz}>
                    <h4><GraduationCap size={16} aria-hidden /> Concept check</h4>
                    {[
                      { q: 1, text: 'What is the primary function discussed in this lesson?', opts: ['Structural Support', 'Energy Conversion', 'Data Processing', 'Aesthetic Design'] },
                      { q: 2, text: 'How is this typically implemented in robotics?', opts: ['Via mechanical linkages', 'Using embedded AI logic', 'Through external wired power', 'Using pneumatic tubes'] },
                    ].map(({ q, text, opts }) => (
                      <fieldset key={q} className={styles.question}>
                        <legend>{q}. {text}</legend>
                        {opts.map((opt) => (
                          <label key={opt} className={selectedAnswers[q] === opt ? styles.optionOn : ''}>
                            <input type="radio" name={`q${q}`} value={opt} disabled={quizSubmitted} checked={selectedAnswers[q] === opt}
                              onChange={(e) => setSelectedAnswers({ ...selectedAnswers, [q]: e.target.value })} />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </fieldset>
                    ))}
                    {!quizSubmitted ? (
                      <button type="button" className={styles.primaryBtn} disabled={Object.keys(selectedAnswers).length < 2}
                        onClick={() => {
                          setQuizSubmitted(true);
                          let score = 0;
                          if (selectedAnswers[1]) score += 50;
                          if (selectedAnswers[2]) score += 50;
                          setQuizScore(score);
                        }}>
                        Submit answers
                      </button>
                    ) : (
                      <div className={`${styles.result} ${quizScore === 100 ? styles.resultGood : ''}`} role="status">
                        <strong>{quizScore === 100 ? 'Excellent!' : 'Good try!'} {quizScore}%</strong>
                        <span>You can move on to the next session.</span>
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.upNext}>
                  <p className={styles.cardLabel}>In this module</p>
                  <ol>
                    {activeModule.lessons.map((l) => (
                      <li key={l.id}>
                        <button type="button" onClick={() => openLesson(l)} aria-current={l.id === active.id ? 'true' : undefined}>
                          {isStudent && progress.get(l.id)?.done ? <CheckCircle2 size={15} aria-hidden /> : <Circle size={15} aria-hidden />}
                          <span>{l.title}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              </aside>
            </div>

            <footer className={styles.playerFoot}>
              <button type="button" className={styles.ghostBtn} disabled={!prevLesson} onClick={() => prevLesson && openLesson(prevLesson)}>
                <ArrowLeft size={16} /> <span className={styles.hideSm}>Previous</span>
              </button>
              <span className={styles.footPos}>Session {active.session} of {siblings.length}</span>
              <button type="button" className={styles.primaryBtn} disabled={!nextLesson} onClick={() => nextLesson && openLesson(nextLesson)}>
                <span className={styles.hideSm}>Next session</span> <ArrowRight size={16} />
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

/** Circular progress ring with centred content. */
function Ring({ pct, size, stroke, color, children }: { pct: number; size: number; stroke: number; color: string; children: React.ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className={styles.ring} style={{ width: size, height: size }} role="img" aria-label={`${pct}% complete`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
      <div className={styles.ringInner}>{children}</div>
    </div>
  );
}

/** Small pie showing how much of a lesson has been watched. */
function ProgressDot({ pct }: { pct: number }) {
  const r = 7, c = 2 * Math.PI * r;
  return (
    <svg width={18} height={18} viewBox="0 0 18 18">
      <circle cx={9} cy={9} r={r} fill="none" stroke="currentColor" strokeOpacity={0.25} strokeWidth={2} />
      <circle cx={9} cy={9} r={r} fill="none" stroke="currentColor" strokeWidth={2} strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 9 9)" strokeLinecap="round" />
    </svg>
  );
}
