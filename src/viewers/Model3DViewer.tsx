// Visualizador de modelos GLB/GLTF com rotação 360°, zoom, toque, carregamento
// progressivo e fallback. Qualidade reduzida automaticamente em dispositivos modestos.
import { Canvas, useThree } from '@react-three/fiber';
import { Bounds, ContactShadows, OrbitControls, useBounds, useGLTF, useProgress } from '@react-three/drei';
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Box, Hand, Maximize2, Minimize2, Pause, Play, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import clsx from 'clsx';
import { useAssetUrl } from '@/utils/assets';
import { isLowEndDevice } from '@/utils/device';

function Env() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const tex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = tex;
    return () => {
      scene.environment = null;
      tex.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Model({ url, onReady }: { url: string; onReady: (size: number) => void }) {
  const { scene } = useGLTF(url);
  const obj = useMemo(() => {
    const c = scene.clone(true);
    const box = new THREE.Box3().setFromObject(c);
    const size = box.getSize(new THREE.Vector3());
    const s = 1.6 / Math.max(size.x, size.y, size.z);
    c.scale.setScalar(s);
    const b2 = new THREE.Box3().setFromObject(c);
    const center = b2.getCenter(new THREE.Vector3());
    c.position.set(-center.x, -b2.min.y, -center.z);
    c.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);
  useEffect(() => onReady(1), [obj, onReady]);
  return <primitive object={obj} />;
}

function FitOnLoad({ trigger }: { trigger: number }) {
  const bounds = useBounds();
  useEffect(() => {
    bounds.refresh().clip().fit();
  }, [trigger, bounds]);
  return null;
}

function Progress({ poster }: { poster: string }) {
  const { progress, active } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
      {poster && <img src={poster} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-40 blur-md" />}
      <div className="relative flex flex-col items-center gap-3 rounded-2xl bg-cream-50/85 px-6 py-5 shadow-soft backdrop-blur">
        <Box className="h-6 w-6 animate-pulse text-brass" />
        <p className="font-serif text-lg italic text-walnut">Carregando modelo 3D…</p>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-sand/60">
          <div className="h-full bg-walnut transition-all" style={{ width: `${Math.round(progress)}%` }} />
        </div>
        <span className="text-xs text-tobacco">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function Model3DViewer({ src, poster, className, title }: { src: string; poster?: string; className?: string; title: string }) {
  const url = useAssetUrl(src);
  const posterUrl = useAssetUrl(poster);
  const low = useMemo(isLowEndDevice, []);
  const controls = useRef<OrbitControlsImpl | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [auto, setAuto] = useState(true);
  const [ready, setReady] = useState(0);
  const [fs, setFs] = useState(false);
  const [interacted, setInteracted] = useState(false);

  useEffect(() => {
    const onFs = () => setFs(document.fullscreenElement === wrap.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const zoom = (f: number) => {
    const c = controls.current;
    if (!c) return;
    const cam = c.object as THREE.PerspectiveCamera;
    const dir = cam.position.clone().sub(c.target);
    const len = THREE.MathUtils.clamp(dir.length() * f, c.minDistance, c.maxDistance);
    cam.position.copy(c.target).add(dir.setLength(len));
    c.update();
  };

  const fallback = (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-cream-200 p-6 text-center">
      <Box className="h-7 w-7 text-tobacco" />
      <p className="font-serif text-xl text-walnut">Não foi possível exibir o modelo 3D</p>
      <p className="max-w-xs text-sm text-tobacco">O arquivo pode estar corrompido ou o navegador não suporta WebGL. As fotografias continuam disponíveis.</p>
    </div>
  );

  if (!url) return <div className={clsx('relative bg-cream-200', className)}>{fallback}</div>;

  return (
    <div ref={wrap} className={clsx('relative overflow-hidden bg-gradient-to-b from-cream-50 to-cream-200', fs && 'fixed inset-0 z-[60]', className)} style={{ touchAction: 'none' }} onPointerDown={() => setInteracted(true)}>
      <ErrorBoundary fallback={fallback}>
        <Canvas shadows={!low} dpr={low ? [1, 1.25] : [1, 2]} gl={{ antialias: !low, preserveDrawingBuffer: false }} camera={{ position: [2.2, 1.4, 2.6], fov: 35, near: 0.01, far: 100 }} aria-label={`Modelo 3D: ${title}`}>
          <Env />
          <hemisphereLight args={['#fff6e8', '#7a5c3c', 0.6]} />
          <directionalLight position={[3, 5, 3]} intensity={2.2} castShadow={!low} shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-3, 2, -2]} intensity={0.7} color="#ffe2b8" />
          <Suspense fallback={null}>
            <Bounds margin={1.25}>
              <Model url={url} onReady={setReady} />
              <FitOnLoad trigger={ready} />
            </Bounds>
            <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={4} blur={2.6} far={2} resolution={low ? 256 : 512} color="#3b2416" />
          </Suspense>
          <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping dampingFactor={0.08} autoRotate={auto} autoRotateSpeed={1.1} minDistance={0.8} maxDistance={7} minPolarAngle={0.15} maxPolarAngle={Math.PI / 2 - 0.02} onStart={() => setAuto(false)} />
        </Canvas>
        <Progress poster={posterUrl} />
      </ErrorBoundary>
      {!interacted && ready > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-full bg-espresso/70 px-3.5 py-1.5 text-[12.5px] text-cream backdrop-blur">
          <Hand className="h-3.5 w-3.5" /> Arraste para girar · pinça ou roda para zoom
        </div>
      )}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-cream-50/90 p-1 shadow-soft backdrop-blur">
        {[
          { l: auto ? 'Pausar rotação' : 'Girar automaticamente', i: auto ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />, f: () => setAuto((a) => !a) },
          { l: 'Aproximar', i: <ZoomIn className="h-4 w-4" />, f: () => zoom(0.8) },
          { l: 'Afastar', i: <ZoomOut className="h-4 w-4" />, f: () => zoom(1.25) },
          { l: 'Restaurar vista', i: <RotateCcw className="h-4 w-4" />, f: () => (controls.current?.reset(), setReady((r) => r + 1)) },
          { l: fs ? 'Sair da tela cheia' : 'Tela cheia', i: fs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />, f: () => (document.fullscreenElement ? document.exitFullscreen() : wrap.current?.requestFullscreen?.().catch(() => setFs((v) => !v))) },
        ].map((b) => (
          <button key={b.l} type="button" title={b.l} aria-label={b.l} onClick={b.f} className="flex h-9 w-9 items-center justify-center rounded-full text-walnut transition hover:bg-walnut hover:text-cream">
            {b.i}
          </button>
        ))}
      </div>
    </div>
  );
}

