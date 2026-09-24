import { motion } from "framer-motion";
import { Link } from "react-router";

import { BrandLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";

const STEPS = [
  {
    n: "01",
    title: "Learn",
    body: "Every surah is a gentle course. Each verse comes with its recitation, its sounds, and its meaning.",
  },
  {
    n: "02",
    title: "Practice",
    body: "Repeat verses until they feel like home, mark them learned, then prove it with a short quiz.",
  },
  {
    n: "03",
    title: "Share & grow",
    body: "Children can record and share their own recitation. Parents can watch progress grow across the whole library.",
  },
];

const FEATURED_SURAHS = [
  { number: 1, arabic: "الفاتحة", english: "Al-Fatiha", meaning: "The Opening", ayahs: 7 },
  { number: 114, arabic: "الناس", english: "An-Naas", meaning: "Mankind", ayahs: 6 },
  { number: 113, arabic: "الفلق", english: "Al-Falaq", meaning: "The Daybreak", ayahs: 5 },
  { number: 112, arabic: "الإخلاص", english: "Al-Ikhlas", meaning: "Sincerity", ayahs: 4 },
  { number: 108, arabic: "الكوثر", english: "Al-Kawthar", meaning: "Abundance", ayahs: 3 },
  { number: 103, arabic: "العصر", english: "Al-Asr", meaning: "The Time", ayahs: 3 },
];

const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-neutral-950 antialiased">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <span className="inline-flex items-center gap-2.5">
            <BrandLogo className="size-6 text-neutral-950" />
            <span className="text-base font-semibold tracking-tight">MIK</span>
            <span className="text-xs font-medium text-neutral-400">for Kids</span>
          </span>
          <Button asChild variant="ghost" size="sm" className="text-neutral-600">
            <Link to="/auth?returnTo=/dashboard">Sign in</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-24 pt-20 text-center sm:pt-28">
        <motion.div {...reveal}>
          <p dir="rtl" className="font-arabic text-2xl leading-relaxed text-neutral-800 sm:text-[1.75rem]">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p className="mt-8 text-xs font-medium uppercase tracking-[0.25em] text-neutral-400">
            For children and the grown-ups who teach them
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            Learn the Quran. Practice it. Grow with it.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-7 text-neutral-500 sm:text-lg">
            MIK for Kids is a calm, friendly space where children learn surah by
            surah, quiz what they know, and share their own recitations — with
            parents always able to see how far they've come.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full rounded-md px-8 sm:w-auto">
              <Link to="/auth?returnTo=/dashboard">
                Start learning <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full rounded-md px-8 sm:w-auto">
              <Link to="/catalog">Browse the catalog</Link>
            </Button>
          </div>
          <p className="mt-10 text-xs uppercase tracking-[0.2em] text-neutral-400">
            Al-Fatiha &amp; Juz Amma · 38 surah courses · Recited by Mishary Alafasy
          </p>
        </motion.div>
      </section>

      <section className="border-t border-neutral-200">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <motion.div {...reveal}>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
              How it works
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Learning, in three gentle steps.
            </h2>
          </motion.div>
          <motion.div
            {...reveal}
            className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-3"
          >
            {STEPS.map((step) => (
              <div key={step.n} className="border-t border-neutral-200 pt-6">
                <span className="text-4xl font-light tabular-nums text-neutral-300">
                  {step.n}
                </span>
                <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-500">{step.body}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="surahs" className="border-t border-neutral-200">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <motion.div {...reveal}>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
              The catalog
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Start with the short surahs.
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-neutral-500">
              The catalog opens with Al-Fatiha and the whole of Juz Amma — the
              surahs every young learner begins with.
            </p>
          </motion.div>
          <motion.div {...reveal} className="mt-12">
            {FEATURED_SURAHS.map((s) => (
              <Link
                key={s.number}
                to="/catalog"
                className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-t border-neutral-200 py-5 transition-colors hover:bg-neutral-50 sm:grid-cols-[3rem_1fr_1fr_auto]"
              >
                <span className="text-sm tabular-nums text-neutral-400">{s.number}</span>
                <span className="flex items-baseline gap-3">
                  <span dir="rtl" className="font-arabic text-xl leading-snug">{s.arabic}</span>
                  <span className="text-sm font-medium">{s.english}</span>
                </span>
                <span className="hidden text-sm text-neutral-500 sm:block">{s.meaning}</span>
                <span className="flex items-center gap-4 text-sm text-neutral-500">
                  {s.ayahs} verses
                  <ArrowRight className="size-4 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-950" />
                </span>
              </Link>
            ))}
            <Link
              to="/catalog"
              className="group flex items-center justify-between border-t border-neutral-200 py-5 transition-colors hover:bg-neutral-50"
            >
              <span className="text-sm font-medium">Browse and search the full catalog</span>
              <ArrowRight className="size-4 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-950" />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-neutral-200">
        <div className="mx-auto grid max-w-5xl gap-px bg-neutral-200 sm:grid-cols-2">
          <motion.div {...reveal} className="bg-white p-10 sm:p-14">
            <Star className="size-5 text-amber-600" />
            <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
              A short quiz for every surah.
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Five gentle questions after every course — a small celebration of
              what's been learned, with a best score to beat.
            </p>
          </motion.div>
          <motion.div {...reveal} className="bg-white p-10 sm:p-14">
            <Star className="size-5 text-amber-600" />
            <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
              A voice of their own.
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Children can record and share their recitation on any surah page,
              and comment on what they're learning — a small, safe corner of the
              internet made just for them.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-neutral-200">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <motion.div {...reveal} className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
              Made for families
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              One account, two points of view.
            </h2>
            <p className="mt-4 text-base leading-7 text-neutral-500">
              Children get a friendly, uncluttered space to listen, practice, and
              quiz. Parents can open the same dashboard and see every verse
              learned, every quiz taken, and every recitation shared.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-neutral-200">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <motion.div {...reveal}>
            <p dir="rtl" className="font-arabic text-3xl text-neutral-900 sm:text-4xl">
              الْفَاتِحَة
            </p>
            <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Begin with Al-Fatiha.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-pretty text-base leading-7 text-neutral-500">
              The surah every prayer opens with. Seven verses — a perfect first
              lesson.
            </p>
            <Button asChild size="lg" className="mt-10 rounded-md px-8">
              <Link to="/auth?returnTo=/dashboard">
                Start learning <ArrowRight className="size-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-xs text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <p>MIK for Kids — learn the Quran, verse by verse.</p>
          <p>Recitation by Mishary Rashid Alafasy · Text &amp; translation from alquran.cloud</p>
        </div>
      </footer>
    </div>
  );
}
