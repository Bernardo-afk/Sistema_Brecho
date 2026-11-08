// Design system "antiquário contemporâneo": componentes base reutilizados pela
// loja pública e pelo painel administrativo.
import { forwardRef, useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { create } from 'zustand';
import { AlertTriangle, CheckCircle2, ChevronRight, ImageOff, Info, Loader2, X, XCircle, FlaskConical } from 'lucide-react';
import { useToasts } from '@/store/toast';
import { useAssetUrl } from '@/utils/assets';
import type { OrderStatus, ProductStatus } from '@/types/domain';
import { orderStatusLabel, productStatusLabel } from '@/utils/format';

export { clsx };

// ---------- Botões ----------
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'brass' | 'link';
type Size = 'sm' | 'md' | 'lg';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  block?: boolean;
}
const variants: Record<Variant, string> = {
  primary: 'bg-walnut text-cream hover:bg-walnut-800 shadow-soft',
  secondary: 'bg-transparent text-walnut border border-walnut/30 hover:border-walnut hover:bg-walnut/5',
  ghost: 'text-walnut hover:bg-walnut/5',
  danger: 'bg-oxblood text-cream hover:bg-oxblood/90',
  brass: 'bg-brass text-espresso hover:bg-brass-light shadow-soft',
  link: 'text-walnut underline underline-offset-4 decoration-brass/60 hover:decoration-brass px-0',
};
const sizes: Record<Size, string> = { sm: 'h-9 px-3.5 text-[13px]', md: 'h-11 px-5 text-sm', lg: 'h-13 py-3.5 px-7 text-[15px]' };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'primary', size = 'md', loading, icon, block, className, children, disabled, ...rest }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex select-none items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98]',
        variants[variant],
        variant !== 'link' && sizes[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
});

export function IconButton({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button aria-label={label} title={label} className={clsx('inline-flex h-10 w-10 items-center justify-center rounded-full text-walnut transition hover:bg-walnut/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass', className)} {...rest}>
      {children}
    </button>
  );
}

// ---------- Badges ----------
export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'brass' | 'green' | 'red' | 'dark' | 'blue' | 'amber'; className?: string }) {
  const tones = {
    neutral: 'bg-cream-200 text-walnut',
    brass: 'bg-brass/15 text-[#7a5a1e]',
    green: 'bg-sage/15 text-[#45502f]',
    red: 'bg-oxblood/10 text-oxblood',
    dark: 'bg-espresso/85 text-cream',
    blue: 'bg-[#2b4c8c]/10 text-[#2b4c8c]',
    amber: 'bg-[#c98a1e]/15 text-[#8a5a0e]',
  };
  return <span className={clsx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[.08em]', tones[tone], className)}>{children}</span>;
}

export function ProductStatusBadge({ status, className }: { status: ProductStatus; className?: string }) {
  const tone = { disponivel: 'green', reservado: 'amber', vendido: 'dark', arquivado: 'neutral' } as const;
  return <Badge tone={tone[status]} className={className}>{productStatusLabel[status]}</Badge>;
}
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone = { 'aguardando-pagamento': 'amber', pago: 'blue', 'em-separacao': 'brass', enviado: 'brass', entregue: 'green', cancelado: 'red' } as const;
  return <Badge tone={tone[status]}>{orderStatusLabel[status]}</Badge>;
}

export function DemoTag({ children = 'Simulação', className }: { children?: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full border border-dashed border-oxblood/40 bg-oxblood/5 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[.1em] text-oxblood', className)}>
      <FlaskConical className="h-3 w-3" /> {children}
    </span>
  );
}

export function DemoNotice({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex gap-3 rounded-xl border border-dashed border-oxblood/30 bg-oxblood/[.04] p-4 text-sm text-walnut', className)}>
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-oxblood" />
      <div>
        <p className="font-semibold text-oxblood">{title}</p>
        <div className="mt-0.5 text-walnut/80">{children}</div>
      </div>
    </div>
  );
}

// ---------- Formulários ----------
const inputBase = 'w-full rounded-lg border border-sand bg-cream-50 px-3.5 text-[15px] text-espresso placeholder:text-tobacco/60 transition focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/25 disabled:opacity-60';

export function Field({ label, hint, error, children, className, required }: { label: string; hint?: ReactNode; error?: string | null; children: ReactNode; className?: string; required?: boolean }) {
  return (
    <label className={clsx('block', className)}>
      <span className="mb-1.5 block text-[12.5px] font-semibold uppercase tracking-[.08em] text-tobacco">
        {label}
        {required && <span className="text-oxblood"> *</span>}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs text-oxblood">{error}</span> : hint ? <span className="mt-1 block text-xs text-tobacco/80">{hint}</span> : null}
    </label>
  );
}
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={clsx(inputBase, 'h-11', className)} {...p} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={clsx(inputBase, 'min-h-[110px] py-2.5 leading-relaxed', className)} {...p} />;
});
export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx(inputBase, 'h-11 appearance-none bg-[url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%238a6a4a%27 stroke-width=%272%27><path d=%27m6 9 6 6 6-6%27/></svg>")] bg-[length:14px] bg-[right_12px_center] bg-no-repeat pr-9', className)} {...p}>
      {children}
    </select>
  );
}
export function Checkbox({ label, checked, onChange, className }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <label className={clsx('inline-flex cursor-pointer items-center gap-2.5 text-sm text-walnut', className)}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-sand accent-walnut" />
      {label}
    </label>
  );
}
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="inline-flex items-center gap-2.5 text-sm text-walnut">
      <span className={clsx('relative h-6 w-10 rounded-full transition', checked ? 'bg-walnut' : 'bg-sand')}>
        <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-cream shadow transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
      </span>
      {label}
    </button>
  );
}

