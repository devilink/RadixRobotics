"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, ArrowUp, GraduationCap, PlayCircle, CheckCircle2, X } from 'lucide-react';
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

interface ActiveVideo {
  topicId: string;
  title: string;
}

const classColors: Record<number, { bg: string, text: string, border: string, from: string, to: string }> = {
  1: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', from: 'from-rose-600', to: 'to-pink-600' },
  2: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', from: 'from-orange-600', to: 'to-amber-500' },
  3: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', from: 'from-amber-500', to: 'to-yellow-500' },
  4: { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/20', from: 'from-lime-600', to: 'to-green-500' },
  5: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', from: 'from-emerald-600', to: 'to-teal-500' },
  6: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', from: 'from-teal-600', to: 'to-cyan-600' },
  7: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', from: 'from-cyan-600', to: 'to-sky-500' },
  8: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', from: 'from-blue-600', to: 'to-indigo-500' },
  9: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', from: 'from-indigo-600', to: 'to-violet-500' },
  10: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', from: 'from-purple-600', to: 'to-fuchsia-500' }
};

export default function CurriculumPage({ schoolName, userRole, schoolId, userId }: CurriculumPageProps) {
  const [currentFilter, setCurrentFilter] = useState<Level | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Set all sections open by default
  const [openSections, setOpenSections] = useState<Set<number>>(new Set(curriculumData.map(d => d.cls)));
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Video, Progress, and Quiz State
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  // Fetch initial progress for students
  useEffect(() => {
    if (userRole === 'student' && userId) {
      getStudentProgress(userId).then(progressData => {
        const completedIds = new Set(
          progressData.filter(p => p.is_completed).map(p => p.topic_id)
        );
        setCompletedTopics(completedIds);
      });
    }
  }, [userRole, userId]);

  // Handle Video Progress Tracking Simulation
  const progressRef = useRef(0);

  useEffect(() => {
    if (!activeVideo || !userId) return;

    // Reset progress and quiz states when a new video opens
    progressRef.current = 0;
    setVideoProgress(0);
    setShowQuiz(false);
    setQuizSubmitted(false);
    setQuizScore(null);
    setSelectedAnswers({});

    const interval = setInterval(() => {
      const next = Math.min(progressRef.current + 2, 100);
      progressRef.current = next;
      setVideoProgress(next);

      // Sync with backend (side effect kept outside of setState updater)
      updateStudentProgress(userId, activeVideo.topicId, next).then(res => {
        if (res.success && res.isCompleted) {
          setCompletedTopics(prevSet => new Set(prevSet).add(activeVideo.topicId));
        }
      });

      if (next >= 100) clearInterval(interval);
    }, 5000); // 2% every 5 seconds (~4 min to complete)

    return () => clearInterval(interval);
  }, [activeVideo, userId]);

  // Parse current class for dynamic coloring
  const currentClassMatch = activeVideo?.topicId.match(/cls-(\d+)-/);
  const activeClassNum = currentClassMatch ? parseInt(currentClassMatch[1], 10) : 1;
  const activeColor = classColors[activeClassNum] || classColors[8]; // Fallback to blue

  // Handle scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSection = (cls: number) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(cls)) {
        next.delete(cls);
      } else {
        next.add(cls);
      }
      return next;
    });
  };

  // Filter and compute data using useMemo
  const { filteredData, totalMatchedTopics, hasResults } = useMemo(() => {
    let matchedCount = 0;
    
    // First, filter by level
    const levelFiltered = currentFilter === 'all' 
      ? curriculumData 
      : curriculumData.filter(d => d.level === currentFilter);

    // Then, filter by search query
    const finalFiltered = levelFiltered.map(clsData => {
      const filteredParts = clsData.parts.map(part => {
        const matchedTopics = searchQuery
          ? part.topics.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
          : part.topics;
        return { ...part, topics: matchedTopics };
      }).filter(part => part.topics.length > 0);

      const totalSessionsForClass = filteredParts.reduce((sum, p) => sum + p.topics.length, 0);
      matchedCount += totalSessionsForClass;

      return {
        ...clsData,
        filteredParts,
        totalSessionsForClass
      };
    }).filter(clsData => clsData.filteredParts.length > 0);

    return {
      filteredData: finalFiltered,
      totalMatchedTopics: matchedCount,
      hasResults: finalFiltered.length > 0
    };
  }, [currentFilter, searchQuery]);

  // Helper to safely highlight search matches
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <span key={i} className={styles.highlightMark}>{part}</span>
            : part
        )}
      </>
    );
  };

  return (
    <div className={styles.themeContainer}>
      {/* Ambient Background */}
      <div className={styles.ambientBg}>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
      </div>
      <div className={styles.gridOverlay} />

      {/* Navbar with Role-Based Conditional Rendering */}
      <nav className="sticky top-0 z-[1000] border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl py-3 px-6 md:px-8">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 font-bold text-lg text-neutral-100 no-underline hover:text-emerald-400 transition-colors">
              {/* You can replace this with next/image if preferred */}
              <img src="/logo1.jpeg" alt="Radix Logo" className="h-8 rounded" />
              <span>RADIX</span>
            </Link>
            <div className="h-5 w-px bg-zinc-800 hidden sm:block" />
            <Link href="/" className="hidden sm:flex text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Home</Link>
            <span className="hidden sm:flex text-sm font-semibold text-zinc-100">Curriculum</span>
          </div>
          
          <div className="flex items-center gap-3">
            {userRole === 'super_admin' && (
              <Link 
                href="/super-admin"
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium transition-colors border border-purple-500/20"
              >
                Super Admin
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          {userRole === 'school_admin' && (
            <Link 
              href={`/school-admin/${schoolId}`}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium transition-colors border border-emerald-500/20"
            >
              School Admin Dashboard
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        </div>
      </nav>

      <main className="max-w-[1100px] mx-auto px-6 px-safe relative z-10 pb-16">
        
        {/* Hero Section */}
        <section className="pt-20 pb-12 text-center relative">
          <div className={styles.heroBadge}>
            <span className={styles.dot} />
            NEP 2020 Aligned Curriculum
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4 animate-[fadeInUp_0.6s_ease_0.1s_both]">
            <span className={styles.gradientText}>
              {schoolName ? `${schoolName} Robotics & AI Curriculum` : 'Robotics & AI Curriculum'}
            </span>
          </h1>
          <p className="text-base md:text-lg text-[#9898a6] max-w-2xl mx-auto leading-relaxed mb-9 animate-[fadeInUp_0.6s_ease_0.2s_both]">
            A comprehensive K-10 learning path with <strong>250 hands-on sessions</strong> — from basic machines to competition-ready autonomous robots and AI systems.
          </p>
        </section>

        {/* Stats Bar */}
        <div className="flex justify-center flex-wrap gap-3 mb-10 animate-[fadeInUp_0.6s_ease_0.3s_both]">
          <div className={styles.statChip}>
            <span className="font-bold text-lg text-[#eeeef0]">250</span>
            <span className="text-[13px]">Total Sessions</span>
          </div>
          <div className={styles.statChip}>
            <span className="font-bold text-lg text-[#eeeef0]">10</span>
            <span className="text-[13px]">Classes</span>
          </div>
          <div className={styles.statChip}>
            <span className="font-bold text-lg text-[#eeeef0]">150</span>
            <span className="text-[13px]">Primary (1–5)</span>
          </div>
          <div className={styles.statChip}>
            <span className="font-bold text-lg text-[#eeeef0]">100</span>
            <span className="text-[13px]">Secondary (6–10)</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex justify-center flex-wrap gap-2 mb-12 animate-[fadeInUp_0.6s_ease_0.4s_both]">
          <button 
            className={`${styles.pill} ${currentFilter === 'all' ? styles.pillActive : ''}`} 
            data-f="all" 
            onClick={() => setCurrentFilter('all')}
          >
            All Classes
          </button>
          <button 
            className={`${styles.pill} ${currentFilter === 'p' ? styles.pillActive : ''}`} 
            data-f="p"
            onClick={() => setCurrentFilter('p')}
          >
            Class 1–5 · Primary
          </button>
          <button 
            className={`${styles.pill} ${currentFilter === 'i' ? styles.pillActive : ''}`} 
            data-f="i"
            onClick={() => setCurrentFilter('i')}
          >
            Class 6–9 · Intermediate
          </button>
          <button 
            className={`${styles.pill} ${currentFilter === 'a' ? styles.pillActive : ''}`} 
            data-f="a"
            onClick={() => setCurrentFilter('a')}
          >
            Class 10 · Advanced
          </button>
        </div>

        {/* Search Input */}
        <div className="max-w-[480px] mx-auto relative mb-10 animate-[fadeInUp_0.6s_ease_0.45s_both]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#5a5a6e]" />
          <input 
            type="text" 
            className={styles.searchInput}
            placeholder="Search topics... e.g. 'sensor', 'Arduino', 'AI'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="text-center text-[12px] text-[#5a5a6e] mt-2 min-h-[18px]">
            {searchQuery && `${totalMatchedTopics} topic${totalMatchedTopics !== 1 ? 's' : ''} found`}
          </div>
        </div>

        {/* Curriculum Content Render */}
        <div className="space-y-5">
          {!hasResults ? (
            <div className="text-center py-16 px-5 text-[#5a5a6e] text-[15px]">
              <div className="text-[40px] mb-3">🔍</div>
              No topics found for "<strong>{searchQuery}</strong>"
            </div>
          ) : (
            filteredData.map((clsData, idx) => {
              const meta = levelMeta[clsData.level];
              const isOpen = openSections.has(clsData.cls);

              return (
                <div key={clsData.cls} className="animate-[fadeInUp_0.4s_ease_both]" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className={styles.classCard}>
                    
                    {/* Class Header */}
                    <div className={styles.classHeader} onClick={() => toggleSection(clsData.cls)}>
                      <span className={`text-[13px] font-semibold py-1 px-4 rounded-full min-w-[80px] text-center tracking-wide ${styles[meta.badgeClass]}`}>
                        Class {clsData.cls}
                      </span>
                      <span className="text-[15px] font-medium text-[#eeeef0]">{meta.label}</span>
                      <span className="ml-auto text-[12px] text-[#5a5a6e] font-medium pr-1 tabular-nums">
                        {clsData.totalSessionsForClass} sessions
                      </span>
                      <ChevronRight className={`w-[18px] h-[18px] text-[#5a5a6e] transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
                    </div>

                    {/* Class Body Expandable Content */}
                    {isOpen && (
                      <div className="px-6 pb-5">
                        {clsData.filteredParts.map((part, pIdx) => (
                          <div key={pIdx} className="mb-5 last:mb-0">
                            <div className="text-[11px] font-semibold tracking-widest uppercase text-[#5a5a6e] mb-2.5 pl-0.5">
                              {part.label}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1.5">
                              {part.topics.map((topic, tIdx) => {
                                const topicId = `cls-${clsData.cls}-p${pIdx}-t${tIdx}`;
                                const isCompleted = completedTopics.has(topicId);

                                return (
                                  <button 
                                    key={tIdx} 
                                    onClick={() => setActiveVideo({ topicId, title: topic })}
                                    className={`${styles.topicItem} text-left flex items-center justify-between group hover:bg-zinc-800/60 transition-colors border ${isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-transparent'}`}
                                  >
                                    <div className="flex z-[5]">
                                      <span className="text-[11px] font-medium text-[#5a5a6e] min-w-[22px] pt-0.5 font-mono tabular-nums">
                                        {String(tIdx + 1).padStart(2, '0')}
                                      </span>
                                      <span className={`flex-1 ${isCompleted ? 'text-emerald-50' : ''}`}>
                                        {highlightText(topic, searchQuery)}
                                      </span>
                                    </div>
                                    <div className="shrink-0 flex items-center z-[5] opacity-0 group-hover:opacity-100 transition-opacity">
                                      {isCompleted ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 opacity-100" />
                                      ) : (
                                        <PlayCircle className="w-4 h-4 text-blue-400" />
                                      )}
                                    </div>
                                    {isCompleted && <div className="absolute right-3 opacity-100 transition-opacity"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-10 border-t border-white/5 mt-10">
        <p className="text-[13px] text-[#5a5a6e]">
          Built with ❤️ for <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">Robotics Education</span>
        </p>
      </footer>

      {/* Scroll to Top */}
      <button 
        className={`${styles.scrollTop} ${showScrollTop ? styles.scrollTopVisible : ''}`}
        onClick={scrollToTop}
        title="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      {/* Ambient Overlay for Drawer */}
      <div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[1900] transition-all duration-300 ${activeVideo ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        onClick={() => setActiveVideo(null)}
      />

      {/* Slide-Up Bottom Drawer */}
      <div 
        className={`fixed bottom-0 left-0 right-0 w-full h-[70dvh] md:h-[65dvh] bg-[#0a0a10] border-t border-white/10 shadow-[0_-10px_60px_rgba(0,0,0,0.8)] z-[2000] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-t-2xl ${activeVideo ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {activeVideo && (
          <>
            {/* Drawer Header */}
            <div className="shrink-0 relative">
              {/* Color accent bar */}
              <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${activeColor.from} ${activeColor.to}`} />

              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/15" />
              </div>

              <div className="flex items-center justify-between px-6 pb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-[11px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md shrink-0 ${activeColor.bg} ${activeColor.text}`}>
                    Class {activeClassNum}
                  </span>
                  <h3 className="text-white font-semibold text-base md:text-lg truncate">
                    {activeVideo.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setActiveVideo(null)}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors ml-4"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-b border-white/5" />

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="max-w-6xl mx-auto px-6 py-6">

                {/* Lesson Overview */}
                {(() => {
                  const desc = getTopicDescription(activeVideo.title);
                  return (
                    <div className="mb-6">
                      <p className="text-zinc-400 text-sm leading-relaxed mb-3">
                        {desc.summary}
                      </p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                        {desc.points.map((point, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-gradient-to-br ${activeColor.from} ${activeColor.to}`} />
                            {point}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Video Player — takes 2 cols */}
                  <div className="lg:col-span-2">
                    <div className="rounded-xl overflow-hidden bg-black border border-white/10">
                      <div className="aspect-video relative">
                        <iframe 
                          className="absolute inset-0 w-full h-full"
                          src="https://www.youtube.com/embed/MiUHjLxm3V0?autoplay=0&controls=1&rel=0" 
                          title="Lesson Video" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                        />
                      </div>
                    </div>

                    {/* Progress Bar — directly below video */}
                    <div className="mt-4 p-4 rounded-xl bg-[#111118] border border-white/5 relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b ${activeColor.from} ${activeColor.to}`} />

                      <div className="flex items-center justify-between text-xs font-semibold mb-2 pl-3">
                        <span className="text-zinc-400">Progress</span>
                        <span className={videoProgress >= 90 ? 'text-emerald-400' : activeColor.text}>{videoProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#0a0a0f] rounded-full overflow-hidden ml-3 mr-3" style={{width: 'calc(100% - 1.5rem)'}}>
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ease-out ${videoProgress >= 90 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${videoProgress}%` }}
                        />
                      </div>

                      {videoProgress >= 90 && (
                        <p className="text-xs text-emerald-400 mt-2.5 ml-3 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Panel — Quiz/Test */}
                  <div className="lg:col-span-1">
                    {!showQuiz ? (
                      <div className="rounded-xl border border-white/5 bg-[#111118] p-5 text-center h-full flex flex-col justify-center">
                        <GraduationCap className={`w-10 h-10 mx-auto mb-3 ${activeColor.text} opacity-60`} />
                        <h4 className="text-white font-semibold text-sm mb-1">Self-Assessment</h4>
                        <p className="text-zinc-500 text-xs mb-5 leading-relaxed">
                          Test your understanding after watching the video.
                        </p>
                        <button 
                          disabled={videoProgress < 90}
                          onClick={() => setShowQuiz(true)}
                          className={`w-full py-3 rounded-lg text-sm font-bold transition-all
                            ${videoProgress >= 90 
                              ? `bg-gradient-to-r ${activeColor.from} ${activeColor.to} text-white hover:brightness-110 shadow-md active:scale-[0.98]` 
                              : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed border border-white/5'
                            }
                          `}
                        >
                          {videoProgress >= 90 ? 'Start Quiz' : `Complete video first (${videoProgress}%)`}
                        </button>
                      </div>
                    ) : (
                      <div className={`rounded-xl border bg-[#111118] p-5 relative overflow-hidden ${activeColor.border}`}>
                        <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${activeColor.from} ${activeColor.to}`} />
                        
                        <h4 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                          <GraduationCap className={`w-4 h-4 ${activeColor.text}`} />
                          Concept Check
                        </h4>

                        {/* Q1 */}
                        <div className="mb-5">
                          <p className="text-xs text-zinc-300 font-medium mb-2">1. What is the primary function discussed in this lesson?</p>
                          <div className="space-y-1.5">
                            {['Structural Support', 'Energy Conversion', 'Data Processing', 'Aesthetic Design'].map((opt, i) => (
                              <label key={i} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors text-xs ${selectedAnswers[1] === opt ? `${activeColor.bg} ${activeColor.border}` : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800/50'}`}>
                                <input type="radio" name="q1" value={opt} disabled={quizSubmitted} onChange={(e) => setSelectedAnswers({...selectedAnswers, 1: e.target.value})} className="hidden" />
                                <div className={`w-3.5 h-3.5 rounded-full border flex shrink-0 items-center justify-center ${selectedAnswers[1] === opt ? `${activeColor.border}` : 'border-zinc-600'}`}>
                                  {selectedAnswers[1] === opt && <div className={`w-1.5 h-1.5 rounded-full ${activeColor.text.replace('text-','bg-')}`} />}
                                </div>
                                <span className="text-zinc-300">{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Q2 */}
                        <div className="mb-5">
                          <p className="text-xs text-zinc-300 font-medium mb-2">2. How is this typically implemented in robotics?</p>
                          <div className="space-y-1.5">
                            {['Via mechanical linkages', 'Using embedded AI logic', 'Through external wired power', 'Using pneumatic tubes'].map((opt, i) => (
                              <label key={i} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors text-xs ${selectedAnswers[2] === opt ? `${activeColor.bg} ${activeColor.border}` : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800/50'}`}>
                                <input type="radio" name="q2" value={opt} disabled={quizSubmitted} onChange={(e) => setSelectedAnswers({...selectedAnswers, 2: e.target.value})} className="hidden" />
                                <div className={`w-3.5 h-3.5 rounded-full border shrink-0 flex items-center justify-center ${selectedAnswers[2] === opt ? `${activeColor.border}` : 'border-zinc-600'}`}>
                                  {selectedAnswers[2] === opt && <div className={`w-1.5 h-1.5 rounded-full ${activeColor.text.replace('text-','bg-')}`} />}
                                </div>
                                <span className="text-zinc-300">{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Submit / Results */}
                        {!quizSubmitted ? (
                          <button 
                            disabled={Object.keys(selectedAnswers).length < 2}
                            onClick={() => {
                              setQuizSubmitted(true);
                              let score = 0;
                              if (selectedAnswers[1]) score += 50;
                              if (selectedAnswers[2]) score += 50;
                              setQuizScore(score);
                            }}
                            className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all
                              ${Object.keys(selectedAnswers).length < 2 
                                ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed' 
                                : `bg-gradient-to-r ${activeColor.from} ${activeColor.to} text-white hover:brightness-110`
                              }`}
                          >
                            Submit
                          </button>
                        ) : (
                          <div className={`p-3 rounded-lg border text-xs ${quizScore === 100 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                            <div className="flex items-center justify-between">
                              <strong className={quizScore === 100 ? 'text-emerald-400' : 'text-amber-400'}>
                                {quizScore === 100 ? 'Excellent!' : 'Good Try!'}
                              </strong>
                              <span className="text-white font-bold">{quizScore}%</span>
                            </div>
                            <p className="text-zinc-500 mt-1">You may proceed to the next module.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
