import React, { useState } from 'react';
import { Bus, Check, X, Shield, AlertCircle, Sparkles } from 'lucide-react';
import { BRANDING } from '../../constants/branding';

interface BusSelectorModalProps {
  isOpen: boolean;
  currentBus: string;
  onSelectBus: (busNumber: string) => void;
  onClose?: () => void;
  isMandatory?: boolean;
}

const PRESET_BUS_NUMBERS = [
  'BUS-01',
  'BUS-02',
  'BUS-03',
  'BUS-04',
  'BUS-05',
  'BUS-06',
  'BUS-07',
  'BUS-08',
  'BUS-09',
  'BUS-10',
  'BUS-12',
  'BUS-15',
];

export const BusSelectorModal: React.FC<BusSelectorModalProps> = ({
  isOpen,
  currentBus,
  onSelectBus,
  onClose,
  isMandatory = false,
}) => {
  const [selectedBus, setSelectedBus] = useState<string>(currentBus || 'BUS-01');
  const [customBus, setCustomBus] = useState<string>(
    PRESET_BUS_NUMBERS.includes(currentBus) ? '' : currentBus
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBus = customBus.trim() ? customBus.trim().toUpperCase() : selectedBus;
    if (!finalBus) return;
    onSelectBus(finalBus);
  };

  const handleSelectPreset = (preset: string) => {
    setSelectedBus(preset);
    setCustomBus('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-slate-200 space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Select Assigned Bus Unit
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Identify the bus you are currently scanning passengers on
              </p>
            </div>
          </div>

          {!isMandatory && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Route Info Badge */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs flex items-center gap-2.5 text-amber-900">
          <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></div>
          <div>
            <span className="font-bold block">Assigned Route:</span>
            <span className="text-[11px] font-semibold text-amber-800">
              {BRANDING.primaryRoute}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Presets Grid */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
              Quick Select Bus Unit
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_BUS_NUMBERS.map((preset) => {
                const isSelected = selectedBus === preset && !customBus;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-mono font-black border transition cursor-pointer flex items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-amber-400 shadow-md scale-[1.02]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset}
                    {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Bus Number Input */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
              Or Custom Bus / Plate Number
            </label>
            <div className="relative">
              <input
                type="text"
                id="custom-bus-number-input"
                placeholder="e.g. BUS-108 or NAG-4921"
                value={customBus}
                onChange={(e) => {
                  setCustomBus(e.target.value.toUpperCase());
                  if (e.target.value) {
                    setSelectedBus('');
                  }
                }}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-amber-500 rounded-xl text-sm font-mono font-black focus:outline-none uppercase transition"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              This bus number will be stamped on all passenger scan logs.
            </p>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            id="confirm-bus-number-btn"
            disabled={!customBus.trim() && !selectedBus}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Check className="w-4 h-4" />
            <span>Confirm Bus ({customBus.trim() || selectedBus}) & Start Scanning</span>
          </button>
        </form>
      </div>
    </div>
  );
};
