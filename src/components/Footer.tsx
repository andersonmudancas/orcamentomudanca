import React from 'react';
import { Phone, MessageCircle, ShieldCheck, Truck } from 'lucide-react';

interface FooterProps {
  onAdminClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  return (
    <footer className="bg-neutral-900 text-neutral-400 text-xs py-8 border-t border-neutral-800 mt-12">
      <div className="max-w-6xl mx-auto px-4 text-center space-y-4">
        
        <div className="flex items-center justify-center gap-2 text-white font-bold text-sm">
          <Truck className="w-4 h-4 text-sky-400" />
          <span>Anderson Mudanças e Transporte</span>
        </div>

        <p className="text-neutral-400 text-xs max-w-md mx-auto">
          Especialistas em mudanças residenciais e comerciais, desmontagem e montagem de móveis, embalagens seguras e fornecimento de caixas de papelão.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap text-neutral-300">
          <a
            href="https://wa.me/5514996756241"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>(14) 99675-6241 (WhatsApp)</span>
          </a>

          <span>•</span>

          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            Cargas Seguradas & Profissionais Qualificados
          </span>
        </div>

        <div className="pt-2 text-[11px] text-neutral-500 flex items-center justify-center gap-3">
          <span>© 2026 Anderson Mudanças e Transporte • Todos os direitos reservados.</span>
          <span>•</span>
          <button
            type="button"
            onClick={onAdminClick}
            className="hover:text-sky-400 transition-colors underline cursor-pointer"
          >
            Acesso Administrativo
          </button>
        </div>

      </div>
    </footer>
  );
};
