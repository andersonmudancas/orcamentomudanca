import React, { useState } from 'react';
import {
  User,
  MapPin,
  Home,
  Building,
  Calendar,
  Package,
  Wrench,
  Box,
  Plus,
  Trash2,
  CheckCircle2,
  MessageCircle,
  Clock,
  Sparkles,
  Phone,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { CardboardBoxSvg } from './CardboardBoxSvg';
import { createQuote, generateProtocol } from '../services/quotesService';
import { PropertyType } from '../types/quote';

interface QuoteFormProps {
  onSuccessCreated?: (protocol: string) => void;
}

export const QuoteForm: React.FC<QuoteFormProps> = ({ onSuccessCreated }) => {
  // Form State
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');

  // Origem
  const [origem, setOrigem] = useState('');
  const [tipoOrigem, setTipoOrigem] = useState<PropertyType>('Casa');
  const [tipoCasaOrigem, setTipoCasaOrigem] = useState<'Térrea' | 'Sobrado'>('Térrea');
  const [elevadorOrigem, setElevadorOrigem] = useState<'Sim' | 'Não'>('Sim');
  const [andarOrigem, setAndarOrigem] = useState('');

  // Destino
  const [destino, setDestino] = useState('');
  const [tipoDestino, setTipoDestino] = useState<PropertyType>('Casa');
  const [tipoCasaDestino, setTipoCasaDestino] = useState<'Térrea' | 'Sobrado'>('Térrea');
  const [elevadorDestino, setElevadorDestino] = useState<'Sim' | 'Não'>('Sim');
  const [andarDestino, setAndarDestino] = useState('');

  // Data e Itens
  const [dataMudanca, setDataMudanca] = useState('');
  const [itens, setItens] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Serviços Adicionais
  const [servicoDesmontagem, setServicoDesmontagem] = useState(false);
  const [itensDesmontagem, setItensDesmontagem] = useState<string[]>([]);
  const [novoItemDesmontagem, setNovoItemDesmontagem] = useState('');
  const [isModalDesmontagemOpen, setIsModalDesmontagemOpen] = useState(false);

  const [servicoEmbalagem, setServicoEmbalagem] = useState(false);
  const [itensEmbalagem, setItensEmbalagem] = useState<string[]>([]);
  const [novoItemEmbalagem, setNovoItemEmbalagem] = useState('');
  const [isModalEmbalagemOpen, setIsModalEmbalagemOpen] = useState(false);

  const [precisaCaixas, setPrecisaCaixas] = useState(false);
  const [quantidadeCaixas, setQuantidadeCaixas] = useState(10);
  const PRECO_UNITARIO_CAIXA = 3.0;

  // Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedProtocol, setSubmittedProtocol] = useState<string | null>(null);
  const [generatedWhatsAppUrl, setGeneratedWhatsAppUrl] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add Desmontagem Item
  const handleAddDesmontagem = () => {
    if (!novoItemDesmontagem.trim()) return;
    setItensDesmontagem([...itensDesmontagem, novoItemDesmontagem.trim()]);
    setNovoItemDesmontagem('');
    setIsModalDesmontagemOpen(false);
  };

  const handleRemoveDesmontagem = (index: number) => {
    setItensDesmontagem(itensDesmontagem.filter((_, i) => i !== index));
  };

  // Add Embalagem Item
  const handleAddEmbalagem = () => {
    if (!novoItemEmbalagem.trim()) return;
    setItensEmbalagem([...itensEmbalagem, novoItemEmbalagem.trim()]);
    setNovoItemEmbalagem('');
    setIsModalEmbalagemOpen(false);
  };

  const handleRemoveEmbalagem = (index: number) => {
    setItensEmbalagem(itensEmbalagem.filter((_, i) => i !== index));
  };

  // Build formatted WhatsApp message
  const buildWhatsAppMessage = (protocol: string): string => {
    const origemInfo =
      tipoOrigem === 'Casa'
        ? `Casa (${tipoCasaOrigem})`
        : `Apartamento | Elevador: ${elevadorOrigem} | Andar: ${andarOrigem || 'Não informado'}`;

    const destinoInfo =
      tipoDestino === 'Casa'
        ? `Casa (${tipoCasaDestino})`
        : `Apartamento | Elevador: ${elevadorDestino} | Andar: ${andarDestino || 'Não informado'}`;

    let dataFormatada = dataMudanca;
    if (dataMudanca.includes('-')) {
      const [y, m, d] = dataMudanca.split('-');
      dataFormatada = `${d}/${m}/${y}`;
    }

    let msg = `🚚 *SOLICITAÇÃO DE ORÇAMENTO - ANDERSON MUDANÇAS*\n`;
    msg += `📄 *Protocolo:* ${protocol}\n\n`;
    msg += `👤 *Nome:* ${nome.trim()}\n`;
    if (telefone.trim()) {
      msg += `📱 *Telefone/WhatsApp:* ${telefone.trim()}\n`;
    }
    msg += `\n📍 *ORIGEM:*\n${origem.trim()}\nTipo: ${origemInfo}\n`;
    msg += `\n📍 *DESTINO:*\n${destino.trim()}\nTipo: ${destinoInfo}\n`;
    msg += `\n📅 *Data da Mudança:* ${dataFormatada}\n`;
    msg += `\n📦 *ITENS DA MUDANÇA:*\n${itens.trim()}\n`;

    // Desmontagem
    if (servicoDesmontagem) {
      msg += `\n🛠️ *DESMONTAGEM E MONTAGEM:* SOLICITADO\n`;
      if (itensDesmontagem.length > 0) {
        itensDesmontagem.forEach((item, idx) => {
          msg += `   ${idx + 1}. ${item}\n`;
        });
      } else {
        msg += `   (A informar móveis na conversa)\n`;
      }
      msg += `   📸 _Enviarei fotos dos móveis para montagem/desmontagem logo abaixo._\n`;
    } else {
      msg += `\n🛠️ Desmontagem e Montagem: Não solicitado\n`;
    }

    // Embalagem
    if (servicoEmbalagem) {
      msg += `\n📦 *EMBALAGEM DE MÓVEIS:* SOLICITADO\n`;
      if (itensEmbalagem.length > 0) {
        itensEmbalagem.forEach((item, idx) => {
          msg += `   ${idx + 1}. ${item}\n`;
        });
      } else {
        msg += `   (A informar itens na conversa)\n`;
      }
      msg += `   📸 _Enviarei fotos dos itens a serem embalados logo abaixo._\n`;
    } else {
      msg += `\n📦 Embalagem de Móveis: Não solicitado\n`;
    }

    // Caixas
    if (precisaCaixas) {
      const totalCaixas = Math.max(0, quantidadeCaixas) * PRECO_UNITARIO_CAIXA;
      msg += `\n📦 *CAIXAS DE PAPELÃO SOLICITADAS:*\n`;
      msg += `   Quantidade: ${quantidadeCaixas} caixas (50x30x32 cm)\n`;
      msg += `   Valor: R$ 3,00 cada | Total: R$ ${totalCaixas.toFixed(2).replace('.', ',')}\n`;
    } else {
      msg += `\n📦 Caixas de papelão: Não necessita\n`;
    }

    if (observacoes.trim()) {
      msg += `\n📝 *Observações:* ${observacoes.trim()}\n`;
    }

    msg += `\nAguardo o orçamento. Muito obrigado!`;
    return msg;
  };

  // Submit Handler
  const handleSubmit = async (openWhatsAppImmediately: boolean) => {
    setErrorMessage(null);

    // Validation
    if (!nome.trim()) {
      setErrorMessage('Por favor, informe seu nome.');
      return;
    }
    if (!origem.trim()) {
      setErrorMessage('Por favor, informe o endereço de origem.');
      return;
    }
    if (!destino.trim()) {
      setErrorMessage('Por favor, informe o endereço de destino.');
      return;
    }
    if (!dataMudanca) {
      setErrorMessage('Por favor, informe a data prevista para a mudança.');
      return;
    }
    if (!itens.trim()) {
      setErrorMessage('Por favor, liste os principais itens da mudança.');
      return;
    }
    if (servicoDesmontagem && itensDesmontagem.length === 0) {
      setErrorMessage('Você selecionou desmontagem. Por favor, adicione pelo menos um móvel na lista de desmontagem.');
      return;
    }
    if (servicoEmbalagem && itensEmbalagem.length === 0) {
      setErrorMessage('Você selecionou embalagem. Por favor, adicione pelo menos um item na lista de embalagem.');
      return;
    }

    setIsSubmitting(true);
    const protocol = generateProtocol();

    const origemInfo =
      tipoOrigem === 'Casa'
        ? `Casa (${tipoCasaOrigem})`
        : `Apartamento | Elevador: ${elevadorOrigem} | Andar: ${andarOrigem || 'Térreo'}`;

    const destinoInfo =
      tipoDestino === 'Casa'
        ? `Casa (${tipoCasaDestino})`
        : `Apartamento | Elevador: ${elevadorDestino} | Andar: ${andarDestino || 'Térreo'}`;

    const totalCaixas = precisaCaixas ? Math.max(0, quantidadeCaixas) * PRECO_UNITARIO_CAIXA : 0;

    try {
      // 1. Save in Firestore database
      await createQuote({
        protocol,
        nome: nome.trim(),
        telefone: telefone.trim(),
        origem: origem.trim(),
        tipoOrigem,
        tipoCasaOrigem: tipoOrigem === 'Casa' ? tipoCasaOrigem : undefined,
        elevadorOrigem: tipoOrigem === 'Apartamento' ? elevadorOrigem : undefined,
        andarOrigem: tipoOrigem === 'Apartamento' ? andarOrigem : undefined,
        detalhesOrigem: origemInfo,
        destino: destino.trim(),
        tipoDestino,
        tipoCasaDestino: tipoDestino === 'Casa' ? tipoCasaDestino : undefined,
        elevadorDestino: tipoDestino === 'Apartamento' ? elevadorDestino : undefined,
        andarDestino: tipoDestino === 'Apartamento' ? andarDestino : undefined,
        detalhesDestino: destinoInfo,
        dataMudanca,
        itens: itens.trim(),
        precisaDesmontagem: servicoDesmontagem,
        itensDesmontagem: servicoDesmontagem ? itensDesmontagem : [],
        precisaEmbalagem: servicoEmbalagem,
        itensEmbalagem: servicoEmbalagem ? itensEmbalagem : [],
        precisaCaixas,
        quantidadeCaixas: precisaCaixas ? quantidadeCaixas : 0,
        valorTotalCaixas: totalCaixas,
        observacoes: observacoes.trim(),
      });

      // 2. Prepare WhatsApp link
      const message = buildWhatsAppMessage(protocol);
      const whatsappNumber = '5514996756241';
      const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

      setSubmittedProtocol(protocol);
      setGeneratedWhatsAppUrl(waUrl);

      if (onSuccessCreated) {
        onSuccessCreated(protocol);
      }

      // 3. Open WhatsApp if requested
      if (openWhatsAppImmediately) {
        window.open(waUrl, '_blank');
      }
    } catch (err: any) {
      console.error('Erro ao salvar orçamento:', err);
      setErrorMessage(
        'Não foi possível salvar o orçamento no momento. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!submittedProtocol) return;
    const msg = buildWhatsAppMessage(submittedProtocol);
    navigator.clipboard.writeText(msg);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 3000);
  };

  const resetForm = () => {
    setSubmittedProtocol(null);
    setGeneratedWhatsAppUrl(null);
    setNome('');
    setTelefone('');
    setOrigem('');
    setDestino('');
    setDataMudanca('');
    setItens('');
    setObservacoes('');
    setServicoDesmontagem(false);
    setItensDesmontagem([]);
    setServicoEmbalagem(false);
    setItensEmbalagem([]);
    setPrecisaCaixas(false);
  };

  const totalCalculadoCaixas = precisaCaixas
    ? (Math.max(0, quantidadeCaixas) * PRECO_UNITARIO_CAIXA).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })
    : 'R$ 0,00';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Top Banner Introduction */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl hidden sm:block">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Solicitar Orçamento de Mudança
            </h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Preencha os dados abaixo com os detalhes da sua mudança. Seus dados são salvos com segurança em nosso sistema e enviados diretamente para nosso WhatsApp para um orçamento rápido e transparente!
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8 space-y-6">
        
        {/* Error notification */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Atenção</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Section: Dados de Contato */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-sky-600" />
            1. Seus Dados de Contato
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Seu Nome Completo *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Carlos Eduardo Silva"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Seu WhatsApp / Telefone *
              </label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(14) 99999-9999"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        {/* Section: Origem */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <MapPin className="w-4 h-4 text-sky-600" />
            2. Local de Origem (Onde vamos retirar)
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Endereço, Bairro, Cidade ou Condomínio *
            </label>
            <input
              type="text"
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
              placeholder="Ex: Rua das Flores, 120 - Jardim América, Bauru"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-slate-50/50"
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase block">
              Tipo de imóvel na Origem:
            </span>

            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="tipoOrigem"
                  value="Casa"
                  checked={tipoOrigem === 'Casa'}
                  onChange={() => setTipoOrigem('Casa')}
                  className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                />
                <Home className="w-4 h-4 text-slate-600" />
                Casa
              </label>

              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="tipoOrigem"
                  value="Apartamento"
                  checked={tipoOrigem === 'Apartamento'}
                  onChange={() => setTipoOrigem('Apartamento')}
                  className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                />
                <Building className="w-4 h-4 text-slate-600" />
                Apartamento
              </label>
            </div>

            {tipoOrigem === 'Casa' ? (
              <div className="pt-2 border-t border-slate-200/80 flex gap-4 text-sm">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoCasaOrigem"
                    value="Térrea"
                    checked={tipoCasaOrigem === 'Térrea'}
                    onChange={() => setTipoCasaOrigem('Térrea')}
                    className="w-4 h-4 text-sky-600"
                  />
                  Casa Térrea
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoCasaOrigem"
                    value="Sobrado"
                    checked={tipoCasaOrigem === 'Sobrado'}
                    onChange={() => setTipoCasaOrigem('Sobrado')}
                    className="w-4 h-4 text-sky-600"
                  />
                  Sobrado (possui escadas)
                </label>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-slate-600">Elevador:</span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="elevadorOrigem"
                      value="Sim"
                      checked={elevadorOrigem === 'Sim'}
                      onChange={() => setElevadorOrigem('Sim')}
                      className="w-4 h-4 text-sky-600"
                    />
                    Sim
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="elevadorOrigem"
                      value="Não"
                      checked={elevadorOrigem === 'Não'}
                      onChange={() => setElevadorOrigem('Não')}
                      className="w-4 h-4 text-sky-600"
                    />
                    Sem elevador
                  </label>
                </div>
                <div>
                  <input
                    type="text"
                    value={andarOrigem}
                    onChange={(e) => setAndarOrigem(e.target.value)}
                    placeholder="Qual o andar? Ex: 3º andar"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section: Destino */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            3. Local de Destino (Onde vamos entregar)
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Endereço, Bairro, Cidade ou Condomínio *
            </label>
            <input
              type="text"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder="Ex: Av. Nações Unidas, 1500 - Centro, Bauru"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-slate-50/50"
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase block">
              Tipo de imóvel no Destino:
            </span>

            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="tipoDestino"
                  value="Casa"
                  checked={tipoDestino === 'Casa'}
                  onChange={() => setTipoDestino('Casa')}
                  className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                />
                <Home className="w-4 h-4 text-slate-600" />
                Casa
              </label>

              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="tipoDestino"
                  value="Apartamento"
                  checked={tipoDestino === 'Apartamento'}
                  onChange={() => setTipoDestino('Apartamento')}
                  className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                />
                <Building className="w-4 h-4 text-slate-600" />
                Apartamento
              </label>
            </div>

            {tipoDestino === 'Casa' ? (
              <div className="pt-2 border-t border-slate-200/80 flex gap-4 text-sm">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoCasaDestino"
                    value="Térrea"
                    checked={tipoCasaDestino === 'Térrea'}
                    onChange={() => setTipoCasaDestino('Térrea')}
                    className="w-4 h-4 text-sky-600"
                  />
                  Casa Térrea
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoCasaDestino"
                    value="Sobrado"
                    checked={tipoCasaDestino === 'Sobrado'}
                    onChange={() => setTipoCasaDestino('Sobrado')}
                    className="w-4 h-4 text-sky-600"
                  />
                  Sobrado (possui escadas)
                </label>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-slate-600">Elevador:</span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="elevadorDestino"
                      value="Sim"
                      checked={elevadorDestino === 'Sim'}
                      onChange={() => setElevadorDestino('Sim')}
                      className="w-4 h-4 text-sky-600"
                    />
                    Sim
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="elevadorDestino"
                      value="Não"
                      checked={elevadorDestino === 'Não'}
                      onChange={() => setElevadorDestino('Não')}
                      className="w-4 h-4 text-sky-600"
                    />
                    Sem elevador
                  </label>
                </div>
                <div>
                  <input
                    type="text"
                    value={andarDestino}
                    onChange={(e) => setAndarDestino(e.target.value)}
                    placeholder="Qual o andar? Ex: 5º andar"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section: Data da Mudança */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Calendar className="w-4 h-4 text-sky-600" />
            4. Data Prevista da Mudança
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Data *
            </label>
            <input
              type="date"
              value={dataMudanca}
              onChange={(e) => setDataMudanca(e.target.value)}
              className="w-full sm:w-72 px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Section: Itens da Mudança */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-600" />
              5. Itens e Móveis da Mudança *
            </h3>
            <span className="text-xs text-slate-500">Móveis, eletros, caixas</span>
          </div>

          <div>
            <textarea
              rows={4}
              value={itens}
              onChange={(e) => setItens(e.target.value)}
              placeholder="Descreva os itens da sua mudança. Ex: 1 geladeira duplex, 1 fogão 4 bocas, 1 cama box casal com colchão, sofá 3 lugares, máquina de lavar 12kg, mesa com 4 cadeiras, cerca de 15 caixas..."
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Section: Serviços Adicionais */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-sky-600" />
            Serviços Adicionais Opcionais
          </h3>

          {/* 1. Desmontagem e Montagem */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 transition-all hover:border-slate-300">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={servicoDesmontagem}
                onChange={(e) => {
                  setServicoDesmontagem(e.target.checked);
                  if (e.target.checked && itensDesmontagem.length === 0) {
                    setIsModalDesmontagemOpen(true);
                  }
                }}
                className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500 accent-sky-600"
              />
              <span className="font-bold text-slate-900 text-sm sm:text-base">
                🛠️ Preciso de Desmontagem e Montagem de Móveis
              </span>
            </label>

            {servicoDesmontagem && (
              <div className="mt-4 pt-4 border-t border-slate-200 bg-white p-4 rounded-xl border space-y-3">
                <p className="text-xs text-slate-600 font-medium">
                  Liste os móveis que precisam ser desmontados e montados pela nossa equipe:
                </p>

                <button
                  type="button"
                  onClick={() => setIsModalDesmontagemOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Móvel para Desmontagem
                </button>

                {/* List of disassembly items */}
                {itensDesmontagem.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {itensDesmontagem.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      >
                        <span className="font-medium text-slate-800 flex items-center gap-2">
                          🪑 {item}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDesmontagem(index)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-semibold px-2 py-1 rounded hover:bg-rose-50 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 font-medium italic">
                    Nenhum móvel cadastrado ainda. Clique acima para adicionar.
                  </p>
                )}

                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-sky-900 leading-relaxed flex items-start gap-2.5">
                  <span className="text-lg">📸</span>
                  <div>
                    <strong>Dica importante para o orçamento:</strong> Envie fotos dos móveis a serem desmontados diretamente pelo WhatsApp logo após enviar este formulário. Isso agiliza o cálculo preciso do valor!
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Embalagem de Móveis */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 transition-all hover:border-slate-300">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={servicoEmbalagem}
                onChange={(e) => {
                  setServicoEmbalagem(e.target.checked);
                  if (e.target.checked && itensEmbalagem.length === 0) {
                    setIsModalEmbalagemOpen(true);
                  }
                }}
                className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500 accent-sky-600"
              />
              <span className="font-bold text-slate-900 text-sm sm:text-base">
                📦 Preciso de Embalagem Especial de Móveis / Frágeis
              </span>
            </label>

            {servicoEmbalagem && (
              <div className="mt-4 pt-4 border-t border-slate-200 bg-white p-4 rounded-xl border space-y-3">
                <p className="text-xs text-slate-600 font-medium">
                  Informe os móveis ou itens sensíveis que necessitam de plástico bolha, papelão ondulado ou mantas:
                </p>

                <button
                  type="button"
                  onClick={() => setIsModalEmbalagemOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Item para Embalagem
                </button>

                {/* List of packaging items */}
                {itensEmbalagem.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {itensEmbalagem.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      >
                        <span className="font-medium text-slate-800 flex items-center gap-2">
                          📦 {item}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmbalagem(index)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-semibold px-2 py-1 rounded hover:bg-rose-50 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 font-medium italic">
                    Nenhum item cadastrado ainda. Clique acima para adicionar.
                  </p>
                )}

                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-sky-900 leading-relaxed flex items-start gap-2.5">
                  <span className="text-lg">📸</span>
                  <div>
                    <strong>Fotos pelo WhatsApp:</strong> Você também poderá enviar fotos dos itens delicados na conversa do WhatsApp para orientar nossa equipe.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Caixas de Papelão */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 transition-all hover:border-slate-300">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={precisaCaixas}
                onChange={(e) => setPrecisaCaixas(e.target.checked)}
                className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500 accent-sky-600"
              />
              <span className="font-bold text-slate-900 text-sm sm:text-base">
                📦 Preciso de Caixas de Papelão para Embalar
              </span>
            </label>

            {precisaCaixas && (
              <div className="mt-4 pt-4 border-t border-slate-200 bg-white p-4 rounded-xl border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs text-slate-500 block uppercase font-bold">
                      Valor Unitário da Caixa:
                    </span>
                    <span className="text-lg font-black text-sky-700">
                      R$ 3,00 por unidade
                    </span>
                  </div>
                  <span className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                    Alta Resistência para Mudanças
                  </span>
                </div>

                {/* Cardboard Box SVG illustration */}
                <CardboardBoxSvg />

                {/* Stepper Quantity */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    Quantidade de Caixas Desejada:
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantidadeCaixas(Math.max(1, quantidadeCaixas - 5))}
                      className="w-10 h-10 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-bold text-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantidadeCaixas(Math.max(1, quantidadeCaixas - 1))}
                      className="w-10 h-10 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-bold text-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                    >
                      -1
                    </button>

                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={quantidadeCaixas}
                      onChange={(e) => setQuantidadeCaixas(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 text-center font-bold text-lg py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-slate-50"
                    />

                    <button
                      type="button"
                      onClick={() => setQuantidadeCaixas(quantidadeCaixas + 1)}
                      className="w-10 h-10 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-bold text-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantidadeCaixas(quantidadeCaixas + 5)}
                      className="w-10 h-10 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-bold text-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                    >
                      +5
                    </button>
                  </div>
                </div>

                {/* Subtotal caixas */}
                <div className="bg-sky-50/70 p-3.5 rounded-xl border border-sky-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Subtotal das Caixas ({quantidadeCaixas} un):
                  </span>
                  <span className="text-lg font-black text-sky-700">
                    {totalCalculadoCaixas}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section: Observações adicionais */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Observações ou Instruções Especiais (Opcional)
          </label>
          <textarea
            rows={2}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: Condomínio permite mudança somente das 08h às 17h, vaga para caminhão próxima da portaria..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(true)}
            className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base sm:text-lg rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
          >
            <MessageCircle className="w-6 h-6 shrink-0" />
            {isSubmitting ? 'Salvando e preparando...' : '📲 Enviar pelo WhatsApp'}
          </button>

          <p className="text-center text-[11px] text-slate-500">
            🔒 Seus dados serão salvos com segurança em nosso sistema e enviados diretamente para nosso WhatsApp.
          </p>
        </div>

      </div>

      {/* MODAL: Adicionar Item Desmontagem */}
      {isModalDesmontagemOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-sky-700 flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Móvel para Desmontagem
              </h3>
              <button
                type="button"
                onClick={() => setIsModalDesmontagemOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nome do móvel ou item *
              </label>
              <input
                type="text"
                value={novoItemDesmontagem}
                onChange={(e) => setNovoItemDesmontagem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddDesmontagem();
                }}
                autoFocus
                placeholder="Ex: Guarda-roupa 6 portas, Cama box casal, Painel de TV..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-900 flex items-start gap-2">
              <span>📸</span>
              <span>
                Após salvar seus móveis, envie fotos deles pelo WhatsApp para podermos avaliar com precisão ferragens e complexidade.
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddDesmontagem}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
              >
                Salvar Item
              </button>
              <button
                type="button"
                onClick={() => setIsModalDesmontagemOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Adicionar Item Embalagem */}
      {isModalEmbalagemOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-sky-700 flex items-center gap-2">
                <Box className="w-5 h-5" />
                Item para Embalagem
              </h3>
              <button
                type="button"
                onClick={() => setIsModalEmbalagemOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nome do móvel ou item a ser embalado *
              </label>
              <input
                type="text"
                value={novoItemEmbalagem}
                onChange={(e) => setNovoItemEmbalagem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddEmbalagem();
                }}
                autoFocus
                placeholder="Ex: Louças, Espelho grande, TV 65, Tampo de vidro..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-900 flex items-start gap-2">
              <span>📸</span>
              <span>
                Você poderá nos enviar fotos dos itens delicados na conversa do WhatsApp.
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddEmbalagem}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
              >
                Salvar Item
              </button>
              <button
                type="button"
                onClick={() => setIsModalEmbalagemOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL */}
      {submittedProtocol && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 border border-emerald-100 text-center">
            
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Orçamento Salvo com Sucesso!
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                Pedido Registrado!
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Seu orçamento foi cadastrado no banco de dados da Anderson Mudanças com o protocolo:
              </p>
              <div className="bg-slate-100 border border-slate-300 font-mono text-base sm:text-lg font-bold text-sky-700 py-2 px-4 rounded-xl mt-2 inline-block">
                {submittedProtocol}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-1.5 text-slate-700">
              <div><strong>Cliente:</strong> {nome}</div>
              <div><strong>Origem:</strong> {origem} ({tipoOrigem})</div>
              <div><strong>Destino:</strong> {destino} ({tipoDestino})</div>
              <div><strong>Data:</strong> {dataMudanca}</div>
              {precisaCaixas && (
                <div><strong>Caixas:</strong> {quantidadeCaixas} unidades ({totalCalculadoCaixas})</div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              {generatedWhatsAppUrl && (
                <a
                  href={generatedWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Abrir Conversa no WhatsApp
                  <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
                </a>
              )}

              <button
                type="button"
                onClick={copyToClipboard}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {copiedMessage ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    Mensagem Copiada!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar Texto do Orçamento
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-800 underline block mx-auto pt-1 cursor-pointer"
              >
                Criar nova solicitação de orçamento
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
