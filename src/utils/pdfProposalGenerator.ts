import { jsPDF } from 'jspdf';
import { Quote } from '../types/quote';
import { formatDateBR } from './dateUtils';

export interface ProposalPdfInput {
  quote: Quote;
  dataMudancaTarget?: string;
  dataDisponivelTarget?: string;
  horarioDisponivelTarget?: string;
  valorTotalTarget?: string;
  valorTransporteTarget?: string;
  valorDesmontagemTarget?: string;
  valorEmbalagemTarget?: string;
  formaPagamentoTarget?: string;
  condicaoTarget?: string;
}

export interface ProposalBreakdownItem {
  label: string;
  value: string;
}

export interface ProposalPdfData {
  protocol: string;
  nomeCliente: string;
  primeiroNome: string;
  origemEndereco: string;
  origemDetalhes: string;
  destinoEndereco: string;
  destinoDetalhes: string;
  dataSolicitada: string;
  dataDisponivel: string;
  horarioDisponivel: string;
  dataAgendadaTexto: string;
  dataDiferenteDaSolicitada: boolean;
  itensLista: string[];
  servicosInclusos: string[];
  hasExtraServices: boolean;
  detalhamentoValores: ProposalBreakdownItem[];
  valorTotalFormatado: string;
  formaPagamento: string;
  condicaoPagamento: string;
  fileName: string;
}

function parseCurrencyVal(val: number | string | undefined | null): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const clean = String(val).replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

function formatBRL(num: number): string {
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}

function formatPropertyDetails(
  tipo: 'Casa' | 'Apartamento',
  tipoCasa?: string,
  andar?: string,
  elevador?: string,
  detalhes?: string
): string {
  let desc = '';
  if (tipo === 'Casa') {
    const sub = tipoCasa ? tipoCasa : 'Térrea';
    desc = `Casa (${sub})`;
  } else {
    const elev =
      elevador === 'Sim' ? 'com elevador' : elevador === 'Não' ? 'sem elevador' : '';
    const andarStr = andar ? `${andar} andar` : '';
    if (andarStr && elev) {
      desc = `Apartamento (${andarStr}, ${elev})`;
    } else if (andarStr) {
      desc = `Apartamento (${andarStr})`;
    } else if (elev) {
      desc = `Apartamento (${elev})`;
    } else {
      desc = 'Apartamento';
    }
  }
  if (detalhes && !desc.toLowerCase().includes(detalhes.toLowerCase())) {
    desc += ` · ${detalhes.trim()}`;
  }
  return desc;
}

