import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { services } from '@/services';
import type { Category, Coupon, CouponType } from '@/types/domain';
import { useQuery } from '@/hooks/useQuery';
import { toast } from '@/store/toast';
import { Badge, Button, Card, Checkbox, confirm, EmptyState, Field, IconButton, Img, Input, Modal, Select, Textarea, Toggle } from '@/design-system';
import { brl, date } from '@/utils/format';
import { PageHeader } from './AdminApp';

// ---------- Categorias ----------
export function CategoriesPage() {
  const { data: categories } = useQuery(() => services.categories.list(), []);
  const { data: products } = useQuery(() => services.products.list({ status: 'todos' }), []);
  const { data: panoramas } = useQuery(() => services.panoramas.list(), []);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [saving, setSaving] = useState(false);
  const imgInput = useRef<HTMLInputElement>(null);

  const save = async () => {
    if (!editing?.name?.trim()) return toast.error('Informe o nome da categoria');
    setSaving(true);
    try {
      if (editing.id) await services.categories.update(editing.id, editing);
      else
        await services.categories.create({
          slug: '',
          name: editing.name,
          tagline: editing.tagline ?? '',
          description: editing.description ?? '',
          image: editing.image ?? 'assets/scenes/sala-capa.jpg',
          panoramaId: editing.panoramaId ?? null,
          order: (categories?.length ?? 0) + 1,
          showInMenu: editing.showInMenu ?? true,
        });
      toast.success(editing.id ? 'Categoria atualizada' : 'Categoria criada', 'O menu da loja já foi atualizado.');
      setEditing(null);
    } catch (e) {
      toast.error('Não foi possível salvar', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const remove = async (c: Category) => {
    if (!(await confirm({ title: `Excluir “${c.name}”?`, message: 'A categoria sairá do menu da loja.', danger: true, confirmLabel: 'Excluir' }))) return;
    const r = await services.categories.remove(c.id);
    if (r.ok) toast.success('Categoria excluída');
    else toast.error('Não foi possível excluir', r.reason);
  };
  const move = async (c: Category, d: number) => {
    const list = [...(categories ?? [])];
    const i = list.findIndex((x) => x.id === c.id);
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    await Promise.all([services.categories.update(list[i].id, { order: list[j].order }), services.categories.update(list[j].id, { order: list[i].order })]);
  };

  return (
    <div>
      <PageHeader title="Categorias" description="Organização do catálogo, menu lateral e ambientes panorâmicos associados." actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing({ showInMenu: true })}>Nova categoria</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories?.map((c, i) => (
          <Card key={c.id} padded={false} className="overflow-hidden">
            <Img src={c.image} alt={c.name} className="aspect-[16/9]" />
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-serif text-xl text-walnut">{c.name}</p>
                  <p className="text-[12.5px] text-tobacco">{c.tagline}</p>
                </div>
                <span className="flex">
                  <IconButton label="Mover para cima" className="!h-8 !w-8" disabled={i === 0} onClick={() => move(c, -1)}>↑</IconButton>
                  <IconButton label="Mover para baixo" className="!h-8 !w-8" disabled={i === categories.length - 1} onClick={() => move(c, 1)}>↓</IconButton>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge>{products?.filter((p) => p.categoryId === c.id).length ?? 0} peças</Badge>
                {c.panoramaId ? <Badge tone="brass">360°: {panoramas?.find((p) => p.id === c.panoramaId)?.name}</Badge> : <Badge>sem panorama</Badge>}
                {!c.showInMenu && <Badge tone="red">fora do menu</Badge>}
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="secondary" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditing(c)}>Editar</Button>
                <Link to={`/categoria/${c.slug}`} target="_blank"><Button size="sm" variant="ghost">Ver na loja</Button></Link>
                <Button size="sm" variant="ghost" className="ml-auto hover:!text-oxblood" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => remove(c)}>Excluir</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Editar categoria' : 'Nova categoria'}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button><Button loading={saving} onClick={save}>Salvar</Button></>}
      >
        {editing && (
          <div className="space-y-4">
            <Field label="Nome" required><Input value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Chamada"><Input value={editing.tagline ?? ''} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} /></Field>
            <Field label="Descrição"><Textarea rows={3} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <Field label="Ambiente panorâmico associado">
              <Select value={editing.panoramaId ?? ''} onChange={(e) => setEditing({ ...editing, panoramaId: e.target.value || null })}>
                <option value="">Nenhum</option>
                {panoramas?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label="Imagem de capa">
              <div className="flex items-center gap-3">
                <Img src={editing.image} alt="" className="h-20 w-32 rounded-lg" />
                <input
                  ref={imgInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const { ref } = await services.files.upload(f);
                    setEditing((ed) => ({ ...ed, image: ref }));
                  }}
                />
                <Button type="button" size="sm" variant="secondary" icon={<ImagePlus className="h-4 w-4" />} onClick={() => imgInput.current?.click()}>Alterar imagem</Button>
              </div>
            </Field>
            <Checkbox checked={editing.showInMenu ?? true} onChange={(v) => setEditing({ ...editing, showInMenu: v })} label="Exibir no menu da loja" />
          </div>
        )}
      </Modal>
    </div>
  );
}

// ---------- Cupons ----------
const couponTypeLabel: Record<CouponType, string> = { percentual: 'Percentual', 'valor-fixo': 'Valor fixo', 'frete-gratis': 'Frete grátis' };

export function CouponsPage() {
  const { data: coupons } = useQuery(() => services.coupons.list(), []);
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const e = editing!;
    if (!e.code?.trim()) return toast.error('Informe o código do cupom');
    if (e.type !== 'frete-gratis' && !(Number(e.value) > 0)) return toast.error('Informe o valor do desconto');
    if (e.type === 'percentual' && Number(e.value) > 90) return toast.error('Percentual máximo de 90%');
    setSaving(true);
    try {
      const data = { code: e.code, description: e.description || couponTypeLabel[e.type ?? 'percentual'], type: e.type ?? 'percentual', value: Number(e.value) || 0, minSubtotal: Number(e.minSubtotal) || 0, validUntil: e.validUntil!, usageLimit: Number(e.usageLimit) || 1, active: e.active ?? true };
      if (e.id) await services.coupons.update(e.id, data);
      else await services.coupons.create(data);
      toast.success('Cupom salvo', 'Já pode ser usado no carrinho da loja.');
      setEditing(null);
    } catch (err) {
      toast.error('Não foi possível salvar', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const status = (c: Coupon) => {
    if (!c.active) return <Badge>Inativo</Badge>;
    if (new Date(c.validUntil + 'T23:59:59') < new Date()) return <Badge tone="red">Expirado</Badge>;
    if (c.used >= c.usageLimit) return <Badge tone="amber">Esgotado</Badge>;
    return <Badge tone="green">Ativo</Badge>;
  };
  return (
    <div>
      <PageHeader
        title="Cupons"
        description="Cupons demonstrativos que funcionam no carrinho e no checkout da loja."
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing({ type: 'percentual', active: true, usageLimit: 100, minSubtotal: 0, validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) })}>Novo cupom</Button>}
      />
      {!coupons?.length ? (
        <EmptyState icon={<Tag className="h-6 w-6" />} title="Nenhum cupom cadastrado" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coupons.map((c) => (
            <Card key={c.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="rounded-lg border-2 border-dashed border-brass/60 bg-brass/5 px-3 py-1.5 font-mono text-lg font-bold tracking-wider text-walnut">{c.code}</span>
                {status(c)}
              </div>
              <p className="text-sm text-tobacco">{c.description}</p>
              <dl className="grid grid-cols-2 gap-2 text-[13px]">
                <div><dt className="text-tobacco">Tipo</dt><dd className="font-semibold text-walnut">{couponTypeLabel[c.type]}{c.type === 'percentual' ? ` · ${c.value}%` : c.type === 'valor-fixo' ? ` · ${brl(c.value)}` : ''}</dd></div>
                <div><dt className="text-tobacco">Pedido mínimo</dt><dd className="font-semibold text-walnut">{c.minSubtotal ? brl(c.minSubtotal) : '—'}</dd></div>
                <div><dt className="text-tobacco">Validade</dt><dd className="font-semibold text-walnut">{date(c.validUntil + 'T12:00:00')}</dd></div>
                <div><dt className="text-tobacco">Utilização</dt><dd className="font-semibold text-walnut">{c.used} / {c.usageLimit}</dd></div>
              </dl>
              <div className="h-1.5 rounded-full bg-cream-200"><div className="h-full rounded-full bg-brass" style={{ width: `${Math.min(100, (c.used / c.usageLimit) * 100)}%` }} /></div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditing(c)}>Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => services.coupons.update(c.id, { active: !c.active }).then(() => toast.info(c.active ? 'Cupom desativado' : 'Cupom ativado'))}>{c.active ? 'Desativar' : 'Ativar'}</Button>
                <Button size="sm" variant="ghost" className="ml-auto hover:!text-oxblood" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={async () => (await confirm({ title: `Excluir ${c.code}?`, danger: true, confirmLabel: 'Excluir' })) && services.coupons.remove(c.id).then(() => toast.success('Cupom excluído'))}>Excluir</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Editar cupom' : 'Novo cupom'} footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button><Button loading={saving} onClick={save}>Salvar cupom</Button></>}>
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Código" required><Input value={editing.code ?? ''} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase().replace(/\s/g, '') })} className="font-mono uppercase" /></Field>
            <Field label="Tipo">
              <Select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as CouponType })}>
                {(Object.keys(couponTypeLabel) as CouponType[]).map((t) => <option key={t} value={t}>{couponTypeLabel[t]}</option>)}
              </Select>
            </Field>
            {editing.type !== 'frete-gratis' && (
              <Field label={editing.type === 'percentual' ? 'Percentual (%)' : 'Valor (R$)'} required><Input inputMode="decimal" value={editing.value ?? ''} onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })} /></Field>
            )}
            <Field label="Pedido mínimo (R$)"><Input inputMode="decimal" value={editing.minSubtotal ?? ''} onChange={(e) => setEditing({ ...editing, minSubtotal: Number(e.target.value) })} /></Field>
            <Field label="Validade"><Input type="date" value={editing.validUntil ?? ''} onChange={(e) => setEditing({ ...editing, validUntil: e.target.value })} /></Field>
            <Field label="Limite de utilização"><Input inputMode="numeric" value={editing.usageLimit ?? ''} onChange={(e) => setEditing({ ...editing, usageLimit: Number(e.target.value) })} /></Field>
            <Field label="Descrição" className="sm:col-span-2"><Input value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <Toggle checked={editing.active ?? true} onChange={(v) => setEditing({ ...editing, active: v })} label="Cupom ativo" />
          </div>
        )}
      </Modal>
    </div>
  );
}
