import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraOff, Search, RefreshCw, AlertCircle, Upload, Image as ImageIcon, Bus } from 'lucide-react';
import { soundPlayer } from '../../lib/soundUtils';

interface QrScannerViewProps {
  onScanSuccess: (decodedText: string) => void;
  isVerifying: boolean;
  activeBusNumber?: string;
  onChangeBus?: () => void;
}

export const QrScannerView: React.FC<QrScannerViewProps> = ({
  onScanSuccess,
  isVerifying,
  activeBusNumber = 'BUS-01',
  onChangeBus,
}) => {
  const [manualInput, setManualInput] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isFileScanning, setIsFileScanning] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isLockedRef = useRef(false);
  const isMountedRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scannerContainerId = 'qr-reader-container';

  const stopScannerInternal = async () => {
    const scanner = html5QrCodeRef.current;
    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        await scanner.clear();
      } catch {
        // Ignore normal cleanup
      }
      html5QrCodeRef.current = null;
    }
    if (isMountedRef.current) {
      setScannerActive(false);
    }
  };

  const startScanner = async () => {
    if (!isMountedRef.current) return;
    setCameraError(null);
    setIsInitializing(true);
    isLockedRef.current = false;

    // Give DOM time to ensure container element is present
    await new Promise((resolve) => setTimeout(resolve, 60));
    if (!isMountedRef.current) return;

    try {
      // Safely cleanup previous instance if any
      await stopScannerInternal();

      const container = document.getElementById(scannerContainerId);
      if (!container) {
        throw new Error('Scanner container not found in DOM.');
      }
      container.innerHTML = '';

      const scanner = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 12,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Guard against multiple rapid calls per scan frame
          if (isLockedRef.current) return;
          isLockedRef.current = true;

          // 1. Play immediate single scan chirp
          soundPlayer.playScanChirp();

          // 2. Pause video immediately to prevent further frame scans
          try {
            if (scanner.isScanning) {
              scanner.pause(true);
            }
          } catch {}

          // 3. Dispatch verification
          onScanSuccess(decodedText);
        },
        () => {
          // Frame scan pass (normal during camera movement, ignore)
        }
      );

      if (isMountedRef.current) {
        setScannerActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access status:', err?.name || err?.message || err);
      if (isMountedRef.current) {
        const isPermissionIssue =
          err?.name === 'NotAllowedError' ||
          err?.message?.toLowerCase().includes('permission') ||
          err?.message?.toLowerCase().includes('notallowed') ||
          err?.message?.toLowerCase().includes('dismissed');

        if (isPermissionIssue) {
          setCameraError(
            'Camera permission was not granted or was dismissed. You can enable camera access in your browser settings, scan a QR image, or enter the passenger ID manually below.'
          );
        } else {
          setCameraError(
            'Camera is currently unavailable. You can upload a QR image or enter the passenger ID manually below.'
          );
        }
        setScannerActive(false);
      }
    } finally {
      if (isMountedRef.current) {
        setIsInitializing(false);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileScanning(true);
    setCameraError(null);

    try {
      // Create a temporary instance to scan the uploaded image
      const tempScanner = new Html5Qrcode('qr-reader-temp-file', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

      const decoded = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      
      soundPlayer.playScanChirp();
      onScanSuccess(decoded);
    } catch (err: any) {
      console.warn('QR image decoding result:', err);
      setCameraError('No valid QR code could be detected in the uploaded image. Please try another photo or enter the ID manually.');
    } finally {
      setIsFileScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    isLockedRef.current = false;
    startScanner();

    return () => {
      isMountedRef.current = false;
      stopScannerInternal();
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim() || isLockedRef.current || isVerifying) return;
    isLockedRef.current = true;
    soundPlayer.playScanChirp();
    onScanSuccess(manualInput.trim());
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input and container for image QR decoding */}
      <div id="qr-reader-temp-file" className="hidden"></div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Camera Live Scanner Box */}
      <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-xl border-2 border-slate-800 text-white relative overflow-hidden">
        {/* Active Bus Bar */}
        <div className="mb-3 px-3 py-2 bg-slate-800/80 rounded-xl flex items-center justify-between border border-slate-700/60">
          <div className="flex items-center gap-2">
            <Bus className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-300 font-semibold">Active Bus:</span>
            <span className="font-mono text-xs font-black text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-amber-400/30">
              {activeBusNumber}
            </span>
          </div>
          {onChangeBus && (
            <button
              type="button"
              id="switch-bus-btn"
              onClick={onChangeBus}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
            >
              Switch Unit
            </button>
          )}
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Live Camera QR Scanner
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="upload-qr-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isFileScanning || isVerifying}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Upload QR code image"
            >
              <Upload className="w-3 h-3 text-amber-400" />
              <span>{isFileScanning ? 'Scanning...' : 'Upload QR'}</span>
            </button>

            {scannerActive ? (
              <button
                type="button"
                id="pause-camera-btn"
                onClick={stopScannerInternal}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Pause
              </button>
            ) : (
              <button
                type="button"
                id="start-camera-btn"
                onClick={startScanner}
                disabled={isInitializing}
                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3 h-3 ${isInitializing ? 'animate-spin' : ''}`} />
                <span>Retry</span>
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
          {scannerActive && !isVerifying && (
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

          {isVerifying && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 z-10">
              <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-amber-300 font-black tracking-wider uppercase">
                Verifying Pass with DCPC Server...
              </p>
            </div>
          )}

          {!scannerActive && !isInitializing && (
            <div className="text-center p-6 space-y-3">
              <CameraOff className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Camera is paused or access was dismissed.</p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={startScanner}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition"
                >
                  Enable Camera
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition flex items-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  Upload QR Image
                </button>
              </div>
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
            <span className="leading-relaxed">{cameraError}</span>
          </div>
        )}

        <p className="text-[11px] text-slate-400 text-center mt-3">
          Point camera at the passenger's QR pass, upload a QR screenshot, or enter the ID below.
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
              placeholder="e.g. PAS-000001"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value.toUpperCase())}
              disabled={isVerifying}
              className="w-full uppercase font-mono px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-black focus:outline-none transition tracking-wider disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            id="verify-manual-number-btn"
            disabled={!manualInput.trim() || isVerifying}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-black shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            {isVerifying ? 'Checking...' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  );
};
