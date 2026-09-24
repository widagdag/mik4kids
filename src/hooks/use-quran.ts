import { useCallback, useEffect, useState } from "react";
import { backend } from "@/lib/api";
import type { Surah } from "@/lib/types";

/**
 * Catalog hook — mirrors the recovered `useQuran()` behavior:
 * loads the surah list and auto-seeds it (from the fallback list /
 * alquran.cloud) if empty, with an explicit retry on failure.
 */
export function useQuran() {
  const [data, setData] = useState<Surah[] | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const load = useCallback(() => {
    backend
      .listSurahs()
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (data !== undefined && data.length === 0 && !attempted) {
      setAttempted(true);
      backend
        .seedSurahList()
        .then(load)
        .catch(() => setFailed(true));
    }
  }, [data, attempted, load]);

  const retry = useCallback(() => {
    setFailed(false);
    setAttempted(false);
    backend
      .seedSurahList()
      .then(load)
      .catch(() => setFailed(true));
  }, [load]);

  return { data, failed, retry };
}

/**
 * Single-surah hook — mirrors the recovered `useSurah(number)` behavior:
 * returns null while loading, and auto-seeds the full surah (verses, audio)
 * if the catalog entry has none yet.
 */
export function useSurah(number: number) {
  const [data, setData] = useState<Surah | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    setData(null);
    setFailed(false);
    setAttempted(false);
    if (number < 1) return;
    backend
      .getSurah(number)
      .then(setData)
      .catch(() => setFailed(true));
  }, [number]);

  useEffect(() => {
    if (number < 1 || data !== null || attempted) return;
    setAttempted(true);
    backend
      .seedSurah({ number })
      .then(() => backend.getSurah(number))
      .then(setData)
      .catch(() => setFailed(true));
  }, [number, data, attempted]);

  const retry = useCallback(() => {
    setFailed(false);
    setAttempted(false);
    backend
      .seedSurah({ number })
      .then(() => backend.getSurah(number))
      .then(setData)
      .catch(() => setFailed(true));
  }, [number]);

  return { data, failed, retry };
}
