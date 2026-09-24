import { motion } from "framer-motion";
import { Link } from "react-router";
import { ArrowRight, BookOpen, ListChecks, Star, Mic } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { backend, useApiQuery } from "@/lib/api";
import { useQuran } from "@/hooks/use-quran";
import type { Surah } from "@/lib/types";

function firstName(name?: string): string {
  return name ? name.trim().split(/\s+/)[0] : "";
}

function firstIncomplete(surahs: Surah[]): Surah | undefined {
  return (
    surahs.find(
      (s) =>
        (s.practicedCount ?? 0) > 0 &&
        (s.practicedCount ?? 0) < s.numberOfAyahs,
    ) ?? surahs.find((s) => (s.practicedCount ?? 0) === 0)
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, failed, retry } = useQuran();

  const myRecordings = useApiQuery(() => backend.myRecordings(), "myRecordings");
  const quizSummary = useApiQuery(() => backend.quizSummary(), "quizSummary");

  const versesLearned =
    data?.reduce((sum, s) => sum + (s.practicedCount ?? 0), 0) ?? 0;
  const coursesStarted =
    data?.filter((s) => (s.practicedCount ?? 0) > 0).length ?? 0;
  const next = data ? firstIncomplete(data) : undefined;
  const allDone =
    data !== undefined && data.length > 0 && next === undefined;

  const greeting = user?.name ? `Salaam, ${firstName(user.name)}` : "Salaam, young learner";

  const stats = [
    { icon: BookOpen, label: "Verses learned", value: String(versesLearned) },
    { icon: ListChecks, label: "Courses started", value: String(coursesStarted) },
    { icon: Star, label: "Quizzes taken", value: String(quizSummary?.taken ?? 0) },
    {
      icon: Star,
      label: "Best quiz",
      value: quizSummary?.best ? `${quizSummary.best.score}/${quizSummary.best.total}` : "—",
    },
  ];

  return (
    <main className="min-h-screen bg-white text-neutral-950 antialiased">
      <AppHeader current="dashboard" />
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
            Your learning
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {greeting}.
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-neutral-500">
            Here's where your learning stands today — for you, and for the
            grown-ups who follow along.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-2 gap-px border border-neutral-200 bg-neutral-200 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white p-6">
              <stat.icon className="size-4 text-neutral-400" />
              <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-neutral-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="border border-neutral-200">
            <div className="border-b border-neutral-100 px-6 py-4">
              <h2 className="text-sm font-semibold">Continue learning</h2>
            </div>
            {failed ? (
              <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
                <p className="text-sm text-neutral-500">
                  Your courses couldn't be loaded.
                </p>
                <Button variant="outline" size="sm" onClick={retry}>
                  Try again
                </Button>
              </div>
            ) : data === undefined ? (
              <div className="h-40 animate-pulse bg-neutral-50" />
            ) : allDone ? (
              <div className="px-6 py-14 text-center">
                <p className="text-3xl">🎉</p>
                <p className="mt-3 text-sm text-neutral-600">
                  You've practiced every surah in the library — wonderful work!
                </p>
                <Button asChild variant="outline" size="sm" className="mt-6">
                  <Link to="/catalog">Back to the catalog</Link>
                </Button>
              </div>
            ) : next ? (
              <div className="px-6 py-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p dir="rtl" className="font-arabic text-3xl leading-snug text-neutral-950">
                      {next.name}
                    </p>
                    <p className="mt-2 text-sm font-medium">
                      {next.englishName}{" "}
                      <span className="font-normal text-neutral-500">
                        · {next.englishNameTranslation}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs tabular-nums text-neutral-400">{next.number}</span>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs text-neutral-500">
                  <span>
                    {next.practicedCount} of {next.numberOfAyahs} verses learned
                  </span>
                </div>
                <div className="mt-2.5 h-px w-full bg-neutral-200">
                  <div
                    className="h-full bg-neutral-950 transition-all duration-500"
                    style={{
                      width: `${Math.round(((next.practicedCount ?? 0) / next.numberOfAyahs) * 100)}%`,
                    }}
                  />
                </div>
                <Button asChild className="mt-8 w-full rounded-md sm:w-auto">
                  <Link to={`/learn/${next.number}`}>
                    Continue this surah <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            ) : null}
          </section>

          <section className="border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <h2 className="text-sm font-semibold">Recent recordings</h2>
              <Button asChild variant="ghost" size="sm" className="text-neutral-500">
                <Link to="/my-content">See all</Link>
              </Button>
            </div>
            {myRecordings === undefined ? (
              <div className="h-40 animate-pulse bg-neutral-50" />
            ) : myRecordings.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Mic className="mx-auto size-5 text-neutral-300" />
                <p className="mt-3 text-sm text-neutral-500">
                  Nothing shared yet. Record your recitation from any surah page.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-6">
                  <Link to="/catalog">Find a surah</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {myRecordings.slice(0, 3).map((rec) => (
                  <li key={rec._id} className="px-6 py-4">
                    <p className="text-sm font-medium">{rec.title}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {rec.surahName ? `Course: ${rec.surahName}` : "General recitation"}
                    </p>
                    {rec.url && (
                      <audio
                        controls
                        preload="none"
                        className="mt-3 h-9 w-full max-w-sm"
                      >
                        <source src={rec.url} />
                      </audio>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-md">
            <Link to="/catalog">
              Browse the catalog <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-md">
            <Link to="/my-content">My recordings</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
