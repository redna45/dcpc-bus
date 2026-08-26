import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Bus, ShieldCheck, MapPin } from 'lucide-react';
import { UserProfile, Subscription } from '../../types';
import { formatDate } from '../../lib/dateUtils';
import { BRANDING } from '../../constants/branding';
import { Logo } from './Logo';

interface PrintableIdCardProps {
  passenger: UserProfile;
  subscription?: Subscription | null;
  companyName?: string;
}

export const PrintableIdCard: React.FC<PrintableIdCardProps> = ({
  passenger,
  subscription,
  companyName = BRANDING.name,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const passengerNumber = passenger.passengerNumber || 'BUS-000001';

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex items-center justify-between no-print">
        <p className="text-xs text-slate-500 font-medium">Official Digital & Printable Passenger ID Card</p>
        <button
          id="print-card-btn"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Physical Card</span>
        </button>
      </div>

      {/* The Printable Bus Pass ID Badge */}
      <div
        ref={cardRef}
        id="printable-passenger-id-card"
        className="w-full max-w-sm mx-auto bg-white rounded-3xl border-2 border-emerald-600 shadow-xl overflow-hidden text-slate-900 font-sans print:shadow-none print:border-emerald-700 print:m-0"
      >
        {/* Top Header Banner */}
        <div className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between border-b-2 border-emerald-500">
          <div className="flex items-center gap-2.5">
            <Logo size="xs" showText={false} />
            <div>
              <h4 className="text-xs font-black tracking-wider uppercase font-heading leading-tight">{companyName}</h4>
              <p className="text-[9px] text-emerald-200 font-bold tracking-wider uppercase flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                <span>{BRANDING.location}</span>
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-emerald-900 border border-emerald-500/50 px-2 py-0.5 rounded text-emerald-200 font-black">
            PASS
          </span>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-emerald-50/40 via-white to-white">
          <div className="flex gap-3.5 items-start">
            {/* Passenger Photo */}
            <div className="w-22 h-26 shrink-0 rounded-2xl overflow-hidden border-2 border-emerald-200 bg-slate-100 shadow-xs relative">
              <img
                src={passenger.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${passenger.fullName}`}
                alt={passenger.fullName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 inset-x-0 bg-emerald-700 text-white text-[8px] text-center font-black py-0.5 tracking-wider uppercase">
                COMMUTER
              </div>
            </div>

            {/* Passenger Info */}
            <div className="flex-1 min-w-0 space-y-1">
              <div>
                <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">
                  Passenger Name
                </span>
                <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate font-heading">
                  {passenger.fullName}
                </h3>
              </div>

              <div>
                <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">
                  Passenger ID No.
                </span>
                <div className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block tracking-wider">
                  {passengerNumber}
                </div>
              </div>

              <div>
                <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">
                  Mobile Contact
                </span>
                <p className="text-xs font-bold text-slate-700">{passenger.mobileNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* QR Code & Status Section */}
          <div className="mt-3.5 pt-3 border-t border-emerald-100 grid grid-cols-2 gap-3 items-center">
            {/* QR Code Box */}
            <div className="p-2 bg-white rounded-2xl border-2 border-emerald-600 shadow-xs flex flex-col items-center justify-center">
              <QRCodeSVG
                value={passengerNumber}
                size={80}
                level="H"
                includeMargin={false}
                className="w-full h-auto"
              />
              <span className="text-[8px] font-mono text-emerald-800 mt-1 font-black">SCAN TO BOARD</span>
            </div>

            {/* Subscription Validity Box */}
            <div className="space-y-1.5">
              <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                <span className="text-[8px] uppercase font-extrabold text-slate-400 block">Subscription</span>
                <p className="text-xs font-black text-slate-900 truncate font-heading">
                  {subscription?.planNameSnapshot || 'No Active Plan'}
                </p>
              </div>

              <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                <span className="text-[8px] uppercase font-extrabold text-slate-400 block">Expiration</span>
                <p className="text-xs font-black text-emerald-700 font-mono">
                  {subscription?.expiryDate ? formatDate(subscription.expiryDate) : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="bg-slate-50 px-4 py-2 border-t border-emerald-100 flex items-center justify-between text-[9px] text-slate-500 font-semibold">
          <span className="flex items-center gap-1 text-emerald-700">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Non-Transferable
          </span>
          <span className="font-mono text-slate-400">Issued: {formatDate(passenger.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};
