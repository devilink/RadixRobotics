"use client";

import React, { useState, useTransition } from "react";
import { StudentData, toggleStudentApproval, createStudentAccount } from "@/app/actions/schoolAdminActions";
import { Check, X, Search, ShieldAlert, GraduationCap, LayoutDashboard, LogOut, UserPlus, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

interface Props {
  initialStudents: StudentData[];
  schoolId: string;
}

export default function StudentManager({ initialStudents, schoolId }: Props) {
  const [students, setStudents] = useState<StudentData[]>(initialStudents);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", studentCode: "" });
  const [adding, setAdding] = useState(false);
  const [addResult, setAddResult] = useState<{ ok: boolean; text: string; note?: string } | null>(null);
  const supabase = createClient();

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const bytes = crypto.getRandomValues(new Uint32Array(10));
    const body = Array.from(bytes, (b) => chars[b % chars.length]).join("");
    setForm((f) => ({ ...f, password: `${body}${(bytes[0] % 10)}` }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setAddResult(null);
    const res = await createStudentAccount(schoolId, form);
    setAdding(false);
    if (res.success && res.student) {
      setStudents((prev) => [res.student!, ...prev]);
      setAddResult({ ok: true, text: `${res.message} Password: ${form.password}`, note: res.erpNote });
      setForm({ name: "", email: "", password: "", studentCode: "" });
    } else {
      setAddResult({ ok: false, text: res.message });
    }
  };

  const handleToggle = async (studentId: string, currentStatus: boolean) => {
    // Optimistic toggle
    const updatedStatus = !currentStatus;
    setStudents((prev) =>
      prev.map((s) => s.id === studentId ? { ...s, is_approved: updatedStatus } : s)
    );

    startTransition(async () => {
      const { success } = await toggleStudentApproval(studentId, updatedStatus);
      if (!success) {
        // Revert on failure
        setStudents((prev) =>
          prev.map((s) => s.id === studentId ? { ...s, is_approved: currentStatus } : s)
        );
        alert("Failed to update student approval status.");
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const filteredStudents = students.filter(s =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-brand-500/30">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-brand-500 font-black text-xl tracking-tighter hover:opacity-80 transition-opacity">RADIX</Link>
            <div className="h-5 w-px bg-zinc-800 hidden sm:block" />
            <Link href="/" className="hidden sm:flex text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Home</Link>
            <div className="hidden sm:flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-brand-400" />
              <h1 className="text-sm font-bold tracking-tight text-white mb-0">Admin <span className="text-zinc-500 font-mono font-normal">&middot; {schoolId}</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/curriculum/${schoolId}`}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full text-sm font-medium transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Curriculum Map
            </Link>
            <button
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 rounded-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">Student Management</h2>
            <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
              Add students directly, or review and approve students who registered themselves. Unapproved students cannot access the curriculum.
            </p>
          </div>

          <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3 shrink-0">
          <button
            type="button"
            onClick={() => { setShowAdd((v) => !v); setAddResult(null); }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-brand-400 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Add Student
          </button>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all placeholder:text-zinc-600"
            />
          </div>
          </div>
        </div>

        {/* Add Student */}
        {showAdd && (
          <form onSubmit={handleAdd} className="mb-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Add a student</h3>
                <p className="text-sm text-zinc-500">The account is approved immediately. Share the email and password with the student; they sign in on the Student tab.</p>
              </div>
              <button type="button" onClick={() => setShowAdd(false)} aria-label="Close" className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {([
                ["name", "Full name", "text", "E.g. Ananya Sharma", true],
                ["email", "Email", "email", "student@example.com", true],
                ["studentCode", "Roll / admission no. (optional)", "text", "E.g. 2026-041", false],
              ] as const).map(([key, label, type, placeholder, required]) => (
                <label key={key} className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
                  <input
                    type={type}
                    required={required}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 px-3.5 py-3 text-sm text-white placeholder-zinc-600 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                  />
                </label>
              ))}
              <label className="block">
                <span className="mb-1.5 flex justify-between text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                  Password
                  <button type="button" onClick={generatePassword} className="flex items-center gap-1 normal-case tracking-normal text-brand-500 hover:text-brand-300">
                    <RefreshCw className="w-3 h-3" /> Generate
                  </button>
                </span>
                <input
                  type="text"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="At least 8 characters, a letter and a number"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 px-3.5 py-3 font-mono text-sm text-white placeholder-zinc-600 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                />
              </label>
            </div>
            {addResult && (
              <div role={addResult.ok ? "status" : "alert"} className={`mt-5 rounded-xl border p-3 text-sm ${addResult.ok ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-red-500/20 bg-red-500/10 text-red-400"}`}>
                {addResult.text}
                {addResult.note && <p className="mt-1 text-amber-300">{addResult.note}</p>}
              </div>
            )}
            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={adding}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-brand-400 disabled:bg-zinc-800 disabled:text-zinc-600"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {adding ? "Creating..." : "Create student"}
              </button>
            </div>
          </form>
        )}

        {/* Data Table */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-900/80">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Account ID</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Student</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-zinc-500">
                    <GraduationCap className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <code className="text-[11px] font-mono text-zinc-600 tracking-wider">
                        {student.id.substring(0, 8)}...
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {student.name && <p className="font-medium text-zinc-100">{student.name}</p>}
                      <p className={student.name ? "text-xs text-zinc-500" : "font-medium text-zinc-200"}>{student.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      {student.is_approved ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Search className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggle(student.id, student.is_approved)}
                        className={`inline-flex items-center justify-center px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                          student.is_approved
                            ? "bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-transparent hover:border-red-500/30"
                            : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]"
                        }`}
                      >
                        {student.is_approved ? "Revoke Access" : "Approve Student"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
