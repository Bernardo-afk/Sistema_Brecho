// Visualizador de panoramas equiretangulares (imagem 360° pré-renderizada).
// Usado pela loja pública (exploração + hotspots) e pelo editor do painel
// (clique para criar hotspot, arrastar para reposicionar).
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { Compass, Loader2, Maximize2, Minimize2, Minus, Plus, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { useAssetUrl } from '@/utils/assets';
import { isLowEndDevice } from '@/utils/device';

export interface PanoMarker {
  id: string;
  yaw: number;
  pitch: number;
  kind: 'product' | 'nav';
  label: string;
  sublabel?: string;
  dimmed?: boolean;
  thumb?: string;
}

interface Props {
  image: string;
  imageMobile?: string;
  initialYaw?: number;
  markers: PanoMarker[];
  onMarkerClick?: (m: PanoMarker) => void;
  activeMarkerId?: string | null;
  /** modo editor: clique no panorama devolve a posição */
  onPanoramaClick?: (pos: { yaw: number; pitch: number }) => void;
  onMarkerMove?: (id: string, pos: { yaw: number; pitch: number }) => void;
  editable?: boolean;
  className?: string;
  children?: ReactNode;
  focus?: { yaw: number; pitch: number; key: number } | null;
}

const R = 50;
const DEG = Math.PI / 180;
export const dirFromYawPitch = (yaw: number, pitch: number) =>
  new THREE.Vector3(Math.cos(pitch * DEG) * Math.cos(yaw * DEG), Math.sin(pitch * DEG), Math.cos(pitch * DEG) * Math.sin(yaw * DEG));
const yawPitchFromDir = (d: THREE.Vector3) => ({ yaw: +(Math.atan2(d.z, d.x) / DEG).toFixed(2), pitch: +(Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)) / DEG).toFixed(2) });

