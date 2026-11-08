import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getDataRevision, subscribeToData } from '@/services';

export function useDataRevision() {
  return useSyncExternalStore(subscribeToData, getDataRevision);
}

/**
 * Busca dados de um serviço e refaz a busca sempre que os dados mockados mudam
 * (equivalente simplificado a React Query/SWR; pode ser trocado na versão real).
 */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const revision = useDataRevision();
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const first = useRef(true);
  const depsKey = JSON.stringify(deps);
  const lastDeps = useRef(depsKey);

  const run = useCallback(() => {
    let alive = true;
    // em atualizações de dados (mesmos parâmetros) evita piscar o carregamento
    if (first.current || lastDeps.current !== depsKey) setLoading(true);
    lastDeps.current = depsKey;
    fnRef
      .current()
      .then((d) => alive && (setData(d), setError(null)))
      .catch((e) => alive && setError(e))
      .finally(() => {
        if (alive) setLoading(false);
        first.current = false;
      });
    return () => {
      alive = false;
    };
  }, [depsKey]);

  useEffect(run, [run, revision]);
  return { data, error, loading, refetch: run };
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    if (title) document.title = `${title} · Casa Âmbar`;
  }, [title]);
}
