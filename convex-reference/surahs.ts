import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

/**
 * Surah catalog + per-user verse progress.
 * Catalog is seeded on demand from api.alquran.cloud (as the original did).
 */

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const surahs = await ctx.db.query("surahs").withIndex("by_number").collect();
    const practiced = await ctx.db
      .query("practiced")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return surahs.map((s) => ({
      ...s,
      ayahs: undefined,
      practicedCount: practiced.filter(
        (p) => p.surahNumber === s.number,
      ).length,
    }));
  },
});

export const getSurah = query({
  args: { number: v.number() },
  handler: async (ctx, { number }) => {
    const user = await requireUser(ctx);
    const surah = await ctx.db
      .query("surahs")
      .withIndex("by_number", (q) => q.eq("number", number))
      .unique();
    if (!surah) return null;
    const practiced = await ctx.db
      .query("practiced")
      .withIndex("by_user_surah", (q) =>
        q.eq("userId", user._id).eq("surahNumber", number),
      )
      .collect();
    return { surah, practiced };
  },
});

export const seedSurahList = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("surahs").first();
    if (existing) return;
    const res = await fetch("https://api.alquran.cloud/v1/surah");
    const json = await res.json();
    for (const s of json.data as any[]) {
      const wanted =
        s.number === 1 || (s.number >= 78 && s.number <= 114);
      if (!wanted) continue;
      await ctx.db.insert("surahs", {
        number: s.number,
        name: s.name,
        englishName: s.englishName,
        englishNameTranslation: s.englishNameTranslation,
        numberOfAyahs: s.numberOfAyahs,
        revelationType: s.revelationType,
      });
    }
  },
});

export const seedSurah = mutation({
  args: { number: v.number() },
  handler: async (ctx, { number }) => {
    const surah = await ctx.db
      .query("surahs")
      .withIndex("by_number", (q) => q.eq("number", number))
      .unique();
    if (!surah || surah.ayahs) return;
    const res = await fetch(
      `https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,en.transliteration,en.asad`,
    );
    const json = await res.json();
    const [ar, tl, tr] = json.data as any[];
    const ayahs = ar.ayahs.map((a: any, i: number) => ({
      number: a.number,
      numberInSurah: a.numberInSurah,
      text: a.text,
      transliteration: tl.ayahs[i]?.text ?? "",
      translation: tr.ayahs[i]?.text ?? "",
      audioUrl: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${a.number}.mp3`,
    }));
    await ctx.db.patch(surah._id, { ayahs });
  },
});

export const toggleAyahPracticed = mutation({
  args: { surahNumber: v.number(), ayahNumber: v.number() },
  handler: async (ctx, { surahNumber, ayahNumber }) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("practiced")
      .withIndex("by_user_surah_ayah", (q) =>
        q
          .eq("userId", user._id)
          .eq("surahNumber", surahNumber)
          .eq("ayahNumber", ayahNumber),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.insert("practiced", { userId: user._id, surahNumber, ayahNumber });
    }
  },
});
