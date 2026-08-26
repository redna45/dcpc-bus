import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, RefreshCw, Clock } from 'lucide-react';
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Recent Passenger Verifications</h3>
          <p className="text-xs text-slate-500">Log of boarded scans and checks</p>
        </div>
        <button
          onClick={loadLogs}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading scan logs...
        </div>
      ) : logs.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.passengerName}</span>
                    <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {log.passengerNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {formatDateTime(log.timestamp)} • Checked by {log.checkerName}
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
          <p>No verification scans recorded yet.</p>
        </div>
      )}
    </div>
  );
};
