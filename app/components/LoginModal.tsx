"use client";

import { useState } from 'react';
import { loginCurriculum } from '../actions';
import { useRouter } from 'next/navigation';

export default function LoginModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  async function handleLogin() {
    setError('');
    setLoading(true);
    const res = await loginCurriculum(username, password);
    setLoading(false);
    if (res.success) {
      router.push('/curriculum');
    } else {
      setError(res.error || 'Login failed');
    }
  }

  return (
    <div style={{ display: 'flex', position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div style={{ background: '#fff', borderRadius: '24px', padding: '3rem', width: '90%', maxWidth: '420px', boxShadow: '0 30px 80px rgba(15,23,42,0.2)', transform: 'translateY(0)', transition: 'transform 0.3s', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>&times;</button>
        <div style={{ width: '50px', height: '50px', background: 'var(--accent-green)', clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem', marginBottom: '1.5rem' }}>⬡</div>
        <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.4rem' }}>Curriculum Access</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>This area is restricted to RADIX partners and staff.</p>
        
        {error && (
          <div style={{ background: '#fff0f0', color: '#dc2626', borderRadius: '10px', padding: '0.8rem 1rem', fontSize: '0.85rem', marginBottom: '1.2rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1.2rem' }}>
          <label style={{ fontFamily: "'Syne',sans-serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>Username</label>
          <input type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: '0.9rem 1.1rem', border: '1.5px solid var(--border)', borderRadius: '10px', fontFamily: "'DM Sans',sans-serif", fontSize: '0.95rem', color: 'var(--ink)', outline: 'none' }} />
        </div>
        <div style={{ marginBottom: '1.8rem' }}>
          <label style={{ fontFamily: "'Syne',sans-serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>Password</label>
          <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ width: '100%', padding: '0.9rem 1.1rem', border: '1.5px solid var(--border)', borderRadius: '10px', fontFamily: "'DM Sans',sans-serif", fontSize: '0.95rem', color: 'var(--ink)', outline: 'none' }} />
        </div>
        <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: '1rem', background: 'var(--accent-green)', color: '#fff', border: 'none', borderRadius: '10px', fontFamily: "'Syne',sans-serif", fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          {loading ? 'Verifying...' : 'Access Curriculum \u2192'}
        </button>
      </div>
    </div>
  );
}
