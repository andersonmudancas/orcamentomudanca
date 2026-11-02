import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { QuoteForm } from './components/QuoteForm';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { testConnection } from './firebase';
import { subscribeAuth, logoutAdmin } from './services/authService';
import { subscribeQuotes } from './services/quotesService';
import { Quote } from './types/quote';

export default function App() {
  const [activeTab, setActiveTab] = useState<'orcamento' | 'admin'>('orcamento');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newQuotesCount, setNewQuotesCount] = useState(0);

  // Initialize and check Firestore connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Listen for user auth
  useEffect(() => {
    const unsubscribe = subscribeAuth((user, adminStatus) => {
      setCurrentUser(user);
      setIsAdmin(adminStatus);
    });
    return () => unsubscribe();
  }, []);

  // Listen to new quotes count if admin
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
        // Silent fail if rules restrict or not loaded yet
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const handleLogout = async () => {
    await logoutAdmin();
    setActiveTab('orcamento');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        newQuotesCount={newQuotesCount}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'orcamento' ? (
          <QuoteForm
            onSuccessCreated={() => {
              // Could trigger celebration or prompt
            }}
          />
        ) : (
          <AdminDashboard currentUser={currentUser} isAdmin={isAdmin} />
        )}
      </main>

      {/* Footer */}
      <Footer onAdminClick={() => setActiveTab('admin')} />
    </div>
  );
}
