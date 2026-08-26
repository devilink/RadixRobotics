"use client";

import React, { useState } from 'react';
import { Circle, Trash2, ArrowRight, Plus, ChevronDown, ChevronUp, CheckSquare, Square, Menu, X } from 'lucide-react';
import Link from 'next/link';

export interface Submodule {
  id: string;
  name: string;
  description: string;
  completed: boolean;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  submodules: Submodule[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  dateAdded: string;
  modules: Module[];
}

const TwitterIcon = ({ size = 13, strokeWidth = 2.5, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

const InstagramIcon = ({ size = 13, strokeWidth = 2.5, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const LinkedinIcon = ({ size = 13, strokeWidth = 2.5, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4";
const STATUSES = ["Upcoming", "Ongoing", "Completed", "Archived"];

const SocialBtn = ({ icon: Icon, className }: { icon: any, className: string }) => (
  <button type="button" className={`w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-80 transition-opacity ${className}`}>
    <Icon size={13} strokeWidth={2.5} />
  </button>
);

export default function ContactLandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [status, setStatus] = useState<string>("Upcoming");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "Nexus Core AI",
      description: "Upgrade core neural pathways for faster visual processing.",
      status: "Ongoing",
      dateAdded: new Date().toLocaleDateString(),
      modules: [
        {
          id: "m1", name: "Vision Array", description: "Main vision component", completed: true, submodules: [
            { id: "s1", name: "Camera API", description: "Interface for camera hardware", completed: true },
            { id: "s2", name: "Tensor Core", description: "Processing core optimization", completed: false }
          ]
        },
        {
          id: "m2", name: "Core ML", description: "Machine learning module updates", completed: false, submodules: []
        }
      ]
    },
    {
      id: "2",
      name: "Servo Firm. v2",
      description: "Overhaul the kinetic drivers to reduce power consumption.",
      status: "Upcoming",
      dateAdded: new Date().toLocaleDateString(),
      modules: [
        {
          id: "m3", name: "Kinematics", description: "Movement solver equations", completed: false, submodules: [
            { id: "s3", name: "Driver API", description: "Hardware driver interface", completed: false }
          ]
        },
        {
          id: "m4", name: "Power", description: "Power management optimizations", completed: false, submodules: []
        }
      ]
    }
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Project | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggleProjectExpand = (id: string) => {
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditing = (p: Project) => {
    setEditingId(p.id);
    setEditForm(JSON.parse(JSON.stringify(p))); // Deep copy
  };

  const saveEdit = (id: string) => {
    if (!editForm) return;
    setProjects(projects.map(p => p.id === id ? editForm : p));
    setEditingId(null);
    setEditForm(null);
  };

  const toggleItemCompletion = (projectId: string, moduleId: string, submoduleId?: string) => {
    setProjects(projects.map(p => {
      if (p.id !== projectId) return p;
      const newModules = p.modules.map(m => {
        if (m.id !== moduleId) return m;
        if (!submoduleId) {
          return { ...m, completed: !m.completed };
        }
        const newSubmodules = m.submodules.map(s => s.id === submoduleId ? { ...s, completed: !s.completed } : s);
        return { ...m, submodules: newSubmodules };
      });
      return { ...p, modules: newModules };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName) return;
    setSending(true);
    
    // Simulate DB insert
    await new Promise(r => setTimeout(r, 1000));
    
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: projectName,
      description: projectDescription,
      status: status,
      dateAdded: new Date().toLocaleDateString(),
      modules: []
    };
    
    setProjects([newProject, ...projects]);
    setSending(false);
    setSent(true);
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  const updateProjectStatus = (id: string, newStatus: string) => {
    setProjects(projects.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  return (
    <div className="min-h-screen bg-white p-3 sm:p-4 md:p-6 font-inter text-gray-900 flex flex-col gap-8">
      
      {/* Hero Section */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden min-h-[calc(100vh-24px)] sm:min-h-[calc(100vh-32px)] md:min-h-[calc(100vh-48px)] lg:h-[calc(100vh-48px)] shadow-2xl shrink-0">
        
        <video
          src={VIDEO_URL}
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="relative z-10 flex flex-col min-h-[calc(100vh-24px)] sm:min-h-[calc(100vh-32px)] md:min-h-[calc(100vh-48px)] lg:h-full p-4 sm:p-6 md:p-8 gap-6">
          
          {/* Navigation */}
          <div style={{ position: 'fixed', top: '2rem', left: 0, right: 0, zIndex: 100, display: 'flex', justifyContent: 'center', padding: '0 1rem' }}>
              <nav className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', width: '100%', maxWidth: '95%' }}>
                  <Link href="/" className="nav-link font-bold text-sm uppercase tracking-tighter text-white" style={{ flexShrink: 0 }}>Radix</Link>

                  {/* Desktop Nav Links */}
                  <div className="flex items-center" style={{ gap: '1.25rem' }}>
                      <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }}></div>
                      <Link href="/super-admin" className="nav-link text-white" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, whiteSpace: 'nowrap' }}>Dashboard</Link>
                      <a href="#projects" className="nav-link text-white" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, whiteSpace: 'nowrap' }}>Ongoing</a>
                      <a href="#projects" className="nav-link text-white" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, whiteSpace: 'nowrap' }}>Upcoming</a>
                      <a href="#projects" className="nav-link text-white" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, whiteSpace: 'nowrap' }}>Archived</a>
                      <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }}></div>
                  </div>