export function buildProposalStructuredData({
  quote,
  dataMudancaTarget,
  dataDisponivelTarget,
  horarioDisponivelTarget,
  valorTotalTarget,
  valorTransporteTarget,
  valorDesmontagemTarget,
  valorEmbalagemTarget,
  formaPagamentoTarget,
  condicaoTarget,
}: ProposalPdfInput): ProposalPdfData {
  const nomeCliente = quote.nome.trim() || 'Cliente';
  const primeiroNome = nomeCliente.split(' ')[0] || nomeCliente;

  const origemEndereco = quote.origem.trim();
  const origemDetalhes = formatPropertyDetails(
    quote.tipoOrigem,
    quote.tipoCasaOrigem,
    quote.andarOrigem,
    quote.elevadorOrigem,
    quote.detalhesOrigem
  );

  const destinoEndereco = quote.destino.trim();
  const destinoDetalhes = formatPropertyDetails(
    quote.tipoDestino,
    quote.tipoCasaDestino,
    quote.andarDestino,
    quote.elevadorDestino,
    quote.detalhesDestino
  );

  const rawDataMudanca = (dataMudancaTarget ?? quote.dataMudanca ?? '').trim();
  const rawDataDisponivel = (
    dataDisponivelTarget ??
    quote.dataDisponivel ??
    rawDataMudanca
  ).trim();
  const horarioDisponivel = (
    horarioDisponivelTarget ??
    quote.horarioDisponivel ??
    ''
  ).trim();

  const dataSolicitada = formatDateBR(rawDataMudanca);
  const dataDisponivel = formatDateBR(rawDataDisponivel || rawDataMudanca);
  const dataAgendadaTexto = horarioDisponivel
    ? `${dataDisponivel} às ${horarioDisponivel}`
    : dataDisponivel;
  const dataDiferenteDaSolicitada = Boolean(
    dataSolicitada && dataDisponivel && dataSolicitada !== dataDisponivel
  );

  // Parse items list, excluding box supply lines when client requested boxes
  const itensLista: string[] = [];
  if (quote.itens && quote.itens.trim()) {
    let rawLines = quote.itens
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (quote.precisaCaixas) {
      rawLines = rawLines.filter((line) => {
        const clean = line.replace(/^[\*\-•\d\.\)\s]+/, '').trim().toLowerCase();
        return !/^(caixas\s+com\s+pertences|caixas\s+de\s+papel[aã]o|caixas\s+para\s+embalar)$/i.test(
          clean
        );
      });
    }

    if (rawLines.length > 1) {
      rawLines.forEach((line) => {
        const clean = line.replace(/^[\*\-•\d\.\)\s]+/, '').trim();
        if (clean) itensLista.push(clean);
      });
    } else if (rawLines.length === 1) {
      const parts = rawLines[0]
        .split(/[,;]/)
        .map((p) => p.replace(/^[\*\-•\s]+/, '').trim())
        .filter(Boolean);
      const filteredParts = quote.precisaCaixas
        ? parts.filter(
            (p) =>
              !/^(caixas\s+com\s+pertences|caixas\s+de\s+papel[aã]o|caixas\s+para\s+embalar)$/i.test(
                p.toLowerCase()
              )
          )
        : parts;
      itensLista.push(...filteredParts);
    }
  }

  if (itensLista.length === 0) {
    itensLista.push('Pertences e móveis gerais da mudança');
  }

  // Services
  const servicosInclusos: string[] = [
    'Transporte rodoviário seguro',
    'Carga e descarga no local',
    'Proteção básica de todos os itens',
  ];
  if (quote.precisaDesmontagem) {
    const qtd = quote.itensDesmontagem?.length
      ? ` (${quote.itensDesmontagem.length} itens)`
      : '';
    servicosInclusos.push(`Desmontagem e montagem${qtd}`);
  }
  if (quote.precisaEmbalagem) {
    const qtd = quote.itensEmbalagem?.length
      ? ` (${quote.itensEmbalagem.length} itens)`
      : '';
    servicosInclusos.push(`Serviço de embalagem${qtd}`);
  }
  if (quote.precisaCaixas && quote.quantidadeCaixas) {
    servicosInclusos.push(`Fornecimento de ${quote.quantidadeCaixas} caixas de papelão`);
  }

  // Values
  const numTransporte = parseCurrencyVal(valorTransporteTarget ?? quote.valorTransporte);
  const numDesmontagem = quote.precisaDesmontagem
    ? parseCurrencyVal(valorDesmontagemTarget ?? quote.valorDesmontagem)
    : 0;
  const numEmbalagem = quote.precisaEmbalagem
    ? parseCurrencyVal(valorEmbalagemTarget ?? quote.valorEmbalagem)
    : 0;
  const qtdCaixas = quote.precisaCaixas ? quote.quantidadeCaixas || 0 : 0;
  const numCaixas = qtdCaixas > 0 ? qtdCaixas * 3 : 0;

  let totalCalculado = parseCurrencyVal(valorTotalTarget ?? quote.valorOrcamento);
  if (
    !totalCalculado &&
    (numTransporte > 0 || numDesmontagem > 0 || numEmbalagem > 0 || numCaixas > 0)
  ) {
    totalCalculado = numTransporte + numDesmontagem + numEmbalagem + numCaixas;
  }

  const valorTotalFormatado =
    totalCalculado > 0
      ? formatBRL(totalCalculado)
      : valorTotalTarget && valorTotalTarget.trim()
      ? valorTotalTarget.includes('R$')
        ? valorTotalTarget.trim()
        : `R$ ${valorTotalTarget.trim()}`
      : 'R$ 600,00';

  const hasExtraServices = Boolean(
    quote.precisaDesmontagem || quote.precisaEmbalagem || qtdCaixas > 0
  );

  const detalhamentoValores: ProposalBreakdownItem[] = [];
  if (hasExtraServices) {
    const transporteEfetivo =
      numTransporte > 0
        ? numTransporte
        : totalCalculado > numDesmontagem + numEmbalagem + numCaixas
        ? totalCalculado - numDesmontagem - numEmbalagem - numCaixas
        : 0;

    detalhamentoValores.push({
      label: 'Transporte e carregamento',
      value: transporteEfetivo > 0 ? formatBRL(transporteEfetivo) : 'Incluso',
    });

    if (quote.precisaDesmontagem) {
      detalhamentoValores.push({
        label: 'Desmontagem e montagem de móveis',
        value: numDesmontagem > 0 ? formatBRL(numDesmontagem) : 'A combinar',
      });
    }

    if (quote.precisaEmbalagem) {
      detalhamentoValores.push({
        label: 'Serviço de embalagem dos móveis',
        value: numEmbalagem > 0 ? formatBRL(numEmbalagem) : 'A combinar',
      });
    }

    if (qtdCaixas > 0) {
      detalhamentoValores.push({
        label: `Caixas de papelão (${qtdCaixas} un x R$ 3,00)`,
        value: formatBRL(numCaixas),
      });
    }
  }

  const rawForma = (formaPagamentoTarget ?? quote.formaPagamento ?? 'Pix')
    .trim()
    .replace(/\.$/, '');
  const formaPagamento = rawForma || 'Pix';
  const condicaoPagamento =
    (condicaoTarget ?? 'Pagamento no término da mudança.').trim() ||
    'Pagamento no término da mudança.';

  const safeClientSlug = nomeCliente
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);

  const fileName = `Orcamento_Mudanca_${safeClientSlug || quote.protocol}.pdf`;

  return {
    protocol: quote.protocol,
    nomeCliente,
    primeiroNome,
    origemEndereco,
    origemDetalhes,
    destinoEndereco,
    destinoDetalhes,
    dataSolicitada,
    dataDisponivel,
    horarioDisponivel,
    dataAgendadaTexto,
    dataDiferenteDaSolicitada,
    itensLista,
    servicosInclusos,
    hasExtraServices,
    detalhamentoValores,
    valorTotalFormatado,
    formaPagamento,
    condicaoPagamento,
    fileName,
  };
}

