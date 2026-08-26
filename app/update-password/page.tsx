"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // Make sure we have a session (the user clicked the email link)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Your password reset link is invalid or has expired. Please request a new one.");
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setMessage("Password updated successfully! Redirecting...");
      
      // Short delay so they see the success message
      setTimeout(() => {
        router.push("/");
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-2xl">
        <div className="mb-8 text-center text-emerald-500 font-black tracking-tighter text-3xl">RADIX</div>
        
        <div className="mb-6">
           <h1 className="text-xl font-bold text-white mb-1">Update Password</h1>
           <p className="text-zinc-400 text-sm">Enter your new password below.</p>
        </div>

        {error && <div className="p-3 mb-6 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}
        {message && <div className="p-3 mb-6 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">{message}</div>}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="text-zinc-400 text-sm font-medium mb-1.5 block">New Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white placeholder-zinc-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm font-mono tracking-wider" 
            />
          </div>
          
          <div>
            <label className="text-zinc-400 text-sm font-medium mb-1.5 block">Confirm New Password</label>
            <input 
              type="password" 
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white placeholder-zinc-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm font-mono tracking-wider" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !!error.includes("expired")}
            className="w-full py-3.5 mt-4 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:bg-zinc-800 disabled:text-zinc-600 bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <div className="mt-6 text-center">
             <button 
                onClick={() => router.push("/login")} 
                className="text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
             >
                Return to Login
             </button>
        </div>
      </div>
    </div>
  );
}