                  {/* Desktop Auth Links / Actions */}
                  <div className="flex items-center" style={{ gap: '0.75rem' }}>
                      <Link href="/super-admin" className="nav-link flex items-center gap-2 text-white" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '9999px', whiteSpace: 'nowrap', cursor: 'pointer', border: 'none' }}>
                        Admin View
                      </Link>
                  </div>
              </nav>
          </div>

          <div className="flex-1 min-h-[2rem]" />

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 w-full">
            
            <p className="text-white text-3xl sm:text-4xl xl:text-5xl font-medium leading-tight drop-shadow-lg lg:max-w-lg xl:max-w-2xl shrink-0">
              Beyond planning, <br />
              we track the <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontWeight: 400 }}>progress</span>
            </p>

            <div className="w-full lg:w-[45%] lg:max-w-[480px] shrink-0">
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden p-4 sm:p-6 flex flex-col gap-4">
                
                {sent ? (
                  <div className="flex flex-col items-center text-center py-6 gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-xl text-green-600">
                      ✓
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Project Initialized!</h3>
                    <p className="text-sm text-gray-500">The initiative has been added to the registry.</p>
                    <button 
                      onClick={() => { setSent(false); setProjectName(""); setProjectDescription(""); setStatus("Upcoming"); }}
                      className="mt-4 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Add another project
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">New Initiative 🚀</h2>
                    
                    <div className="flex flex-row items-center justify-between gap-3 bg-gray-50 rounded-2xl px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">System Admin</span>
                        <span className="text-sm text-blue-600 font-semibold truncate">princedas000555@gmail.com</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <SocialBtn icon={Circle} className="bg-pink-100 text-pink-500 hover:bg-pink-200" />
                        <SocialBtn icon={InstagramIcon} className="bg-orange-100 text-orange-400 hover:bg-orange-200" />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-gray-400 font-medium text-sm">PARAMS</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-3">Define project parameters</label>
                        <div className="flex flex-col gap-2 mb-2">
                          <input 
                            type="text" 
                            required
                            placeholder="Project Name (e.g. Nexus Core)" 
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-transparent placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                          />
                          <input 
                            type="text" 
                            placeholder="Project Desc" 
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                            className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-transparent placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">Project Status</label>
                        <div className="flex flex-wrap gap-1.5">
                          {STATUSES.map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setStatus(s)}
                              className={`text-xs font-medium px-3 py-2 rounded-lg border transition-all ${
                                status === s
                                  ? 'bg-gray-100 text-black border-black shadow-sm'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={sending || !projectName}
                        className="w-full bg-black text-white text-sm font-semibold py-3 rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-60"
                      >
                        {sending ? 'Initializing...' : 'Initialize Project'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Projects Dashboard Section */}
      <section id="projects" className="w-full max-w-7xl mx-auto py-12 px-2 sm:px-4">
        <h2 className="text-4xl font-instrument text-black mb-10 text-center sm:text-left">Project Registry</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {STATUSES.map((colStatus) => (
            <div key={colStatus} className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  {colStatus}
                  <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {projects.filter(p => p.status === colStatus).length}
                  </span>
                </h3>
              </div>
              
              <div className="flex flex-col gap-4">
                {projects.filter(p => p.status === colStatus).length === 0 ? (
                  <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-2xl p-6 text-center italic">
                    No projects yet
                  </div>
                ) : (
                  projects.filter(p => p.status === colStatus).map((project) => {
                    const isEditing = editingId === project.id;
                    const isExpanded = !!expandedProjects[project.id];
                    
                    let totalTasks = 0;
                    let completedTasks = 0;
                    project.modules.forEach(m => {
                      totalTasks++;
                      if (m.completed) completedTasks++;
                      m.submodules.forEach(s => {
                        totalTasks++;
                        if (s.completed) completedTasks++;
                      });
                    });
                    const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

                    return (
                    <div key={project.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group relative flex flex-col">
                      
                      {isEditing && editForm ? (
                        <div className="flex flex-col gap-4">
                          <h4 className="font-semibold text-black text-base truncate border-b pb-2 mb-1">Edit Project</h4>
                          
                          <div className="flex flex-col gap-2">
                            <div>
                              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Name</label>
                              <input 
                                value={editForm.name} 
                                onChange={e => setEditForm({...editForm, name: e.target.value})}
                                className="w-full text-sm p-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Description</label>
                              <textarea 
                                value={editForm.description} 
                                onChange={e => setEditForm({...editForm, description: e.target.value})}
                                className="w-full text-sm p-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black"
                                rows={2}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Status</label>
                              <select 
                                value={editForm.status} 
                                onChange={e => setEditForm({...editForm, status: e.target.value})}
                                className="w-full text-sm p-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black"
                              >
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="border-t border-gray-200 pt-3 mt-1">
                            <div className="flex justify-between items-center mb-2">
                              <label className="text-xs uppercase font-bold text-gray-600 block">Modules</label>
                              <button 
                                onClick={() => {
                                  const newModule: Module = { id: Math.random().toString(36).substr(2, 9), name: "New Module", description: "", completed: false, submodules: [] };
                                  setEditForm({...editForm, modules: [...editForm.modules, newModule]});
                                }}
                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"
                              >
                                <Plus size={12}/> Add Module
                              </button>
                            </div>

                            <div className="flex flex-col gap-3">
                              {editForm.modules.map((m, mIdx) => (
                                <div key={m.id} className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                  <div className="flex justify-between items-start mb-2">
                                    <input 
                                      className="text-sm font-semibold bg-transparent border-b border-gray-300 focus:border-black outline-none w-full mr-2"
                                      value={m.name}
                                      placeholder="Module Name"
                                      onChange={(e) => {
                                        const newMods = [...editForm.modules];
                                        newMods[mIdx].name = e.target.value;
                                        setEditForm({...editForm, modules: newMods});
                                      }}
                                    />
                                    <button onClick={() => {
                                      const newMods = editForm.modules.filter(mod => mod.id !== m.id);
                                      setEditForm({...editForm, modules: newMods});
                                    }} className="text-red-500 hover:text-red-700">
                                      <Trash2 size={14}/>
                                    </button>
                                  </div>
                                  <textarea 
                                    className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white outline-none mb-2"
                                    value={m.description}
                                    placeholder="Module Description"
                                    rows={1}
                                    onChange={(e) => {
                                      const newMods = [...editForm.modules];
                                      newMods[mIdx].description = e.target.value;
                                      setEditForm({...editForm, modules: newMods});
                                    }}
                                  />
                                  
                                  {/* Submodules Edit */}
                                  <div className="pl-3 border-l-2 border-gray-200 flex flex-col gap-2 mt-2">
                                    <div className="flex justify-between items-center">
                                      <label className="text-[10px] uppercase font-bold text-gray-500 block">Submodules</label>
                                      <button 
                                        onClick={() => {
                                          const newMods = [...editForm.modules];
                                          newMods[mIdx].submodules.push({ id: Math.random().toString(36).substr(2, 9), name: "New Submodule", description: "", completed: false });
                                          setEditForm({...editForm, modules: newMods});
                                        }}
                                        className="text-[10px] flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                      >
                                        <Plus size={10}/> Add
                                      </button>
                                    </div>
                                    {m.submodules.map((sm, smIdx) => (
                                      <div key={sm.id} className="bg-white p-2 rounded-lg border border-gray-100 flex flex-col gap-1">
                                        <div className="flex justify-between items-center">
                                          <input 
                                            className="text-xs font-medium bg-transparent border-b border-gray-200 focus:border-black outline-none w-full mr-2"
                                            value={sm.name}
                                            placeholder="Submodule Name"
                                            onChange={(e) => {
                                              const newMods = [...editForm.modules];
                                              newMods[mIdx].submodules[smIdx].name = e.target.value;
                                              setEditForm({...editForm, modules: newMods});
                                            }}
                                          />
                                          <button onClick={() => {
                                            const newMods = [...editForm.modules];
                                            newMods[mIdx].submodules = newMods[mIdx].submodules.filter(sub => sub.id !== sm.id);
                                            setEditForm({...editForm, modules: newMods});
                                          }} className="text-red-400 hover:text-red-600">
                                            <Trash2 size={12}/>
                                          </button>
                                        </div>
                                        <input 
                                          className="text-[10px] bg-transparent outline-none text-gray-500 w-full"
                                          value={sm.description}
                                          placeholder="Description"
                                          onChange={(e) => {
                                            const newMods = [...editForm.modules];
                                            newMods[mIdx].submodules[smIdx].description = e.target.value;
                                            setEditForm({...editForm, modules: newMods});
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
                            <button onClick={() => setEditingId(null)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={() => saveEdit(project.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors">Save</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Display Mode */}
                          <div className="flex justify-between items-start mb-2 cursor-pointer" onClick={() => toggleProjectExpand(project.id)}>
                            <h4 className="font-semibold text-black text-base pr-2">{project.name}</h4>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); startEditing(project); }}
                                  className="text-gray-300 hover:text-blue-500 transition-colors"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(project.id); }}
                                  className="text-gray-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <div className="text-gray-400">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                            </div>
                          </div>
                          
                          {project.description && (
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>
                          )}
                          
                          {/* Progress Bar */}
                          {totalTasks > 0 && (
                            <div className="mb-4">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Progress</span>
                                <span className="text-xs font-semibold text-gray-600">{progressPercent}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${progressPercent === 100 ? 'bg-green-500' : 'bg-black'}`}
                                  style={{ width: `${progressPercent}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {isExpanded && project.modules.length > 0 && (
                            <div className="flex flex-col gap-3 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="h-px bg-gray-100 w-full mb-1"></div>
                              {project.modules.map(m => (
                                <div key={m.id} className="flex flex-col gap-1">
                                  <div className="flex items-start gap-2 group/mod">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); toggleItemCompletion(project.id, m.id); }}
                                      className="mt-0.5 text-gray-400 hover:text-black transition-colors"
                                    >
                                      {m.completed ? <CheckSquare size={14} className="text-black" /> : <Square size={14} />}
                                    </button>
                                    <div className="flex flex-col">
                                      <span className={`text-sm font-medium ${m.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                        {m.name}
                                      </span>
                                      {m.description && (
                                        <span className={`text-[11px] leading-tight mt-0.5 ${m.completed ? 'text-gray-300' : 'text-gray-500'}`}>
                                          {m.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Render Submodules */}
                                  {m.submodules.length > 0 && (
                                    <div className="flex flex-col gap-1.5 mt-1 ml-5 pl-2 border-l-2 border-gray-100">
                                      {m.submodules.map(sm => (
                                        <div key={sm.id} className="flex items-start gap-2">
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); toggleItemCompletion(project.id, m.id, sm.id); }}
                                            className="mt-0.5 text-gray-300 hover:text-gray-600 transition-colors"
                                          >
                                            {sm.completed ? <CheckSquare size={12} className="text-gray-500" /> : <Square size={12} />}
                                          </button>
                                          <div className="flex flex-col">
                                            <span className={`text-xs ${sm.completed ? 'text-gray-300 line-through' : 'text-gray-600'}`}>
                                              {sm.name}
                                            </span>
                                            {sm.description && (
                                              <span className={`text-[10px] leading-tight ${sm.completed ? 'text-gray-200' : 'text-gray-400'}`}>
                                                {sm.description}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-[10px] text-gray-400">{project.dateAdded}</span>
                            
                            <div className="flex items-center gap-1">
                               {colStatus !== "Archived" && (
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); updateProjectStatus(project.id, STATUSES[STATUSES.indexOf(colStatus) + 1]); }}
                                   className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 px-2 py-1 rounded-lg border border-gray-200 transition-colors flex items-center gap-1"
                                 >
                                   Next <ArrowRight size={12} />
                                 </button>
                               )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )})
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Delete Project?</h3>
              <button onClick={() => setDeleteConfirmId(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteProject(deleteConfirmId)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
