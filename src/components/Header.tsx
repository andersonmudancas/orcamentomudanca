import React from 'react';
import { Truck, Phone, ShieldCheck, LogOut, Lock, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  activeTab: 'orcamento' | 'admin';
  setActiveTab: (tab: 'orcamento' | 'admin') => void;
  isAdmin: boolean;
  onLogout: () => void;
  newQuotesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isAdmin,
  onLogout,
  newQuotesCount = 0,
}) => {
  return (
    <header className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white border-b-4 border-sky-600 shadow-lg sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Branding */}
          <div className="text-center md:text-left flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 shadow-inner">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white flex items-center justify-center md:justify-start gap-2">
                ANDERSON MUDANÇAS
              </h1>
              <p className="text-xs sm:text-sm font-semibold tracking-wider text-sky-400">
                MUDANÇAS & TRANSPORTES
              </p>
              <div className="flex items-center justify-center md:justify-start gap-2 text-[11px] text-neutral-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Segurança
                </span>
                <span>•</span>
                <span>Agilidade</span>
                <span>•</span>
                <span>Confiança</span>
              </div>
            </div>
          </div>

          {/* Quick contact badge */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            <a
              href="https://wa.me/5514996756241?text=Ol%C3%A1%2C%20Anderson!%20Gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20mudan%C3%A7a."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors shadow-sm"
              title="Fale direto no WhatsApp"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>(14) 99675-6241</span>
            </a>

            {/* Navigation buttons */}
            <div className="inline-flex bg-neutral-800/80 p-1 rounded-xl border border-neutral-700">
              <button
                type="button"
                onClick={() => setActiveTab('orcamento')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'orcamento'
                    ? 'bg-sky-600 text-white shadow-sm font-semibold'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                📋 Solicitar Orçamento
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`relative px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-sky-600 text-white shadow-sm font-semibold'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                {isAdmin ? (
                  <>
                    <FileSpreadsheet className="w-3.5 h-3.5 text-sky-200" />
                    <span>Painel Anderson</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Acesso Gestão</span>
                  </>
                )}
                {newQuotesCount > 0 && (
                  <span className="bg-amber-500 text-neutral-950 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse ml-0.5">
                    {newQuotesCount}
                  </span>
                )}
              </button>
            </div>

            {/* If logged in admin */}
            {isAdmin && (
              <div className="flex items-center gap-2 pl-1 border-l border-neutral-800">
                <span className="text-xs text-emerald-400 font-semibold hidden sm:inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Conectado
                </span>
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-rose-400 rounded-lg text-xs transition-colors flex items-center gap-1"
                  title="Sair do painel"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="text-[11px] sm:hidden">Sair</span>
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
