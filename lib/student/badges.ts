// Badges earned on the student profile, worked out from saved progress.

import { CHALLENGES } from './lab';

export type ProgressRow = { topic_id: string; progress_percentage: number; is_completed: boolean; last_watched_at: string | null };

export type Badge = { id: string; name: string; description: string; icon: string; earned: boolean; progress?: string };

export type ProgressSummary = {
  projectsStarted: number;
  projectsDone: number;
  labSolved: number;
  lessonsDone: number;
  /** Distinct days with any activity in the last 7 days. */
  activeDays: number;
};

export function summarise(rows: ProgressRow[], now = new Date()): ProgressSummary {
  const project = rows.filter((r) => r.topic_id.startsWith('project:'));
  const lab = rows.filter((r) => r.topic_id.startsWith('lab:') && r.is_completed);
  const lessons = rows.filter((r) => r.topic_id.startsWith('cls-') && r.is_completed);
  const weekAgo = now.getTime() - 7 * 86_400_000;
  const days = new Set(
    rows
      .filter((r) => r.last_watched_at && new Date(r.last_watched_at).getTime() >= weekAgo)
      .map((r) => r.last_watched_at!.slice(0, 10)),
  );
  return {
    projectsStarted: project.filter((r) => r.progress_percentage > 0).length,
    projectsDone: project.filter((r) => r.is_completed).length,
    labSolved: lab.length,
    lessonsDone: lessons.length,
    activeDays: days.size,
  };
}

export function badges(s: ProgressSummary, attendanceRate: number | null): Badge[] {
  const labTotal = CHALLENGES.length;
  return [
    { id: 'spark', name: 'First Spark', icon: '⚡', description: 'Start your first project', earned: s.projectsStarted >= 1 },
    { id: 'maker', name: 'Maker', icon: '🛠️', description: 'Finish a project', earned: s.projectsDone >= 1 },
    { id: 'engineer', name: 'Engineer', icon: '🏗️', description: 'Finish 3 projects', earned: s.projectsDone >= 3, progress: `${Math.min(s.projectsDone, 3)}/3` },
    { id: 'coder', name: 'Coder', icon: '💻', description: 'Solve a virtual-lab challenge', earned: s.labSolved >= 1 },
    { id: 'lab-master', name: 'Lab Master', icon: '🧪', description: 'Solve every lab challenge', earned: s.labSolved >= labTotal, progress: `${Math.min(s.labSolved, labTotal)}/${labTotal}` },
    { id: 'streak', name: 'On a Roll', icon: '🔥', description: 'Be active on 3 days in a week', earned: s.activeDays >= 3, progress: `${Math.min(s.activeDays, 3)}/3` },
    { id: 'present', name: 'Always There', icon: '🎯', description: '90%+ attendance', earned: attendanceRate !== null && attendanceRate >= 90 },
  ];
}
