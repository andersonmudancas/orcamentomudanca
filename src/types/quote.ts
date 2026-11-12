export type QuoteStatus =
  | 'novo'
  | 'em_analise'
  | 'orcamento_enviado'
  | 'fechado'
  | 'cancelado'
  | 'concluido';

export type PropertyType = 'Casa' | 'Apartamento';

export interface Quote {
  id?: string;
  protocol: string;
  nome: string;
  telefone?: string;
  origem: string;
  tipoOrigem: PropertyType;
  tipoCasaOrigem?: 'Térrea' | 'Sobrado';
  elevadorOrigem?: 'Sim' | 'Não';
  andarOrigem?: string;
  detalhesOrigem?: string;
  destino: string;
  tipoDestino: PropertyType;
  tipoCasaDestino?: 'Térrea' | 'Sobrado';
  elevadorDestino?: 'Sim' | 'Não';
  andarDestino?: string;
  detalhesDestino?: string;
  dataMudanca: string;
  turno?: string;
  itens: string;
  precisaDesmontagem: boolean;
  itensDesmontagem?: string[];
  precisaEmbalagem: boolean;
  itensEmbalagem?: string[];
  precisaCaixas: boolean;
  quantidadeCaixas?: number;
  valorTotalCaixas?: number;
  observacoes?: string;
  status: QuoteStatus;
  valorOrcamento?: number;
  valorTransporte?: number;
  valorDesmontagem?: number;
  valorEmbalagem?: number;
  dataDisponivel?: string;
  horarioDisponivel?: string;
  formaPagamento?: string;
  notasInternas?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface QuoteFilter {
  searchTerm: string;
  status: QuoteStatus | 'todos';
  dateFilter?: string;
  serviceFilter?: 'todos' | 'desmontagem' | 'embalagem' | 'caixas';
}