const sphereMaterial = (tex: THREE.Texture) =>
  new THREE.ShaderMaterial({
    uniforms: { map: { value: tex } },
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D map; varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        vec2 uv = vec2(atan(d.z, d.x) / 6.283185307 + 0.5, asin(clamp(d.y,-1.0,1.0)) / 3.141592653 + 0.5);
        gl_FragColor = texture2D(map, uv);
        #include <colorspace_fragment>
      }`,
  });

interface ViewState {
  yaw: number;
  pitch: number;
  fov: number;
  vYaw: number;
  vPitch: number;
}

function Scene({ texture, view, markers, onMarkerClick, activeMarkerId, editable, onMarkerDown, draggingId }: {
  texture: THREE.Texture;
  view: React.MutableRefObject<ViewState>;
  markers: PanoMarker[];
  onMarkerClick?: (m: PanoMarker) => void;
  activeMarkerId?: string | null;
  editable?: boolean;
  onMarkerDown: (id: string, e: React.PointerEvent) => void;
  draggingId: string | null;
}) {
  const { camera } = useThree();
  const mat = useMemo(() => sphereMaterial(texture), [texture]);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(() => {
    const v = view.current;
    v.yaw += v.vYaw;
    v.pitch = THREE.MathUtils.clamp(v.pitch + v.vPitch, -85, 85);
    v.vYaw *= 0.9;
    v.vPitch *= 0.9;
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - v.fov) > 0.01) {
      cam.fov += (v.fov - cam.fov) * 0.2;
      cam.updateProjectionMatrix();
    }
    cam.lookAt(dirFromYawPitch(v.yaw, v.pitch));
  });
  return (
    <>
      <mesh material={mat}>
        <sphereGeometry args={[R, 64, 40]} />
      </mesh>
      {markers.map((m) => {
        const p = dirFromYawPitch(m.yaw, m.pitch).multiplyScalar(R * 0.9);
        const active = activeMarkerId === m.id;
        return (
          <Html key={m.id} position={p.toArray()} center zIndexRange={[40, 0]} style={{ pointerEvents: 'none' }}>
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                onMarkerDown(m.id, e);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!editable) onMarkerClick?.(m);
              }}
              aria-label={m.kind === 'nav' ? m.label : `Ver peça: ${m.label}`}
              className={clsx('group relative flex items-center justify-center', editable && 'cursor-grab active:cursor-grabbing')}
              style={{ pointerEvents: 'auto', touchAction: 'none' }}
            >
              {m.kind === 'product' ? (
                <>
                  {!m.dimmed && <span className="absolute h-11 w-11 animate-pulseRing rounded-full bg-cream/70" />}
                  <span className={clsx('relative flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-lift transition-transform duration-200 group-hover:scale-110', active ? 'scale-110 border-brass bg-walnut' : 'border-cream bg-espresso/55 backdrop-blur', m.dimmed && 'opacity-60')}>
                    <span className={clsx('h-3 w-3 rounded-full', active ? 'bg-brass' : 'bg-cream')} />
                  </span>
                  <span className={clsx('pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-espresso/85 px-3 py-1 text-[12px] font-medium text-cream shadow-lift backdrop-blur transition-opacity', active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100')}>
                    {m.label}
                    {m.sublabel && <span className="ml-1.5 text-brass-light">{m.sublabel}</span>}
                  </span>
                </>
              ) : (
                <span className="flex items-center gap-2 rounded-full border border-cream/70 bg-espresso/60 py-2 pl-2.5 pr-3.5 text-[12.5px] font-semibold text-cream shadow-lift backdrop-blur transition hover:bg-walnut">
                  <Compass className="h-4 w-4 text-brass-light" />
                  {m.label}
                </span>
              )}
            </button>
          </Html>
        );
      })}
    </>
  );
}

export function PanoramaViewer({ image, imageMobile, initialYaw = 0, markers, onMarkerClick, activeMarkerId, onPanoramaClick, onMarkerMove, editable, className, children, focus }: Props) {
  const low = useMemo(isLowEndDevice, []);
  const url = useAssetUrl(low && imageMobile ? imageMobile : image);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [hint, setHint] = useState(true);
  const wrap = useRef<HTMLDivElement>(null);
  const view = useRef<ViewState>({ yaw: initialYaw, pitch: 0, fov: low ? 80 : 72, vYaw: 0, vPitch: 0 });
  const camRef = useRef<THREE.PerspectiveCamera | null>(null);
  const drag = useRef<{ x: number; y: number; sx: number; sy: number; moved: boolean; pinch?: number; pointers: Map<number, { x: number; y: number }> }>({ x: 0, y: 0, sx: 0, sy: 0, moved: false, pointers: new Map() });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragMoved = useRef(false);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    setTexture(null);
    setError(false);
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.onprogress = (e) => e.lengthComputable && alive && setProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (!alive) return;
      if (xhr.status >= 400) return setError(true);
      const objUrl = URL.createObjectURL(xhr.response);
      new THREE.TextureLoader().load(
        objUrl,
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.minFilter = THREE.LinearFilter;
          t.generateMipmaps = false;
          if (alive) setTexture(t);
          URL.revokeObjectURL(objUrl);
        },
        undefined,
        () => alive && setError(true),
      );
    };
    xhr.onerror = () => alive && setError(true);
    xhr.send();
    return () => {
      alive = false;
      xhr.abort();
    };
  }, [url]);

  useEffect(() => {
    view.current.yaw = initialYaw;
    view.current.pitch = 0;
  }, [initialYaw, image]);

  useEffect(() => {
    if (focus) {
      setHint(false);
      view.current.yaw = focus.yaw;
      view.current.pitch = THREE.MathUtils.clamp(focus.pitch, -60, 60) * 0.6;
      view.current.vYaw = view.current.vPitch = 0;
    }
  }, [focus]);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === wrap.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const pointToYawPitch = (clientX: number, clientY: number) => {
    const el = wrap.current!.getBoundingClientRect();
    const cam = camRef.current!;
    const ndc = new THREE.Vector3(((clientX - el.left) / el.width) * 2 - 1, -((clientY - el.top) / el.height) * 2 + 1, 0.5);
    ndc.unproject(cam);
    return yawPitchFromDir(ndc.sub(cam.position).normalize());
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const d = drag.current;
    d.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    d.x = d.sx = e.clientX;
    d.y = d.sy = e.clientY;
    d.moved = false;
    view.current.vYaw = view.current.vPitch = 0;
    setHint(false);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (draggingId && onMarkerMove) {
      dragMoved.current = true;
      onMarkerMove(draggingId, pointToYawPitch(e.clientX, e.clientY));
      return;
    }
    if (!d.pointers.has(e.pointerId)) return;
    d.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (d.pointers.size === 2) {
      const [a, b] = [...d.pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (d.pinch) view.current.fov = THREE.MathUtils.clamp(view.current.fov * (d.pinch / dist), 30, 95);
      d.pinch = dist;
      d.moved = true;
      return;
    }
    const k = (view.current.fov / (wrap.current?.clientHeight || 600)) * 1.0;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 5) d.moved = true;
    view.current.yaw -= dx * k;
    view.current.pitch = THREE.MathUtils.clamp(view.current.pitch + dy * k, -85, 85);
    view.current.vYaw = -dx * k * 0.35;
    view.current.vPitch = dy * k * 0.35;
    d.x = e.clientX;
    d.y = e.clientY;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    d.pointers.delete(e.pointerId);
    if (d.pointers.size < 2) d.pinch = undefined;
    if (draggingId) {
      const m = markers.find((x) => x.id === draggingId);
      if (!dragMoved.current && m) onMarkerClick?.(m);
      setDraggingId(null);
      return;
    }
    if (!d.moved && onPanoramaClick && camRef.current && e.button === 0) onPanoramaClick(pointToYawPitch(e.clientX, e.clientY));
  };
  const onWheel = (e: React.WheelEvent) => {
    view.current.fov = THREE.MathUtils.clamp(view.current.fov + e.deltaY * 0.04, 30, 95);
  };
  const onKey = (e: React.KeyboardEvent) => {
    const v = view.current;
    if (e.key === 'ArrowLeft') v.vYaw = -2;
    else if (e.key === 'ArrowRight') v.vYaw = 2;
    else if (e.key === 'ArrowUp') v.vPitch = 1.5;
    else if (e.key === 'ArrowDown') v.vPitch = -1.5;
    else if (e.key === '+' || e.key === '=') v.fov = Math.max(30, v.fov - 8);
    else if (e.key === '-') v.fov = Math.min(95, v.fov + 8);
    else return;
    e.preventDefault();
  };

  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else wrap.current?.requestFullscreen?.().catch(() => setFullscreen((f) => !f));
  };

  return (
    <div
      ref={wrap}
      className={clsx('relative select-none overflow-hidden bg-espresso', fullscreen && 'fixed inset-0 z-[60] !h-full !rounded-none', className)}
      tabIndex={0}
      onKeyDown={onKey}
      aria-label="Panorama interativo. Arraste para olhar ao redor; use as setas do teclado ou a roda do mouse para zoom."
      style={{ touchAction: 'none', cursor: editable ? 'crosshair' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      {texture && (
        <Canvas
          dpr={low ? 1 : [1, 1.75]}
          gl={{ antialias: !low, toneMapping: THREE.NoToneMapping }}
          camera={{ fov: view.current.fov, near: 0.1, far: 200, position: [0, 0, 0] }}
          onCreated={({ camera }) => (camRef.current = camera as THREE.PerspectiveCamera)}
          flat
        >
          <Scene
            texture={texture}
            view={view}
            markers={markers}
            onMarkerClick={onMarkerClick}
            activeMarkerId={activeMarkerId}
            editable={editable}
            draggingId={draggingId}
            onMarkerDown={(id) => {
              if (editable) {
                dragMoved.current = false;
                setDraggingId(id);
              }
            }}
          />
        </Canvas>
      )}
      {!texture && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-walnut-800 to-espresso text-cream">
          <Loader2 className="h-6 w-6 animate-spin text-brass-light" />
          <p className="font-serif text-xl italic">Preparando o ambiente…</p>
          <div className="h-1 w-48 overflow-hidden rounded-full bg-cream/15">
            <div className="h-full bg-brass transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-cream/60">{progress}% · {low ? 'qualidade otimizada para este dispositivo' : 'alta resolução'}</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-walnut-800 p-6 text-center text-cream">
          <p className="font-serif text-2xl">Não foi possível carregar o panorama</p>
          <p className="text-sm text-cream/70">Verifique sua conexão e tente novamente. As peças continuam disponíveis na lista.</p>
        </div>
      )}
      {texture && hint && !editable && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 animate-fadeIn items-center gap-2 rounded-full bg-espresso/70 px-4 py-2 text-sm text-cream backdrop-blur">
          <span className="inline-block animate-pulse">⟷</span> Arraste para explorar · toque nos pontos para ver as peças
        </div>
      )}
      <div className="absolute bottom-3 right-3 flex gap-1.5" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
        {[
          { l: 'Aproximar', i: <Plus className="h-4 w-4" />, f: () => (view.current.fov = Math.max(30, view.current.fov - 10)) },
          { l: 'Afastar', i: <Minus className="h-4 w-4" />, f: () => (view.current.fov = Math.min(95, view.current.fov + 10)) },
          { l: 'Voltar à vista inicial', i: <RotateCcw className="h-4 w-4" />, f: () => Object.assign(view.current, { yaw: initialYaw, pitch: 0, vYaw: 0, vPitch: 0, fov: low ? 80 : 72 }) },
          { l: fullscreen ? 'Sair da tela cheia' : 'Tela cheia', i: fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />, f: toggleFs },
        ].map((b) => (
          <button key={b.l} type="button" title={b.l} aria-label={b.l} onClick={b.f} className="flex h-10 w-10 items-center justify-center rounded-full bg-espresso/65 text-cream backdrop-blur transition hover:bg-walnut">
            {b.i}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
