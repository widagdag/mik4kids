import { motion } from "framer-motion";
import { Link } from "react-router";
import { Mic, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { backend, useApiQuery } from "@/lib/api";

function fullDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MyContent() {
  const recordings = useApiQuery(() => backend.myRecordings(), "myRecordings");

  const handleDelete = async (id: string) => {
    try {
      await backend.deleteRecording({ id });
      toast.success("Recording deleted.");
    } catch {
      toast.error("Couldn't delete that recording.");
    }
  };

  return (
    <main className="min-h-screen bg-white text-neutral-950 antialiased">
      <AppHeader current="recordings" />
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
            Your content
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            My recordings.
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-neutral-500">
            Every recitation you've shared, all in one place. You can listen to
            them, or remove them whenever you like.
          </p>
        </motion.div>

        <div className="mt-12">
          {recordings === undefined ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse bg-neutral-50" />
              ))}
            </div>
          ) : recordings.length === 0 ? (
            <div className="flex flex-col items-center border border-dashed border-neutral-200 px-6 py-16 text-center">
              <Mic className="size-6 text-neutral-300" />
              <p className="mt-4 text-sm text-neutral-500">
                You haven't shared any recordings yet.
              </p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-neutral-400">
                Open any surah course and use “Share yours” to record or upload
                your recitation.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-6">
                <Link to="/catalog">Find a surah</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100 border-y border-neutral-200">
              {recordings.map((rec) => (
                <li
                  key={rec._id}
                  className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{rec.title}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {rec.surahName
                        ? `Course: ${rec.surahName}${rec.ayahNumber ? ` · Verse ${rec.ayahNumber}` : ""}`
                        : "General recitation"}{" "}
                      · {fullDate(rec._creationTime)}
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete recording"
                      className="text-neutral-400 hover:text-red-600"
                      onClick={() => void handleDelete(rec._id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
