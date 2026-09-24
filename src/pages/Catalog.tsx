import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { Search } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuran } from "@/hooks/use-quran";

export default function Catalog() {
  const { data, failed, retry } = useQuran();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (q === "") return data;
    return data.filter(
      (s) =>
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.name.includes(query.trim()) ||
        String(s.number) === q,
    );
  }, [data, query]);

  return (
    <main className="min-h-screen bg-white text-neutral-950 antialiased">
      <AppHeader current="catalog" />
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
            The catalog
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Choose a surah course.
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-neutral-500">
            Every surah is a course: listen to each verse, repeat it, mark it
            learned, and finish with a short quiz.
          </p>
          <div className="relative mt-8 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search surahs — try “Fatiha” or “الناس”"
              className="pl-9"
              aria-label="Search surah courses"
            />
          </div>
        </motion.div>

        {failed ? (
          <div className="mt-12 flex flex-col items-center gap-4 border border-neutral-200 px-6 py-16 text-center">
            <p className="text-sm text-neutral-500">The catalog couldn't be loaded.</p>
            <Button variant="outline" size="sm" onClick={retry}>
              Try again
            </Button>
          </div>
        ) : data === undefined ? (
          <div className="mt-12 grid grid-cols-1 gap-px border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse bg-white" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-12 border border-neutral-200 px-6 py-16 text-center">
            <p className="text-sm text-neutral-500">
              No surahs match “{query}”. Try another spelling.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-px border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => {
              const pct = Math.round(((s.practicedCount ?? 0) / s.numberOfAyahs) * 100);
              return (
                <Link
                  key={s.number}
                  to={`/learn/${s.number}`}
                  className="group flex flex-col bg-white p-6 transition-colors hover:bg-neutral-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p dir="rtl" className="font-arabic text-2xl leading-snug text-neutral-950">
                      {s.name}
                    </p>
                    <span className="text-xs tabular-nums text-neutral-400">{s.number}</span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-4">
                    <span className="text-sm font-medium text-neutral-800">{s.englishName}</span>
                    <span className="text-xs text-neutral-400">{s.englishNameTranslation}</span>
                  </div>
                  <div className="mt-8 border-t border-neutral-100 pt-4">
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>
                        {s.numberOfAyahs} {s.numberOfAyahs === 1 ? "verse" : "verses"}
                      </span>
                      <span className="tabular-nums">
                        {s.practicedCount ?? 0} / {s.numberOfAyahs} learned
                      </span>
                    </div>
                    <div className="mt-2.5 h-px w-full bg-neutral-200">
                      <div
                        className="h-full bg-neutral-950 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
