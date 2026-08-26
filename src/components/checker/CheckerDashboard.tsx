import React, { useState } from 'react';
import { Scan, History, UserCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { VerificationResultData } from '../../types';
import { verifyPassenger } from '../../services/db';
import { QrScannerView } from './QrScannerView';
import { VerificationResultCard } from './VerificationResultCard';
import { VerificationHistory } from './VerificationHistory';
import { soundPlayer } from '../../lib/soundUtils';

interface CheckerDashboardProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export const CheckerDashboard: React.FC<CheckerDashboardProps> = ({ currentView = 'verify' }) => {
  const { userProfile } = useAuth();
  const [verificationResult, setVerificationResult] = useState<VerificationResultData | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<'verify' | 'history'>(
    currentView === 'history' ? 'history' : 'verify'
  );

  if (!userProfile) return null;

  const handleScanOrSearch = async (payload: string) => {
    if (isVerifying) return;
    setIsVerifying(true);
    try {
      const result = await verifyPassenger(payload, userProfile.uid, userProfile.fullName);
      
      // Play distinct audio cues based on the result
      if (result.result === 'valid') {
        soundPlayer.playSuccessChime();
      } else if (result.result === 'expired' || result.result === 'no_active_subscription') {
        soundPlayer.playWarningTone();
      } else {
        soundPlayer.playErrorTone();
      }

      setVerificationResult(result);
    } catch (err) {
      console.error('Verification error:', err);
      soundPlayer.playErrorTone();
      setVerificationResult({
        result: 'passenger_not_found',
        message: 'Could not complete verification. Please check network connection.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setVerificationResult(null);
    setIsVerifying(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Checker Top Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 leading-tight">Checker Terminal</h2>
            <p className="text-[11px] text-slate-500 font-semibold">
              Checker: <span className="text-slate-800 font-bold">{userProfile.fullName}</span>
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            id="checker-tab-scanner"
            onClick={() => {
              setActiveTab('verify');
              setVerificationResult(null);
              setIsVerifying(false);
            }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'verify' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Scanner
          </button>
          <button
            id="checker-tab-history"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {activeTab === 'history' ? (
        <VerificationHistory checkerId={userProfile.uid} />
      ) : verificationResult ? (
        <VerificationResultCard data={verificationResult} onReset={handleReset} />
      ) : (
        <QrScannerView onScanSuccess={handleScanOrSearch} isVerifying={isVerifying} />
      )}
    </div>
  );
};
