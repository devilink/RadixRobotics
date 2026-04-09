"use client";

import { useEffect, useState } from 'react';
import { getCurriculumUsers, createCurriculumUser, deleteCurriculumUser, updateCurriculumUser } from '../actions';
import { SignOutButton, UserButton, useUser } from '@clerk/nextjs';

type User = {
  id: string;
  username: string;
  password?: string;
  createdAt: Date;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);

  // Example Admin Check
  // In a real app we would use Clerk Roles, but we use the primary email here as a simple check based on plan
  const adminEmail = "princedas000555@gmail.com";
  
  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const data = await getCurriculumUsers();
    setUsers(data);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.append('username', username);
    fd.append('password', password);
    const res = await createCurriculumUser(fd);
    if (!res.success) alert(res.error);
    else {
      setUsername('');
      setPassword('');
      loadUsers();
    }
  }

  async function handleDelete(id: string) {
    if(!confirm('Are you sure?')) return;
    const res = await deleteCurriculumUser(id);
    if (!res.success) alert(res.error);
    else loadUsers();
  }

  if (!isLoaded || loading) return <div className="p-8">Loading...</div>;

  const email = user?.primaryEmailAddress?.emailAddress;
  const isAdmin = email === adminEmail;

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-600">Access Denied. You are not the admin.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 pt-24 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Curriculum User Management</h1>
          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium text-gray-500">{email}</span>
            <UserButton />
          </div>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 mb-8 bg-gray-50 border border-gray-200 p-5 rounded-lg items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Username (ID)</label>
            <input type="text" value={username} onChange={e=>setUsername(e.target.value)} required className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-4 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="Enter username" />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="text" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-4 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="Enter password" />
          </div>
          <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-md font-medium hover:bg-emerald-700 transition-colors shrink-0">Create User</button>
        </form>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-sm font-semibold text-gray-600">User ID</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Password</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{u.username}</td>
                  <td className="p-4 text-gray-500">{u.password}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(u.id)} className="text-red-500 text-sm font-medium hover:text-red-700 transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">No curriculum users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
