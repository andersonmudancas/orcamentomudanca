import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Truck,
  MessageCircle,
  ExternalLink,
  Printer,
  Trash2,
  Save,
  MapPin,
  Calendar,
  Package,
  Wrench,
  Box,
  AlertTriangle,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  ShieldCheck,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { Quote, QuoteStatus } from '../types/quote';
import { subscribeQuotes, updateQuote, deleteQuote } from '../services/quotesService';

interface AdminDashboardProps {
  isAdmin: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
}

const STATUS_LABELS: Record<QuoteStatus, { label: string; bg: string; text: string; border: string }> = {
  novo: {
    label: 'Novo Pedido',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-300',
  },
  em_analise: {
    label: 'Em Análise',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-300',
  },
  orcamento_enviado: {
    label: 'Orçamento Enviado',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-300',
  },
  fechado: {
    label: 'Fechado / Agendado',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
  },
  concluido: {
    label: 'Mudança Concluída',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
  },
  cancelado: {
    label: 'Cancelado',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-300',
  },
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isAdmin,
  onLoginSuccess,
  onLogout,
}) => {
  // Password screen state
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Dashboard state
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'todos'>('todos');
  const [serviceFilter, setServiceFilter] = useState<'todos' | 'desmontagem' | 'embalagem' | 'caixas'>('todos');

  // Edit fields for selected quote
  const [editStatus, setEditStatus] = useState<QuoteStatus>('novo');
  const [editValorOrcamento, setEditValorOrcamento] = useState<string>('');
  const [editNotasInternas, setEditNotasInternas] = useState<string>('');
  const [editDataMudanca, setEditDataMudanca] = useState<string>('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [lastScheduledCalendarUrl, setLastScheduledCalendarUrl] = useState<string | null>(null);

  // Real-time listener when authenticated as admin
  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeQuotes(
      (data) => {
        setQuotes(data);
        setIsLoading(false);
        // If a quote was selected, refresh its data in the modal
        if (selectedQuote) {
          const updated = data.find((q) => q.id === selectedQuote.id);
          if (updated) {
            setSelectedQuote(updated);
          }
        }
      },
      (error) => {
        console.error('Erro ao buscar orçamentos:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin, selectedQuote?.id]);

  // Handle Password Verification
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (passwordInput === 'qqqq11') {
      setPasswordInput('');
      onLoginSuccess();
    } else {
      setPasswordError('Senha incorreta! Digite a senha correta para conectar.');
    }
  };

  // Open Quote Details Modal
  const handleOpenDetail = (quote: Quote) => {
    setSelectedQuote(quote);
    setEditStatus(quote.status);
    setEditValorOrcamento(quote.valorOrcamento ? String(quote.valorOrcamento) : '');
    setEditNotasInternas(quote.notasInternas || '');
    setEditDataMudanca(quote.dataMudanca || '');
    setSaveSuccessMessage(null);
    setModalError(null);
    setIsConfirmingDelete(false);
    setLastScheduledCalendarUrl(null);
  };

  // Google Calendar URL generator
  const getGoogleCalendarUrl = (
    quote: Quote,
    targetDate: string,
    targetValor?: string,
    targetNotas?: string
  ): string => {
    const title = `🚚 Mudança - ${quote.nome} (Orçamento: ${quote.protocol})`;
    const dateClean = (targetDate || quote.dataMudanca || '').replace(/-/g, '').trim();
    const datesParam = dateClean ? `${dateClean}T080000/${dateClean}T180000` : '';
    const location = `${quote.origem} ➔ ${quote.destino}`;

    let details = `🚚 ANDERSON MUDANÇAS E TRANSPORTE\n`;
    details += `📄 Orçamento: ${quote.protocol}\n`;
    details += `👤 Cliente: ${quote.nome}\n`;
    if (quote.telefone) details += `📱 WhatsApp/Tel: ${quote.telefone}\n`;
    details += `\n📍 Origem: ${quote.origem} (${quote.tipoOrigem}${quote.detalhesOrigem ? ' - ' + quote.detalhesOrigem : ''})\n`;
    details += `📍 Destino: ${quote.destino} (${quote.tipoDestino}${quote.detalhesDestino ? ' - ' + quote.detalhesDestino : ''})\n`;

    const valor = targetValor || (quote.valorOrcamento ? `R$ ${quote.valorOrcamento.toFixed(2).replace('.', ',')}` : '');
    if (valor) {
      details += `\n💰 Valor Fechado: ${valor.startsWith('R$') ? valor : 'R$ ' + valor}\n`;
    }

    details += `\n📦 ITENS:\n${quote.itens}\n`;

    if (quote.precisaDesmontagem && quote.itensDesmontagem?.length) {
      details += `\n🛠️ DESMONTAGEM (${quote.itensDesmontagem.length} itens):\n`;
      quote.itensDesmontagem.forEach((item, idx) => {
        details += `${idx + 1}. ${item}\n`;
      });
    }

    if (quote.precisaEmbalagem && quote.itensEmbalagem?.length) {
      details += `\n📦 EMBALAGEM (${quote.itensEmbalagem.length} itens):\n`;
      quote.itensEmbalagem.forEach((item, idx) => {
        details += `${idx + 1}. ${item}\n`;
      });
    }

    if (quote.precisaCaixas && quote.quantidadeCaixas) {
      details += `\n📦 CAIXAS: ${quote.quantidadeCaixas} unidades\n`;
    }

    const notas = targetNotas || quote.notasInternas;
    if (notas?.trim()) {
      details += `\n📝 NOTAS DE LOGÍSTICA:\n${notas}\n`;
    }

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${datesParam}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
  };

  const handleOpenGoogleCalendar = (
    quote: Quote,
    targetDate: string,
    targetValor?: string,
    targetNotas?: string
  ) => {
    const url = getGoogleCalendarUrl(quote, targetDate, targetValor, targetNotas);
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn('Popup blocked or failed to open window:', e);
    }
  };

  // Save changes to quote
  const handleSaveQuoteChanges = async () => {
    if (!selectedQuote?.id) return;
    setIsSaving(true);
    setSaveSuccessMessage(null);
    setModalError(null);

    const oldStatus = selectedQuote.status;
    const isNowFechado = editStatus === 'fechado';
    const statusJustChangedToFechado = isNowFechado && oldStatus !== 'fechado';
    const newDate = editDataMudanca.trim() || selectedQuote.dataMudanca;

    try {
      const numValor = parseFloat(editValorOrcamento.replace(',', '.'));
      await updateQuote(selectedQuote.id, {
        status: editStatus,
        valorOrcamento: isNaN(numValor) ? undefined : numValor,
        notasInternas: editNotasInternas.trim(),
        dataMudanca: newDate,
      });

      setSaveSuccessMessage('Alterações salvas com sucesso!');

      // Se o status for ou se tornou Fechado / Agendado, atualiza o link direto do Google Agenda
      if (isNowFechado) {
        const calUrl = getGoogleCalendarUrl(selectedQuote, newDate, editValorOrcamento, editNotasInternas);
        setLastScheduledCalendarUrl(calUrl);
        if (statusJustChangedToFechado) {
          handleOpenGoogleCalendar(selectedQuote, newDate, editValorOrcamento, editNotasInternas);
        }
      }

      setTimeout(() => setSaveSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      setModalError('Erro ao salvar alterações no banco de dados. Verifique a conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Quote
  const handleDeleteQuote = async (id: string) => {
    try {
      await deleteQuote(id);
      setSelectedQuote(null);
      setIsConfirmingDelete(false);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      setModalError('Não foi possível excluir o orçamento do banco de dados.');
    }
  };

  // Generate WhatsApp proposal text
  const handleSendWhatsAppProposal = (quote: Quote) => {
    if (!quote.telefone) {
      setModalError('Este cliente não cadastrou telefone de contato.');
      return;
    }

    const cleanPhone = quote.telefone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const valorFormatado = editValorOrcamento
      ? `R$ ${parseFloat(editValorOrcamento.replace(',', '.')).toFixed(2).replace('.', ',')}`
      : 'sob consulta';

    const targetDate = editDataMudanca.trim() || quote.dataMudanca;

    let msg = `Olá, *${quote.nome.trim()}*! Tudo bem?\n`;
    msg += `Aqui é o *Anderson* da *Anderson Mudanças e Transporte* 🚚\n\n`;
    msg += `Recebemos sua solicitação (Orçamento: *${quote.protocol}*) para a data de *${targetDate}*.\n\n`;
    msg += `📍 *Origem:* ${quote.origem}\n`;
    msg += `📍 *Destino:* ${quote.destino}\n`;

    if (quote.precisaDesmontagem) {
      msg += `🛠️ *Desmontagem e montagem inclusa* (${quote.itensDesmontagem?.length || 0} itens)\n`;
    }
    if (quote.precisaEmbalagem) {
      msg += `📦 *Serviço de embalagem incluso* (${quote.itensEmbalagem?.length || 0} itens)\n`;
    }
    if (quote.precisaCaixas && quote.quantidadeCaixas) {
      msg += `📦 *Caixas de papelão:* ${quote.quantidadeCaixas} unidades inclusas\n`;
    }

    msg += `\n💰 *Valor Proposto do Orçamento:* *${valorFormatado}*\n\n`;
    msg += `Podemos confirmar a disponibilidade para essa data? Fico à disposição para tirar qualquer dúvida!`;

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Filtered Quotes
  const filteredQuotes = quotes.filter((q) => {
    const search = searchTerm.toLowerCase();
    const matchSearch =
      !search ||
      q.nome.toLowerCase().includes(search) ||
      q.protocol.toLowerCase().includes(search) ||
      q.origem.toLowerCase().includes(search) ||
      q.destino.toLowerCase().includes(search) ||
      (q.telefone && q.telefone.includes(search));

    const matchStatus = statusFilter === 'todos' || q.status === statusFilter;

    let matchService = true;
    if (serviceFilter === 'desmontagem') matchService = q.precisaDesmontagem;
    if (serviceFilter === 'embalagem') matchService = q.precisaEmbalagem;
    if (serviceFilter === 'caixas') matchService = q.precisaCaixas;

    return matchSearch && matchStatus && matchService;
  });

  // KPI Calculations
  const totalPedidos = quotes.length;
  const countNovos = quotes.filter((q) => q.status === 'novo').length;
  const countEmAnalise = quotes.filter((q) => q.status === 'em_analise').length;
  const countOrcamentoEnviado = quotes.filter((q) => q.status === 'orcamento_enviado').length;
  const countFechados = quotes.filter((q) => q.status === 'fechado').length;
  const countConcluidos = quotes.filter((q) => q.status === 'concluido').length;
  const totalCaixasVendidas = quotes.reduce((acc, q) => acc + (q.quantidadeCaixas || 0), 0);

  // If not authenticated, show ONLY Restricted Access with Password "qqqq11"
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-7 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-slate-900 text-sky-400 rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-black text-rose-700 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider border border-rose-200">
              Acesso Restrito
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-3">
              Painel de Gestão
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
              Digite a senha de administrador para acessar e gerenciar os orçamentos.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Senha de Acesso:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError(null);
                  }}
                  autoFocus
                  placeholder="Digite a senha de acesso"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Conectar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[11px] text-slate-400">
            © Anderson Mudanças e Transporte • Acesso Administrativo
          </p>
        </div>
      </div>
    );
  }

  // Dashboard Screen (Authenticated with "qqqq11")
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Top Admin Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Gestão de Orçamentos de Mudança
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Conectado como <strong>Administrador</strong> • Banco de dados em tempo real</span>
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-200 cursor-pointer"
            title="Imprimir relatório da tela"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-200 cursor-pointer"
          >
            Desconectar / Sair
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Orçamentos</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalPedidos}</div>
          <span className="text-[10px] text-slate-400">Registrados</span>
        </div>

        <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-200 shadow-xs">
          <span className="text-[11px] font-bold text-sky-700 uppercase block flex items-center justify-between">
            Novos
            {countNovos > 0 && <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />}
          </span>
          <div className="text-2xl font-black text-sky-700 mt-1">{countNovos}</div>
          <span className="text-[10px] text-sky-600">Aguardando retorno</span>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase block">Em Análise</span>
          <div className="text-2xl font-black text-amber-700 mt-1">{countEmAnalise}</div>
          <span className="text-[10px] text-amber-600">Avaliando volume</span>
        </div>

        <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 shadow-xs">
          <span className="text-[11px] font-bold text-purple-700 uppercase block">Orçados</span>
          <div className="text-2xl font-black text-purple-700 mt-1">{countOrcamentoEnviado}</div>
          <span className="text-[10px] text-purple-600">Proposta enviada</span>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase block">Fechados</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{countFechados}</div>
          <span className="text-[10px] text-emerald-600">Agendados no Google</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-600 uppercase block">Caixas Solicitadas</span>
          <div className="text-2xl font-black text-slate-800 mt-1">{totalCaixasVendidas} un</div>
          <span className="text-[10px] text-slate-500">R$ {(totalCaixasVendidas * 3).toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome do cliente, orçamento, endereço ou telefone..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Quick Service Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-500 font-semibold px-1">Serviço:</span>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'desmontagem', label: '🛠️ Desmontagem' },
              { id: 'embalagem', label: '📦 Embalagem' },
              { id: 'caixas', label: '📦 Caixas' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setServiceFilter(s.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  serviceFilter === s.id
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 pb-1">
          <span className="text-xs text-slate-500 font-semibold">Status:</span>
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'novo', label: 'Novos' },
            { id: 'em_analise', label: 'Em Análise' },
            { id: 'orcamento_enviado', label: 'Orçados' },
            { id: 'fechado', label: 'Fechados / Agendados' },
            { id: 'concluido', label: 'Concluídos' },
            { id: 'cancelado', label: 'Cancelados' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
            <span className="text-sm font-medium">Carregando orçamentos de mudança...</span>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Package className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="text-base font-bold text-slate-700">Nenhum orçamento encontrado</h4>
            <p className="text-xs text-slate-400">
              {searchTerm || statusFilter !== 'todos' || serviceFilter !== 'todos'
                ? 'Nenhum orçamento corresponde aos filtros selecionados.'
                : 'Quando os clientes enviarem o formulário de orçamento, eles aparecerão aqui automaticamente.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredQuotes.map((q) => {
              const statusCfg = STATUS_LABELS[q.status] || STATUS_LABELS.novo;
              const hasPhone = Boolean(q.telefone?.trim());

              return (
                <div
                  key={q.id}
                  onClick={() => handleOpenDetail(q)}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left Column: Basic Info & Route */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        Orçamento: {q.protocol}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                        {statusCfg.label}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {q.dataMudanca}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">{q.nome}</h4>
                      {hasPhone && (
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {q.telefone}
                        </span>
                      )}
                    </div>

                    {/* Route */}
                    <div className="text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="flex items-center gap-1 truncate max-w-xs" title={q.origem}>
                        <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <strong>De:</strong> {q.origem} ({q.tipoOrigem})
                      </span>
                      <span className="hidden sm:inline text-slate-300">➔</span>
                      <span className="flex items-center gap-1 truncate max-w-xs" title={q.destino}>
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <strong>Para:</strong> {q.destino} ({q.tipoDestino})
                      </span>
                    </div>

                    {/* Services Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {q.precisaDesmontagem && (
                        <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-sky-600" />
                          Desmontagem ({q.itensDesmontagem?.length || 0})
                        </span>
                      )}
                      {q.precisaEmbalagem && (
                        <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                          <Package className="w-3 h-3 text-amber-600" />
                          Embalagem ({q.itensEmbalagem?.length || 0})
                        </span>
                      )}
                      {q.precisaCaixas && (
                        <span className="text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 font-medium">
                          <Box className="w-3 h-3 text-amber-700" />
                          {q.quantidadeCaixas} Caixas
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Quoted price & Action buttons */}
                  <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-between lg:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Valor Orçado</span>
                      <span className="text-sm font-black text-slate-900">
                        {q.valorOrcamento
                          ? `R$ ${q.valorOrcamento.toFixed(2).replace('.', ',')}`
                          : 'A definir'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Direct Google Calendar quick button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenGoogleCalendar(q, q.dataMudanca);
                        }}
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors border border-emerald-200 cursor-pointer"
                        title="Agendar diretamente na Google Agenda"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>

                      {hasPhone && (
                        <a
                          href={`https://wa.me/${q.telefone?.replace(/\D/g, '').startsWith('55') ? q.telefone.replace(/\D/g, '') : `55${q.telefone?.replace(/\D/g, '')}`}?text=${encodeURIComponent(`Olá ${q.nome}! Aqui é o Anderson da Anderson Mudanças sobre seu orçamento nº ${q.protocol}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl transition-colors border border-sky-200"
                          title="Chamar no WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(q);
                        }}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        Gerenciar
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL & MANAGEMENT MODAL */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl my-8 space-y-6 max-h-[90vh] overflow-y-auto border border-slate-200">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-4 gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-black text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                    Orçamento: {selectedQuote.protocol}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${STATUS_LABELS[selectedQuote.status]?.bg} ${STATUS_LABELS[selectedQuote.status]?.text} ${STATUS_LABELS[selectedQuote.status]?.border}`}>
                    {STATUS_LABELS[selectedQuote.status]?.label}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {selectedQuote.nome}
                </h3>
                {selectedQuote.telefone && (
                  <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>Telefone:</strong> {selectedQuote.telefone}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedQuote(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick action buttons row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Direct Google Calendar action button */}
              <button
                type="button"
                onClick={() =>
                  handleOpenGoogleCalendar(
                    selectedQuote,
                    editDataMudanca,
                    editValorOrcamento,
                    editNotasInternas
                  )
                }
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                title="Agendar diretamente no Google Calendar"
              >
                <Calendar className="w-4 h-4" />
                Agendar no Google Agenda
              </button>

              {selectedQuote.telefone && (
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppProposal(selectedQuote)}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  Enviar Proposta WhatsApp
                </button>
              )}

              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(selectedQuote.origem)}&destination=${encodeURIComponent(selectedQuote.destino)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200"
              >
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                Rota Google Maps
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Pedido
              </button>
            </div>

            {/* Google Calendar Notice Box when Fechado / Agendado */}
            {editStatus === 'fechado' && (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    Status Fechado / Agendado
                  </span>
                  <p className="text-xs text-emerald-700">
                    Mudança agendada para <strong>{editDataMudanca || selectedQuote.dataMudanca}</strong>. Ao salvar alterações, o agendamento no Google Agenda abrirá automaticamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenGoogleCalendar(
                      selectedQuote,
                      editDataMudanca,
                      editValorOrcamento,
                      editNotasInternas
                    )
                  }
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  Abrir no Google Agenda
                </button>
              </div>
            )}

            {/* Logistics summary details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Origem Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs sm:text-sm">
                <span className="font-bold text-sky-700 uppercase text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Origem
                </span>
                <p className="font-semibold text-slate-900">{selectedQuote.origem}</p>
                <p className="text-slate-600">
                  <strong>Tipo:</strong> {selectedQuote.tipoOrigem}
                </p>
                {selectedQuote.detalhesOrigem && (
                  <p className="text-slate-500 italic">
                    {selectedQuote.detalhesOrigem}
                  </p>
                )}
              </div>

              {/* Destino Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs sm:text-sm">
                <span className="font-bold text-emerald-700 uppercase text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Destino
                </span>
                <p className="font-semibold text-slate-900">{selectedQuote.destino}</p>
                <p className="text-slate-600">
                  <strong>Tipo:</strong> {selectedQuote.tipoDestino}
                </p>
                {selectedQuote.detalhesDestino && (
                  <p className="text-slate-500 italic">
                    {selectedQuote.detalhesDestino}
                  </p>
                )}
              </div>

            </div>

            {/* Current Date Display */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-700 flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-sky-600" />
                Data Registrada da Mudança: <strong className="text-slate-900">{editDataMudanca || selectedQuote.dataMudanca}</strong>
              </span>
              <span className="text-xs text-sky-700 font-semibold bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
                Pode ser alterada no campo abaixo
              </span>
            </div>

            {/* Items inventory */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Package className="w-4 h-4 text-sky-600" />
                Itens a serem transportados
              </span>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                {selectedQuote.itens}
              </div>
            </div>

            {/* Additional Services Breakdown */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-700 uppercase block">
                Serviços Adicionais Solicitados:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Desmontagem */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-sky-600" /> Desmontagem
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedQuote.precisaDesmontagem ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-600'}`}>
                      {selectedQuote.precisaDesmontagem ? 'SIM' : 'NÃO'}
                    </span>
                  </div>
                  {selectedQuote.precisaDesmontagem && selectedQuote.itensDesmontagem && selectedQuote.itensDesmontagem.length > 0 && (
                    <ul className="list-disc list-inside text-slate-600 pt-1 space-y-0.5">
                      {selectedQuote.itensDesmontagem.map((i, idx) => (
                        <li key={idx} className="truncate">{i}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Embalagem */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Box className="w-3.5 h-3.5 text-amber-600" /> Embalagem
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedQuote.precisaEmbalagem ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                      {selectedQuote.precisaEmbalagem ? 'SIM' : 'NÃO'}
                    </span>
                  </div>
                  {selectedQuote.precisaEmbalagem && selectedQuote.itensEmbalagem && selectedQuote.itensEmbalagem.length > 0 && (
                    <ul className="list-disc list-inside text-slate-600 pt-1 space-y-0.5">
                      {selectedQuote.itensEmbalagem.map((i, idx) => (
                        <li key={idx} className="truncate">{i}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Caixas */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      📦 Caixas
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedQuote.precisaCaixas ? `${selectedQuote.quantidadeCaixas} un` : 'NÃO'} `}>
                      {selectedQuote.precisaCaixas ? `${selectedQuote.quantidadeCaixas} un` : 'NÃO'}
                    </span>
                  </div>
                  {selectedQuote.precisaCaixas && (
                    <p className="text-slate-600 pt-1">
                      Total das caixas: <strong>R$ {((selectedQuote.quantidadeCaixas || 0) * 3).toFixed(2).replace('.', ',')}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Customer observations */}
            {selectedQuote.observacoes && (
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-900">
                <strong>Observações do Cliente:</strong> {selectedQuote.observacoes}
              </div>
            )}

            {/* MANAGEMENT CONTROLS SECTION */}
            <div className="bg-sky-50/40 p-4 sm:p-5 rounded-2xl border border-sky-200 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-700" />
                Gerenciamento do Orçamento (Anderson)
              </h4>

              {saveSuccessMessage && (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              {lastScheduledCalendarUrl && (
                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-medium border border-emerald-300 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Mudança agendada para <strong>{editDataMudanca || selectedQuote.dataMudanca}</strong>!</span>
                  </div>
                  <a
                    href={lastScheduledCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                  >
                    Abrir no Google Agenda
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {modalError && (
                <div className="p-3 bg-rose-100 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border border-rose-300">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalError(null)}
                    className="text-rose-700 hover:text-rose-900 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Status selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Status do Orçamento:
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => {
                      const newSt = e.target.value as QuoteStatus;
                      setEditStatus(newSt);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="novo">Novo Pedido</option>
                    <option value="em_analise">Em Análise</option>
                    <option value="orcamento_enviado">Orçamento Enviado</option>
                    <option value="fechado">Fechado / Agendado</option>
                    <option value="concluido">Mudança Concluída</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                {/* Alterar Data da Mudança */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Alterar Data da Mudança:
                  </label>
                  <input
                    type="date"
                    value={editDataMudanca}
                    onChange={(e) => setEditDataMudanca(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  />
                </div>

                {/* Quoted Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Valor do Orçamento (R$):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="text"
                      value={editValorOrcamento}
                      onChange={(e) => setEditValorOrcamento(e.target.value)}
                      placeholder="Ex: 850,00"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Notas Internas e Logística (privado - visível só para você):
                </label>
                <textarea
                  rows={2}
                  value={editNotasInternas}
                  onChange={(e) => setEditNotasInternas(e.target.value)}
                  placeholder="Ex: Levar 2 ajudantes; cliente pagará 50% adiantado via Pix; caminhão baú 6m..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Inline Delete Confirmation if requested */}
              {isConfirmingDelete && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs font-bold text-rose-800">
                    Tem certeza de que deseja excluir este orçamento permanentemente do banco?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteQuote(selectedQuote.id!)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Sim, Excluir
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Save & Delete Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveQuoteChanges}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>

                  <a
                    href={getGoogleCalendarUrl(
                      selectedQuote,
                      editDataMudanca,
                      editValorOrcamento,
                      editNotasInternas
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition-colors border border-emerald-300 flex items-center gap-1.5"
                    title="Adicionar evento diretamente na Google Agenda"
                  >
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    Agendar no Google
                  </a>
                </div>

                {!isConfirmingDelete && (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir Orçamento
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
