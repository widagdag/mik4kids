import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUser } from "./requireUser";

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
      .withIndex("by_user", (q) => q.eq("userId", user!._id))
      .collect();

    return surahs.map((s) => ({
      ...s,
      ayahs: undefined,
      audioUrls: undefined,
      practicedCount: practiced.filter((p) => p.surahNumber === s.number).length,
    }));
  },
});

export const getSurah = query({
  args: { number: v.number() },
  handler: async (ctx, { number }) => {
    await requireUser(ctx);
    const surah = await ctx.db
      .query("surahs")
      .withIndex("by_number", (q) => q.eq("number", number))
      .unique();
    if (!surah) return null;
    const user = await requireUser(ctx);
    const practiced = await ctx.db
      .query("practiced")
      .withIndex("by_user_surah", (q) =>
        q.eq("userId", user!._id).eq("surahNumber", number),
      )
      .collect();
    return { surah, practiced };
  },
});

// Seeds fetch from api.alquran.cloud, so they run as actions (network is
// forbidden in mutations) and delegate writes to internal mutations.
export const seedSurahList = action({
  args: {},
  handler: async (ctx) => {
    const res = await fetch("https://api.alquran.cloud/v1/surah");
    const json = await res.json();
    const rows = (json.data as any[])
      .filter((s) => s.number === 1 || (s.number >= 78 && s.number <= 114))
      .map((s) => ({
        number: s.number,
        name: s.name,
        englishName: s.englishName,
        englishNameTranslation: s.englishNameTranslation,
        numberOfAyahs: s.numberOfAyahs,
        revelationType: s.revelationType,
      }));
    await ctx.runMutation(internal.surahs.insertSurahList, { rows });
  },
});

export const insertSurahList = internalMutation({
  args: {
    rows: v.array(
      v.object({
        number: v.number(),
        name: v.string(),
        englishName: v.string(),
        englishNameTranslation: v.string(),
        numberOfAyahs: v.number(),
        revelationType: v.string(),
      }),
    ),
  },
  handler: async (ctx, { rows }) => {
    const existing = await ctx.db.query("surahs").first();
    if (existing) return;
    for (const row of rows) {
      await ctx.db.insert("surahs", row);
    }
  },
});

export const seedSurah = action({
  args: { number: v.number() },
  handler: async (ctx, { number }) => {
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
    }));
    const audioUrls = ar.ayahs.map(
      (a: any) =>
        `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${a.number}.mp3`,
    );
    await ctx.runMutation(internal.surahs.setSurahContent, {
      number,
      ayahs,
      audioUrls,
    });
  },
});

export const setSurahContent = internalMutation({
  args: {
    number: v.number(),
    ayahs: v.array(
      v.object({
        number: v.number(),
        numberInSurah: v.number(),
        text: v.string(),
        transliteration: v.string(),
        translation: v.string(),
      }),
    ),
    audioUrls: v.array(v.string()),
  },
  handler: async (ctx, { number, ayahs, audioUrls }) => {
    const surah = await ctx.db
      .query("surahs")
      .withIndex("by_number", (q) => q.eq("number", number))
      .unique();
    if (!surah || surah.ayahs) return;
    await ctx.db.patch(surah._id, { ayahs, audioUrls });
  },
});

export const listPracticed = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("practiced")
      .withIndex("by_user", (q) => q.eq("userId", user!._id))
      .collect();
    return rows.map((r) => ({ surahNumber: r.surahNumber, ayahNumber: r.ayahNumber }));
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
          .eq("userId", user!._id)
          .eq("surahNumber", surahNumber)
          .eq("ayahNumber", ayahNumber),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.insert("practiced", {
        userId: user!._id,
        surahNumber,
        ayahNumber,
      });
    }
  },
});
