import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  RefreshCw,
  ShieldCheck,
  Download,
  Filter,
  UserCheck,
  Bus,
  Calendar,
  Eye,
  X,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Clock,
  Layers,
} from 'lucide-react';
import { VerificationLog, UserProfile } from '../../types';
import { getVerificationLogs, getPassengers } from '../../services/db';
import { formatDateTime, formatDate, getRemainingDays } from '../../lib/dateUtils';
import { Badge } from '../common/Badge';
import { BRANDING } from '../../constants/branding';

type ViewMode = 'table' | 'checkers' | 'buses';
type DateFilterType = 'all' | 'today' | 'yesterday' | '7days' | '30days' | 'custom';

export const VerificationLogsView: React.FC = () => {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [passengers, setPassengers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [checkerFilter, setCheckerFilter] = useState<string>('all');
  const [busFilter, setBusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Active View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Modal Inspection State
  const [selectedLog, setSelectedLog] = useState<VerificationLog | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsData, passengersData] = await Promise.all([
        getVerificationLogs(),
        getPassengers(),
      ]);
      setLogs(logsData);
      setPassengers(passengersData);
    } catch (err) {
      console.error('Error fetching verification logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Extract unique checkers and bus numbers for filter dropdowns
  const uniqueCheckers = useMemo(() => {
    const map = new Map<string, string>();
    logs.forEach((log) => {
      if (log.checkerName) {
        map.set(log.checkerId || log.checkerName, log.checkerName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [logs]);

  const uniqueBuses = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.busNumber) {
        set.add(log.busNumber.toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [logs]);

  // Date filtering logic
  const isDateInRange = (isoString: string) => {
    if (dateFilter === 'all') return true;
    const logDate = new Date(isoString);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateFilter === 'today') {
      return logDate >= todayStart;
    }

    if (dateFilter === 'yesterday') {
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      return logDate >= yesterdayStart && logDate < todayStart;
    }

    if (dateFilter === '7days') {
      const past7 = new Date(todayStart);
      past7.setDate(past7.getDate() - 7);
      return logDate >= past7;
    }

    if (dateFilter === '30days') {
      const past30 = new Date(todayStart);
      past30.setDate(past30.getDate() - 30);
      return logDate >= past30;
    }

    if (dateFilter === 'custom') {
      if (customStartDate && logDate < new Date(customStartDate)) return false;
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (logDate > end) return false;
      }
      return true;
    }

    return true;
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Result filter
      if (resultFilter !== 'all' && log.result !== resultFilter) return false;

      // 2. Checker filter
      if (checkerFilter !== 'all') {
        if (log.checkerId !== checkerFilter && log.checkerName !== checkerFilter) {
          return false;
        }
      }

      // 3. Bus filter
      if (busFilter !== 'all') {
        if ((log.busNumber || 'BUS-01').toUpperCase() !== busFilter.toUpperCase()) {
          return false;
        }
      }

      // 4. Date filter
      if (!isDateInRange(log.timestamp)) return false;

      // 5. Search query
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const pName = (log.passengerName || '').toLowerCase();
        const pNum = (log.passengerNumber || '').toLowerCase();
        const cName = (log.checkerName || '').toLowerCase();
        const busNum = (log.busNumber || '').toLowerCase();
        const plan = (log.planName || '').toLowerCase();

        return (
          pName.includes(term) ||
          pNum.includes(term) ||
          cName.includes(term) ||
          busNum.includes(term) ||
          plan.includes(term)
        );
      }

      return true;
    });
  }, [logs, resultFilter, checkerFilter, busFilter, dateFilter, customStartDate, customEndDate, searchTerm]);

  // Overall Statistics calculated from the filtered selection
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const valid = filteredLogs.filter((l) => l.result === 'valid').length;
    const expired = filteredLogs.filter((l) => l.result === 'expired').length;
    const noSub = filteredLogs.filter((l) => l.result === 'no_active_subscription').length;
    const notFound = filteredLogs.filter((l) => l.result === 'passenger_not_found').length;
    const validRate = total > 0 ? Math.round((valid / total) * 100) : 0;

    const checkersCount = new Set(filteredLogs.map((l) => l.checkerName)).size;
    const busesCount = new Set(filteredLogs.map((l) => l.busNumber || 'BUS-01')).size;

    return { total, valid, expired, noSub, notFound, validRate, checkersCount, busesCount };
  }, [filteredLogs]);

  // Checker-grouped analytics
  const checkerStats = useMemo(() => {
    const map = new Map<
      string,
      {
        checkerId: string;
        checkerName: string;
        total: number;
        valid: number;
        expired: number;
        noSub: number;
        notFound: number;
        buses: Set<string>;
        lastActive: string;
      }
    >();

    logs.forEach((log) => {
      const key = log.checkerName || 'Unknown Checker';
      if (!map.has(key)) {
        map.set(key, {
          checkerId: log.checkerId,
          checkerName: log.checkerName,
          total: 0,
          valid: 0,
          expired: 0,
          noSub: 0,
          notFound: 0,
          buses: new Set(),
          lastActive: log.timestamp,
        });
      }

      const item = map.get(key)!;
      item.total += 1;
      if (log.result === 'valid') item.valid += 1;
      else if (log.result === 'expired') item.expired += 1;
      else if (log.result === 'no_active_subscription') item.noSub += 1;
      else if (log.result === 'passenger_not_found') item.notFound += 1;

      if (log.busNumber) item.buses.add(log.busNumber);
      if (new Date(log.timestamp) > new Date(item.lastActive)) {
        item.lastActive = log.timestamp;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [logs]);

  // Bus-grouped analytics
  const busStats = useMemo(() => {
    const map = new Map<
      string,
      {
        busNumber: string;
        total: number;
        valid: number;
        expired: number;
        noSub: number;
        notFound: number;
        checkers: Set<string>;
        lastActive: string;
      }
    >();

    logs.forEach((log) => {
      const busKey = log.busNumber ? log.busNumber.toUpperCase() : 'BUS-01';
      if (!map.has(busKey)) {
        map.set(busKey, {
          busNumber: busKey,
          total: 0,
          valid: 0,
          expired: 0,
          noSub: 0,
          notFound: 0,
          checkers: new Set(),
          lastActive: log.timestamp,
        });
      }

      const item = map.get(busKey)!;
      item.total += 1;
      if (log.result === 'valid') item.valid += 1;
      else if (log.result === 'expired') item.expired += 1;
      else if (log.result === 'no_active_subscription') item.noSub += 1;
      else if (log.result === 'passenger_not_found') item.notFound += 1;

      if (log.checkerName) item.checkers.add(log.checkerName);
      if (new Date(log.timestamp) > new Date(item.lastActive)) {
        item.lastActive = log.timestamp;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [logs]);

  // Export to CSV Function
  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = [
      'Verification ID',
      'Date & Time',
      'Checker Name',
      'Checker UID',
      'Bus Number',
      'Passenger Name',
      'Passenger Number',
      'Verification Result',
      'Plan Name',
      'Expiry Date',
      'Notes',
    ];

    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${formatDateTime(l.timestamp)}"`,
      `"${l.checkerName.replace(/"/g, '""')}"`,
      `"${l.checkerId}"`,
      `"${(l.busNumber || 'BUS-01').replace(/"/g, '""')}"`,
      `"${l.passengerName.replace(/"/g, '""')}"`,
      `"${l.passengerNumber}"`,
      `"${l.result}"`,
      `"${(l.planName || '').replace(/"/g, '""')}"`,
      `"${l.expiryDate ? formatDate(l.expiryDate) : ''}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `DCPC_Checker_Scan_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setResultFilter('all');
    setCheckerFilter('all');
    setBusFilter('all');
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  // Find passenger details for inspection modal
  const inspectedPassenger = useMemo(() => {
    if (!selectedLog || !selectedLog.passengerId) return null;
    return passengers.find((p) => p.uid === selectedLog.passengerId || p.passengerNumber === selectedLog.passengerNumber);
  }, [selectedLog, passengers]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold font-mono">
              Live Audit Trail
            </span>
            <span className="text-xs text-slate-400 font-medium">• {BRANDING.name}</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Checker Verification & Scan Audit Logs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor and audit all onboard QR verifications executed by transit checkers across active bus units.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="export-scan-logs-csv-btn"
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV ({filteredLogs.length})</span>
          </button>

          <button
            onClick={loadData}
            title="Refresh logs"
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Scans</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          <span className="text-[10px] text-slate-500 font-medium">Recorded events</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-emerald-600 font-bold uppercase block">Valid Boardings</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.valid}</div>
          <span className="text-[10px] text-emerald-600 font-bold">{stats.validRate}% Pass Rate</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-rose-600 font-bold uppercase block">Expired Passes</span>
          <div className="text-2xl font-black text-rose-700 mt-1">{stats.expired}</div>
          <span className="text-[10px] text-slate-500 font-medium">Denied boarding</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-amber-600 font-bold uppercase block">No Active Pass</span>
          <div className="text-2xl font-black text-amber-700 mt-1">{stats.noSub + stats.notFound}</div>
          <span className="text-[10px] text-slate-500 font-medium">Unpaid / Unregistered</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-indigo-600 font-bold uppercase block">Active Checkers</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{stats.checkersCount}</div>
          <span className="text-[10px] text-slate-500 font-medium">Conductors on duty</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-purple-600 font-bold uppercase block">Bus Units</span>
          <div className="text-2xl font-black text-purple-700 mt-1">{stats.busesCount}</div>
          <span className="text-[10px] text-slate-500 font-medium">In circulation</span>
        </div>
      </div>

      {/* Main Filter & Search Control Panel */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Top View Mode Switcher and Quick Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>All Scans List ({filteredLogs.length})</span>
            </button>

            <button
              onClick={() => setViewMode('checkers')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'checkers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Checker Activity ({checkerStats.length})</span>
            </button>

            <button
              onClick={() => setViewMode('buses')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'buses' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              <span>Bus Units ({busStats.length})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              id="admin-search-logs-input"
              placeholder="Search passenger, PAS-ID, checker, or bus..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Detailed Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Outcome Status Filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Verification Outcome
            </label>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Outcomes ({logs.length})</option>
              <option value="valid">Valid / Active Boarded</option>
              <option value="expired">Expired Passes</option>
              <option value="no_active_subscription">No Active Subscription</option>
              <option value="passenger_not_found">Passenger Not Found</option>
            </select>
          </div>

          {/* 2. Checker Selection Filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Filter by Checker
            </label>
            <select
              value={checkerFilter}
              onChange={(e) => setCheckerFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Checkers ({uniqueCheckers.length})</option>
              {uniqueCheckers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Bus Unit Filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Filter by Bus Unit
            </label>
            <select
              value={busFilter}
              onChange={(e) => setBusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Bus Units ({uniqueBuses.length})</option>
              {uniqueBuses.map((bus) => (
                <option key={bus} value={bus}>
                  {bus}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Date Range Filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Date Period
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs if 'custom' selected */}
        {dateFilter === 'custom' && (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>
        )}

        {/* Active Filter Chips & Reset */}
        {(searchTerm || resultFilter !== 'all' || checkerFilter !== 'all' || busFilter !== 'all' || dateFilter !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">
              Showing <strong className="text-slate-900">{filteredLogs.length}</strong> of {logs.length} total verification logs
            </span>
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: ALL SCAN LOGS TABLE */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>Loading scan audit records from DCPC servers...</p>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Checker</th>
                    <th className="px-5 py-3.5">Bus Unit</th>
                    <th className="px-5 py-3.5">Passenger</th>
                    <th className="px-5 py-3.5">Pass ID</th>
                    <th className="px-5 py-3.5">Enrolled Plan</th>
                    <th className="px-5 py-3.5">Outcome</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                        <div className="font-semibold text-slate-700">
                          {formatDateTime(log.timestamp)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                            {log.checkerName.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900">{log.checkerName}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-300">
                          <Bus className="w-3 h-3 text-amber-700" />
                          {log.busNumber || 'BUS-01'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900 block">{log.passengerName}</span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {log.passengerNumber || 'N/A'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {log.planName ? (
                          <span className="font-semibold text-slate-800">{log.planName}</span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge status={log.result} size="sm" />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1 bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600 font-bold rounded-lg text-xs transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 p-8 text-slate-400 space-y-2">
              <History className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No verification events match your filter criteria.</p>
              <p className="text-xs">Try clearing some filters or searching for another passenger or checker.</p>
              <button
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: CHECKER ACTIVITY PERFORMANCE SUMMARY */}
      {viewMode === 'checkers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {checkerStats.map((chk) => {
            const validPct = chk.total > 0 ? Math.round((chk.valid / chk.total) * 100) : 0;
            return (
              <div
                key={chk.checkerName}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4 hover:border-indigo-400 transition"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-base shadow-sm">
                      {chk.checkerName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{chk.checkerName}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Last Active: {formatDateTime(chk.lastActive)}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold font-mono">
                    {chk.total} Scans
                  </span>
                </div>

                {/* Performance Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-500">Boarding Validity Rate</span>
                    <span className="text-emerald-700">{validPct}% Valid</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${validPct}%` }}
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    ></div>
                  </div>
                </div>

                {/* Outcome Breakdown Stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Valid</span>
                    <span className="font-black text-emerald-900">{chk.valid}</span>
                  </div>
                  <div className="p-2 bg-rose-50 rounded-xl border border-rose-100">
                    <span className="text-[10px] font-bold text-rose-800 uppercase block">Expired</span>
                    <span className="font-black text-rose-900">{chk.expired}</span>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">No Pass</span>
                    <span className="font-black text-amber-900">{chk.noSub + chk.notFound}</span>
                  </div>
                </div>

                {/* Operated Buses */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Bus className="w-3.5 h-3.5 text-amber-500" />
                    <span>Buses:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {Array.from(chk.buses).join(', ') || 'BUS-01'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setCheckerFilter(chk.checkerId || chk.checkerName);
                      setViewMode('table');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>View Logs</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 3: BUS UNITS OVERVIEW */}
      {viewMode === 'buses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {busStats.map((bus) => {
            const validPct = bus.total > 0 ? Math.round((bus.valid / bus.total) * 100) : 0;
            return (
              <div
                key={bus.busNumber}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4 hover:border-amber-400 transition"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-base shadow-sm">
                      <Bus className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 font-mono tracking-tight">
                        {bus.busNumber}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {BRANDING.primaryRoute}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-black font-mono">
                    {bus.total} Scans
                  </span>
                </div>

                {/* Outcome Stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Valid</span>
                    <span className="font-black text-emerald-900">{bus.valid}</span>
                  </div>
                  <div className="p-2 bg-rose-50 rounded-xl border border-rose-100">
                    <span className="text-[10px] font-bold text-rose-800 uppercase block">Expired</span>
                    <span className="font-black text-rose-900">{bus.expired}</span>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">No Pass</span>
                    <span className="font-black text-amber-900">{bus.noSub + bus.notFound}</span>
                  </div>
                </div>

                {/* Operating Checkers */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-slate-500">
                    <span>Checkers: </span>
                    <strong className="text-slate-800">
                      {Array.from(bus.checkers).join(', ') || 'None'}
                    </strong>
                  </div>

                  <button
                    onClick={() => {
                      setBusFilter(bus.busNumber);
                      setViewMode('table');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Filter Bus</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VERIFICATION DETAIL AUDIT MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-slate-200 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Verification Audit Log
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Scan Event Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Large Outcome Status Card */}
            <div>
              {selectedLog.result === 'valid' && (
                <div className="p-4 bg-emerald-500 text-white rounded-2xl flex items-center gap-3 shadow-md">
                  <CheckCircle className="w-8 h-8 shrink-0 text-emerald-100" />
                  <div>
                    <h4 className="text-lg font-black uppercase">VALID / BOARDED</h4>
                    <p className="text-xs text-emerald-100">Passenger held an active valid subscription.</p>
                  </div>
                </div>
              )}
              {selectedLog.result === 'expired' && (
                <div className="p-4 bg-rose-600 text-white rounded-2xl flex items-center gap-3 shadow-md">
                  <XCircle className="w-8 h-8 shrink-0 text-rose-100" />
                  <div>
                    <h4 className="text-lg font-black uppercase">EXPIRED PASS</h4>
                    <p className="text-xs text-rose-100">Passenger pass has lapsed and requires renewal.</p>
                  </div>
                </div>
              )}
              {selectedLog.result === 'no_active_subscription' && (
                <div className="p-4 bg-amber-500 text-slate-950 rounded-2xl flex items-center gap-3 shadow-md">
                  <AlertTriangle className="w-8 h-8 shrink-0 text-slate-950" />
                  <div>
                    <h4 className="text-lg font-black uppercase">NO ACTIVE SUBSCRIPTION</h4>
                    <p className="text-xs text-slate-900 font-medium">Passenger is registered but has no current pass.</p>
                  </div>
                </div>
              )}
              {selectedLog.result === 'passenger_not_found' && (
                <div className="p-4 bg-slate-800 text-white rounded-2xl flex items-center gap-3 shadow-md">
                  <HelpCircle className="w-8 h-8 shrink-0 text-rose-400" />
                  <div>
                    <h4 className="text-lg font-black uppercase">PASSENGER NOT FOUND</h4>
                    <p className="text-xs text-slate-300">Scanned QR code or ID does not exist in registry.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Checker & Bus Stamped Details */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                Verification Metadata
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Assigned Checker:</span>
                  <span className="font-bold text-white text-sm">{selectedLog.checkerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Operating Bus Unit:</span>
                  <span className="font-bold text-amber-300 font-mono text-sm">
                    {selectedLog.busNumber || 'BUS-01'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Scan Timestamp:</span>
                  <span className="font-medium text-slate-200">{formatDateTime(selectedLog.timestamp)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Route:</span>
                  <span className="font-medium text-slate-200">Del Rosario – Centro</span>
                </div>
              </div>
            </div>

            {/* Passenger Identification & Subscription Section */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Passenger Information
              </span>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-200 border-2 border-slate-300 shrink-0">
                  {inspectedPassenger?.photoUrl ? (
                    <img
                      src={inspectedPassenger.photoUrl}
                      alt={selectedLog.passengerName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-amber-400 font-bold">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="space-y-0.5">
                  <h4 className="text-base font-black text-slate-900">{selectedLog.passengerName}</h4>
                  <div className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded inline-block">
                    {selectedLog.passengerNumber || 'Unassigned'}
                  </div>
                  {inspectedPassenger?.mobileNumber && (
                    <p className="text-xs text-slate-500 font-medium">
                      Phone: {inspectedPassenger.mobileNumber}
                    </p>
                  )}
                </div>
              </div>

              {selectedLog.planName && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Enrolled Plan:</span>
                    <span className="font-black text-slate-800">{selectedLog.planName}</span>
                  </div>
                  {selectedLog.expiryDate && (
                    <div>
                      <span className="text-slate-400 block">Expiry Date:</span>
                      <span className="font-bold text-slate-800">{formatDate(selectedLog.expiryDate)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Audit Notes */}
            {selectedLog.notes && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold block">Log Notes:</span>
                <span>{selectedLog.notes}</span>
              </div>
            )}

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={() => setSelectedLog(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
