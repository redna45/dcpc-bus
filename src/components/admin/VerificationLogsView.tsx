import React, { useState, useEffect } from 'react';
import { History, Search, RefreshCw, ShieldCheck, Download } from 'lucide-react';
import { VerificationLog } from '../../types';
import { getVerificationLogs } from '../../services/db';
import { formatDateTime } from '../../lib/dateUtils';
import { Badge } from '../common/Badge';

export const VerificationLogsView: React.FC = () => {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState<string>('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getVerificationLogs();
      setLogs(data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter((log) => {
    if (resultFilter !== 'all' && log.result !== resultFilter) return false;
    const term = searchTerm.toLowerCase();
    return (
      log.passengerName.toLowerCase().includes(term) ||
      log.passengerNumber.toLowerCase().includes(term) ||
      log.checkerName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Checker Verification & Scan Audit Logs
          </h2>
          <p className="text-xs text-slate-500">
            Real-time audit record of passenger QR scans conducted by transit checkers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search passenger or checker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={loadLogs}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Result Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'valid', 'expired', 'no_active_subscription', 'passenger_not_found'].map((r) => (
          <button
            key={r}
            onClick={() => setResultFilter(r)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
              resultFilter === r
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {r === 'all'
              ? `All Scans (${logs.length})`
              : `${r.replace(/_/g, ' ')} (${logs.filter((l) => l.result === r).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading scan audit history...
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Passenger</th>
                  <th className="px-6 py-3.5">Passenger ID</th>
                  <th className="px-6 py-3.5">Checker</th>
                  <th className="px-6 py-3.5 text-right">Verification Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 text-slate-500">{formatDateTime(log.timestamp)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{log.passengerName}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {log.passengerNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{log.checkerName}</td>
                    <td className="px-6 py-4 text-right">
                      <Badge status={log.result} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 text-xs text-slate-400">
          No verification events logged yet.
        </div>
      )}
    </div>
  );
};
