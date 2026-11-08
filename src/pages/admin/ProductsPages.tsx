import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Archive, ArrowDown, ArrowUp, Box, Copy, ExternalLink, ImagePlus, Pencil, Plus, RefreshCw, Search, Trash2, Upload } from 'lucide-react';
import { services } from '@/services';
import type { ProductInput } from '@/services';
import type { Conservation, Product, ProductStatus } from '@/types/domain';
import { useQuery } from '@/hooks/useQuery';
import { toast } from '@/store/toast';
import { Badge, Button, Card, confirm, DemoNotice, EmptyState, Field, IconButton, Img, Input, ProductStatusBadge, Select, Skeleton, Textarea, Toggle } from '@/design-system';
import { Model3DViewer } from '@/viewers';
import { brl, conservationLabel, productStatusLabel } from '@/utils/format';
import { PageHeader } from './AdminApp';

export function ProductsPage() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState<'todos' | ProductStatus>('todos');
  const { data: products, loading } = useQuery(() => services.products.list({ status, categoryId: cat || undefined, search: q || undefined, sort: 'recentes' }), [q, cat, status]);
  const { data: categories } = useQuery(() => services.categories.list(), []);
  const catName = (id: string) => categories?.find((c) => c.id === id)?.name ?? '—';

  const changeStatus = async (p: Product, s: ProductStatus) => {
    await services.products.setStatus(p.id, s);
    toast.success('Disponibilidade atualizada', `${p.name}: ${productStatusLabel[s]}`);
  };
  const remove = async (p: Product) => {
    if (!(await confirm({ title: 'Excluir produto?', message: <>A peça <strong>{p.name}</strong> será removida do catálogo e dos panoramas. Prefira arquivar se quiser manter o histórico.</>, danger: true, confirmLabel: 'Excluir' }))) return;
    await services.products.remove(p.id);
    toast.success('Produto excluído', p.name);
  };

  return (
    <div>
      <PageHeader
        title="Produtos"
        description={`${products?.length ?? '…'} peças · cadastro, disponibilidade, fotos e modelos 3D`}
        actions={
          <Link to="/admin/produtos/novo">
            <Button icon={<Plus className="h-4 w-4" />}>Nova peça</Button>
          </Link>
        }
      />
      <Card className="mb-4 !p-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_200px_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tobacco" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, material, época…" className="pl-9" aria-label="Buscar produtos" />
          </div>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filtrar por categoria">
            <option value="">Todas as categorias</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Filtrar por status">
            <option value="todos">Todos os status</option>
            {(Object.keys(productStatusLabel) as ProductStatus[]).map((s) => <option key={s} value={s}>{productStatusLabel[s]}</option>)}
          </Select>
        </div>
      </Card>
      {loading && !products ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : !products?.length ? (
        <EmptyState icon={<Search className="h-6 w-6" />} title="Nenhum produto encontrado">Ajuste a busca ou os filtros.</EmptyState>
      ) : (
        <Card padded={false} className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="hidden bg-cream-200/60 text-[11px] uppercase tracking-[.12em] text-tobacco md:table-header-group">
              <tr>
                <th className="px-4 py-3 font-semibold">Peça</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">Preço</th>
                <th className="px-4 py-3 font-semibold">Disponibilidade</th>
                <th className="px-4 py-3 font-semibold">Mídia</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/60">
              {products.map((p) => (
                <tr key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:table-row md:p-0">
                  <td className="flex min-w-0 flex-1 items-center gap-3 md:px-4 md:py-3">
                    <Img src={p.photos[0]} alt="" className="h-12 w-12 shrink-0 rounded-lg" />
                    <div className="min-w-0">
                      <Link to={`/admin/produtos/${p.id}`} className="block truncate font-medium text-walnut hover:underline">{p.name}</Link>
                      <span className="text-[12px] text-tobacco">{p.era} · {p.views} visualizações</span>
                    </div>
                  </td>
                  <td className="hidden text-tobacco md:table-cell md:px-4">{catName(p.categoryId)}</td>
                  <td className="font-semibold tabular-nums text-walnut md:px-4">{brl(p.price)}</td>
                  <td className="md:px-4">
                    {p.status === 'reservado' ? (
                      <span title="Reservado por um carrinho ou PIX em aberto. Libera automaticamente ao expirar."><ProductStatusBadge status="reservado" /></span>
                    ) : (
                      <Select aria-label={`Status de ${p.name}`} value={p.status} onChange={(e) => changeStatus(p, e.target.value as ProductStatus)} className="!h-8 w-36 !text-[12.5px]">
                        <option value="disponivel">Disponível</option>
                        <option value="vendido">Vendido</option>
                        <option value="arquivado">Arquivado</option>
                      </Select>
                    )}
                  </td>
                  <td className="md:px-4">
                    <span className="flex gap-1.5">
                      <Badge>{p.photos.length} fotos</Badge>
                      {p.model3d ? <Badge tone="brass"><Box className="h-3 w-3" /> 3D</Badge> : <Badge tone="neutral">sem 3D</Badge>}
                    </span>
                  </td>
                  <td className="ml-auto md:px-4 md:text-right">
                    <span className="inline-flex">
                      <Link to={`/produto/${p.slug}`} target="_blank" aria-label="Ver na loja" title="Ver na loja" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-walnut hover:bg-walnut/5"><ExternalLink className="h-4 w-4" /></Link>
                      <Link to={`/admin/produtos/${p.id}`} aria-label="Editar" title="Editar" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-walnut hover:bg-walnut/5"><Pencil className="h-4 w-4" /></Link>
                      {p.status !== 'arquivado' && (
                        <IconButton label="Arquivar" className="!h-9 !w-9" onClick={() => changeStatus(p, 'arquivado')}><Archive className="h-4 w-4" /></IconButton>
                      )}
                      <IconButton label="Excluir" className="!h-9 !w-9 hover:!text-oxblood" onClick={() => remove(p)}><Trash2 className="h-4 w-4" /></IconButton>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

const EMPTY: ProductInput = {
  name: '',
  shortDescription: '',
  description: '',
  price: 0,
  categoryId: '',
  photos: [],
  model3d: null,
  dimensions: { height: 0, width: 0, depth: 0 },
  weightKg: 0,
  material: '',
  conservation: 'muito-bom',
  era: '',
  maker: '',
  provenance: '',
  wearNotes: '',
  status: 'disponivel',
  featured: false,
  isNew: true,
  tags: [],
};

function PhotoManager({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const replaceIdx = useRef<number | null>(null);
  const [busy, setBusy] = useState(false);
  const handle = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const refs: string[] = [];
      for (const f of Array.from(files)) {
        if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
          toast.error('Formato não suportado', `${f.name}: use JPG, PNG ou WebP.`);
          continue;
        }
        if (f.size > 10 * 1024 * 1024) {
          toast.error('Arquivo muito grande', `${f.name} excede 10 MB.`);
          continue;
        }
        refs.push((await services.files.upload(f)).ref);
      }
      if (replaceIdx.current != null && refs[0]) {
        const old = photos[replaceIdx.current];
        const next = [...photos];
        next[replaceIdx.current] = refs[0];
        onChange(next);
        services.files.remove(old);
        toast.success('Foto substituída');
      } else if (refs.length) {
        onChange([...photos, ...refs]);
        toast.success(`${refs.length} foto(s) adicionada(s)`, 'Armazenadas localmente no navegador (simulação).');
      }
    } finally {
      replaceIdx.current = null;
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };
  const move = (i: number, d: number) => {
    const n = [...photos];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    onChange(n);
  };
  return (
    <div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => handle(e.target.files)} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map((ph, i) => (
          <div key={ph + i} className="group relative">
            <Img src={ph} alt={`Foto ${i + 1}`} className="aspect-square rounded-xl" />
            {i === 0 && <Badge tone="dark" className="absolute left-2 top-2">Capa</Badge>}
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-center gap-1 rounded-full bg-cream-50/95 p-1 shadow-soft">
              <IconButton label="Mover para a esquerda" className="!h-7 !w-7" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5 -rotate-90" /></IconButton>
              <IconButton label="Mover para a direita" className="!h-7 !w-7" disabled={i === photos.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5 -rotate-90" /></IconButton>
              <IconButton label="Substituir" className="!h-7 !w-7" onClick={() => ((replaceIdx.current = i), input.current?.click())}><RefreshCw className="h-3.5 w-3.5" /></IconButton>
              <IconButton
                label="Remover"
                className="!h-7 !w-7 hover:!text-oxblood"
                onClick={async () => {
                  if (await confirm({ title: 'Remover foto?', message: 'A imagem será desvinculada da peça.', danger: true, confirmLabel: 'Remover' })) {
                    onChange(photos.filter((_, k) => k !== i));
                    services.files.remove(ph);
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            </div>
          </div>
        ))}
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-sand text-sm text-tobacco transition hover:border-walnut hover:text-walnut">
          <ImagePlus className="h-6 w-6" />
          {busy ? 'Enviando…' : 'Adicionar fotos'}
          <span className="text-[11px]">JPG, PNG ou WebP · até 10 MB</span>
        </button>
      </div>
    </div>
  );
}

function ModelManager({ model, onChange, poster, name }: { model?: string | null; onChange: (m: string | null) => void; poster?: string; name: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const handle = async (f?: File) => {
    if (!f) return;
    if (!/\.(glb|gltf)$/i.test(f.name)) return toast.error('Formato não suportado', 'Envie um arquivo .glb ou .gltf (com recursos embutidos).');
    if (f.size > 40 * 1024 * 1024) return toast.error('Arquivo muito grande', 'Limite de 40 MB no protótipo.');
    setBusy(true);
    const { ref } = await services.files.upload(f);
    if (model) services.files.remove(model);
    onChange(ref);
    setBusy(false);
    setPreview(true);
    toast.success('Modelo 3D associado', `${f.name} · armazenado localmente (simulação).`);
    if (input.current) input.current.value = '';
  };
  return (
    <div className="space-y-3">
      <input ref={input} type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" hidden onChange={(e) => handle(e.target.files?.[0])} />
      {model ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-sand bg-cream-200/40 p-3">
          <Box className="h-5 w-5 text-brass" />
          <span className="min-w-0 flex-1 truncate text-sm text-walnut">{model.startsWith('upload:') ? 'Modelo enviado neste navegador' : model}</span>
          <Button size="sm" variant="secondary" onClick={() => setPreview((v) => !v)}>{preview ? 'Ocultar prévia' : 'Visualizar'}</Button>
          <Button size="sm" variant="secondary" loading={busy} icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => input.current?.click()}>Substituir</Button>
          <Button size="sm" variant="ghost" className="hover:!text-oxblood" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={async () => (await confirm({ title: 'Remover modelo 3D?', message: 'A página da peça passará a usar a vista por ângulos fotográficos.', danger: true, confirmLabel: 'Remover' })) && (services.files.remove(model), onChange(null), setPreview(false))}>Remover</Button>
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()} className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-sand py-8 text-sm text-tobacco transition hover:border-walnut hover:text-walnut">
          <Upload className="h-6 w-6" />
          {busy ? 'Enviando…' : 'Enviar modelo GLB/GLTF'}
          <span className="text-[11px]">Sem modelo, a loja exibe uma vista alternativa por ângulos fotográficos.</span>
        </button>
      )}
      {model && preview && <Model3DViewer src={model} poster={poster} title={name} className="aspect-[4/3] rounded-xl" />}
    </div>
  );
}

export function ProductFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const { data: categories } = useQuery(() => services.categories.list(), []);
  const { data: existing, loading } = useQuery(async () => (id ? services.products.get(id) : null), [id]);
  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (existing && !dirty) {
      const { id: _i, createdAt: _c, updatedAt: _u, views: _v, ...rest } = existing;
      setForm({ ...rest, status: rest.status === 'reservado' ? 'disponivel' : rest.status });
    }
  }, [existing, dirty]);
  useEffect(() => {
    if (isNew && categories?.length && !form.categoryId) setForm((f) => ({ ...f, categoryId: categories[0].id }));
  }, [categories, isNew, form.categoryId]);

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => {
    setDirty(true);
    setForm((f) => ({ ...f, [k]: v }));
  };
  const num = (v: string) => (v === '' ? 0 : Number(v.replace(',', '.')));

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = 'Informe um nome com pelo menos 3 caracteres.';
    if (!(form.price > 0)) e.price = 'Informe um preço maior que zero.';
    if (!form.categoryId) e.categoryId = 'Selecione uma categoria.';
    if (!form.description.trim()) e.description = 'Descreva a peça.';
    if (!form.material.trim()) e.material = 'Informe o material.';
    if (!form.era.trim()) e.era = 'Informe a época aproximada.';
    if (form.dimensions.height <= 0 || form.dimensions.width <= 0 || form.dimensions.depth <= 0) e.dimensions = 'Preencha altura, largura e profundidade.';
    if (form.weightKg <= 0) e.weightKg = 'Informe o peso.';
    setErrors(e);
    if (Object.keys(e).length) toast.error('Revise o formulário', `${Object.keys(e).length} campo(s) precisam de atenção.`);
    return !Object.keys(e).length;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, shortDescription: form.shortDescription || form.description.slice(0, 110) };
      if (isNew) {
        const p = await services.products.create(payload);
        toast.success('Peça cadastrada', 'Ela já aparece na loja pública.');
        nav(`/admin/produtos/${p.id}`, { replace: true });
      } else {
        await services.products.update(id!, payload);
        toast.success('Alterações salvas', 'A loja pública já reflete as mudanças.');
      }
      setDirty(false);
    } catch (e) {
      toast.error('Não foi possível salvar', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && loading && !existing) return <Skeleton className="h-96" />;
  if (!isNew && !existing && !loading) return <EmptyState title="Produto não encontrado" action={<Link to="/admin/produtos"><Button>Voltar</Button></Link>} />;

  return (
    <div>
      <PageHeader
        title={isNew ? 'Nova peça' : form.name || 'Editar peça'}
        description={isNew ? 'Preencha a ficha completa da peça.' : <>Última atualização: {existing && new Date(existing.updatedAt).toLocaleString('pt-BR')}</>}
        actions={
          <>
            {!isNew && existing && (
              <>
                <Link to={`/produto/${existing.slug}`} target="_blank"><Button variant="secondary" icon={<ExternalLink className="h-4 w-4" />}>Ver na loja</Button></Link>
                <Button variant="secondary" icon={<Copy className="h-4 w-4" />} onClick={async () => { const p = await services.products.create({ ...form, name: `${form.name} (cópia)`, status: 'disponivel' }); toast.success('Peça duplicada'); nav(`/admin/produtos/${p.id}`); }}>Duplicar</Button>
              </>
            )}
            <Button loading={saving} onClick={save}>{isNew ? 'Cadastrar peça' : 'Salvar alterações'}</Button>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card className="space-y-4">
            <p className="font-serif text-xl text-walnut">Informações principais</p>
            <Field label="Nome" required error={errors.name}><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Resumo" hint="Frase curta exibida nos cards e no topo da página."><Input value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} /></Field>
            <Field label="Descrição" required error={errors.description}><Textarea rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Preço (R$)" required error={errors.price}><Input inputMode="decimal" value={form.price || ''} onChange={(e) => set('price', num(e.target.value))} /></Field>
              <Field label="Preço “de” (opcional)"><Input inputMode="decimal" value={form.compareAtPrice || ''} onChange={(e) => set('compareAtPrice', num(e.target.value) || undefined)} /></Field>
              <Field label="Categoria" required error={errors.categoryId}>
                <Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                  {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
            </div>
          </Card>
          <Card className="space-y-4">
            <p className="font-serif text-xl text-walnut">Ficha técnica</p>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Altura (cm)" required error={errors.dimensions}><Input inputMode="decimal" value={form.dimensions.height || ''} onChange={(e) => set('dimensions', { ...form.dimensions, height: num(e.target.value) })} /></Field>
              <Field label="Largura (cm)" required><Input inputMode="decimal" value={form.dimensions.width || ''} onChange={(e) => set('dimensions', { ...form.dimensions, width: num(e.target.value) })} /></Field>
              <Field label="Profund. (cm)" required><Input inputMode="decimal" value={form.dimensions.depth || ''} onChange={(e) => set('dimensions', { ...form.dimensions, depth: num(e.target.value) })} /></Field>
              <Field label="Peso (kg)" required error={errors.weightKg}><Input inputMode="decimal" value={form.weightKg || ''} onChange={(e) => set('weightKg', num(e.target.value))} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Material" required error={errors.material}><Input value={form.material} onChange={(e) => set('material', e.target.value)} /></Field>
              <Field label="Estado de conservação">
                <Select value={form.conservation} onChange={(e) => set('conservation', e.target.value as Conservation)}>
                  {(Object.keys(conservationLabel) as Conservation[]).map((k) => <option key={k} value={k}>{conservationLabel[k]}</option>)}
                </Select>
              </Field>
              <Field label="Época" required error={errors.era}><Input value={form.era} onChange={(e) => set('era', e.target.value)} placeholder="Ex.: Década de 1950" /></Field>
              <Field label="Fabricante"><Input value={form.maker} onChange={(e) => set('maker', e.target.value)} /></Field>
              <Field label="Procedência" className="sm:col-span-2"><Input value={form.provenance} onChange={(e) => set('provenance', e.target.value)} /></Field>
            </div>
            <Field label="Observações sobre desgastes"><Textarea rows={3} value={form.wearNotes} onChange={(e) => set('wearNotes', e.target.value)} /></Field>
          </Card>
          <Card className="space-y-4">
            <p className="font-serif text-xl text-walnut">Fotografias</p>
            <PhotoManager photos={form.photos} onChange={(p) => set('photos', p)} />
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="space-y-4">
            <p className="font-serif text-xl text-walnut">Publicação</p>
            <Field label="Disponibilidade">
              <Select value={form.status} onChange={(e) => set('status', e.target.value as ProductStatus)}>
                <option value="disponivel">Disponível</option>
                <option value="vendido">Vendido</option>
                <option value="arquivado">Arquivado (oculto da loja)</option>
              </Select>
            </Field>
            {existing?.status === 'reservado' && <p className="text-[12.5px] text-[#8a5a0e]">Esta peça está reservada agora por um carrinho ou PIX em aberto.</p>}
            <div className="flex flex-col gap-3">
              <Toggle checked={form.featured} onChange={(v) => set('featured', v)} label="Destaque na página inicial" />
              <Toggle checked={form.isNew} onChange={(v) => set('isNew', v)} label="Marcar como novidade" />
            </div>
            <Field label="Etiquetas" hint="Separadas por vírgula. Usadas na busca e nos relacionados.">
              <Input value={form.tags.join(', ')} onChange={(e) => set('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))} />
            </Field>
          </Card>
          <Card className="space-y-4">
            <p className="font-serif text-xl text-walnut">Modelo 3D</p>
            <ModelManager model={form.model3d} onChange={(m) => set('model3d', m)} poster={form.photos[0]} name={form.name} />
          </Card>
          <DemoNotice title="Uploads simulados">Arquivos ficam no IndexedDB deste navegador. Na versão definitiva, serão enviados para um storage remoto (ex.: S3) com CDN.</DemoNotice>
        </div>
      </div>
    </div>
  );
}
