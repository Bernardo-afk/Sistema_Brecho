import { useEffect, useState } from 'react';
import { services } from '@/services';

/** Converte uma referência estática (`assets/...`) em URL respeitando o `base` do build. */
export function assetUrl(ref?: string | null): string {
  if (!ref) return '';
  if (/^(https?:|blob:|data:)/.test(ref)) return ref;
  if (ref.startsWith('upload:')) return '';
  return import.meta.env.BASE_URL + ref.replace(/^\//, '');
}

/** Resolve também arquivos enviados no painel (guardados no IndexedDB). */
export function useAssetUrl(ref?: string | null): string {
  const [url, setUrl] = useState(() => assetUrl(ref));
  useEffect(() => {
    let alive = true;
    if (ref?.startsWith('upload:')) {
      setUrl('');
      services.files.resolve(ref).then((u) => alive && setUrl(u ?? ''));
    } else setUrl(assetUrl(ref));
    return () => {
      alive = false;
    };
  }, [ref]);
  return url;
}