/**
 * Generates crisp offscreen Canvas2D data URLs for icons and the header gradient banner
 * so the PDF never suffers from missing emoji fonts across platforms.
 */
function createCanvasImage(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): string | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  draw(ctx, width, height);
  return canvas.toDataURL('image/png');
}

function createHeaderGradientBanner(): string | null {
  return createCanvasImage(900, 180, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#173673');
    grad.addColorStop(0.55, '#1e429f');
    grad.addColorStop(1, '#2253b8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle geometric accent highlights matching the screenshot's soft sheen
    const sheen = ctx.createRadialGradient(w * 0.85, h * 0.15, 10, w * 0.85, h * 0.15, 280);
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, w, h);
  });
}

function createPinIcon(): string | null {
  return createCanvasImage(48, 48, (ctx) => {
    // Pin head
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(24, 17, 10, 0, Math.PI * 2);
    ctx.fill();
    // Highlight inside pin head
    ctx.fillStyle = '#fda4af';
    ctx.beginPath();
    ctx.arc(21, 14, 3, 0, Math.PI * 2);
    ctx.fill();
    // Pin needle
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(24, 27);
    ctx.lineTo(24, 43);
    ctx.stroke();
  });
}

function createCalendarIcon(): string | null {
  return createCanvasImage(48, 48, (ctx) => {
    // Calendar body
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(7, 10, 34, 31, 5);
    ctx.fill();
    ctx.stroke();

    // Red top header bar
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(7, 10, 34, 10, [5, 5, 0, 0]);
    ctx.fill();

    // Rings
    ctx.fillStyle = '#475569';
    ctx.fillRect(14, 6, 4, 7);
    ctx.fillRect(30, 6, 4, 7);

    // Date text "17" style grid dots
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('17', 24, 31);
  });
}

