import { useState } from "react";
import { motion } from "framer-motion";
import { Link, Navigate, useParams } from "react-router";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { useQuran } from "@/hooks/use-quran";
import { backend, useApiQuery } from "@/lib/api";
import type { Surah } from "@/lib/types";

const QUESTION_COUNT = 5;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function sampleUniqueBy<T>(arr: T[], n: number, key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const picked: T[] = [];
  for (const item of shuffle(arr)) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    picked.push(item);
    if (picked.length === n) break;
  }
  return picked;
}

interface Question {
  prompt: string;
  options: { text: string; correct: boolean }[];
}

function generateQuestions(all: Surah[], surah: Surah): Question[] {
  const others = all.filter((s) => s.number !== surah.number);
  return [
    {
      prompt: `What does “${surah.name}” mean in English?`,
      options: shuffle([
        { text: surah.englishNameTranslation, correct: true },
        ...sample(others, 3).map((s) => ({ text: s.englishNameTranslation, correct: false })),
      ]),
    },
    {
      prompt: `What is surah ${surah.number} called in English?`,
      options: shuffle([
        { text: surah.englishName, correct: true },
        ...sample(others, 3).map((s) => ({ text: s.englishName, correct: false })),
      ]),
    },
    {
      prompt: `How many verses does ${surah.englishName} have?`,
      options: shuffle([
        { text: String(surah.numberOfAyahs), correct: true },
        ...sampleUniqueBy(others, 3, (s) => String(s.numberOfAyahs)).map((s) => ({
          text: String(s.numberOfAyahs),
          correct: false,
        })),
      ]),
    },
    {
      prompt: `Was ${surah.englishName} revealed in Mecca or Medina?`,
      options: shuffle([
        { text: surah.revelationType, correct: true },
        { text: surah.revelationType === "Meccan" ? "Medinan" : "Meccan", correct: false },
      ]),
    },
    {
      prompt: `Which surah number is ${surah.englishName}?`,
      options: shuffle([
        { text: String(surah.number), correct: true },
        ...sample(others, 3).map((s) => ({ text: String(s.number), correct: false })),
      ]),
    },
  ];
}

function scoreMessage(score: number, total: number): string {
  const ratio = score / total;
  if (ratio === 1) return "Perfect! You know this surah beautifully.";
  if (ratio >= 0.8) return "Excellent work — so close to perfect!";
  if (ratio >= 0.6) return "Great job. A little more practice will finish it off.";
  return "Good try. Listen to the verses again and give it another go.";
}

