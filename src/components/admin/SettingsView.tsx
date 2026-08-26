import React, { useState, useEffect } from 'react';
import { Building2, CreditCard, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { CompanySettings, GCashSettings } from '../../types';
import {
  getCompanySettings,
  updateCompanySettings,
  getGCashSettings,
  updateGCashSettings,
} from '../../services/db';

interface SettingsViewProps {
  onSaved?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSaved }) => {
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

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
        Loading system configuration...
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveAll} className="space-y-6 max-w-3xl">
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
  );
};
