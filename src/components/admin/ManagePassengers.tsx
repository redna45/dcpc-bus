import React, { useState, useEffect } from 'react';
import { Users, Search, ShoppingBag, Eye, ShieldCheck, CreditCard, Trash2, RefreshCw } from 'lucide-react';
import { UserProfile, Subscription } from '../../types';
import { getPassengers, getPassengerSubscriptions, deleteUserByAdmin } from '../../services/db';
import { formatDate, isSubscriptionActive } from '../../lib/dateUtils';
import { Badge } from '../common/Badge';
import { SellSubscriptionModal } from '../cashier/SellSubscriptionModal';
import { Modal } from '../common/Modal';
import { useAuth, isSuperAdminEmail } from '../../context/AuthContext';

export const ManagePassengers: React.FC = () => {
  const { userProfile, activeRole } = useAuth();
  const [passengers, setPassengers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPassengerForSale, setSelectedPassengerForSale] = useState<UserProfile | null>(null);
  const [viewingPassenger, setViewingPassenger] = useState<UserProfile | null>(null);
  const [passengerToDelete, setPassengerToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passengerSubs, setPassengerSubs] = useState<Subscription[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  const loadPassengers = async () => {
    setLoading(true);
    try {
      const list = await getPassengers();
      setPassengers(list);
    } catch (err) {
      console.error('Error fetching passengers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPassengers();
  }, []);

  const handleInspect = async (passenger: UserProfile) => {
    setViewingPassenger(passenger);
    setSubsLoading(true);
    try {
      const list = await getPassengerSubscriptions(passenger.uid);
      setPassengerSubs(list);
    } catch (err) {
      console.error('Error loading passenger subs:', err);
    } finally {
      setSubsLoading(false);
    }
  };

  const handleOpenDeleteModal = (passenger: UserProfile) => {
    if (isSuperAdminEmail(passenger.email)) {
      setStatusMsg({
        type: 'error',
        text: 'The primary administrator account is protected and cannot be deleted.',
      });
      setTimeout(() => setStatusMsg(null), 4000);
      return;
    }
    setPassengerToDelete(passenger);
  };

  const executeDeletePassenger = async () => {
    if (!passengerToDelete) return;
    setIsDeleting(true);
    setStatusMsg(null);

    const targetUid = passengerToDelete.uid;
    const targetName = passengerToDelete.fullName;

    try {
      await deleteUserByAdmin(targetUid);
      setPassengers((prev) => prev.filter((p) => p.uid !== targetUid));
      setPassengerToDelete(null);
      setStatusMsg({
        type: 'success',
        text: `Passenger profile for ${targetName} was deleted successfully.`,
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      console.error('Error deleting passenger:', err);
      setStatusMsg({
        type: 'error',
        text: 'Failed to delete passenger: ' + (err.message || 'Error occurred'),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = passengers.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.fullName && p.fullName.toLowerCase().includes(term)) ||
      (p.passengerNumber && p.passengerNumber.toLowerCase().includes(term)) ||
      (p.mobileNumber && p.mobileNumber.toLowerCase().includes(term)) ||
      (p.email && p.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Registered Passengers</h2>
          <p className="text-xs text-slate-500">
            Full directory of commuter passenger profiles, unique IDs, and pass history.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search passenger ID, name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border animate-in fade-in ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{statusMsg.text}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading passenger directory...
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Passenger</th>
                  <th className="px-6 py-3.5">Passenger ID Number</th>
                  <th className="px-6 py-3.5">Contact Number</th>
                  <th className="px-6 py-3.5">Registered Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.uid} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img
                        src={p.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.fullName}`}
                        alt={p.fullName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{p.fullName}</p>
                        <p className="text-[11px] text-slate-400">{p.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {p.passengerNumber || 'BUS-000000'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{p.mobileNumber}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(p.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleInspect(p)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" />
                          View Profile
                        </button>
                        <button
                          onClick={() => setSelectedPassengerForSale(p)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 inline mr-1" />
                          Sell Pass
                        </button>
                        {!isSuperAdminEmail(p.email) && (
                          <button
                            onClick={() => handleOpenDeleteModal(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title={`Delete passenger record for ${p.fullName}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-2 text-slate-400 text-xs">
          <Users className="w-8 h-8 mx-auto text-slate-300" />
          <p>No passengers found matching your search query.</p>
        </div>
      )}

      {/* Sell Subscription Modal */}
      {selectedPassengerForSale && (
        <SellSubscriptionModal
          isOpen={Boolean(selectedPassengerForSale)}
          onClose={() => setSelectedPassengerForSale(null)}
          initialPassenger={selectedPassengerForSale}
        />
      )}

      {/* Passenger Detailed Inspector Modal */}
      {viewingPassenger && (
        <Modal
          isOpen={Boolean(viewingPassenger)}
          onClose={() => setViewingPassenger(null)}
          title={`Passenger Record: ${viewingPassenger.fullName}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <img
                src={viewingPassenger.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewingPassenger.fullName}`}
                alt={viewingPassenger.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-200"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {viewingPassenger.passengerNumber}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Active Rider</span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{viewingPassenger.fullName}</h4>
                <p className="text-xs text-slate-500">
                  {viewingPassenger.email} • {viewingPassenger.mobileNumber}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Enrolled Subscription History
              </h5>

              {subsLoading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading subscriptions...</div>
              ) : passengerSubs.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {passengerSubs.map((s) => {
                    const active = isSubscriptionActive(s);
                    return (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{s.planNameSnapshot}</p>
                          <p className="text-[11px] text-slate-500">
                            {formatDate(s.startDate)} → {formatDate(s.expiryDate)}
                          </p>
                        </div>
                        <Badge status={active ? 'active' : s.status} size="sm" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl">
                  No subscription passes registered.
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  const p = viewingPassenger;
                  setViewingPassenger(null);
                  setSelectedPassengerForSale(p);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Sell New Pass to Passenger
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Permanent Delete Confirmation */}
      {passengerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Passenger Record</h3>
                <p className="text-xs text-slate-500">This will remove their commuter profile & passes.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="font-bold text-slate-900">{passengerToDelete.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Passenger ID:</span>
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {passengerToDelete.passengerNumber || 'BUS-000000'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-700">{passengerToDelete.email}</span>
              </div>
            </div>

            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl leading-relaxed">
              ⚠️ Deleting this passenger will permanently purge their profile, QR passes, and payment histories from the system.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPassengerToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeletePassenger}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeleting ? 'Deleting Passenger...' : 'Yes, Delete Passenger'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