export default function Quiz() {
  const { surahNumber } = useParams();
  const number = Number(surahNumber);
  const safe = Number.isInteger(number) && number >= 1 ? number : 0;

  const { data, failed, retry } = useQuran();
  const best = useApiQuery(
    () => (safe >= 1 ? backend.quizBest({ surahNumber: safe }) : Promise.resolve(null)),
    `quizBest:${safe}`,
  );

  const [stage, setStage] = useState<"intro" | "questions" | "result">("intro");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  if (safe < 1 || safe > 114) return <Navigate to="/dashboard" replace />;

  if (data === undefined || data.length === 0) {
    return (
      <main className="flex min-h-screen flex-col bg-white text-neutral-950 antialiased">
        <AppHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          {failed ? (
            <>
              <p className="text-sm text-neutral-500">The quiz couldn't be loaded.</p>
              <Button variant="outline" size="sm" onClick={retry}>
                Try again
              </Button>
            </>
          ) : (
            <>
              <Spinner className="size-5 text-neutral-400" />
              <p className="text-sm text-neutral-500">Preparing your quiz…</p>
            </>
          )}
        </div>
      </main>
    );
  }

  const surah = data.find((s) => s.number === safe) ?? null;

  if (surah === null) {
    return (
      <main className="min-h-screen bg-white text-neutral-950 antialiased">
        <AppHeader />
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="text-sm text-neutral-500">This course isn't in the catalog.</p>
          <Button asChild variant="outline" size="sm" className="mt-6">
            <Link to="/catalog">Back to the catalog</Link>
          </Button>
        </div>
      </main>
    );
  }

  const score = answers.reduce(
    (sum, answer, i) => sum + (questions[i]?.options[answer]?.correct ? 1 : 0),
    0,
  );

  const startQuiz = () => {
    setQuestions(generateQuestions(data, surah));
    setAnswers([]);
    setIndex(0);
    setSelected(null);
    setStage("questions");
  };

  const pick = (i: number) => {
    if (selected === null) setSelected(i);
  };

  const next = async () => {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);
    if (index === QUESTION_COUNT - 1) {
      const finalScore = newAnswers.reduce(
        (sum, answer, i) => sum + (questions[i]?.options[answer]?.correct ? 1 : 0),
        0,
      );
      setSaving(true);
      backend
        .saveQuizResult({ surahNumber: safe, score: finalScore, total: QUESTION_COUNT })
        .catch(() => toast.error("Couldn't save your score — but it's shown above."))
        .finally(() => setSaving(false));
      setStage("result");
    } else {
      setIndex(index + 1);
    }
  };

  const question = questions[index];
  const progress =
    stage === "questions" ? ((index + (selected !== null ? 1 : 0)) / QUESTION_COUNT) * 100 : 0;

  return (
    <main className="min-h-screen bg-white text-neutral-950 antialiased">
      <AppHeader />
      <div className="mx-auto max-w-2xl px-6 py-16">
        {stage === "intro" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
              The quiz
            </p>
            <p dir="rtl" className="font-arabic mt-6 text-4xl text-neutral-950">
              {surah.name}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{surah.englishName}</h1>
            <p className="mt-3 text-sm text-neutral-500">
              {surah.englishNameTranslation} · {QUESTION_COUNT} gentle questions
            </p>
            {best && (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700">
                <Star className="size-3.5 fill-amber-500 text-amber-500" />
                Your best score: {best.score}/{best.total}
              </p>
            )}
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="w-full rounded-md px-8 sm:w-auto" onClick={startQuiz}>
                Start the quiz <ArrowRight className="size-4" />
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full rounded-md px-8 sm:w-auto">
                <Link to={`/learn/${safe}`}>Back to the surah</Link>
              </Button>
            </div>
          </motion.div>
        )}

        {stage === "questions" && question && (
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="font-medium uppercase tracking-[0.2em] text-neutral-400">
                Question {index + 1} of {QUESTION_COUNT}
              </span>
              <span className="tabular-nums">{Math.round(progress)}%</span>
            </div>
            <div className="mt-3 h-px w-full bg-neutral-200">
              <div
                className="h-full bg-neutral-950 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <h1 className="mt-10 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
              {question.prompt}
            </h1>
            <div className="mt-8 flex flex-col gap-3">
              {question.options.map((option, i) => {
                const isSelected = selected === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pick(i)}
                    disabled={selected !== null}
                    className={cn(
                      "rounded-md border px-5 py-3.5 text-left text-sm transition-all",
                      selected === null && "border-neutral-200 hover:border-neutral-950",
                      selected !== null &&
                        option.correct &&
                        "border-neutral-950 bg-neutral-950 text-white",
                      selected !== null &&
                        !option.correct &&
                        isSelected &&
                        "border-red-300 bg-red-50 text-red-700",
                      selected !== null && !option.correct && !isSelected && "border-neutral-200 text-neutral-400",
                    )}
                  >
                    {option.text}
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-end">
              <Button onClick={next} disabled={selected === null} className="gap-1.5">
                {index === QUESTION_COUNT - 1 ? "See my score" : "Next"}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {stage === "result" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <div className="flex justify-center gap-1.5">
              {Array.from({ length: QUESTION_COUNT }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-7",
                    i < score ? "fill-amber-500 text-amber-500" : "text-neutral-200",
                  )}
                />
              ))}
            </div>
            <p className="mt-6 text-5xl font-semibold tabular-nums tracking-tight">
              {score}
              <span className="text-2xl text-neutral-400"> / {QUESTION_COUNT}</span>
            </p>
            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-neutral-600">
              {scoreMessage(score, QUESTION_COUNT)}
            </p>
            <p className="mt-3 text-xs text-neutral-400">
              {saving ? "Saving your score…" : "Your score has been saved."}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="w-full rounded-md px-8 sm:w-auto" onClick={startQuiz}>
                Try again
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full rounded-md px-8 sm:w-auto">
                <Link to={`/learn/${safe}`}>
                  <ArrowLeft className="size-4" /> Back to the surah
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
