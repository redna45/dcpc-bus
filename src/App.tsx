import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { AuthPage } from './components/auth/AuthPage';
import { BRANDING } from './constants/branding';

// Passenger Views
import { PassengerDashboard } from './components/passenger/PassengerDashboard';
import { BrowsePlans } from './components/passenger/BrowsePlans';
import { MyQrCard } from './components/passenger/MyQrCard';
import { PassengerPayments } from './components/passenger/PassengerPayments';
import { PassengerSubscriptions } from './components/passenger/PassengerSubscriptions';
import { PassengerProfile } from './components/passenger/PassengerProfile';

// Cashier Views
import { CashierDashboard } from './components/cashier/CashierDashboard';
import { PendingPaymentsQueue } from './components/cashier/PendingPaymentsQueue';
import { PassengerLookup } from './components/cashier/PassengerLookup';
import { CashierSubscriptions } from './components/cashier/CashierSubscriptions';

// Checker Views
import { CheckerDashboard } from './components/checker/CheckerDashboard';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ManagePlans } from './components/admin/ManagePlans';
import { ManagePassengers } from './components/admin/ManagePassengers';
import { ManageStaff } from './components/admin/ManageStaff';
import { ManagePayments } from './components/admin/ManagePayments';
import { AllSubscriptions } from './components/admin/AllSubscriptions';
import { VerificationLogsView } from './components/admin/VerificationLogsView';
import { SettingsView } from './components/admin/SettingsView';

const MainAppContent: React.FC = () => {
  const { userProfile, activeRole, loading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-emerald-400 font-black tracking-wider uppercase font-heading">
          Loading {BRANDING.shortName}...
        </p>
      </div>
    );
  }

  if (!userProfile) {
    return <AuthPage />;
  }

  const renderView = () => {
    // Shared profile view
    if (currentView === 'profile') {
      return <PassengerProfile />;
    }

    // Role-specific view routing based on effective active role
    switch (activeRole) {
      case 'passenger':
        switch (currentView) {
          case 'plans':
            return <BrowsePlans onNavigate={(v) => setCurrentView(v)} />;
          case 'card':
          case 'my-qr':
            return <MyQrCard onNavigate={(v) => setCurrentView(v)} />;
          case 'payments':
            return <PassengerPayments />;
          case 'subscriptions':
          case 'history':
            return <PassengerSubscriptions />;
          case 'dashboard':
          default:
            return <PassengerDashboard onNavigate={(v) => setCurrentView(v)} />;
        }

      case 'cashier':
        switch (currentView) {
          case 'pending':
          case 'pending-payments':
            return <PendingPaymentsQueue />;
          case 'passengers':
          case 'sell-subscription':
            return <PassengerLookup />;
          case 'subscriptions':
            return <CashierSubscriptions />;
          case 'dashboard':
          default:
            return <CashierDashboard onNavigate={(v) => setCurrentView(v)} />;
        }

      case 'checker':
        switch (currentView) {
          case 'history':
            return <CheckerDashboard currentView="history" onNavigate={(v) => setCurrentView(v)} />;
          case 'verify':
          case 'dashboard':
          default:
            return <CheckerDashboard currentView="verify" onNavigate={(v) => setCurrentView(v)} />;
        }

      case 'admin':
        switch (currentView) {
          case 'plans':
            return <ManagePlans />;
          case 'passengers':
            return <ManagePassengers />;
          case 'staff':
            return <ManageStaff />;
          case 'payments':
            return <ManagePayments />;
          case 'subscriptions':
            return <AllSubscriptions />;
          case 'logs':
          case 'scan-logs':
            return <VerificationLogsView />;
          case 'settings':
            return <SettingsView />;
          case 'dashboard':
          default:
            return <AdminDashboard onNavigate={(v) => setCurrentView(v)} />;
        }

      default:
        return <PassengerDashboard onNavigate={(v) => setCurrentView(v)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar currentView={currentView} onNavigate={(v) => setCurrentView(v)} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 pb-28 md:pb-8">
        {renderView()}
      </main>

      <footer className="hidden md:block py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white/70 backdrop-blur-xs">
        <p>{BRANDING.name} • {BRANDING.location} • Modern Commuter Bus Network</p>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
