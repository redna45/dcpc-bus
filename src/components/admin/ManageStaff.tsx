import React, { useState, useEffect } from 'react';
import {
  Shield,
  User,
  Search,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  UserPlus,
  X,
  Trash2,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Key,
  Copy,
  Check,
  CreditCard,
  QrCode,
  ShoppingBag,
  Scan,
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import {
  getAllUsers,
  updateUserRole,
  updateUserProfile,
  createUserByAdmin,
  deleteUserByAdmin,
  generateDesignatedId,
} from '../../services/db';
import { formatDate } from '../../lib/dateUtils';
import { useAuth, SUPER_ADMIN_EMAILS, isSuperAdminEmail } from '../../context/AuthContext';

export const ManageStaff: React.FC = () => {
  const { userProfile: currentUserProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add User modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    fullName: string;
    email: string;
    password?: string;
    role: UserRole;
    id: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [newUserData, setNewUserData] = useState<{
    fullName: string;
    email: string;
    password: string;
    mobileNumber: string;
    role: UserRole;
  }>({
    fullName: '',
    email: '',
    password: '',
    mobileNumber: '',
    role: 'cashier',
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      // Backfill missing IDs for any user that was created before
      const updatedList: UserProfile[] = [];
      for (const u of data) {
        if (!u.passengerNumber) {
          try {
            const designatedId = await generateDesignatedId(u.role);
            await updateUserProfile(u.uid, { passengerNumber: designatedId });
            updatedList.push({ ...u, passengerNumber: designatedId });
          } catch {
            updatedList.push(u);
          }
        } else {
          updatedList.push(u);
        }
      }
      setUsers(updatedList);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
    let pass = 'Pass';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUserData((prev) => ({ ...prev, password: pass }));
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRoleChange = async (uid: string, targetEmail: string, newRole: UserRole) => {
    if (isSuperAdminEmail(targetEmail) && newRole !== 'admin') {
      setStatusMsg({
        type: 'error',
        text: 'The primary system administrator account cannot be demoted.',
      });
      setTimeout(() => setStatusMsg(null), 4000);
      return;
    }

    setUpdatingUid(uid);
    setStatusMsg(null);
    try {
      await updateUserRole(uid, newRole);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u)));
      setStatusMsg({
        type: 'success',
        text: `User role successfully updated to ${newRole.toUpperCase()}.`,
      });
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      console.error('Error changing role:', err);
      setStatusMsg({
        type: 'error',
        text: 'Failed to update role: ' + (err.message || 'Unknown error'),
      });
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newUserData.fullName.trim() || !newUserData.email.trim()) {
      setFormError('Please provide a full name and valid email address.');
      return;
    }

    if (newUserData.password.trim().length < 6) {
      setFormError('Please enter a login password of at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createUserByAdmin({
        fullName: newUserData.fullName.trim(),
        email: newUserData.email.trim().toLowerCase(),
        password: newUserData.password.trim(),
        mobileNumber: newUserData.mobileNumber.trim() || '+63 900 000 0000',
        role: newUserData.role,
      });

      setUsers((prev) => [created, ...prev.filter((u) => u.uid !== created.uid)]);
      setShowAddModal(false);
      
      // Show credentials confirmation modal
      setCreatedCredentials({
        fullName: created.fullName,
        email: created.email,
        password: newUserData.password.trim(),
        role: created.role,
        id: created.passengerNumber || 'ASSIGNED',
      });

      // Reset form
      setNewUserData({
        fullName: '',
        email: '',
        password: '',
        mobileNumber: '',
        role: 'cashier',
      });

      setStatusMsg({
        type: 'success',
        text: `New ${created.role.toUpperCase()} account created successfully with designated ID ${created.passengerNumber}!`,
      });
      setTimeout(() => setStatusMsg(null), 5000);
    } catch (err: any) {
      console.error('Error creating user by admin:', err);
      setFormError('Failed to create account: ' + (err.message || 'Error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (u: UserProfile) => {
    if (isSuperAdminEmail(u.email)) {
      setStatusMsg({
        type: 'error',
        text: 'The primary administrator account (sanderbedana1@gmail.com) is protected and cannot be deleted.',
      });
      setTimeout(() => setStatusMsg(null), 4000);
      return;
    }
    setUserToDelete(u);
  };

  const executeDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    setStatusMsg(null);

    const targetUid = userToDelete.uid;
    const targetName = userToDelete.fullName;
    const targetEmail = userToDelete.email;

    try {
      await deleteUserByAdmin(targetUid);
      // Remove from state immediately
      setUsers((prev) => prev.filter((u) => u.uid !== targetUid));
      setUserToDelete(null);
      setStatusMsg({
        type: 'success',
        text: `Account for ${targetName} (${targetEmail}) was deleted successfully.`,
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setStatusMsg({
        type: 'error',
        text: 'Failed to delete user: ' + (err.message || 'Network or Firestore error'),
      });
    } finally {
      setIsDeletingUser(false);
    }
  };

  const getRolePrefixLabel = (role: UserRole) => {
    switch (role) {
      case 'cashier':
        return { prefix: 'CSH-XXXXXX', label: 'Cashier ID' };
      case 'checker':
        return { prefix: 'CHK-XXXXXX', label: 'Checker ID' };
      case 'admin':
        return { prefix: 'ADM-XXXXXX', label: 'Admin ID' };
      case 'passenger':
      default:
        return { prefix: 'PAS-XXXXXX', label: 'Passenger ID' };
    }
  };

  const getRoleIdBadge = (u: UserProfile) => {
    const id = u.passengerNumber;
    if (!id) {
      return <span className="text-slate-400 font-mono text-[11px]">Generating...</span>;
    }

    switch (u.role) {
      case 'admin':
        return (
          <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            {id}
          </span>
        );
      case 'cashier':
        return (
          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {id}
          </span>
        );
      case 'checker':
        return (
          <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            {id}
          </span>
        );
      case 'passenger':
      default:
        return (
          <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {id}
          </span>
        );
    }
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    const term = searchTerm.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.passengerNumber && u.passengerNumber.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Staff & Access Roles</h2>
          <p className="text-xs text-slate-500">
            Create staff accounts with passwords, assign roles (Cashier, Checker, Admin, Passenger), and designate unique IDs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setNewUserData({
                fullName: '',
                email: '',
                password: '',
                mobileNumber: '',
                role: 'cashier',
              });
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Create User / Role</span>
          </button>

          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID, name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            onClick={loadUsers}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer"
            title="Refresh user list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 border rounded-xl text-xs flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Role Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'admin', 'cashier', 'checker', 'passenger'].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
              roleFilter === r
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {r === 'all'
              ? `All Users (${users.length})`
              : r === 'admin'
              ? `Admins & Co-Admins (${users.filter((u) => u.role === 'admin').length})`
              : `${r}s (${users.filter((u) => u.role === r).length})`}
          </button>
        ))}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading user and staff records...
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">User & Staff Member</th>
                  <th className="px-6 py-3.5">Designated System ID</th>
                  <th className="px-6 py-3.5">Mobile Contact</th>
                  <th className="px-6 py-3.5">Registered Date</th>
                  <th className="px-6 py-3.5 text-right">Assigned Access Role</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const isSuper = isSuperAdminEmail(u.email);
                  return (
                    <tr key={u.uid} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img
                          src={u.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.fullName}`}
                          alt={u.fullName}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900">{u.fullName}</p>
                            {isSuper && (
                              <span className="text-[9px] font-black bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-300">
                                PRIMARY ADMIN
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRoleIdBadge(u)}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{u.mobileNumber || '—'}</td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(u.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={u.role}
                          disabled={updatingUid === u.uid || isSuper}
                          onChange={(e) => handleRoleChange(u.uid, u.email, e.target.value as UserRole)}
                          className={`p-1.5 px-3 rounded-xl text-xs font-bold border focus:outline-none transition cursor-pointer ${
                            u.role === 'admin'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : u.role === 'cashier'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : u.role === 'checker'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          <option value="passenger">Passenger (Rider)</option>
                          <option value="cashier">Cashier</option>
                          <option value="checker">Checker</option>
                          <option value="admin">Administrator / Co-Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {!isSuper ? (
                          <button
                            onClick={() => handleOpenDeleteModal(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title={`Delete user account for ${u.fullName}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-mono">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 text-xs text-slate-400">
          No users match the selected criteria.
        </div>
      )}

      {/* Modal: Create User / Staff Role */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-xs">
                  <UserPlus className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Create Staff or Passenger Account</h3>
                  <p className="text-[11px] text-slate-500">
                    Set up email login credentials and assign a designated ID
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Santos"
                    value={newUserData.fullName}
                    onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+63 912 345 6789"
                    value={newUserData.mobileNumber}
                    onChange={(e) => setNewUserData({ ...newUserData, mobileNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Login Username) *</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="cashier1@metrotransit.com"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Account Password (for Login) *</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Auto-Generate Password</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters (e.g. Cashier#2026)"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  The staff member will use this email & password to sign in at the Login page.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Assigned Access Role</label>
                  <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    ID Prefix: {getRolePrefixLabel(newUserData.role).prefix}
                  </span>
                </div>

                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="cashier">Cashier (GCash approval, Pass Selling Counter, Passenger Directory)</option>
                  <option value="checker">Checker (QR Pass Scanner, Validation Logs, Ticket Inspections)</option>
                  <option value="passenger">Passenger (Rider - Passenger ID, GCash Purchase, Bus QR Pass)</option>
                  <option value="admin">Administrator / Co-Admin (Full administrative privileges)</option>
                </select>

                <p className="text-[11px] text-slate-600">
                  {newUserData.role === 'cashier' &&
                    '✓ Will be assigned a Cashier ID (e.g. CSH-000001). Can process GCash payments and issue subscriptions.'}
                  {newUserData.role === 'checker' &&
                    '✓ Will be assigned a Checker ID (e.g. CHK-000001). Can scan passenger QR passes and verify validity.'}
                  {newUserData.role === 'passenger' &&
                    '✓ Will be assigned a Passenger ID (e.g. PAS-000001). Can view their digital QR pass and buy plans.'}
                  {newUserData.role === 'admin' &&
                    '✓ Will be assigned an Admin ID (e.g. ADM-000001). Full system access across all views.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{isSubmitting ? 'Creating Account...' : 'Create Account & Assign ID'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Credentials Summary after creation */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">Account Created Successfully!</h3>
              <p className="text-xs text-slate-500">
                The account has been created with login credentials and designated ID.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Designated ID:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {createdCredentials.id}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Assigned Role:</span>
                <span className="font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {createdCredentials.role}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Email (Username):</span>
                <div className="flex items-center gap-1.5 font-mono font-medium text-slate-900">
                  <span>{createdCredentials.email}</span>
                  <button
                    onClick={() => copyToClipboard(createdCredentials.email, 'email')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                    title="Copy email"
                  >
                    {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Password:</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <span>{createdCredentials.password}</span>
                  <button
                    onClick={() => copyToClipboard(createdCredentials.password || '', 'password')}
                    className="p-1 hover:bg-amber-100 rounded text-amber-700 cursor-pointer"
                    title="Copy password"
                  >
                    {copiedField === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 leading-relaxed">
              💡 Provide these credentials to the staff member so they can log in via the Login page and access their designated portal.
            </div>

            <div className="pt-2">
              <button
                onClick={() => setCreatedCredentials(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Permanent Delete Confirmation */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete User Account</h3>
                <p className="text-xs text-slate-500">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="font-bold text-slate-900">{userToDelete.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-700">{userToDelete.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Role:</span>
                <span className="font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {userToDelete.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ID:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {userToDelete.passengerNumber || 'N/A'}
                </span>
              </div>
            </div>

            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl leading-relaxed">
              ⚠️ Deleting this account will permanently remove their profile, access permissions, and any associated subscriptions and payment records from the transit database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeletingUser}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteUser}
                disabled={isDeletingUser}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeletingUser ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeletingUser ? 'Deleting Account...' : 'Yes, Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