function createBoxIcon(): string | null {
  return createCanvasImage(48, 48, (ctx) => {
    // Cardboard box body
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(8, 17);
    ctx.lineTo(24, 9);
    ctx.lineTo(40, 17);
    ctx.lineTo(40, 34);
    ctx.lineTo(24, 42);
    ctx.lineTo(8, 34);
    ctx.closePath();
    ctx.fill();

    // Top lighter face
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(8, 17);
    ctx.lineTo(24, 9);
    ctx.lineTo(40, 17);
    ctx.lineTo(24, 25);
    ctx.closePath();
    ctx.fill();

    // Right darker face
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(24, 25);
    ctx.lineTo(40, 17);
    ctx.lineTo(40, 34);
    ctx.lineTo(24, 42);
    ctx.closePath();
    ctx.fill();

    // Tape strip
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(16, 13);
    ctx.lineTo(32, 21);
    ctx.stroke();
  });
}

function createTruckIcon(): string | null {
  return createCanvasImage(48, 48, (ctx) => {
    // Cargo box
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(5, 13, 24, 19, 2);
    ctx.fill();

    // Cab
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(29, 17);
    ctx.lineTo(38, 17);
    ctx.lineTo(43, 24);
    ctx.lineTo(43, 32);
    ctx.lineTo(29, 32);
    ctx.closePath();
    ctx.fill();

    // Windshield
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.moveTo(31, 19);
    ctx.lineTo(37, 19);
    ctx.lineTo(40.5, 24);
    ctx.lineTo(31, 24);
    ctx.closePath();
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(14, 34, 4.5, 0, Math.PI * 2);
    ctx.arc(36, 34, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(14, 34, 1.8, 0, Math.PI * 2);
    ctx.arc(36, 34, 1.8, 0, Math.PI * 2);
    ctx.fill();
  });
}

function createCheckIcon(): string | null {
  return createCanvasImage(36, 36, (ctx) => {
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(7, 19);
    ctx.lineTo(15, 27);
    ctx.lineTo(29, 10);
    ctx.stroke();
  });
}

export function createProposalPdfDocument(input: ProposalPdfInput): {
  doc: jsPDF;
  fileName: string;
  blob: Blob;
  data: ProposalPdfData;
} {
  const data = buildProposalStructuredData(input);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  // Generate crisp raster icons & banner background
  const bannerImg = createHeaderGradientBanner();
  const pinImg = createPinIcon();
  const calImg = createCalendarIcon();
  const boxImg = createBoxIcon();
  const truckImg = createTruckIcon();
  const checkImg = createCheckIcon();

  // --- 1. TOP BLUE GRADIENT BANNER ---
  const bannerH = 44;
  if (bannerImg) {
    doc.addImage(bannerImg, 'PNG', 0, 0, pageWidth, bannerH);
  } else {
    doc.setFillColor(29, 78, 216);
    doc.rect(0, 0, pageWidth, bannerH, 'F');
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('ANDERSON MUDANÇAS', marginX, 15.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(226, 232, 240);
  doc.text('Orçamento de Serviço de Transporte', marginX, 21.5);

  doc.setFontSize(8.5);
  doc.setTextColor(191, 219, 254);
  doc.text('CNPJ: 23.823.857/0001-07', marginX, 26.5);

  // Badge: PROPOSTA COMERCIAL
  doc.setFillColor(37, 99, 235);
  doc.setDrawColor(147, 197, 253);
  doc.setLineWidth(0.35);
  doc.roundedRect(marginX, 31.5, 48, 6.8, 3.4, 3.4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PROPOSTA COMERCIAL', marginX + 24, 36, { align: 'center' });

  // Subtle protocol on top right of banner
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(219, 234, 254);
  doc.text(`Orçamento: ${data.protocol}`, pageWidth - marginX, 14, { align: 'right' });

  let cursorY = bannerH + 8;

  // --- 2. GREETING CALLOUT BOX ---
  const greetPrefix = 'Olá, ';
  const greetName = `${data.nomeCliente}!`;
  const greetSuffix =
    ' Conforme as informações enviadas, apresentamos a proposta detalhada para a sua mudança.';
  const greetFull = `${greetPrefix}${greetName}${greetSuffix}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const greetLines = doc.splitTextToSize(greetFull, contentWidth - 12);
  const greetBoxH = Math.max(14, greetLines.length * 4.8 + 6.5);

  doc.setFillColor(239, 246, 255); // #eff6ff
  doc.roundedRect(marginX, cursorY, contentWidth, greetBoxH, 1.5, 1.5, 'F');
  // Left blue accent bar matching the screenshot
  doc.setFillColor(59, 130, 246); // #3b82f6
  doc.rect(marginX, cursorY, 1.4, greetBoxH, 'F');

  // Render greeting with bold client name on first line
  const textX = marginX + 5.5;
  const textY = cursorY + 6.2;
  doc.setTextColor(30, 64, 175); // #1e40af
  if (greetLines.length > 0) {
    // Draw line 1 with bold name if it starts cleanly
    const firstLine = greetLines[0] as string;
    const idxName = firstLine.indexOf(greetName);
    if (idxName !== -1) {
      const before = firstLine.slice(0, idxName);
      const after = firstLine.slice(idxName + greetName.length);
      doc.setFont('helvetica', 'normal');
      doc.text(before, textX, textY);
      const wBefore = doc.getTextWidth(before);
      doc.setFont('helvetica', 'bold');
      doc.text(greetName, textX + wBefore, textY);
      const wName = doc.getTextWidth(greetName);
      doc.setFont('helvetica', 'normal');
      doc.text(after, textX + wBefore + wName, textY);
    } else {
      doc.text(firstLine, textX, textY);
    }
    for (let i = 1; i < greetLines.length; i++) {
      doc.setFont('helvetica', 'normal');
      doc.text(greetLines[i], textX, textY + i * 4.8);
    }
  }

  cursorY += greetBoxH + 7.5;

  // --- 3. THREE SUMMARY CARDS (ORIGEM | DESTINO | DATA AGENDADA) ---
  const cardGap = 4.5;
  const cardW = (contentWidth - cardGap * 2) / 3; // ~57.6mm
  const cardInnerW = cardW - 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  const origAddrLines = doc.splitTextToSize(data.origemEndereco, cardInnerW);
  const destAddrLines = doc.splitTextToSize(data.destinoEndereco, cardInnerW);
  const dateMainLines = doc.splitTextToSize(data.dataAgendadaTexto, cardInnerW);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  const origDetLines = doc.splitTextToSize(data.origemDetalhes, cardInnerW);
  const destDetLines = doc.splitTextToSize(data.destinoDetalhes, cardInnerW);
  const dateSubText = data.dataSolicitada
    ? `Data solicitada: ${data.dataSolicitada}`
    : 'Data solicitada';
  const dateSubLines = doc.splitTextToSize(dateSubText, cardInnerW);

  const calcSummaryH = (mainLen: number, subLen: number) =>
    14 + mainLen * 4.2 + 1.5 + subLen * 3.8 + 4;

  const summaryCardH = Math.max(
    30,
    calcSummaryH(origAddrLines.length, origDetLines.length),
    calcSummaryH(destAddrLines.length, destDetLines.length),
    calcSummaryH(dateMainLines.length, dateSubLines.length)
  );

  const summaryCards = [
    {
      x: marginX,
      icon: pinImg,
      title: 'ORIGEM',
      mainLines: origAddrLines,
      subLines: origDetLines,
    },
    {
      x: marginX + cardW + cardGap,
      icon: pinImg,
      title: 'DESTINO',
      mainLines: destAddrLines,
      subLines: destDetLines,
    },
    {
      x: marginX + (cardW + cardGap) * 2,
      icon: calImg,
      title: 'DATA DISPONÍVEL',
      mainLines: dateMainLines,
      subLines: dateSubLines,
    },
  ];

  summaryCards.forEach((c) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240); // #e2e8f0
    doc.setLineWidth(0.35);
    doc.roundedRect(c.x, cursorY, cardW, summaryCardH, 2.2, 2.2, 'FD');

    if (c.icon) {
      doc.addImage(c.icon, 'PNG', c.x + 4, cursorY + 3.8, 4.2, 4.2);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138); // #1e3a8a
    doc.text(c.title, c.x + 9.5, cursorY + 7);

    // Bold address / date
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(15, 23, 42); // #0f172a
    let innerY = cursorY + 13.5;
    c.mainLines.forEach((line: string) => {
      doc.text(line, c.x + 4, innerY);
      innerY += 4.2;
    });

    // Muted details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(100, 116, 139); // #64748b
    innerY += 0.8;
    c.subLines.forEach((line: string) => {
      doc.text(line, c.x + 4, innerY);
      innerY += 3.8;
    });
  });

  cursorY += summaryCardH + 8;

  // --- 4. TWO-COLUMN DETAILS (ITENS A TRANSPORTAR | SERVIÇOS INCLUSOS) ---
  const colGap = 5.5;
  const colW = (contentWidth - colGap) / 2; // ~88.25mm
  const itemTextMaxW = colW - 13;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.6);
  const wrappedItems = data.itensLista.map((item) =>
    doc.splitTextToSize(item, itemTextMaxW) as string[]
  );
  const wrappedServices = data.servicosInclusos.map((srv) =>
    doc.splitTextToSize(srv, itemTextMaxW - 2) as string[]
  );

  const itemsContentH = wrappedItems.reduce(
    (acc, lines) => acc + lines.length * 4.2 + 1.8,
    0
  );
  const servicesContentH = wrappedServices.reduce(
    (acc, lines) => acc + lines.length * 4.2 + 2.2,
    0
  );

  const leftCardH = Math.max(46, 16 + itemsContentH + 4);
  const rightCardH = Math.max(46, 16 + servicesContentH + 4);
  const twoColCardH = Math.max(leftCardH, rightCardH);

  // Check if cards fit on page 1 alongside Total + Footer (~62mm needed below)
  const needsPageBreakBeforeDetails = cursorY + twoColCardH > pageHeight - 25;
  if (needsPageBreakBeforeDetails) {
    doc.addPage();
    cursorY = 16;
  }

  // Left card: ITENS A TRANSPORTAR
  const leftX = marginX;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.roundedRect(leftX, cursorY, colW, twoColCardH, 2.2, 2.2, 'FD');

  if (boxImg) {
    doc.addImage(boxImg, 'PNG', leftX + 5, cursorY + 4.2, 4.5, 4.5);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text('ITENS A TRANSPORTAR', leftX + 11, cursorY + 7.7);

  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.35);
  doc.line(leftX + 5, cursorY + 11.2, leftX + colW - 5, cursorY + 11.2);

  let itemY = cursorY + 16.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.6);
  wrappedItems.forEach((lines) => {
    doc.setFillColor(100, 116, 139);
    doc.circle(leftX + 6.8, itemY - 1.1, 0.7, 'F');
    doc.setTextColor(51, 65, 85); // #334155
    lines.forEach((ln, idx) => {
      doc.text(ln, leftX + 9.8, itemY + idx * 4.2);
    });
    itemY += lines.length * 4.2 + 1.8;
  });

  // Right card: SERVIÇOS INCLUSOS
  const rightX = marginX + colW + colGap;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.roundedRect(rightX, cursorY, colW, twoColCardH, 2.2, 2.2, 'FD');

  if (truckImg) {
    doc.addImage(truckImg, 'PNG', rightX + 5, cursorY + 4.2, 4.8, 4.8);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text('SERVIÇOS INCLUSOS', rightX + 11.2, cursorY + 7.7);

  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.35);
  doc.line(rightX + 5, cursorY + 11.2, rightX + colW - 5, cursorY + 11.2);

  let srvY = cursorY + 16.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.6);
  wrappedServices.forEach((lines) => {
    if (checkImg) {
      doc.addImage(checkImg, 'PNG', rightX + 5.3, srvY - 3.1, 3.6, 3.6);
    }
    doc.setTextColor(51, 65, 85);
    lines.forEach((ln, idx) => {
      doc.text(ln, rightX + 10.8, srvY + idx * 4.2);
    });
    srvY += lines.length * 4.2 + 2.2;
  });

  cursorY += twoColCardH + 9;

  // --- 5. TOTAL / BREAKDOWN VALUE BOX ---
  const breakdownRows = data.detalhamentoValores.length;
  const breakdownBlockH = breakdownRows > 0 ? breakdownRows * 5.4 + 4.5 : 0;
  const totalBoxH = 22 + breakdownBlockH;

  if (cursorY + totalBoxH + 28 > pageHeight) {
    doc.addPage();
    cursorY = 18;
  }

  doc.setFillColor(248, 250, 252); // #f8fafc
  doc.setDrawColor(203, 213, 225); // #cbd5e1
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, cursorY, contentWidth, totalBoxH, 2.2, 2.2, 'FD');

  let boxInnerY = cursorY + 7;

  if (breakdownRows > 0) {
    doc.setFontSize(8.2);
    data.detalhamentoValores.forEach((row) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(row.label, marginX + 6, boxInnerY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(row.value, pageWidth - marginX - 6, boxInnerY, { align: 'right' });
      boxInnerY += 5.4;
    });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.35);
    doc.line(marginX + 6, boxInnerY - 1.5, pageWidth - marginX - 6, boxInnerY - 1.5);
    boxInnerY += 5.2;
  } else {
    boxInnerY = cursorY + 11.5;
  }

  // Main total line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105); // #475569
  doc.text('VALOR TOTAL DO SERVIÇO', marginX + 6, boxInnerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(100, 116, 139);
  doc.text(data.condicaoPagamento, marginX + 6, boxInnerY + 4.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17.5);
  doc.setTextColor(29, 78, 216); // #1d4ed8
  doc.text(data.valorTotalFormatado, pageWidth - marginX - 6, boxInnerY + 0.5, {
    align: 'right',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Forma de Pagamento: ${data.formaPagamento}`,
    pageWidth - marginX - 6,
    boxInnerY + 5.5,
    { align: 'right' }
  );

  cursorY += totalBoxH + 10;

  // --- 6. FOOTER ---
  const footerY = Math.max(cursorY + 2, pageHeight - 30);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.line(marginX, footerY, pageWidth - marginX, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 138);
  doc.text('Anderson Mudanças e Transporte', pageWidth / 2, footerY + 6.5, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'CNPJ: 23.823.857/0001-07 · WhatsApp: (14) 99675-6241',
    pageWidth / 2,
    footerY + 11,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Segurança e compromisso do início ao fim!',
    pageWidth / 2,
    footerY + 15.5,
    { align: 'center' }
  );

  // Page numbering
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`${p}/${totalPages}`, pageWidth - marginX, pageHeight - 8, {
      align: 'right',
    });
  }

  const blob = doc.output('blob');
  return { doc, fileName: data.fileName, blob, data };
}

export function downloadProposalPdf(input: ProposalPdfInput): {
  fileName: string;
  blob: Blob;
  data: ProposalPdfData;
} {
  const { doc, fileName, blob, data } = createProposalPdfDocument(input);
  doc.save(fileName);
  return { fileName, blob, data };
}
