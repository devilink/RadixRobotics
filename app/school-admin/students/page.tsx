"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Plus, 
  MoreVertical, 
  KeyRound, 
  Mail, 
  User, 
  GraduationCap, 
  School,
  X,
  Wand2,
  CheckCircle2,
  Clock
} from "lucide-react";

// Mock Data
const MOCK_SCHOOL_NAME = "Oakridge High School";
const MOCK_STUDENTS = [
  {
    id: "STU-001",
    name: "Alex Jensen",
    email: "alex.j@oakridge.edu",
    progress: 78,
    lastActive: "2 hours ago",
    status: "active"
  },
  {
    id: "STU-002",
    name: "Maria Garcia",
    email: "m.garcia@oakridge.edu",
    progress: 45,
    lastActive: "Yesterday",
    status: "active"
  },
  {
    id: "STU-003",
    name: "James Wilson",
    email: "j.wilson@oakridge.edu",
    progress: 12,
    lastActive: "3 days ago",
    status: "inactive"
  },
  {
    id: "STU-004",
    name: "Sarah Chen",
    email: "schen@oakridge.edu",
    progress: 92,
    lastActive: "Just now",
    status: "active"
  }
];

export default function StudentManagementPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = MOCK_STUDENTS.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-zinc-950/50 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
              <School className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-zinc-50">
                Welcome, {MOCK_SCHOOL_NAME} Administration
              </h1>
              <p className="text-neutral-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Student Management Dashboard
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 text-white px-5 py-2.5 rounded-xl font-medium transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Student
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/60 rounded-3xl shadow-sm overflow-hidden backdrop-blur-xl">
          
          {/* Toolbar */}
          <div className="p-6 border-b border-neutral-200/60 dark:border-zinc-800/60 flex items-center justify-between gap-4 bg-neutral-50/30 dark:bg-zinc-900/30">
            <div className="relative w-full max-w-md">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search students by name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200/60 dark:border-zinc-800/60 text-xs uppercase tracking-wider text-neutral-500 dark:text-zinc-400 bg-neutral-50/50 dark:bg-zinc-950/50">
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold">Course Progress</th>
                  <th className="px-6 py-4 font-semibold">Last Active</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 dark:divide-zinc-800/60">
                {filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 flex items-center justify-center text-neutral-500 dark:text-zinc-400 font-medium font-sans">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-neutral-900 dark:text-zinc-100">{student.name}</div>
                          <div className="text-sm text-neutral-500 dark:text-zinc-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 w-64">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-neutral-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${student.progress}%` }}
                            transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              student.progress > 80 ? 'bg-emerald-500' : 
                              student.progress > 40 ? 'bg-amber-500' : 'bg-neutral-400 dark:bg-zinc-600'
                            }`}
                          />
                        </div>
                        <span className="text-sm font-medium text-neutral-700 dark:text-zinc-300 w-10">
                          {student.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-zinc-400">
                        {student.status === 'active' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                        {student.lastActive}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex items-center justify-center p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors md:hidden">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      <button className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors">
                        <KeyRound className="w-4 h-4" />
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredStudents.length === 0 && (
              <div className="px-6 py-12 text-center text-neutral-500 dark:text-zinc-500 flex flex-col items-center">
                <Search className="w-12 h-12 text-neutral-300 dark:text-zinc-700 mb-4" />
                <p>No students found matching your search.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add Student Modal Overlay */}
      <AnimatePresence>
        {isAddModalOpen && (
          <StudentModal onClose={() => setIsAddModalOpen(false)} />
        )}
      </AnimatePresence>

    </div>
  );
}

// Separate component for the Modal to keep the file clean
function StudentModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: ""
  });
  const [isGenerated, setIsGenerated] = useState(false);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pwd }));
    setIsGenerated(true);
    setTimeout(() => setIsGenerated(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting new student:", formData);
    // TODO: Wire up to Supabase auth client
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm dark:bg-black/60"
      />
      
      {/* Modal Dialog */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-zinc-800"
      >
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-zinc-800 flex items-center justify-between bg-neutral-50/50 dark:bg-zinc-900/50 text-neutral-900 dark:text-锌-50">
          <h2 className="text-xl font-semibold dark:text-zinc-100 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500" />
            Enroll New Student
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200 hover:bg-neutral-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
              Full Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                type="text" 
                required
                value={formData.fullName}
                onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="e.g. Jane Doe" 
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
              Email Address / Username
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="student@school.edu" 
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
                Initial Password
              </label>
              <button 
                type="button"
                onClick={generatePassword}
                className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  isGenerated ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700'
                }`}
              >
                {isGenerated ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Wand2 className="w-3.5 h-3.5" />}
                {isGenerated ? 'Generated!' : 'Auto-Generate'}
              </button>
            </div>
            <div className="relative">
              <KeyRound className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                type="text" 
                required
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Password" 
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all dark:text-zinc-100 font-mono text-sm tracking-wide"
              />
            </div>
            <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-2">
              Note: This password will be securely provided to the student once. They will be prompted to change it upon first login.
            </p>
          </div>

          <div className="pt-6 flex items-center justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-neutral-700 dark:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-all active:scale-95 shadow-sm shadow-emerald-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Enroll Student
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
