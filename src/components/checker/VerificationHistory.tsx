import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, RefreshCw, Clock, Bus, Search } from 'lucide-react';
import { VerificationLog } from '../../types';
import { getVerificationLogs } from '../../services/db';
import { formatDateTime } from '../../lib/dateUtils';
import { Badge } from '../common/Badge';

interface VerificationHistoryProps {
  checkerId?: string;
}

export const VerificationHistory: React.FC<VerificationHistoryProps> = ({ checkerId }) => {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState<string>('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getVerificationLogs(checkerId);
      setLogs(data);
    } catch (err) {
      console.error('Error loading verification logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [checkerId]);

  const filteredLogs = logs.filter((log) => {
    if (resultFilter !== 'all' && log.result !== resultFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.passengerName.toLowerCase().includes(term) ||
      log.passengerNumber.toLowerCase().includes(term) ||
      (log.busNumber && log.busNumber.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Your Verification History</h3>
          <p className="text-xs text-slate-500">Audit trail of passengers scanned on your shifts</p>
        </div>
        <button
          onClick={loadLogs}
          className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
          title="Refresh History"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search and filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Filter by name, PAS-ID, or bus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-400 font-medium"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['all', 'valid', 'expired', 'no_active_subscription', 'passenger_not_found'].map((r) => (
            <button
              key={r}
              onClick={() => setResultFilter(r)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                resultFilter === r
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {r === 'all'
                ? `All (${logs.length})`
                : `${r.replace(/_/g, ' ')} (${logs.filter((l) => l.result === r).length})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading scan logs...
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.passengerName}</span>
                    <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {log.passengerNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-black text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                      <Bus className="w-2.5 h-2.5 text-amber-700" />
                      {log.busNumber || 'BUS-01'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {formatDateTime(log.timestamp)}
                    {log.planName && <span> • Plan: {log.planName}</span>}
                  </p>
                </div>
                <Badge status={log.result} size="sm" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 text-xs text-slate-400 space-y-1">
          <History className="w-6 h-6 mx-auto text-slate-300" />
          <p>No matching verification scans found.</p>
        </div>
      )}
    </div>
  );
};
