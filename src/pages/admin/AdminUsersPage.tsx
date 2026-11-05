import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers, toggleUserSuspension } from '../../services/adminService';
import { User } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  Users,
  Search,
  Shield,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export function AdminUsersPage() {
  const { fbUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await getAllUsers();
      setUsers(list);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleSuspend = async (user: User) => {
    if (!fbUser) return;
    const willSuspend = user.accountStatus !== 'suspended';
    setActionLoading(user.uid);
    try {
      await toggleUserSuspension(
        fbUser.uid,
        user.uid,
        willSuspend,
        willSuspend ? 'Administrative restriction' : 'Restored by admin'
      );
      await loadUsers();
    } catch (err) {
      console.error('Failed to update user status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-600" />
            <span>User Account Management</span>
          </h1>
          <p className="text-xs text-gray-500">
            Inspect registered creators and supporters, enforce account restrictions, and monitor activity.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search users by name, email, or @username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No users found matching search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.uid} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{u.fullName || 'User'}</div>
                      <div className="text-[11px] text-gray-400 font-mono">@{u.username}</div>
                    </td>
                    <td className="p-4 text-gray-600">{u.email}</td>
                    <td className="p-4">
                      <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.accountStatus === 'suspended'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {u.accountStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleSuspend(u)}
                          disabled={actionLoading === u.uid}
                          className={`px-3 py-1 text-xs font-bold rounded-xl border transition-colors ${
                            u.accountStatus === 'suspended'
                              ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                              : 'border-rose-300 text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          {actionLoading === u.uid
                            ? 'Updating...'
                            : u.accountStatus === 'suspended'
                            ? 'Reinstate'
                            : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
