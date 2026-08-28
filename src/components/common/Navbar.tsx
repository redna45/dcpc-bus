import React, { useState } from 'react';
import {
  User,
  QrCode,
  CreditCard,
  History,
  LayoutDashboard,
  Scan,
  Users,
  Shield,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
  Sparkles,
  ShoppingBag,
  Clock,
  Layers,
  MapPin,
  Ticket,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { BRANDING } from '../../constants/branding';
import { Logo } from './Logo';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  companyName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  companyName = BRANDING.name,
}) => {
  const { userProfile, activeRole, isAdmin, logout, switchRoleForDemo } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  if (!userProfile) return null;

  const role = userProfile.role;

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-purple-200 uppercase tracking-wider">ADMIN</span>;
      case 'cashier':
        return <span className="bg-blue-100 text-blue-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">CASHIER</span>;
      case 'checker':
        return <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">CHECKER</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">COMMUTER</span>;
    }
  };

  // Nav items for desktop header and mobile bottom bar
  const getNavItems = () => {
    switch (activeRole) {
      case 'passenger':
        return [
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'plans', label: 'Plans', icon: Ticket },
          { id: 'my-qr', label: 'My Pass', icon: QrCode, isPrimaryAction: true },
          { id: 'payments', label: 'Activity', icon: Clock },
          { id: 'profile', label: 'Account', icon: User },
        ];
      case 'cashier':
        return [
          { id: 'dashboard', label: 'Station', icon: LayoutDashboard },
          { id: 'pending-payments', label: 'Approvals', icon: CreditCard },
          { id: 'sell-subscription', label: 'Sell Pass', icon: ShoppingBag, isPrimaryAction: true },
          { id: 'passengers', label: 'Riders', icon: Users },
          { id: 'subscriptions', label: 'Passes', icon: Layers },
        ];
      case 'checker':
        return [
          { id: 'verify', label: 'Scan Pass', icon: Scan, isPrimaryAction: true },
          { id: 'history', label: 'Scan Logs', icon: History },
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'payments', label: 'Payments', icon: CreditCard },
          { id: 'passengers', label: 'Riders', icon: Users },
          { id: 'plans', label: 'Pass Plans', icon: Ticket },
          { id: 'staff', label: 'Staff Roles', icon: Shield },
          { id: 'scan-logs', label: 'Scan Logs', icon: Scan },
          { id: 'settings', label: 'Settings', icon: SettingsIcon },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15 md:h-16">
            
            {/* Brand / Logo */}
            <div className="flex items-center gap-2">
              <button
                id="header-brand-logo-btn"
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 text-left group cursor-pointer"
              >
                <Logo size="sm" showText={false} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm md:text-base text-slate-900 tracking-tight leading-tight">
                      DCPC <span className="text-emerald-600 font-black">BAPAGTRANSCO</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                    <MapPin className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                    <span className="truncate max-w-[140px] sm:max-w-[220px]">Naga City, Camarines Sur</span>
                  </div>
                </div>
              </button>

              {/* Role badge for desktop */}
              <div className="hidden sm:flex items-center gap-1.5 ml-2">
                {getRoleBadge(role)}
                {isAdmin && activeRole !== 'admin' && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Mode: <strong className="uppercase">{activeRole}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-link-${item.id}`}
                    onClick={() => onNavigate(item.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Right Actions: Admin Switcher & User Profile */}
            <div className="flex items-center gap-2">
              {/* Admin Mode Switcher */}
              {isAdmin && (
                <div className="relative">
                  <button
                    id="admin-role-switcher-btn"
                    onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    title="Role Switcher"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Role:</span>
                    <span className="capitalize">{activeRole}</span>
                    <ChevronDown className="w-3 h-3 text-emerald-700" />
                  </button>

                  {showRoleSwitcher && (
                    <div
                      id="role-switcher-menu"
                      className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-emerald-100 py-2 z-50 animate-in fade-in zoom-in-95"
                    >
                      <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Role Perspective</span>
                        <span className="text-emerald-600 font-extrabold">SUPER ADMIN</span>
                      </div>
                      <button
                        onClick={() => {
                          switchRoleForDemo('passenger');
                          setShowRoleSwitcher(false);
                          onNavigate('dashboard');
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between hover:bg-emerald-50 cursor-pointer ${
                          activeRole === 'passenger' ? 'text-emerald-700 bg-emerald-50 font-black' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-emerald-600" />
                          <span>Passenger Portal</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Rider QR & Pass</span>
                      </button>
                      <button
                        onClick={() => {
                          switchRoleForDemo('cashier');
                          setShowRoleSwitcher(false);
                          onNavigate('dashboard');
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between hover:bg-emerald-50 cursor-pointer ${
                          activeRole === 'cashier' ? 'text-emerald-700 bg-emerald-50 font-black' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-blue-600" />
                          <span>Cashier Station</span>
                        </div>
                        <span className="text-[10px] text-slate-400">GCash & Approvals</span>
                      </button>
                      <button
                        onClick={() => {
                          switchRoleForDemo('checker');
                          setShowRoleSwitcher(false);
                          onNavigate('verify');
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between hover:bg-emerald-50 cursor-pointer ${
                          activeRole === 'checker' ? 'text-emerald-700 bg-emerald-50 font-black' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Scan className="w-4 h-4 text-amber-600" />
                          <span>Bus Checker Scanner</span>
                        </div>
                        <span className="text-[10px] text-slate-400">QR Camera</span>
                      </button>
                      <button
                        onClick={() => {
                          switchRoleForDemo('admin');
                          setShowRoleSwitcher(false);
                          onNavigate('dashboard');
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between hover:bg-emerald-50 cursor-pointer ${
                          activeRole === 'admin' ? 'text-emerald-700 bg-emerald-50 font-black' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-purple-600" />
                          <span>Admin Control Center</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Full System</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* User Dropdown */}
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1 rounded-2xl hover:bg-emerald-50 transition cursor-pointer border border-transparent hover:border-emerald-200"
                >
                  <img
                    src={userProfile.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.fullName}`}
                    alt={userProfile.fullName}
                    className="w-8 h-8 rounded-xl object-cover border border-emerald-300 shadow-xs bg-slate-100"
                    referrerPolicy="no-referrer"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div
                    id="user-menu-dropdown"
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-emerald-100 py-2 z-50 animate-in fade-in"
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 rounded-t-xl">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-black text-slate-900 truncate">{userProfile.fullName}</p>
                        {getRoleBadge(userProfile.role)}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{userProfile.email}</p>
                      {userProfile.passengerNumber && (
                        <p className="text-[11px] font-mono font-bold text-emerald-700 mt-1">
                          Pass ID: {userProfile.passengerNumber}
                        </p>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate(activeRole === 'passenger' ? 'profile' : 'dashboard');
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2 cursor-pointer transition"
                      >
                        <User className="w-4 h-4 text-emerald-600" />
                        Account & Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100 cursor-pointer transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Grab-Style Mobile Bottom Floating Navigation Bar */}
      <nav
        id="mobile-bottom-navigation-bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-emerald-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe"
      >
        <div className="grid grid-flow-col auto-cols-fr items-center justify-around px-2 py-1.5 max-w-md mx-auto">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const isCenterAction = item.isPrimaryAction;

            if (isCenterAction) {
              return (
                <button
                  key={item.id}
                  id={`mobile-tab-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className="flex flex-col items-center justify-center -mt-5 group cursor-pointer focus:outline-none"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                      isActive
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/30'
                    }`}
                  >
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold mt-1 tracking-tight ${
                      isActive ? 'text-emerald-700' : 'text-slate-600 font-bold'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                id={`mobile-tab-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer active:scale-90 ${
                  isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 font-semibold tracking-tight ${
                    isActive ? 'font-bold text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
