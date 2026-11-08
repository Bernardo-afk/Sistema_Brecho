import { useRef, useState } from 'react';
import clsx from 'clsx';
import { useAssetUrl } from '@/utils/assets';

/** Experiência alternativa para peças sem modelo 3D: ângulos fotográficos com arraste e lupa. */
export function PhotoAngleViewer({ photos, title, className }: { photos: string[]; title: string; className?: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const start = useRef<number | null>(null);
  const url = useAssetUrl(photos[i]);
  return (
    <div
      className={clsx('relative cursor-ew-resize overflow-hidden bg-cream-200', className)}
      style={{ touchAction: 'pan-y' }}
      onPointerDown={(e) => (start.current = e.clientX)}
      onPointerMove={(e) => {
        if (start.current == null) {
          if (e.pointerType === 'mouse') {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }
          return;
        }
        const dx = e.clientX - start.current;
        if (Math.abs(dx) > 60) {
          setI((v) => (v + (dx < 0 ? 1 : photos.length - 1)) % photos.length);
          start.current = e.clientX;
        }
      }}
      onPointerUp={() => (start.current = null)}
      onPointerLeave={() => {
        start.current = null;
        setZoom(null);
      }}
    >
      {url && <img src={url} alt={`${title}, ângulo ${i + 1}`} className="h-full w-full object-cover transition-transform duration-300" draggable={false} style={zoom ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />}
      <div className="absolute left-4 top-4 rounded-full bg-cream-50/90 px-3 py-1.5 text-[12px] font-medium text-walnut shadow-soft">
        Vista por ângulos · {i + 1}/{photos.length}
      </div>
      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
        {photos.map((_, k) => (
          <button key={k} aria-label={`Ângulo ${k + 1}`} onClick={() => setI(k)} className={clsx('h-1.5 rounded-full transition-all', k === i ? 'w-6 bg-walnut' : 'w-1.5 bg-walnut/30')} />
        ))}
      </div>
    </div>
  );
}
