import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraOff, Search, Sparkles, RefreshCw, AlertCircle, Volume2 } from 'lucide-react';

interface QrScannerViewProps {
  onScanSuccess: (decodedText: string) => void;
  isVerifying: boolean;
}

export const QrScannerView: React.FC<QrScannerViewProps> = ({
  onScanSuccess,
  isVerifying,
}) => {
  const [manualInput, setManualInput] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-container';

  const startScanner = async () => {
    setCameraError(null);
    setIsInitializing(true);

    try {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch {}
      }

      const scanner = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Play a short pleasant feedback beep
          playBeep(880, 100);
          onScanSuccess(decodedText);
        },
        () => {
          // Frame error (ignore normal scanning frames)
        }
      );

      setScannerActive(true);
    } catch (err: any) {
      console.error('Camera QR start error:', err);
      setCameraError(
        err?.message?.includes('NotAllowedError') || err?.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser, or use the manual passenger number lookup below.'
          : 'Could not access device camera. You can manually enter the passenger number below.'
      );
      setScannerActive(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && scannerActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setScannerActive(false);
  };

  // Simple Web Audio feedback sound
  const playBeep = (freq = 880, duration = 100) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0.15;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setTimeout(() => {
          osc.stop();
          ctx.close();
        }, duration);
      }
    } catch {}
  };

  useEffect(() => {
    // Auto-start camera scanner on load for checker speed
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    playBeep(660, 80);
    onScanSuccess(manualInput.trim());
  };

  return (
    <div className="space-y-4">
      {/* Camera Live Scanner Box */}
      <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-xl border-2 border-slate-800 text-white relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Live Camera QR Scanner
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {scannerActive ? (
              <button
                type="button"
                onClick={stopScanner}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition"
              >
                Pause Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={startScanner}
                disabled={isInitializing}
                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isInitializing ? 'animate-spin' : ''}`} />
                Start Camera
              </button>
            )}
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="relative mt-4 flex flex-col items-center justify-center min-h-[260px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
          <div
            id={scannerContainerId}
            className="w-full max-w-[320px] aspect-square rounded-xl overflow-hidden"
          ></div>

          {/* Scanner Reticle Overlay */}
          {scannerActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-56 border-2 border-amber-400/80 rounded-2xl relative animate-pulse shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-amber-400"></div>
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-amber-400"></div>
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-amber-400"></div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-amber-400"></div>
                <div className="absolute inset-x-4 top-1/2 h-0.5 bg-amber-400/60 shadow-[0_0_8px_#f59e0b]"></div>
              </div>
            </div>
          )}

          {!scannerActive && !isInitializing && (
            <div className="text-center p-6 space-y-2">
              <CameraOff className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Camera is paused or unavailable.</p>
              <button
                onClick={startScanner}
                className="px-4 py-2 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs"
              >
                Turn On Camera
              </button>
            </div>
          )}

          {isInitializing && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center space-y-2">
              <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-amber-300 font-bold">Initializing camera feed...</p>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>{cameraError}</span>
          </div>
        )}

        <p className="text-[11px] text-slate-400 text-center mt-3">
          Point camera at the passenger's static QR code to verify validity.
        </p>
      </div>

      {/* Manual Input Fallback */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-600" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Or Enter Passenger Number Manually
          </h4>
        </div>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              id="manual-passenger-number-input"
              placeholder="e.g. BUS-000001"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value.toUpperCase())}
              className="w-full uppercase font-mono px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-xl text-sm font-black focus:outline-none transition tracking-wider"
            />
          </div>
          <button
            type="submit"
            id="verify-manual-number-btn"
            disabled={!manualInput.trim() || isVerifying}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-black shadow-md transition-transform active:scale-95"
          >
            {isVerifying ? 'Checking...' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  );
};
