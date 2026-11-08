import { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Eye, MousePointerClick, Move, Pencil, Save, Trash2, Undo2 } from 'lucide-react';
import clsx from 'clsx';
import { services } from '@/services';
import type { Hotspot, Panorama } from '@/types/domain';
import { useQuery } from '@/hooks/useQuery';
import { toast } from '@/store/toast';
import { Badge, Button, Card, confirm, Field, Img, Input, Modal, Select, Skeleton, Tabs } from '@/design-system';
import { PanoramaViewer, type PanoMarker } from '@/viewers';
import { PanoramaExplorer } from '@/components/PanoramaExplorer';
import { PageHeader } from './AdminApp';

export function PanoramaEditorPage() {
  const { data: panoramas } = useQuery(() => services.panoramas.list(), []);
  const { data: products } = useQuery(() => services.products.list({ status: 'todos' }), []);
  const [panoId, setPanoId] = useState<string>('');
  const [draft, setDraft] = useState<Hotspot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState<{ yaw: number; pitch: number } | null>(null);
  const [pendingProduct, setPendingProduct] = useState('');
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const pano = panoramas?.find((p) => p.id === panoId);

  useEffect(() => {
    if (panoramas?.length && !panoId) setPanoId(panoramas[0].id);
  }, [panoramas, panoId]);
  const loadedFor = useRef('');
  useEffect(() => {
    // carrega o rascunho ao trocar de ambiente (não sobrescreve edições em andamento)
    if (pano && loadedFor.current !== pano.id) {
      loadedFor.current = pano.id;
      setDraft(pano.hotspots);
      setSelected(null);
    }
  }, [pano]);

  const dirty = useMemo(() => !!pano && JSON.stringify(pano.hotspots) !== JSON.stringify(draft), [pano, draft]);
  const byId = useMemo(() => new Map((products ?? []).map((p) => [p.id, p])), [products]);
  const used = new Set(draft.map((h) => h.productId));
  const available = (products ?? []).filter((p) => !used.has(p.id) && p.status !== 'arquivado');
  const sel = draft.find((h) => h.id === selected);

  const markers: PanoMarker[] = [
    ...draft.map((h) => ({ id: h.id, yaw: h.yaw, pitch: h.pitch, kind: 'product' as const, label: byId.get(h.productId)?.name ?? 'Produto removido' })),
    ...(pending ? [{ id: '__pending', yaw: pending.yaw, pitch: pending.pitch, kind: 'product' as const, label: 'Novo hotspot' }] : []),
  ];

  const switchPano = async (id: string) => {
    if (dirty && !(await confirm({ title: 'Descartar alterações?', message: 'Há hotspots não salvos neste ambiente.', danger: true, confirmLabel: 'Descartar' }))) return;
    setPanoId(id);
    setPreview(false);
  };
  const addPending = () => {
    if (!pending || !pendingProduct) return;
    const h: Hotspot = { id: `${panoId}-h${Date.now().toString(36)}`, productId: pendingProduct, yaw: pending.yaw, pitch: pending.pitch };
    setDraft((d) => [...d, h]);
    setSelected(h.id);
    setPending(null);
    setPendingProduct('');
    toast.info('Hotspot criado', 'Arraste o ponto para ajustar. Lembre-se de salvar.');
  };
  const update = (id: string, patch: Partial<Hotspot>) => setDraft((d) => d.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  const save = async () => {
    setSaving(true);
    await services.panoramas.saveHotspots(panoId, draft);
    setSaving(false);
    toast.success('Configuração salva', 'Os hotspots já aparecem na loja pública.');
  };

  if (!panoramas || !products) return <Skeleton className="h-[60vh]" />;
  const draftPano: Panorama | undefined = pano && { ...pano, hotspots: draft };

  return (
    <div>
      <PageHeader
        title="Editor panorâmico"
        description="Posicione os produtos nos ambientes 360° da loja."
        actions={
          <>
            <Button variant="secondary" icon={<Eye className="h-4 w-4" />} onClick={() => setPreview((v) => !v)}>{preview ? 'Voltar à edição' : 'Pré-visualizar como cliente'}</Button>
            <Button variant="ghost" icon={<Undo2 className="h-4 w-4" />} disabled={!dirty} onClick={() => pano && setDraft(pano.hotspots)}>Descartar</Button>
            <Button icon={<Save className="h-4 w-4" />} loading={saving} disabled={!dirty} onClick={save}>Salvar configuração</Button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={panoId} onChange={switchPano} tabs={panoramas.map((p) => ({ value: p.id, label: p.name }))} />
        {dirty && <Badge tone="amber">Alterações não salvas</Badge>}
      </div>

      {preview && draftPano ? (
        <div>
          <p className="mb-3 text-sm text-tobacco">Prévia exatamente como o cliente verá (inclui alterações ainda não salvas).</p>
          <PanoramaExplorer panorama={draftPano} products={products} panoramas={panoramas} onNavigate={(id) => switchPano(id)} />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div>
            {pano && (
              <PanoramaViewer
                key={pano.id}
                image={pano.image}
                imageMobile={pano.imageMobile}
                initialYaw={pano.initialYaw}
                markers={markers}
                activeMarkerId={selected ?? (pending ? '__pending' : null)}
                editable
                className="h-[58vh] min-h-[380px] rounded-2xl"
                onPanoramaClick={(pos) => {
                  setPending(pos);
                  setSelected(null);
                }}
                onMarkerClick={(m) => m.id !== '__pending' && setSelected(m.id)}
                onMarkerMove={(id, pos) => (id === '__pending' ? setPending(pos) : update(id, pos))}
              >
                <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-espresso/70 px-3 py-1.5 text-[12.5px] text-cream backdrop-blur">
                  <Crosshair className="mr-1 inline h-3.5 w-3.5" /> Modo edição · clique para criar · arraste os pontos
                </div>
              </PanoramaViewer>
            )}
            <div className="mt-3 grid gap-2 text-[12.5px] text-tobacco sm:grid-cols-3">
              <p className="flex items-center gap-2"><MousePointerClick className="h-4 w-4 text-brass" /> Clique no panorama para criar um hotspot</p>
              <p className="flex items-center gap-2"><Move className="h-4 w-4 text-brass" /> Arraste um ponto para reposicioná-lo</p>
              <p className="flex items-center gap-2"><Pencil className="h-4 w-4 text-brass" /> Clique em um ponto para editar</p>
            </div>
          </div>

          <div className="space-y-4">
            {sel ? (
              <Card className="space-y-4">
                <p className="font-serif text-xl text-walnut">Hotspot selecionado</p>
                <Field label="Produto">
                  <Select value={sel.productId} onChange={(e) => update(sel.id, { productId: e.target.value })}>
                    {[byId.get(sel.productId), ...available].filter(Boolean).map((p) => <option key={p!.id} value={p!.id}>{p!.name}</option>)}
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Horizontal (°)"><Input type="number" step="0.5" value={sel.yaw} onChange={(e) => update(sel.id, { yaw: Number(e.target.value) })} /></Field>
                  <Field label="Vertical (°)"><Input type="number" step="0.5" min={-85} max={85} value={sel.pitch} onChange={(e) => update(sel.id, { pitch: Math.max(-85, Math.min(85, Number(e.target.value))) })} /></Field>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setSelected(null)}>Concluir</Button>
                  <Button variant="ghost" size="sm" className="ml-auto hover:!text-oxblood" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={async () => (await confirm({ title: 'Excluir hotspot?', danger: true, confirmLabel: 'Excluir' })) && (setDraft((d) => d.filter((h) => h.id !== sel.id)), setSelected(null))}>
                    Excluir
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="text-sm text-tobacco">Selecione um ponto no panorama ou na lista para editar. Para criar, clique em qualquer lugar da imagem.</Card>
            )}
            <Card padded={false}>
              <p className="border-b border-sand/60 px-4 py-3 font-serif text-lg text-walnut">Hotspots ({draft.length})</p>
              <ul className="max-h-[40vh] divide-y divide-sand/60 overflow-y-auto">
                {draft.map((h) => {
                  const p = byId.get(h.productId);
                  return (
                    <li key={h.id}>
                      <button onClick={() => setSelected(h.id)} className={clsx('flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-walnut/5', selected === h.id && 'bg-brass/10')}>
                        <Img src={p?.photos[0]} alt="" className="h-10 w-10 shrink-0 rounded-lg" />
                        <span className="min-w-0 flex-1 truncate text-sm text-walnut">{p?.name ?? 'Produto removido'}</span>
                        <span className="text-[11px] tabular-nums text-tobacco">{h.yaw.toFixed(0)}°, {h.pitch.toFixed(0)}°</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </div>
      )}

      <Modal
        open={!!pending}
        onClose={() => (setPending(null), setPendingProduct(''))}
        title="Novo hotspot"
        size="sm"
        footer={<><Button variant="secondary" onClick={() => (setPending(null), setPendingProduct(''))}>Cancelar</Button><Button disabled={!pendingProduct} onClick={addPending}>Adicionar</Button></>}
      >
        <div className="space-y-4">
          <p className="text-sm text-tobacco">Posição: {pending?.yaw.toFixed(1)}° horizontal, {pending?.pitch.toFixed(1)}° vertical. Você pode arrastar o ponto depois.</p>
          <Field label="Produto">
            <Select value={pendingProduct} onChange={(e) => setPendingProduct(e.target.value)}>
              <option value="">Selecione…</option>
              {available.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          {pendingProduct && byId.get(pendingProduct) && (
            <div className="flex items-center gap-3 rounded-xl bg-cream-200/60 p-3">
              <Img src={byId.get(pendingProduct)!.photos[0]} alt="" className="h-14 w-14 rounded-lg" />
              <span className="font-serif text-lg text-walnut">{byId.get(pendingProduct)!.name}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
