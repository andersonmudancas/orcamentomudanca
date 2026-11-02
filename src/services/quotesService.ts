import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Quote } from '../types/quote';

export function generateProtocol(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `AND-${year}-${random}`;
}

export async function createQuote(quoteData: Omit<Quote, 'id' | 'createdAt' | 'status'>): Promise<{ id: string; protocol: string }> {
  const quotesCol = collection(db, 'quotes');
  const newDocRef = doc(quotesCol);
  const protocol = quoteData.protocol || generateProtocol();

  const payload: Record<string, any> = {
    protocol,
    nome: quoteData.nome.trim(),
    origem: quoteData.origem.trim(),
    tipoOrigem: quoteData.tipoOrigem,
    destino: quoteData.destino.trim(),
    tipoDestino: quoteData.tipoDestino,
    dataMudanca: quoteData.dataMudanca,
    itens: quoteData.itens.trim(),
    precisaDesmontagem: Boolean(quoteData.precisaDesmontagem),
    itensDesmontagem: quoteData.itensDesmontagem || [],
    precisaEmbalagem: Boolean(quoteData.precisaEmbalagem),
    itensEmbalagem: quoteData.itensEmbalagem || [],
    precisaCaixas: Boolean(quoteData.precisaCaixas),
    quantidadeCaixas: quoteData.quantidadeCaixas || 0,
    valorTotalCaixas: quoteData.valorTotalCaixas || 0,
    status: 'novo',
    createdAt: serverTimestamp(),
  };

  if (quoteData.telefone?.trim()) {
    payload.telefone = quoteData.telefone.trim();
  }
  if (quoteData.detalhesOrigem?.trim()) {
    payload.detalhesOrigem = quoteData.detalhesOrigem.trim();
  }
  if (quoteData.detalhesDestino?.trim()) {
    payload.detalhesDestino = quoteData.detalhesDestino.trim();
  }
  if (quoteData.turno?.trim()) {
    payload.turno = quoteData.turno.trim();
  }
  if (quoteData.observacoes?.trim()) {
    payload.observacoes = quoteData.observacoes.trim();
  }

  try {
    await setDoc(newDocRef, payload);
    return { id: newDocRef.id, protocol };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'quotes');
  }
}

export function subscribeQuotes(
  onData: (quotes: Quote[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const path = 'quotes';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const quotes: Quote[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Quote, 'id'>),
      }));
      onData(quotes);
    },
    (error) => {
      if (onError) {
        onError(error as Error);
      }
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function updateQuote(id: string, updates: Partial<Quote>): Promise<void> {
  const path = `quotes/${id}`;
  const docRef = doc(db, 'quotes', id);

  const cleanUpdates: Record<string, any> = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  delete cleanUpdates.id;
  delete cleanUpdates.createdAt;

  try {
    await updateDoc(docRef, cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteQuote(id: string): Promise<void> {
  const path = `quotes/${id}`;
  const docRef = doc(db, 'quotes', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
