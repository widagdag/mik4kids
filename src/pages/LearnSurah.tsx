import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import {
  ArrowLeft,
  Check,
  Mic,
  Pause,
  Play,
  Repeat,
  Send,
  Square,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useSurah } from "@/hooks/use-quran";
import { backend, useApiMutation, useApiQuery } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Recording } from "@/lib/types";

function shortDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

function CommentsSection({ targetType, targetId }: { targetType: string; targetId: string }) {
  const comments = useApiQuery(
    () => backend.listComments({ targetType, targetId }),
    `comments:${targetType}:${targetId}`,
  );
  const addComment = useApiMutation((args: { text: string }) =>
    backend.addComment({ targetType, targetId, text: args.text }),
  );
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await addComment({ text: trimmed });
      setText("");
    } catch {
      toast.error("Couldn't post your comment — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-t border-neutral-200">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Questions &amp; comments</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Ask a question, or leave an encouraging word for fellow learners.
        </p>
        <form onSubmit={handleSubmit} className="mt-6">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write something kind…"
            className="min-h-20"
            maxLength={500}
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-neutral-400">{text.length}/500</span>
            <Button
              type="submit"
              size="sm"
              className="gap-1.5"
              disabled={submitting || text.trim().length === 0}
            >
              <Send className="size-3.5" />
              Post comment
            </Button>
          </div>
        </form>
        <div className="mt-8">
          {comments === undefined ? (
            <div className="h-24 animate-pulse bg-neutral-50" />
          ) : comments.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No comments yet. Be the first to share something kind.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {comments.map((c) => (
                <li key={c._id} className="py-4">
                  <p className="text-xs text-neutral-500">
                    <span className="font-medium text-neutral-700">{c.userName}</span> ·{" "}
                    {shortDate(c._creationTime)}
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-neutral-700">{c.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Community recitations
// ---------------------------------------------------------------------------

function RecordingsSection({
  surahNumber,
  surahName,
  numberOfAyahs,
}: {
  surahNumber: number;
  surahName: string;
  numberOfAyahs: number;
}) {
  const recordings = useApiQuery(
    () => backend.courseRecordings({ surahNumber }),
    `courseRecordings:${surahNumber}`,
  );

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ayah, setAyah] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const formRef = useRef({ title: "", description: "", ayah: "" });

  useEffect(() => {
    formRef.current = { title, description, ayah };
  }, [title, description, ayah]);

  const uploadAudio = async (blob: Blob, _contentType: string) => {
    setUploading(true);
    try {
      // Mock backend stores the audio directly; Convex backend uses storage.
      const storageId = await backend.generateUploadUrl();
      const current = formRef.current;
      await backend.saveRecording({
        storageId,
        title: current.title.trim() || `My recitation of ${surahName}`,
        description: current.description.trim() || undefined,
        surahNumber,
        ayahNumber: current.ayah ? Number(current.ayah) : undefined,
        audioDataUrl: await blobToDataUrl(blob),
      });
      toast.success("Recitation shared!");
      setOpen(false);
      setTitle("");
      setDescription("");
      setAyah("");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't upload — please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await uploadAudio(file, "audio/mpeg");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        await uploadAudio(blob, "audio/webm");
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast.error("Microphone unavailable — upload an audio file instead.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await backend.deleteRecording({ id });
      toast.success("Recording deleted.");
    } catch {
      toast.error("Couldn't delete that recording.");
    }
  };

  return (
    <section className="border-t border-neutral-200">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Community recitations</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Hear how other young learners recite {surahName} — and share your own voice.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Share yours"}
          </Button>
        </div>

        {open && (
          <form
            className="mt-8 border border-neutral-200 p-6"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="rec-title" className="text-xs text-neutral-500">
                  Title
                </Label>
                <Input
                  id="rec-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`My recitation of ${surahName}`}
                  className="mt-1.5"
                  maxLength={80}
                />
              </div>
              <div>
                <Label htmlFor="rec-ayah" className="text-xs text-neutral-500">
                  Verse (optional)
                </Label>
                <select
                  id="rec-ayah"
                  value={ayah}
                  onChange={(e) => setAyah(e.target.value)}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Whole surah</option>
                  {Array.from({ length: numberOfAyahs }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Verse {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="rec-desc" className="text-xs text-neutral-500">
                  A note (optional)
                </Label>
                <Input
                  id="rec-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Something you practiced…"
                  className="mt-1.5"
                  maxLength={160}
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {recording ? (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={stopRecording}
                >
                  <Square className="size-4 fill-current" />
                  Stop and share
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={startRecording}
                  disabled={uploading}
                >
                  <Mic className="size-4" />
                  Record now
                </Button>
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFile}
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={uploading || recording}
                  asChild
                >
                  <span>
                    <Upload className="size-4" />
                    Upload a file
                  </span>
                </Button>
              </label>
              {uploading && <p className="text-xs text-neutral-500">Uploading…</p>}
            </div>
          </form>
        )}

        <div className="mt-8">
          {recordings === undefined ? (
            <div className="h-24 animate-pulse bg-neutral-50" />
          ) : recordings.length === 0 ? (
            <div className="border border-dashed border-neutral-200 px-6 py-12 text-center">
              <p className="text-sm text-neutral-500">
                No recitations shared here yet — be the first!
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {recordings.map((r) => (
                <RecordingRow key={r._id} rec={r} onDelete={handleDelete} surahName={surahName} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function RecordingRow({
  rec,
  onDelete,
  surahName,
}: {
  rec: Recording;
  onDelete: (id: string) => void;
  surahName: string;
}) {
  return (
    <li className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium">{rec.title}</p>
        <p className="mt-0.5 text-xs text-neutral-500">
          {rec.isMine ? "You" : rec.userName} ·{" "}
          {rec.ayahNumber ? `Verse ${rec.ayahNumber} of ${surahName}` : surahName} ·{" "}
          {shortDate(rec._creationTime)}
        </p>
        {rec.description && (
          <p className="mt-1 text-xs text-neutral-500">{rec.description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {rec.url ? (
          <audio controls preload="none" className="h-9 w-full max-w-[220px]">
            <source src={rec.url} />
          </audio>
        ) : (
          <span className="text-xs text-neutral-400">Audio unavailable</span>
        )}
        {rec.isMine && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Delete recording"
            className="text-neutral-400 hover:text-red-600"
            onClick={() => onDelete(rec._id)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </li>
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function LearnSurah() {
  const { surahNumber } = useParams();
  const number = Number(surahNumber);
  const safe = Number.isInteger(number) && number >= 1 ? number : 0;

  const { data, failed, retry } = useSurah(safe);
  const practicedList = useApiQuery(
    () => (safe >= 1 ? backend.listPracticed() : Promise.resolve([])),
    "practiced",
  );
  const quizBest = useApiQuery(
    () => (safe >= 1 ? backend.quizBest({ surahNumber: safe }) : Promise.resolve(null)),
    `quizBest:${safe}`,
  );

  const [playing, setPlaying] = useState<number | null>(null);
  const [repeatVerse, setRepeatVerse] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => () => audioRef.current?.pause(), []);

  const playVerse = useCallback(
    (verse: { numberInSurah: number; audioUrl: string }) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (playing === verse.numberInSurah) {
        audio.pause();
        setPlaying(null);
        return;
      }
      audio.src = verse.audioUrl;
      audio.play().catch(() => setPlaying(null));
      setPlaying(verse.numberInSurah);
    },
    [playing],
  );

  const handleEnded = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (repeatVerse !== null && repeatVerse === playing) {
      audio.currentTime = 0;
      audio.play().catch(() => setPlaying(null));
    } else {
      setPlaying(null);
    }
  }, [repeatVerse, playing]);

  if (safe < 1 || safe > 114) return <Navigate to="/dashboard" replace />;

  if (data == null) {
    return (
      <main className="flex min-h-screen flex-col bg-white text-neutral-950 antialiased">
        <header className="border-b border-neutral-200">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
            <Brand />
          </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          {failed ? (
            <>
              <p className="text-sm text-neutral-500">This course couldn't be loaded.</p>
              <Button variant="outline" size="sm" onClick={retry}>
                Try again
              </Button>
            </>
          ) : (
            <>
              <Spinner className="size-5 text-neutral-400" />
              <p className="text-sm text-neutral-500">Preparing the recitation…</p>
            </>
          )}
        </div>
      </main>
    );
  }

  const surah = data;
  const ayahs = surah.ayahs ?? [];
  const learnedSet = new Set(
    (practicedList ?? [])
      .filter((p) => p.surahNumber === surah.number)
      .map((p) => p.ayahNumber),
  );
  const pct = ayahs.length ? Math.round((learnedSet.size / ayahs.length) * 100) : 0;

  return (
    <main className="min-h-screen bg-white text-neutral-950 antialiased">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-6">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-neutral-600">
            <Link to="/catalog">
              <ArrowLeft className="size-4" /> Catalog
            </Link>
          </Button>
          <div className="min-w-0 text-center">
            <p dir="rtl" className="font-arabic truncate text-lg leading-snug">
              {surah.name}
            </p>
            <p className="truncate text-xs text-neutral-500">
              {surah.englishName} · {surah.englishNameTranslation}
            </p>
          </div>
          <span className="w-24 text-right text-xs tabular-nums text-neutral-500">
            {learnedSet.size} / {surah.numberOfAyahs} learned
          </span>
        </div>
        <div className="mx-auto max-w-3xl px-6">
          <div className="h-px w-full bg-neutral-100">
            <div
              className="h-full bg-neutral-950 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 pt-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
              Course {surah.number}
            </p>
            <p dir="rtl" className="font-arabic mt-3 text-4xl leading-snug text-neutral-950 sm:text-5xl">
              {surah.name}
            </p>
            <p className="mt-3 text-sm text-neutral-500">
              {surah.englishName} · {surah.englishNameTranslation} · {surah.numberOfAyahs}{" "}
              {surah.numberOfAyahs === 1 ? "verse" : "verses"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {quizBest && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700">
                <Star className="size-3.5 fill-amber-500 text-amber-500" />
                Best quiz: {quizBest.score}/{quizBest.total}
              </span>
            )}
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to={`/quiz/${surah.number}`}>
                <Star className="size-4" /> Take the quiz
              </Link>
            </Button>
          </div>
        </div>
        <p className="mt-6 max-w-xl text-sm leading-6 text-neutral-500">
          Listen to each verse, repeat it until it feels familiar, then mark it
          learned. When the whole course is done, prove it with the quiz.
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-10 pt-4">
        {ayahs.map((verse) => {
          const isPlaying = playing === verse.numberInSurah;
          const isRepeating = repeatVerse === verse.numberInSurah;
          const isLearned = learnedSet.has(verse.numberInSurah);
          return (
            <article
              key={verse.number}
              className="border-b border-neutral-100 py-10 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
                  Verse {verse.numberInSurah}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={isPlaying ? "Pause verse" : "Play verse"}
                    onClick={() => playVerse(verse)}
                    className={cn(
                      isPlaying &&
                        "border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800 hover:text-white",
                    )}
                  >
                    {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Repeat this verse"
                    aria-pressed={isRepeating}
                    onClick={() =>
                      setRepeatVerse((v) => (v === verse.numberInSurah ? null : verse.numberInSurah))
                    }
                    className={cn(
                      isRepeating &&
                        "border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800 hover:text-white",
                    )}
                  >
                    <Repeat className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={isLearned ? "Mark as not learned" : "Mark as learned"}
                    aria-pressed={isLearned}
                    onClick={async () => {
                      try {
                        await backend.togglePracticed({
                          surahNumber: surah.number,
                          ayahNumber: verse.numberInSurah,
                        });
                      } catch {
                        toast.error("Couldn't save — are you signed in?");
                      }
                    }}
                    className={cn(
                      isLearned &&
                        "border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800 hover:text-white",
                    )}
                  >
                    <Check className="size-4" />
                  </Button>
                </div>
              </div>
              <p
                dir="rtl"
                className="font-arabic mt-6 text-right text-2xl leading-[2.1] text-neutral-950 md:text-[1.75rem] md:leading-[2.2]"
              >
                {verse.text}
              </p>
              <p className="mt-5 text-sm italic leading-6 text-neutral-500">
                {verse.transliteration}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-neutral-600">
                {verse.translation}
              </p>
            </article>
          );
        })}
      </div>

      <RecordingsSection
        surahNumber={surah.number}
        surahName={surah.englishName}
        numberOfAyahs={surah.numberOfAyahs}
      />
      <CommentsSection targetType="course" targetId={String(surah.number)} />
      <audio ref={audioRef} className="hidden" preload="none" onEnded={handleEnded} onError={() => setPlaying(null)} />
    </main>
  );
}
