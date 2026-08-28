import React, { useState, useEffect } from 'react';
import {
  Building2,
  CreditCard,
  Save,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  AlertTriangle,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { CompanySettings, GCashSettings } from '../../types';
import {
  getCompanySettings,
  updateCompanySettings,
  getGCashSettings,
  updateGCashSettings,
  restoreFactorySettings,
} from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';

interface SettingsViewProps {
  onSaved?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSaved }) => {
  const { currentUser, userProfile } = useAuth();
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: '',
    contactNumber: '',
    address: '',
    website: '',
  });

  const [gcashSettings, setGcashSettings] = useState<GCashSettings>({
    gcashAccountName: '',
    gcashMobileNumber: '',
    paymentInstructions: '',
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Factory reset modal and states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [resetResult, setResetResult] = useState<{
    deletedUsersCount: number;
    deletedSubsCount: number;
    deletedPaymentsCount: number;
    deletedVerifsCount: number;
    deletedCountersCount: number;
    deletedPlansCount: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    Promise.all([getCompanySettings(), getGCashSettings()]).then(([comp, gcash]) => {
      setCompanySettings(comp);
      setGcashSettings(gcash);
      setLoading(false);
    });
  }, []);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);

    try {
      await Promise.all([
        updateCompanySettings(companySettings),
        updateGCashSettings(gcashSettings),
      ]);
      setSuccessMsg('System and payment settings updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      if (onSaved) onSaved();
    } catch (err: any) {
      console.error('Settings save error:', err);
      alert('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteFactoryReset = async () => {
    if (resetConfirmationText.trim().toUpperCase() !== 'RESET') {
      alert('Please type "RESET" in uppercase to confirm.');
      return;
    }

    setIsResetting(true);
    try {
      const result = await restoreFactorySettings('sanderbedana1@gmail.com');
      setResetResult(result);

      // Refresh loaded settings
      const [comp, gcash] = await Promise.all([getCompanySettings(), getGCashSettings()]);
      setCompanySettings(comp);
      setGcashSettings(gcash);

      setIsResetModalOpen(false);
      setResetConfirmationText('');
      setSuccessMsg('System factory settings successfully restored! All test records purged.');
      if (onSaved) onSaved();
    } catch (err: any) {
      console.error('Factory reset failure:', err);
      alert('Factory reset encountered an error: ' + (err.message || err));
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
        Loading system configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <form onSubmit={handleSaveAll} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">System & GCash Settings</h2>
            <p className="text-xs text-slate-500">
              Configure company branding, contact details, and recipient GCash merchant accounts.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. Company Information */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Bus Company Identity
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companySettings.companyName}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, companyName: e.target.value })
                }
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Official Contact Hotline
              </label>
              <input
                type="text"
                value={companySettings.contactNumber}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, contactNumber: e.target.value })
                }
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                value={companySettings.email || ''}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, email: e.target.value })
                }
                placeholder="dcpctransport@gmail.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Main Bus Terminal / Office Address
              </label>
              <input
                type="text"
                value={companySettings.address}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, address: e.target.value })
                }
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Website URL (Optional)
              </label>
              <input
                type="url"
                value={companySettings.website || ''}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, website: e.target.value })
                }
                placeholder="https://..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* 2. GCash Merchant Settings */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              GCash Payment Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                GCash Registered Account Name
              </label>
              <input
                type="text"
                value={gcashSettings.gcashAccountName}
                onChange={(e) =>
                  setGcashSettings({ ...gcashSettings, gcashAccountName: e.target.value })
                }
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                GCash Mobile Number
              </label>
              <input
                type="text"
                value={gcashSettings.gcashMobileNumber}
                onChange={(e) =>
                  setGcashSettings({ ...gcashSettings, gcashMobileNumber: e.target.value })
                }
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Passenger Payment Instructions
              </label>
              <textarea
                rows={4}
                value={gcashSettings.paymentInstructions}
                onChange={(e) =>
                  setGcashSettings({ ...gcashSettings, paymentInstructions: e.target.value })
                }
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>
      </form>

      {/* 3. Factory Reset & Danger Zone */}
      <div className="bg-rose-50/50 rounded-3xl p-6 border border-rose-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-rose-200">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <div>
            <h3 className="text-sm font-bold text-rose-950 uppercase tracking-wider">
              Danger Zone: Factory Settings & Database Reset
            </h3>
            <p className="text-xs text-rose-700">
              Restore the application to clean factory settings for testing from scratch.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-700 space-y-2 bg-white/80 p-4 rounded-2xl border border-rose-100">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            What will happen when you restore factory settings:
          </div>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>
              <strong>Super Admin Preserved:</strong> <code className="text-indigo-700 font-bold bg-indigo-50 px-1 py-0.5 rounded">sanderbedana1@gmail.com</code> will remain active as the primary Administrator.
            </li>
            <li>
              <strong>User Database Cleared:</strong> All test passenger, cashier, and checker profiles will be removed so you can test registration fresh with any email.
            </li>
            <li>
              <strong>Subscriptions & Payments Cleared:</strong> All issued bus passes, pending payments, and transaction history will be purged.
            </li>
            <li>
              <strong>Verification Logs Cleared:</strong> All scanner logs and check-in records will be reset.
            </li>
            <li>
              <strong>ID Sequence Counter Reset:</strong> Sequential IDs will start from the beginning (<code className="text-indigo-700 font-bold bg-indigo-50 px-1 py-0.5 rounded">PAS-000001</code>).
            </li>
            <li>
              <strong>Plans & Defaults Restored:</strong> Standard pass plans and cooperative contact/GCash settings will be reinitialized.
            </li>
          </ul>
        </div>

        {resetResult && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Factory Reset Summary:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-white p-2 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-400 block">Users Purged</span>
                <span className="font-mono font-bold text-sm text-slate-800">{resetResult.deletedUsersCount}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-400 block">Subscriptions</span>
                <span className="font-mono font-bold text-sm text-slate-800">{resetResult.deletedSubsCount}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-400 block">Payments</span>
                <span className="font-mono font-bold text-sm text-slate-800">{resetResult.deletedPaymentsCount}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-400 block">Verification Logs</span>
                <span className="font-mono font-bold text-sm text-slate-800">{resetResult.deletedVerifsCount}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setResetConfirmationText('');
              setIsResetModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <RotateCcw className="w-4 h-4" />
            Restore Factory Settings
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => !isResetting && setIsResetModalOpen(false)}
        title="Confirm Factory Reset"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 leading-relaxed">
              <p className="font-bold">Are you absolutely sure?</p>
              <p className="mt-1">
                This action will delete all test users, subscriptions, payments, and logs from Firebase.
                Only <strong className="underline">sanderbedana1@gmail.com</strong> will be preserved as the Super Admin.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Type <span className="text-rose-600 font-mono">RESET</span> to confirm:
            </label>
            <input
              type="text"
              value={resetConfirmationText}
              onChange={(e) => setResetConfirmationText(e.target.value)}
              placeholder="RESET"
              disabled={isResetting}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 uppercase"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isResetting}
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={resetConfirmationText.trim().toUpperCase() !== 'RESET' || isResetting}
              onClick={handleExecuteFactoryReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <Trash2 className="w-4 h-4" />
              {isResetting ? 'Restoring Factory Defaults...' : 'Wipe & Restore Factory Settings'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

