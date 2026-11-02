import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { QuoteForm } from './components/QuoteForm';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { testConnection } from './firebase';
import { subscribeQuotes } from './services/quotesService';
import { Quote } from './types/quote';

const ADMIN_STORAGE_KEY = 'anderson_admin_auth_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'orcamento' | 'admin'>('orcamento');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
  });
  const [newQuotesCount, setNewQuotesCount] = useState(0);

  // Initialize and check Firestore connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to new quotes count if admin is authenticated
  useEffect(() => {
    if (!isAdmin) {
      setNewQuotesCount(0);
      return;
    }

    const unsubscribe = subscribeQuotes(
      (quotes: Quote[]) => {
        const count = quotes.filter((q) => q.status === 'novo').length;
        setNewQuotesCount(count);
      },
      () => {
        // Silent fail if network issue
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const handleLoginSuccess = () => {
    sessionStorage.setItem(ADMIN_STORAGE_KEY, 'true');
    setIsAdmin(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    setIsAdmin(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        newQuotesCount={newQuotesCount}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'orcamento' ? (
          <QuoteForm
            onSuccessCreated={() => {
              // Confirmation feedback handled inside QuoteForm
            }}
          />
        ) : (
          <AdminDashboard
            isAdmin={isAdmin}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onAdminClick={() => setActiveTab('admin')} />
    </div>
  );
}
