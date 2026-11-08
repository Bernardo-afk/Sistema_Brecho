import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Download, ExternalLink, FileText, ImagePlus, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { services } from '@/services';
import type { AdminRole, AdminUser, Article, ArticleStatus } from '@/types/domain';
import { useQuery } from '@/hooks/useQuery';
import { useSession } from '@/store/session';
import { useCart } from '@/store/cart';
import { useCheckout } from '@/store/checkout';
import { toast } from '@/store/toast';
import { Badge, Button, Card, confirm, DemoNotice, Drawer, EmptyState, Field, Img, Input, Modal, Select, Tabs, Textarea, Toggle } from '@/design-system';
import { articleStatusLabel, date, dateTime, roleLabel } from '@/utils/format';
import { PageHeader, PERMISSIONS, useAdminUser } from './AdminApp';

const COVERS = ['assets/scenes/escritorio-detalhe.jpg', 'assets/scenes/sala-vitrola.jpg', 'assets/scenes/sala-sobre.jpg', 'assets/scenes/sala-capa.jpg', 'assets/scenes/escritorio-capa.jpg', 'assets/scenes/dormitorio-capa.jpg'];

function toLocalInput(iso: string) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function ArticlesPage() {
  const { data: articles } = useQuery(() => services.articles.list(), []);
  const user = useAdminUser();
  const [tab, setTab] = useState<'todos' | ArticleStatus>('todos');
  const [editing, setEditing] = useState<Partial<Article> | null>(null);
  const [saving, setSaving] = useState(false);
  const cover = useRef<HTMLInputElement>(null);
  const list = (articles ?? []).filter((a) => tab === 'todos' || a.status === tab);
  const effective = (a: Article) => (a.status === 'agendado' && new Date(a.publishAt) <= new Date() ? 'publicado' : a.status);

  const save = async (status?: ArticleStatus) => {
    const e = editing!;
    if (!e.title?.trim()) return toast.error('Informe o título');
    if (!e.body?.trim()) return toast.error('Escreva o conteúdo do artigo');
    setSaving(true);
    const finalStatus = status ?? e.status ?? 'rascunho';
    const data = {
      slug: e.slug ?? '',
      title: e.title,
      excerpt: e.excerpt ?? '',
      body: e.body,
      cover: e.cover ?? COVERS[0],
      author: e.author ?? user?.name ?? 'Equipe',
      status: finalStatus,
      publishAt: finalStatus === 'publicado' && (!e.publishAt || new Date(e.publishAt) > new Date()) ? new Date().toISOString() : e.publishAt ?? new Date().toISOString(),
      seoTitle: e.seoTitle || `${e.title} | Casa Âmbar`,
      seoDescription: e.seoDescription || e.excerpt || '',
      tags: e.tags ?? [],
    };
    if (e.id) await services.articles.update(e.id, data);
    else await services.articles.create(data);
    setSaving(false);
    setEditing(null);
    toast.success(finalStatus === 'publicado' ? 'Artigo publicado' : finalStatus === 'agendado' ? `Agendado para ${dateTime(data.publishAt)}` : 'Rascunho salvo', finalStatus === 'publicado' ? 'Já está visível na área pública.' : undefined);
  };

  return (
    <div>
      <PageHeader title="Conteúdo editorial" description="Artigos exibidos na home e no diário do antiquário." actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing({ status: 'rascunho', publishAt: new Date(Date.now() + 86400000).toISOString(), cover: COVERS[0], tags: [] })}>Novo artigo</Button>} />
      <Tabs className="mb-4 w-fit" value={tab} onChange={setTab} tabs={[{ value: 'todos', label: 'Todos' }, { value: 'publicado', label: 'Publicados' }, { value: 'agendado', label: 'Agendados' }, { value: 'rascunho', label: 'Rascunhos' }]} />
      {!list.length ? (
        <EmptyState icon={<FileText className="h-6 w-6" />} title="Nenhum artigo nesta lista" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((a) => (
            <Card key={a.id} padded={false} className="overflow-hidden">
              <Img src={a.cover} alt="" className="aspect-[16/9]" />
              <div className="space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <Badge tone={effective(a) === 'publicado' ? 'green' : effective(a) === 'agendado' ? 'amber' : 'neutral'}>{articleStatusLabel[effective(a)]}</Badge>
                  <span className="text-[12px] text-tobacco">{effective(a) === 'agendado' ? `publica em ${dateTime(a.publishAt)}` : date(a.publishAt)}</span>
                </div>
                <p className="font-serif text-xl leading-tight text-walnut">{a.title}</p>
                <p className="line-clamp-2 text-[13px] text-tobacco">{a.excerpt}</p>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="secondary" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditing(a)}>Editar</Button>
                  {effective(a) === 'publicado' && <Link to={`/editorial/${a.slug}`} target="_blank"><Button size="sm" variant="ghost" icon={<ExternalLink className="h-3.5 w-3.5" />}>Ver</Button></Link>}
                  <Button size="sm" variant="ghost" className="ml-auto hover:!text-oxblood" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={async () => (await confirm({ title: 'Excluir artigo?', message: a.title, danger: true, confirmLabel: 'Excluir' })) && services.articles.remove(a.id).then(() => toast.success('Artigo excluído'))}>Excluir</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        width="max-w-2xl"
        title={editing?.id ? 'Editar artigo' : 'Novo artigo'}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" loading={saving} onClick={() => save('rascunho')}>Salvar rascunho</Button>
            <Button variant="secondary" loading={saving} onClick={() => save('agendado')}>Agendar</Button>
            <Button loading={saving} onClick={() => save('publicado')}>Publicar agora</Button>
          </div>
        }
      >
        {editing && (
          <div className="space-y-4 p-5">
            <Field label="Título" required><Input value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="Resumo"><Textarea rows={2} value={editing.excerpt ?? ''} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} /></Field>
            <Field label="Conteúdo" required hint="Separe parágrafos com uma linha em branco."><Textarea rows={10} value={editing.body ?? ''} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></Field>
            <Field label="Imagem de capa">
              <div className="grid grid-cols-4 gap-2">
                {[...(editing.cover && !COVERS.includes(editing.cover) ? [editing.cover] : []), ...COVERS].map((c) => (
                  <button key={c} type="button" onClick={() => setEditing({ ...editing, cover: c })} className={`relative overflow-hidden rounded-lg border-2 ${editing.cover === c ? 'border-walnut' : 'border-transparent'}`}>
                    <Img src={c} alt="" className="aspect-[4/3]" />
                    {editing.cover === c && <Check className="absolute right-1 top-1 h-4 w-4 rounded-full bg-walnut p-0.5 text-cream" />}
                  </button>
                ))}
                <input ref={cover} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const { ref } = await services.files.upload(f); setEditing((ed) => ({ ...ed, cover: ref })); } }} />
                <button type="button" onClick={() => cover.current?.click()} className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-sand text-[11px] text-tobacco hover:border-walnut"><ImagePlus className="h-4 w-4" /> Enviar</button>
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Data de publicação" hint="Agendados aparecem automaticamente nesta data."><Input type="datetime-local" value={editing.publishAt ? toLocalInput(editing.publishAt) : ''} onChange={(e) => setEditing({ ...editing, publishAt: new Date(e.target.value).toISOString() })} /></Field>
              <Field label="Etiquetas"><Input value={(editing.tags ?? []).join(', ')} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} /></Field>
            </div>
            <div className="rounded-2xl border border-sand p-4">
              <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-[.14em] text-tobacco">SEO</p>
              <div className="space-y-3">
                <Field label="Título SEO" hint={`${(editing.seoTitle || editing.title || '').length}/60 caracteres`}><Input value={editing.seoTitle ?? ''} placeholder={`${editing.title ?? ''} | Casa Âmbar`} onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })} /></Field>
                <Field label="Descrição SEO" hint={`${(editing.seoDescription || '').length}/160 caracteres`}><Textarea rows={2} value={editing.seoDescription ?? ''} onChange={(e) => setEditing({ ...editing, seoDescription: e.target.value })} /></Field>
                <div className="rounded-xl bg-white p-3 shadow-soft">
                  <p className="text-[12px] text-[#1a6b2a]">casaambar.exemplo › editorial › {editing.slug || 'novo-artigo'}</p>
                  <p className="text-[17px] text-[#1a0dab]">{editing.seoTitle || `${editing.title || 'Título do artigo'} | Casa Âmbar`}</p>
                  <p className="text-[13px] text-[#4d5156]">{editing.seoDescription || editing.excerpt || 'A descrição do artigo aparecerá aqui nos resultados de busca.'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export function UsersPage() {
  const { data: users } = useQuery(() => services.admin.listUsers(), []);
  const current = useSession((s) => s.adminUserId);
  const [editing, setEditing] = useState<Partial<AdminUser> | null>(null);
  const areas = ['dashboard', 'produtos', 'categorias', 'panoramas', 'pedidos', 'clientes', 'cupons', 'conteudo', 'usuarios', 'configuracoes'] as const;
  const save = async () => {
    const e = editing!;
    if (!e.name?.trim() || !/^\S+@\S+\.\S+$/.test(e.email ?? '')) return toast.error('Preencha nome e e-mail válidos');
    if (e.id) await services.admin.updateUser(e.id, e);
    else await services.admin.createUser({ name: e.name, email: e.email!, role: e.role ?? 'estoque', avatarColor: ['#7a2e22', '#4a2f1d', '#6f7a5c', '#b08a40', '#2b4c8c'][Math.floor(Math.random() * 5)], active: true });
    toast.success('Usuário salvo', 'Convite por e-mail simulado (não enviado).');
    setEditing(null);
  };
  return (
    <div>
      <PageHeader title="Usuários administrativos" description="Perfis locais com níveis de acesso simulados." actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing({ role: 'estoque' })}>Novo usuário</Button>} />
      <DemoNotice title="Autorização simulada" className="mb-4">Não há senha nem login real. A troca de perfil no topo do painel mostra como cada nível de acesso enxerga o sistema. Na versão definitiva, as permissões serão validadas pelo servidor.</DemoNotice>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {users?.map((u) => (
          <Card key={u.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full font-serif text-xl text-cream" style={{ background: u.avatarColor }}>{u.name[0]}</span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-walnut">{u.name}</p>
                <p className="truncate text-[12px] text-tobacco">{u.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone={u.role === 'admin' ? 'brass' : 'neutral'}>{roleLabel[u.role]}</Badge>
              {u.id === current && <Badge tone="green">Perfil ativo</Badge>}
              {!u.active && <Badge tone="red">Inativo</Badge>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditing(u)}>Editar</Button>
              {u.role !== 'admin' && <Button size="sm" variant="ghost" onClick={() => services.admin.updateUser(u.id, { active: !u.active })}>{u.active ? 'Desativar' : 'Ativar'}</Button>}
              {u.role !== 'admin' && u.id !== current && <Button size="sm" variant="ghost" className="ml-auto hover:!text-oxblood" onClick={async () => (await confirm({ title: `Remover ${u.name}?`, danger: true, confirmLabel: 'Remover' })) && services.admin.removeUser(u.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
            </div>
          </Card>
        ))}
      </div>
      <Card className="mt-6 overflow-x-auto">
        <p className="mb-3 font-serif text-xl text-walnut">Matriz de permissões</p>
        <table className="w-full min-w-[720px] text-center text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-[.1em] text-tobacco">
              <th className="py-2 text-left">Perfil</th>
              {areas.map((a) => <th key={a} className="py-2">{a}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand/60">
            {(Object.keys(PERMISSIONS) as AdminRole[]).map((r) => (
              <tr key={r}>
                <td className="py-2 text-left font-medium text-walnut">{roleLabel[r]}</td>
                {areas.map((a) => {
                  const ok = PERMISSIONS[r] === '*' || (PERMISSIONS[r] as readonly string[]).includes(a);
                  return <td key={a}>{ok ? <Check className="mx-auto h-4 w-4 text-sage" /> : <X className="mx-auto h-4 w-4 text-sand-500" />}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Editar usuário' : 'Novo usuário'} size="sm" footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button><Button onClick={save}>Salvar</Button></>}>
        {editing && (
          <div className="space-y-4">
            <Field label="Nome" required><Input value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="E-mail" required><Input type="email" value={editing.email ?? ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
            <Field label="Nível de acesso">
              <Select value={editing.role} disabled={editing.role === 'admin' && !!editing.id} onChange={(e) => setEditing({ ...editing, role: e.target.value as AdminRole })}>
                {(Object.keys(roleLabel) as AdminRole[]).map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
              </Select>
            </Field>
            {editing.id && editing.role !== 'admin' && <Toggle checked={editing.active ?? true} onChange={(v) => setEditing({ ...editing, active: v })} label="Usuário ativo" />}
          </div>
        )}
      </Modal>
    </div>
  );
}

export function SettingsPage() {
  const [resetting, setResetting] = useState(false);
  const reset = async () => {
    if (!(await confirm({ title: 'Restaurar a demonstração?', message: 'Todos os produtos, pedidos, cupons, hotspots, artigos e uploads voltarão ao estado original. Carrinho e sessão também serão limpos.', danger: true, confirmLabel: 'Restaurar dados originais' }))) return;
    setResetting(true);
    await services.admin.resetDemo();
    useCart.setState({ items: [], couponCode: null });
    useCheckout.getState().reset();
    useSession.getState().setCustomer(null);
    setResetting(false);
    toast.success('Demonstração restaurada', 'Os dados originais foram recarregados.');
  };
  const exportData = () => {
    const raw = localStorage.getItem('casa-ambar:demo-db') ?? '{}';
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `casa-ambar-demo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Demonstração" description="Controles do protótipo e informações sobre o que é simulado." />
      <Card className="space-y-4">
        <p className="font-serif text-xl text-walnut">Dados da demonstração</p>
        <p className="text-sm text-tobacco">Tudo o que você altera fica salvo no armazenamento local deste navegador. Outros navegadores e dispositivos veem os dados originais.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" loading={resetting} icon={<RotateCcw className="h-4 w-4" />} onClick={reset}>Restaurar dados originais</Button>
          <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={exportData}>Exportar dados (JSON)</Button>
        </div>
      </Card>
      <Card className="space-y-3 text-sm">
        <p className="font-serif text-xl text-walnut">O que é simulado neste protótipo</p>
        <ul className="list-disc space-y-1.5 pl-5 text-tobacco">
          <li>Banco de dados e API: serviços mock em <code>src/services/mock</code> com persistência em localStorage.</li>
          <li>Uploads: IndexedDB local (sem storage remoto).</li>
          <li>Pagamento PIX: QR Code e código ilustrativos, aprovação por botão.</li>
          <li>Frete e CEP: valores calculados localmente pela região do CEP.</li>
          <li>Reservas: temporizadores no navegador (sem exclusividade entre dispositivos).</li>
          <li>Autenticação e permissões: perfis locais, sem senha.</li>
          <li>E-mails e WhatsApp: não são enviados; apenas mensagens na interface.</li>
        </ul>
      </Card>
    </div>
  );
}
