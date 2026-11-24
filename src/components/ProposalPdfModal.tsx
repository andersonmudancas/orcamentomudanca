import React, { useMemo, useState } from 'react';
import {
  Download,
  MessageCircle,
  X,
  Check,
  MapPin,
  Calendar,
  Package,
  Truck,
  FileText,
  ExternalLink,
  Share2,
} from 'lucide-react';
import {
  ProposalPdfInput,
  buildProposalStructuredData,
  createProposalPdfDocument,
  downloadProposalPdf,
} from '../utils/pdfProposalGenerator';

interface ProposalPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalInput: ProposalPdfInput;
  onStatusSent?: () => void;
}

export const ProposalPdfModal: React.FC<ProposalPdfModalProps> = ({
  isOpen,
  onClose,
  proposalInput,
  onStatusSent,
}) => {
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const data = useMemo(
    () => buildProposalStructuredData(proposalInput),
    [proposalInput]
  );

  if (!isOpen) return null;

  const cleanPhone = (proposalInput.quote.telefone || '').replace(/\D/g, '');
  const fullPhone = cleanPhone
    ? cleanPhone.startsWith('55')
      ? cleanPhone
      : `55${cleanPhone}`
    : '';

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    try {
      const { fileName } = downloadProposalPdf(proposalInput);
      setFeedbackMsg(`Arquivo "${fileName}" baixado com sucesso!`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setFeedbackMsg('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendPdfToClient = async () => {
    setIsGenerating(true);
    setFeedbackMsg(null);
    try {
      const { fileName, blob } = createProposalPdfDocument(proposalInput);
      const pdfFile = new File([blob], fileName, { type: 'application/pdf' });

      // 1. Try native Web Share API with file (works great on Android/iOS to send directly to WhatsApp)
      const canShareFiles =
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [pdfFile] });

      if (canShareFiles) {
        try {
          await navigator.share({
            title: `Orçamento de Mudança - ${data.nomeCliente}`,
            text: `Olá ${data.primeiroNome}! Segue o orçamento detalhado da sua mudança em PDF (Anderson Mudanças e Transporte).`,
            files: [pdfFile],
          });
          setFeedbackMsg('Compartilhamento iniciado com o arquivo PDF anexado!');
          if (onStatusSent) onStatusSent();
          return;
        } catch (shareErr: any) {
          // User canceled native share or browser blocked inside iframe -> fall back to download + WhatsApp
          if (shareErr?.name === 'AbortError') {
            return;
          }
        }
      }

      // 2. Fallback for desktop / iframe: Download PDF + open WhatsApp conversation
      downloadProposalPdf(proposalInput);

      const introText = `Olá, ${data.primeiroNome}! Tudo bem?\n\nSegue em anexo o orçamento detalhado da sua mudança em *PDF* (${data.valorTotalFormatado}) para o dia *${data.dataAgendadaTexto}*.\n\nQualquer dúvida ou para confirmar, fico à disposição!\n*Anderson Mudanças e Transporte*`;

      if (fullPhone) {
        const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(introText)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        setFeedbackMsg(
          `PDF "${fileName}" baixado! Basta anexar o arquivo na conversa do WhatsApp que acabou de abrir.`
        );
      } else {
        setFeedbackMsg(
          `PDF "${fileName}" baixado! Cliente sem telefone cadastrado para abrir o WhatsApp automaticamente.`
        );
      }

      if (onStatusSent) onStatusSent();
    } catch (err) {
      console.error('Erro ao preparar envio do PDF:', err);
      setFeedbackMsg('Erro ao gerar o PDF para envio. Tente clicar em "Baixar PDF".');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Proposta Comercial em PDF
              </h3>
              <p className="text-[11px] text-slate-500 font-mono truncate max-w-[210px] sm:max-w-xs">
                {data.fileName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar PDF
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleSendPdfToClient}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-3.5 h-3.5" />
              Enviar PDF no WhatsApp
              <ExternalLink className="w-3 h-3 opacity-80" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Fechar prévia do PDF"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 text-xs text-emerald-900 font-semibold">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scrollable PDF Document Sheet Preview (Matches User Screenshot) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-200/80">
          <div className="mx-auto max-w-[760px] bg-white shadow-lg border border-slate-200 overflow-hidden text-slate-800">
            {/* 1. Header Blue Gradient Banner */}
            <div className="bg-gradient-to-br from-[#173673] via-[#1e429f] to-[#2253b8] px-6 sm:px-10 py-6 sm:py-7 text-white relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight uppercase">
                    ANDERSON MUDANÇAS
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                    Orçamento de Serviço de Transporte
                  </p>
                  <p className="text-[11px] text-blue-200/90 mt-0.5">
                    CNPJ: 23.823.857/0001-07
                  </p>
                </div>
                <span className="text-[11px] text-blue-100/80 font-mono shrink-0">
                  Orçamento: {data.protocol}
                </span>
              </div>

              <div className="mt-3.5">
                <span className="inline-block px-3.5 py-1 rounded-full bg-white/15 border border-white/25 text-[10px] font-bold tracking-wider uppercase text-white">
                  PROPOSTA COMERCIAL
                </span>
              </div>
            </div>

            {/* Body Container */}
            <div className="p-5 sm:p-8 space-y-5 sm:space-y-6">
              {/* 2. Ice-Blue Greeting Callout */}
              <div className="bg-[#eff6ff] border-l-4 border-[#3b82f6] rounded-r-lg px-4 py-3 text-xs sm:text-sm text-[#1e40af] leading-relaxed">
                Olá, <strong className="font-bold">{data.nomeCliente}</strong>! Conforme as informações enviadas, apresentamos a proposta detalhada para a sua mudança.
              </div>

              {/* 3. Three Summary Cards: ORIGEM | DESTINO | DATA AGENDADA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Origem */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#1e3a8a] uppercase tracking-wide">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    ORIGEM
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {data.origemEndereco}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {data.origemDetalhes}
                  </p>
                </div>

                {/* Destino */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#1e3a8a] uppercase tracking-wide">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    DESTINO
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {data.destinoEndereco}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {data.destinoDetalhes}
                  </p>
                </div>

                {/* Data Disponível */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#1e3a8a] uppercase tracking-wide">
                    <Calendar className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    DATA DISPONÍVEL
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
                    {data.dataAgendadaTexto}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {data.dataSolicitada
                      ? `Data solicitada: ${data.dataSolicitada}`
                      : 'Data solicitada'}
                  </p>
                </div>
              </div>

              {/* 4. Two-Column Details: ITENS A TRANSPORTAR | SERVIÇOS INCLUSOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                {/* Left: Itens a Transportar */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#1e3a8a] uppercase tracking-wide pb-2.5 border-b border-slate-100">
                    <Package className="w-4 h-4 text-amber-600 shrink-0" />
                    ITENS A TRANSPORTAR
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
                    {data.itensLista.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-400 font-bold mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right: Serviços Inclusos */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#1e3a8a] uppercase tracking-wide pb-2.5 border-b border-slate-100">
                    <Truck className="w-4 h-4 text-amber-500 shrink-0" />
                    SERVIÇOS INCLUSOS
                  </div>
                  <ul className="mt-3 space-y-2 text-xs text-slate-700">
                    {data.servicosInclusos.map((srv, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{srv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 5. Value Box */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-300 rounded-xl p-4 sm:p-5 space-y-3">
                {data.detalhamentoValores.length > 0 && (
                  <div className="space-y-1.5 pb-3 border-b border-slate-200">
                    {data.detalhamentoValores.map((row, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="text-slate-600">{row.label}</span>
                        <span className="font-bold text-slate-800 tabular-nums">
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wide block">
                      VALOR TOTAL DO SERVIÇO
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {data.condicaoPagamento}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-2xl font-extrabold text-[#1d4ed8] tabular-nums block">
                      {data.valorTotalFormatado}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Forma de Pagamento: <strong className="text-slate-700">{data.formaPagamento}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. Footer */}
              <div className="pt-4 border-t border-slate-200 text-center space-y-0.5">
                <p className="text-xs sm:text-sm font-bold text-[#1e3a8a]">
                  Anderson Mudanças e Transporte
                </p>
                <p className="text-[11px] text-slate-500">
                  CNPJ: 23.823.857/0001-07 · WhatsApp: (14) 99675-6241
                </p>
                <p className="text-[11px] text-slate-500 italic pt-0.5">
                  Segurança e compromisso do início ao fim! 🚛✨
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Mobile-Friendly Bar */}
        <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-2 text-[11px] text-slate-500 shrink-0">
          <span className="hidden sm:inline">
            No celular, "Enviar PDF no WhatsApp" abre o compartilhamento direto com o arquivo anexado. No computador, baixa o PDF e abre a conversa.
          </span>
          <span className="sm:hidden">
            Toque em Enviar PDF para anexar ao cliente.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
