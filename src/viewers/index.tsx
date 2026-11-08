// Visualizadores 3D carregados sob demanda: o Three.js (~300 KB gzip) só é baixado
// quando o visitante abre um panorama ou um modelo 3D.
import { lazy, Suspense, type ComponentProps } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';
export type { PanoMarker } from './PanoramaViewer';
export { PhotoAngleViewer } from './PhotoAngleViewer';

const PanoramaViewerImpl = lazy(() => import('./PanoramaViewer').then((m) => ({ default: m.PanoramaViewer })));
const Model3DViewerImpl = lazy(() => import('./Model3DViewer').then((m) => ({ default: m.Model3DViewer })));

function Fallback({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <div className={clsx('flex items-center justify-center gap-2', dark ? 'bg-walnut-800 text-cream' : 'bg-cream-200 text-tobacco', className)}>
      <Loader2 className="h-5 w-5 animate-spin" /> <span className="font-serif text-lg italic">Carregando visualizador…</span>
    </div>
  );
}

export function PanoramaViewer(props: ComponentProps<typeof PanoramaViewerImpl>) {
  return (
    <Suspense fallback={<Fallback className={props.className} dark />}>
      <PanoramaViewerImpl {...props} />
    </Suspense>
  );
}

export function Model3DViewer(props: ComponentProps<typeof Model3DViewerImpl>) {
  return (
    <Suspense fallback={<Fallback className={props.className} />}>
      <Model3DViewerImpl {...props} />
    </Suspense>
  );
}
