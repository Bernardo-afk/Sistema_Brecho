import type { Conservation, OrderStatus, ProductStatus, AdminRole, ArticleStatus } from '@/types/domain';

const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const brl = (v: number) => brlFmt.format(v);
export const date = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
export const dateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const dims = (d: { height: number; width: number; depth: number }) => `${d.height} × ${d.width} × ${d.depth} cm`;
export const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
export function installments(v: number) {
  const n = v >= 3000 ? 10 : v >= 1000 ? 6 : 3;
  return `ou ${n}x de ${brl(v / n)} sem juros (simulado)`;
}

export const conservationLabel: Record<Conservation, string> = {
  excelente: 'Excelente',
  'muito-bom': 'Muito bom',
  bom: 'Bom',
  restaurado: 'Restaurado',
  'com-marcas-de-uso': 'Com marcas de uso',
};

export const productStatusLabel: Record<ProductStatus, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  vendido: 'Vendido',
  arquivado: 'Arquivado',
};

export const orderStatusLabel: Record<OrderStatus, string> = {
  'aguardando-pagamento': 'Aguardando pagamento',
  pago: 'Pago',
  'em-separacao': 'Em separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export const roleLabel: Record<AdminRole, string> = {
  admin: 'Administrador principal',
  gerente: 'Gerente',
  estoque: 'Funcionário · Estoque',
  editor: 'Funcionário · Conteúdo',
};

export const articleStatusLabel: Record<ArticleStatus, string> = {
  rascunho: 'Rascunho',
  agendado: 'Agendado',
  publicado: 'Publicado',
};

export const maskCep = (v: string) => v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
export const maskPhone = (v: string) =>
  v.replace(/\D/g, '').slice(0, 11).replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
export const maskCpf = (v: string) =>
  v.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
