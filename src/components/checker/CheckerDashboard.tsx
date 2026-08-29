import React, { useState, useEffect } from 'react';
import { Scan, History, UserCheck, ShieldCheck, Bus, RefreshCw, AlertCircle, Edit3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { VerificationResultData } from '../../types';
import { verifyPassenger } from '../../services/db';
import { QrScannerView } from './QrScannerView';
import { VerificationResultCard } from './VerificationResultCard';
import { VerificationHistory } from './VerificationHistory';
import { BusSelectorModal } from './BusSelectorModal';
import { soundPlayer } from '../../lib/soundUtils';
import { BRANDING } from '../../constants/branding';

interface CheckerDashboardProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

const STORAGE_KEY_BUS = 'dcpc_checker_assigned_bus';

export const CheckerDashboard: React.FC<CheckerDashboardProps> = ({ currentView = 'verify' }) => {
  const { userProfile } = useAuth();
  const [verificationResult, setVerificationResult] = useState<VerificationResultData | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<'verify' | 'history'>(
    currentView === 'history' ? 'history' : 'verify'
  );

  // Bus Assignment State
  const [activeBusNumber, setActiveBusNumber] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_BUS) || 'BUS-01';
  });
  const [showBusModal, setShowBusModal] = useState(false);

  useEffect(() => {
    const savedBus = localStorage.getItem(STORAGE_KEY_BUS);
    if (!savedBus) {
      // First time on scanner, show the bus selector modal
      setShowBusModal(true);
    }
  }, []);

  if (!userProfile) return null;

  const handleSelectBus = (busNumber: string) => {
    setActiveBusNumber(busNumber);
    localStorage.setItem(STORAGE_KEY_BUS, busNumber);
    setShowBusModal(false);
  };

  const handleScanOrSearch = async (payload: string) => {
    if (isVerifying) return;
    setIsVerifying(true);
    try {
      const result = await verifyPassenger(
        payload,
        userProfile.uid,
        userProfile.fullName,
        activeBusNumber || 'BUS-01'
      );
      
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
        busNumber: activeBusNumber,
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
    <div className="max-w-lg mx-auto space-y-4">
      {/* Checker Top Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
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

      {/* Active Bus Unit Sticky Info Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-3.5 px-4 shadow-md flex items-center justify-between border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Assigned Bus Unit
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-amber-300 font-mono tracking-wide">
                {activeBusNumber}
              </span>
              <span className="text-[11px] text-slate-300 font-medium hidden sm:inline">
                • {BRANDING.primaryRoute}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          id="change-bus-unit-btn"
          onClick={() => setShowBusModal(true)}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-amber-300 text-xs font-bold rounded-xl border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Edit3 className="w-3 h-3" />
          <span>Change Bus</span>
        </button>
      </div>

      {/* Main View Area */}
      {activeTab === 'history' ? (
        <VerificationHistory checkerId={userProfile.uid} />
      ) : verificationResult ? (
        <VerificationResultCard data={verificationResult} onReset={handleReset} />
      ) : (
        <QrScannerView
          onScanSuccess={handleScanOrSearch}
          isVerifying={isVerifying}
          activeBusNumber={activeBusNumber}
          onChangeBus={() => setShowBusModal(true)}
        />
      )}

      {/* Bus Selector Modal */}
      {showBusModal && (
        <BusSelectorModal
          isOpen={showBusModal}
          currentBus={activeBusNumber}
          onSelectBus={handleSelectBus}
          onClose={() => setShowBusModal(false)}
        />
      )}
    </div>
  );
};
