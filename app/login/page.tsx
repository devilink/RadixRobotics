"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { autoAssignSuperAdmin, getUserRoleById } from "@/app/actions/superAdminActions";
import { getAvailableSchools, queueStudentForApproval } from "@/app/actions/studentActions";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"admin" | "school" | "student">("admin");
  const [studentMode, setStudentMode] = useState<"login" | "register" | "forgot">("login");
  const [schools, setSchools] = useState<{custom_id: string, school_name: string}[]>([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [schoolId, setSchoolId] = useState("");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'pending') {
      setActiveTab('student');
      setError('Your account is pending approval. Please wait for your school administrator to approve your registration.');
    }

    getAvailableSchools().then((data) => setSchools(data));

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setLoading(true);
        await autoAssignSuperAdmin(session.user.email || '', session.user.id);
        await routeUser(session.user.id);
      }
    };
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // 1. FORGOT PASSWORD FLOW
      if (activeTab === "student" && studentMode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (resetError) throw resetError;
        setMessage("Password reset link sent! Check your email.");
        setLoading(false);
        return;
      }

      // 2. REGISTER FLOW
      if (activeTab === "student" && studentMode === "register") {
        if (!selectedSchool) throw new Error("Please select your school before registering.");

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error("Failed to create account.");

        // Queue them for approval
        const qRes = await queueStudentForApproval(signUpData.user.id, selectedSchool);
        if (!qRes.success) throw new Error(qRes.error || "Failed to initialize student profile.");

        setError("Success! Your registration has been submitted. You cannot access the system until your school administrator approves your account!");
        setStudentMode("login");
        setLoading(false);
        return;
      }

      // 3. LOGIN FLOW
      let loginEmail = email;

      if (activeTab === "school") {
        if (!schoolId.trim()) throw new Error("Please enter your School ID.");
        loginEmail = `${schoolId.trim().toLowerCase()}@radix.school`;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (authError || !authData.user) {
        throw authError || new Error("Login failed");
      }

      if (activeTab === "school") {
        router.push(`/curriculum/${schoolId.trim().toUpperCase()}`);
        return;
      }

      await autoAssignSuperAdmin(authData.user.email || '', authData.user.id);
      await routeUser(authData.user.id);
    } catch (err: any) {
      if (err.message?.includes("Email not confirmed")) {
        setError("Please check your inbox and confirm your email address before logging in.");
      } else if (err.message?.includes("Invalid login credentials")) {
        setError(activeTab === "school" ? "Invalid School ID or password." : "Invalid email or password.");
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
      setLoading(false);
    }
  };



  const routeUser = async (userId: string) => {
    // Super Admin & School Admin email bypass
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const email = currentUser?.email || '';
    
    if (email === 'princedas000555@gmail.com') {
      router.push("/super-admin");
      return;
    }
    
    if (email.endsWith('@radix.school')) {
      const schoolId = email.replace('@radix.school', '').toUpperCase();
      router.push(`/curriculum/${schoolId}`);
      return;
    }

    // Fetch User Role cleanly from server back-end escaping RLS blocks
    const roleData = await getUserRoleById(userId);

    if (!roleData) {
      setError("No role has been assigned to your account. Contact your administrator.");
      setLoading(false);
      return;
    }

    if (roleData.is_approved === false) {
      setError("Your account is currently Pending Approval by your school administrator.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // Route approved students to their school's curriculum
    if (roleData.role === 'student' && roleData.school_id) {
      router.push(`/curriculum/${roleData.school_id}`);
      return;
    }

    // Fallback route
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-2xl">
        <div className="mb-8 text-center text-emerald-500 font-black tracking-tighter text-3xl">RADIX</div>
        
        {/* Master Tabs */}
        <div className="flex bg-zinc-950 rounded-xl p-1 mb-8 border border-zinc-800 uppercase tracking-widest text-[10px] font-bold">
          <button 
            type="button"
            onClick={() => { setActiveTab("admin"); setError(""); }}
            className={`flex-1 py-3 rounded-lg transition-all duration-300 ${activeTab === "admin" ? "bg-amber-600 text-white shadow-[0_0_15px_rgba(217,119,6,0.2)]" : "text-zinc-500 hover:text-zinc-400"}`}
          >
            Admin
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab("school"); setError(""); }}
            className={`flex-1 py-3 rounded-lg transition-all duration-300 ${activeTab === "school" ? "bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "text-zinc-500 hover:text-zinc-400"}`}
          >
            School
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab("student"); setError(""); setStudentMode("login"); }}
            className={`flex-1 py-3 rounded-lg transition-all duration-300 ${activeTab === "student" ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.2)]" : "text-zinc-500 hover:text-zinc-400"}`}
          >
            Student
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-white mb-1">
            {activeTab === "admin" ? "Super Admin Login" : activeTab === "school" ? "School Login" : studentMode === "login" ? "Student Login" : "Student Registration"}
          </h1>
          <p className="text-zinc-500 text-xs leading-relaxed">
            {activeTab === "admin" 
              ? "Sign in with your administrator email and password."
              : activeTab === "school" 
                ? "Sign in with the School ID and password provided by the Admin." 
                : studentMode === "login"
                   ? "Log in to access your assigned robotics curriculum."
                   : "Register for your student account. Requires admin approval."}
          </p>
        </div>

        {/* Student Sub-Tabs for Register vs Login */}
        {activeTab === "student" && (
          <div className="flex gap-4 mb-6 border-b border-zinc-800 pb-4">
             <button onClick={() => {setStudentMode("login"); setError(""); setMessage("");}} className={`text-xs font-bold transition-colors ${studentMode === "login" ? "text-blue-500" : "text-zinc-600 hover:text-zinc-400"}`}>Log In</button>
             <button onClick={() => {setStudentMode("register"); setError(""); setMessage("");}} className={`text-xs font-bold transition-colors ${studentMode === "register" ? "text-blue-500" : "text-zinc-600 hover:text-zinc-400"}`}>Register Account</button>
          </div>
        )}

        {error && <div className="p-3 mb-6 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}
        {message && <div className="p-3 mb-6 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">{message}</div>}
        
        <form onSubmit={handleAuth} className="space-y-4">
          {activeTab === "school" ? (
            <div>
              <label className="text-zinc-400 text-sm font-medium mb-1.5 block">School ID</label>
              <input 
                type="text" 
                required 
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                placeholder="RADIX-XXXXXX"
                className="w-full p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-emerald-400 placeholder-zinc-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm font-bold tracking-wider" 
              />
            </div>
          ) : (
            <div>
              <label className="text-zinc-400 text-sm font-medium mb-1.5 block">Email Address</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white placeholder-zinc-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm" 
              />
            </div>
          )}
          
          {!(activeTab === "student" && studentMode === "forgot") && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-zinc-400 text-sm font-medium block">Password</label>
                {activeTab === "student" && studentMode === "login" && (
                  <button 
                    type="button" 
                    onClick={() => {setStudentMode("forgot"); setError(""); setMessage("");}}
                    className="text-[10px] uppercase tracking-wider font-bold text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white placeholder-zinc-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm font-mono tracking-wider" 
              />
            </div>
          )}
          {activeTab === "student" && studentMode === "register" && (
            <div>
              <label className="text-zinc-400 text-sm font-medium mb-1.5 block">Select School</label>
              <select 
                required 
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm appearance-none"
              >
                <option value="" disabled>-- Choose your enrolled school --</option>
                {schools.map(s => (
                  <option key={s.custom_id} value={s.custom_id}>{s.school_name}</option>
                ))}
              </select>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3.5 mt-4 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:bg-zinc-800 disabled:text-zinc-600 ${
              activeTab === "admin"
                ? "bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.15)]"
                : activeTab === "student" 
                  ? "bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.15)]" 
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            }`}
          >
            {loading ? "Processing..." : activeTab === "student" && studentMode === "register" ? "Submit Registration" : activeTab === "student" && studentMode === "forgot" ? "Send Reset Link" : "Sign In"}
          </button>
        </form>



      </div>
    </div>
  );
}
