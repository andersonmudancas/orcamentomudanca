import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Search,
  Filter,
  CheckCircle2,
  Clock,
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
  LogIn,
  DollarSign,
  FileText,
  ChevronRight,
  ShieldCheck,
  Phone,
  Home,
  Building,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Quote, QuoteStatus } from '../types/quote';
import { subscribeQuotes, updateQuote, deleteQuote } from '../services/quotesService';
import { loginWithGoogle, logoutAdmin } from '../services/authService';
import { ADMIN_EMAIL } from '../firebase';

interface AdminDashboardProps {
  currentUser: User | null;
  isAdmin: boolean;
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, isAdmin }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'todos'>('todos');
  const [serviceFilter, setServiceFilter] = useState<'todos' | 'desmontagem' | 'embalagem' | 'caixas'>('todos');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Edit fields for selected quote
  const [editStatus, setEditStatus] = useState<QuoteStatus>('novo');
  const [editValorOrcamento, setEditValorOrcamento] = useState<string>('');
  const [editNotasInternas, setEditNotasInternas] = useState<string>('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

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

  // Handle Login
  const handleLogin = async () => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const user = await loginWithGoogle();
      if (user.email !== ADMIN_EMAIL) {
        setLoginError(`O e-mail ${user.email} não possui autorização de administrador. Entre com ${ADMIN_EMAIL}.`);
      }
    } catch (err: any) {
      console.error('Erro ao fazer login:', err);
      setLoginError('Não foi possível autenticar com o Google. Tente novamente.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Open Quote Details Modal
  const handleOpenDetail = (quote: Quote) => {
    setSelectedQuote(quote);
    setEditStatus(quote.status);
    setEditValorOrcamento(quote.valorOrcamento ? String(quote.valorOrcamento) : '');
    setEditNotasInternas(quote.notasInternas || '');
    setSaveSuccessMessage(null);
  };

  // Save changes to quote
  const handleSaveQuoteChanges = async () => {
    if (!selectedQuote?.id) return;
    setIsSaving(true);
    setSaveSuccessMessage(null);

    try {
      const numValor = parseFloat(editValorOrcamento.replace(',', '.'));
      await updateQuote(selectedQuote.id, {
        status: editStatus,
        valorOrcamento: isNaN(numValor) ? undefined : numValor,
        notasInternas: editNotasInternas.trim(),
      });
      setSaveSuccessMessage('Alterações salvas com sucesso!');
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      alert('Erro ao salvar alterações no banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Quote
  const handleDeleteQuote = async (id: string) => {
    if (!window.confirm('Tem certeza de que deseja excluir este orçamento do banco de dados?')) {
      return;
    }
    try {
      await deleteQuote(id);
      setSelectedQuote(null);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Não foi possível excluir o orçamento.');
    }
  };

  // Generate WhatsApp proposal text
  const handleSendWhatsAppProposal = (quote: Quote) => {
    if (!quote.telefone) {
      alert('Este cliente não cadastrou telefone de contato.');
      return;
    }

    const cleanPhone = quote.telefone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const valorFormatado = editValorOrcamento
      ? `R$ ${parseFloat(editValorOrcamento.replace(',', '.')).toFixed(2).replace('.', ',')}`
      : 'sob consulta';

    let msg = `Olá, *${quote.nome.trim()}*! Tudo bem?\n`;
    msg += `Aqui é o *Anderson* da *Anderson Mudanças e Transporte* 🚚\n\n`;
    msg += `Recebemos sua solicitação de orçamento (Protocolo: *${quote.protocol}*) para a data de *${quote.dataMudanca}*.\n\n`;
    msg += `📍 *Origem:* ${quote.origem}\n`;
    msg += `📍 *Destino:* ${quote.destino}\n`;

    if (quote.precisaDesmontagem) {
      msg += `🛠️ *Desmontagem e montagem inclusa* (${quote.itensDesmontagem?.length || 0} itens)\n`;
    }
    if (quote.precisaEmbalagem) {
      msg += `📦 *Embalagem especial inclusa* (${quote.itensEmbalagem?.length || 0} itens)\n`;
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
    // Search
    const search = searchTerm.toLowerCase();
    const matchSearch =
      !search ||
      q.nome.toLowerCase().includes(search) ||
      q.protocol.toLowerCase().includes(search) ||
      q.origem.toLowerCase().includes(search) ||
      q.destino.toLowerCase().includes(search) ||
      (q.telefone && q.telefone.includes(search));

    // Status
    const matchStatus = statusFilter === 'todos' || q.status === statusFilter;

    // Service
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

  // If user is not authenticated as admin, show login gate
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto border border-sky-100 shadow-inner">
            <Truck className="w-9 h-9" />
          </div>

          <div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full uppercase tracking-wider border border-sky-200">
              Acesso Restrito
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-3">
              Painel de Gestão
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Área administrativa para visualização, contato e gerenciamento de todos os orçamentos recebidos através do site.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 text-left space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Segurança e Privacidade do Cliente
            </div>
            <p>
              Os dados e telefones de clientes só podem ser acessados pelo e-mail do proprietário Anderson (<strong>{ADMIN_EMAIL}</strong>).
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 text-left">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="button"
            disabled={isLoggingIn}
            onClick={handleLogin}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-black text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-5 h-5 text-sky-400" />
            {isLoggingIn ? 'Conectando...' : 'Entrar com Conta Google'}
          </button>

          <p className="text-[11px] text-slate-400">
            © Anderson Mudanças e Transporte • Sistema Integrado com Firestore
          </p>
        </div>
      </div>
    );
  }

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
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Conectado como <strong className="text-slate-800">{currentUser?.email}</strong> • Banco de dados em tempo real
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-200"
            title="Imprimir relatório da tela"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>

          <button
            type="button"
            onClick={logoutAdmin}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-200"
          >
            Sair do Painel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Pedidos</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalPedidos}</div>
          <span className="text-[10px] text-slate-400">Registrados</span>
        </div>

        <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-200 shadow-xs">
          <span className="text-[11px] font-bold text-sky-700 uppercase block flex items-center justify-between">
            Novos
            {countNovos > 0 && <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />}
          </span>
          <div className="text-2xl font-black text-sky-700 mt-1">{countNovos}</div>
          <span className="text-[10px] text-sky-600">Aguardando contato</span>
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
          <span className="text-[10px] text-emerald-600">Agendados</span>
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
              placeholder="Buscar por nome do cliente, protocolo, endereço ou telefone..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
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
            { id: 'fechado', label: 'Fechados' },
            { id: 'concluido', label: 'Concluídos' },
            { id: 'cancelado', label: 'Cancelados' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
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
            <span className="text-sm font-medium">Carregando pedidos de mudança...</span>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Package className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="text-base font-bold text-slate-700">Nenhum pedido encontrado</h4>
            <p className="text-xs text-slate-400">
              {searchTerm || statusFilter !== 'todos' || serviceFilter !== 'todos'
                ? 'Nenhum pedido corresponde aos filtros selecionados.'
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
                        {q.protocol}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                        {statusCfg.label}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {q.dataMudanca} {q.turno ? `(${q.turno})` : ''}
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
                      {hasPhone && (
                        <a
                          href={`https://wa.me/${q.telefone?.replace(/\D/g, '').startsWith('55') ? q.telefone.replace(/\D/g, '') : `55${q.telefone?.replace(/\D/g, '')}`}?text=${encodeURIComponent(`Olá ${q.nome}! Aqui é o Anderson da Anderson Mudanças sobre seu orçamento ${q.protocol}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors border border-emerald-200"
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
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
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
                    {selectedQuote.protocol}
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
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Quick action buttons row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {selectedQuote.telefone && (
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppProposal(selectedQuote)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Enviar Proposta pelo WhatsApp
                </button>
              )}

              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(selectedQuote.origem)}&destination=${encodeURIComponent(selectedQuote.destino)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200"
              >
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                Ver Rota no Google Maps
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Pedido
              </button>
            </div>

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

            {/* Date & Shift */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-600" />
                Data da Mudança: <strong className="text-slate-900">{selectedQuote.dataMudanca}</strong>
              </span>
              <span className="text-slate-600">
                Turno: <strong className="text-slate-900">{selectedQuote.turno || 'A combinar'}</strong>
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
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedQuote.precisaCaixas ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
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
                Gerenciamento do Pedido (Apenas Anderson)
              </h4>

              {saveSuccessMessage && (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {saveSuccessMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Status do Pedido:
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as QuoteStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="novo">Novo Pedido</option>
                    <option value="em_analise">Em Análise</option>
                    <option value="orcamento_enviado">Orçamento Enviado</option>
                    <option value="fechado">Fechado / Agendado</option>
                    <option value="concluido">Mudança Concluída</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
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

              {/* Save & Delete Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveQuoteChanges}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteQuote(selectedQuote.id!)}
                  className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-rose-200 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir Pedido
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
