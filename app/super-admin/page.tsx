"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createSchoolAndAdmin, getAllSchools, updateSchool, deleteSchool } from "@/app/actions/superAdminActions";
import { Plus, School, Key, Loader2, CheckCircle, Hash, Copy, Pencil, Trash2, X, Save, ArrowLeft, Users, Building2, BookOpen } from "lucide-react";
import Link from "next/link";

type SchoolRecord = {
  custom_id: string;
  school_name: string;
  created_at?: string;
};

export default function SuperAdminPage() {
  // --- View State ---
  const [view, setView] = useState<"list" | "create">("list");
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);

  // --- Create Form ---
  const [formData, setFormData] = useState({
    schoolName: "",
    customSchoolId: "",
    password: ""
  });
  const [createStatus, setCreateStatus] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
    schoolId: string | null;
  }>({ loading: false, error: null, success: false, schoolId: null });

  // --- Edit State ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // --- Delete State ---
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // --- Fetch Schools ---
  const fetchSchools = useCallback(async () => {
    setLoadingSchools(true);
    const result = await getAllSchools();
    if (result.success && result.data) {
      setSchools(result.data);
    }
    setLoadingSchools(false);
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  // --- Handlers ---
  const generateRandomId = () => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, customSchoolId: `RADIX-${random}` }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStatus({ loading: true, error: null, success: false, schoolId: null });

    try {
      if (!formData.customSchoolId) {
        setCreateStatus({ loading: false, error: "School ID is required.", success: false, schoolId: null });
        return;
      }

      const result = await createSchoolAndAdmin(
        formData.schoolName,
        formData.customSchoolId,
        formData.password
      );

      if (result.success && result.data) {
        setCreateStatus({ loading: false, error: null, success: true, schoolId: result.data.schoolId });
        setFormData({ schoolName: "", customSchoolId: "", password: "" });
        await fetchSchools();
      } else {
        setCreateStatus({ loading: false, error: result.message, success: false, schoolId: null });
      }
    } catch {
      setCreateStatus({ loading: false, error: "A client-side error occurred.", success: false, schoolId: null });
    }
  };

  const handleUpdate = async (customId: string) => {
    if (!editName.trim()) return;
    setEditLoading(true);
    const result = await updateSchool(customId, editName.trim());
    if (result.success) {
      setEditingId(null);
      await fetchSchools();
    }
    setEditLoading(false);
  };

  const handleDelete = async (customId: string) => {
    setDeleteLoading(true);
    const result = await deleteSchool(customId);
    if (result.success) {
      setDeleteConfirm(null);
      await fetchSchools();
    }
    setDeleteLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">

      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-emerald-500 font-black text-xl tracking-tighter hover:opacity-80 transition-opacity">RADIX</Link>
            <div className="h-5 w-px bg-zinc-800" />
            <Link href="/" className="hidden sm:flex text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Home</Link>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">Super Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {view === "list" ? (
              <button
                onClick={() => { setView("create"); setCreateStatus({ loading: false, error: null, success: false, schoolId: null }); }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] active:scale-[0.97]"
              >
                <Plus className="w-4 h-4" />
                New School
              </button>
            ) : (
              <button
                onClick={() => { setView("list"); setCreateStatus({ loading: false, error: null, success: false, schoolId: null }); }}
                className="flex items-center gap-2 text-zinc-400 hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Schools
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10">

        {/* ===================== LIST VIEW ===================== */}
        {view === "list" && (
          <div>
            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{schools.length}</p>
                  <p className="text-xs text-zinc-500 font-medium">Active Schools</p>
                </div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{schools.length}</p>
                  <p className="text-xs text-zinc-500 font-medium">School Admins</p>
                </div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <School className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">RADIX</p>
                  <p className="text-xs text-zinc-500 font-medium">Platform</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-6">Registered Schools</h2>

            {loadingSchools ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : schools.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl">
                <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 font-medium mb-2">No schools provisioned yet.</p>
                <button onClick={() => setView("create")} className="text-emerald-500 hover:text-emerald-400 text-sm font-bold transition-colors">
                  + Create your first school
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {schools.map((school) => (
                  <div
                    key={school.custom_id}
                    className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-zinc-700/50 transition-colors group"
                  >
                    {/* Left: Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <School className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        {editingId === school.custom_id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="bg-zinc-950 border border-emerald-500/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full max-w-[280px]"
                              autoFocus
                              onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(school.custom_id); if (e.key === 'Escape') setEditingId(null); }}
                            />
                            <button onClick={() => handleUpdate(school.custom_id)} disabled={editLoading} className="text-emerald-500 hover:text-emerald-400 p-1">
                              {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setEditingId(null)} className="text-zinc-500 hover:text-zinc-300 p-1">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-white font-bold text-sm truncate">{school.school_name}</p>
                            <p className="text-emerald-500/80 text-xs font-mono font-bold tracking-wider">{school.custom_id}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    {editingId !== school.custom_id && (
                      <div className="flex items-center gap-2 shrink-0">
                        {deleteConfirm === school.custom_id ? (
                          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                            <span className="text-red-400 text-xs font-bold">Delete permanently?</span>
                            <button
                              onClick={() => handleDelete(school.custom_id)}
                              disabled={deleteLoading}
                              className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors"
                            >
                              {deleteLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-zinc-400 hover:text-zinc-200 text-xs font-bold px-2 py-1"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <Link
                              href={`/school-admin/${school.custom_id}`}
                              className="flex items-center gap-1.5 p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all text-xs font-bold no-underline"
                              title="Manage Students"
                            >
                              <Users className="w-4 h-4" />
                              Students
                            </Link>
                            <Link
                              href={`/curriculum/${school.custom_id}`}
                              className="flex items-center gap-1.5 p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-all text-xs font-bold no-underline"
                              title="View Curriculum"
                            >
                              <BookOpen className="w-4 h-4" />
                              Curriculum
                            </Link>
                            <button
                              onClick={() => { setEditingId(school.custom_id); setEditName(school.school_name); }}
                              className="p-2.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                              title="Edit school name"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(school.custom_id)}
                              className="p-2.5 rounded-xl bg-zinc-800/50 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all"
                              title="Delete school"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== CREATE VIEW ===================== */}
        {view === "create" && (
          <div className="max-w-xl mx-auto">
            <div className="bg-zinc-900/50 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-emerald-500/20 rounded-full blur-[60px] pointer-events-none" />

              {createStatus.success ? (
                <div className="space-y-6 py-12 text-center">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Tenant Created!</h2>
                  <p className="text-zinc-400 mb-8 max-w-[280px] mx-auto">
                    School ID: <strong className="text-white">{createStatus.schoolId}</strong> has been fully initialized.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => { setView("list"); setCreateStatus({ loading: false, error: null, success: false, schoolId: null }); }}
                      className="w-full flex items-center justify-center gap-2 bg-white text-zinc-950 py-3.5 rounded-xl font-bold tracking-wide hover:bg-zinc-200 transition-colors"
                    >
                      View All Schools
                    </button>
                    <button
                      onClick={() => setCreateStatus({ loading: false, error: null, success: false, schoolId: null })}
                      className="w-full text-zinc-500 hover:text-zinc-300 font-medium py-3 transition-colors"
                    >
                      Provision Another School
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-5">
                  <div className="border-b border-white/10 pb-6 mb-6">
                    <h2 className="text-xl font-bold mb-1">New School Tenant</h2>
                    <p className="text-zinc-500 text-sm">Fill out all fields to provision a new school and its admin account.</p>
                  </div>

                  {/* School Name */}
                  <div className="space-y-2 group">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 group-focus-within:text-emerald-400 transition-colors">School Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <School className="w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="E.g. Central Robotics High"
                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium"
                        value={formData.schoolName}
                        onChange={e => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Custom School ID */}
                  <div className="space-y-2 group">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 group-focus-within:text-emerald-400 transition-colors flex justify-between">
                      <span>Custom School ID</span>
                      <button type="button" onClick={generateRandomId} className="hover:text-emerald-300 text-emerald-500 flex items-center gap-1">
                        <Copy className="w-3 h-3" /> Auto
                      </button>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Hash className="w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="RADIX-XXXX"
                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3.5 pl-10 pr-4 text-sm text-emerald-400 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-bold tracking-wider"
                        value={formData.customSchoolId}
                        onChange={e => setFormData(prev => ({ ...prev, customSchoolId: e.target.value }))}
                      />
                    </div>
                  </div>



                  {/* Admin Password */}
                  <div className="space-y-2 group">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 group-focus-within:text-emerald-400 transition-colors">Admin Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Key className="w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                      </div>
                      <input
                        type="text"
                        required
                        minLength={6}
                        placeholder="Generated string..."
                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono"
                        value={formData.password}
                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-600 text-right mt-1">Min 6 characters.</p>
                  </div>

                  {createStatus.error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">
                      <strong>Error:</strong> {createStatus.error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={createStatus.loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 py-3.5 rounded-xl font-bold tracking-wide transition-all flex items-center justify-center gap-2 mt-2 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]"
                  >
                    {createStatus.loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Deploy Tenant
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