// ---------- Superfícies ----------
export function Card({ children, className, padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return <div className={clsx('rounded-2xl border border-sand/60 bg-cream-50 shadow-soft', padded && 'p-5 sm:p-6', className)}>{children}</div>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-lg bg-gradient-to-r from-cream-200 via-cream-300/70 to-cream-200', className)} />;
}

export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-tobacco" role="status">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="font-serif text-lg italic">{label}</span>
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sand px-6 py-14 text-center">
      {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200 text-tobacco">{icon}</div>}
      <h3 className="font-serif text-2xl text-walnut">{title}</h3>
      {children && <div className="mt-2 max-w-md text-sm text-tobacco">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="flex flex-wrap items-center gap-1 text-[12.5px] text-tobacco">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 opacity-60" />}
          {it.to ? (
            <Link to={it.to} className="hover:text-walnut hover:underline">
              {it.label}
            </Link>
          ) : (
            <span className="text-walnut" aria-current="page">
              {it.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function SectionHeading({ eyebrow, title, children, action, className }: { eyebrow?: string; title: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx('mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[.22em] text-brass">{eyebrow}</p>}
        <h2 className="font-serif text-[2rem] leading-[1.05] text-walnut sm:text-[2.6rem]">{title}</h2>
        {children && <p className="mt-3 text-[15px] leading-relaxed text-tobacco">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, tabs, className }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: ReactNode }[]; className?: string }) {
  return (
    <div role="tablist" className={clsx('flex gap-1 overflow-x-auto rounded-full bg-cream-200 p-1', className)}>
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)} className={clsx('whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium transition', value === t.value ? 'bg-cream-50 text-walnut shadow-soft' : 'text-tobacco hover:text-walnut')}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Imagem com carregamento suave e fallback elegante (aceita arquivos enviados). */
export function Img({ src, alt, className, imgClassName, eager }: { src?: string | null; alt: string; className?: string; imgClassName?: string; eager?: boolean }) {
  const url = useAssetUrl(src);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [url]);
  return (
    <div className={clsx('relative overflow-hidden bg-cream-200', className)}>
      {!loaded && !failed && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-cream-200 to-cream-300" />}
      {failed || !url ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-tobacco/70">
          <ImageOff className="h-6 w-6" />
          <span className="text-xs">Imagem indisponível</span>
        </div>
      ) : (
        <img src={url} alt={alt} loading={eager ? 'eager' : 'lazy'} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} className={clsx('h-full w-full object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0', imgClassName)} />
      )}
    </div>
  );
}

// ---------- Modais ----------
export function Modal({ open, onClose, title, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fadeIn bg-espresso/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className={clsx('relative flex max-h-[92vh] w-full animate-fadeUp flex-col rounded-t-3xl bg-cream-50 shadow-lift sm:rounded-2xl', w)}>
        <div className="flex items-start justify-between gap-4 border-b border-sand/60 px-5 py-4 sm:px-6">
          <h3 className="font-serif text-2xl leading-tight text-walnut">{title}</h3>
          <IconButton label="Fechar" onClick={onClose} className="-mr-2 -mt-1">
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-sand/60 px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, children, footer, side = 'right', width = 'max-w-md' }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; side?: 'left' | 'right'; width?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fadeIn bg-espresso/45 backdrop-blur-[2px]" onClick={onClose} />
      <aside className={clsx('absolute top-0 flex h-full w-full flex-col bg-cream-50 shadow-lift', width, side === 'right' ? 'right-0 animate-slideIn' : 'left-0 animate-slideInLeft')}>
        <div className="flex items-center justify-between border-b border-sand/60 px-5 py-4">
          <div className="font-serif text-2xl text-walnut">{title}</div>
          <IconButton label="Fechar" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-sand/60 p-5">{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}

// ---------- Confirmação global ----------
interface ConfirmReq {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (v: boolean) => void;
}
const useConfirmStore = create<{ req: ConfirmReq | null; set: (r: ConfirmReq | null) => void }>((set) => ({ req: null, set: (req) => set({ req }) }));
export function confirm(opts: Omit<ConfirmReq, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => useConfirmStore.getState().set({ ...opts, resolve }));
}
export function ConfirmHost() {
  const { req, set } = useConfirmStore();
  const close = (v: boolean) => {
    req?.resolve(v);
    set(null);
  };
  return (
    <Modal
      open={!!req}
      onClose={() => close(false)}
      title={req?.title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => close(false)}>
            Cancelar
          </Button>
          <Button variant={req?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
            {req?.confirmLabel ?? 'Confirmar'}
          </Button>
        </>
      }
    >
      <div className="flex gap-3 text-[15px] text-walnut">
        {req?.danger && <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-oxblood" />}
        <div>{req?.message}</div>
      </div>
    </Modal>
  );
}

// ---------- Toasts ----------
export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex w-full max-w-sm animate-fadeUp items-start gap-3 rounded-xl border border-sand/70 bg-cream-50 p-4 shadow-lift">
          {t.kind === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0 text-sage" /> : t.kind === 'error' ? <XCircle className="h-5 w-5 shrink-0 text-oxblood" /> : <Info className="h-5 w-5 shrink-0 text-brass" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-walnut">{t.title}</p>
            {t.message && <p className="mt-0.5 text-[13px] text-tobacco">{t.message}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} aria-label="Fechar aviso" className="text-tobacco hover:text-walnut">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}

export function Price({ value, compareAt, className }: { value: number; compareAt?: number; className?: string }) {
  const f = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return (
    <span className={clsx('inline-flex items-baseline gap-2', className)}>
      <span className="font-semibold text-walnut">{f(value)}</span>
      {compareAt && compareAt > value && <span className="text-[0.85em] text-tobacco/70 line-through">{f(compareAt)}</span>}
    </span>
  );
}
