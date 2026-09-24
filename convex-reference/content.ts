import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

/** Community recitations, comments, and quiz results. */

export const myRecordings = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const recordings = await ctx.db
      .query("recordings")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .collect();
    return Promise.all(recordings.map(withUrl));
  },
});

export const courseRecordings = query({
  args: { surahNumber: v.number() },
  handler: async (ctx, { surahNumber }) => {
    const user = await requireUser(ctx);
    const recordings = await ctx.db
      .query("recordings")
      .withIndex("by_surah", (q) => q.eq("surahNumber", surahNumber))
      .order("desc")
      .collect();
    return Promise.all(
      recordings.map(async (r) => ({
        ...(await withUrl(r)),
        isMine: r.ownerId === user._id,
        userName:
          r.ownerId === user._id
            ? "You"
            : (await ctx.db.get(r.ownerId))?.name ?? "A young learner",
      })),
    );
  },
});

async function withUrl(ctx: any, r: any) {
  const url = r.storageId ? await ctx.storage.getUrl(r.storageId) : undefined;
  const { storageId, ...rest } = r;
  return { ...rest, url };
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

export const saveRecording = mutation({
  args: {
    storageId: v.id("_storage"),
    title: v.string(),
    description: v.optional(v.string()),
    surahNumber: v.optional(v.number()),
    ayahNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const surah = args.surahNumber
      ? await ctx.db
          .query("surahs")
          .withIndex("by_number", (q) => q.eq("number", args.surahNumber!))
          .unique()
      : undefined;
    return ctx.db.insert("recordings", {
      ...args,
      ownerId: user._id,
      surahName: surah?.englishName,
    });
  },
});

export const deleteRecording = mutation({
  args: { id: v.id("recordings") },
  handler: async (ctx, { id }) => {
    const user = await requireUser(ctx);
    const rec = await ctx.db.get(id);
    if (!rec || rec.ownerId !== user._id) {
      throw new Error("Recording not found");
    }
    if (rec.storageId) await ctx.storage.delete(rec.storageId);
    await ctx.db.delete(id);
  },
});

export const comments = query({
  args: { targetType: v.string(), targetId: v.string() },
  handler: async (ctx, { targetType, targetId }) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("comments")
      .withIndex("by_target", (q) => q.eq("targetType", targetType).eq("targetId", targetId))
      .collect();
    return Promise.all(
      rows.map(async (c) => ({
        ...c,
        userName:
          c.ownerId === user._id
            ? "You"
            : (await ctx.db.get(c.ownerId))?.name ?? "A learner",
      })),
    );
  },
});

export const addComment = mutation({
  args: { targetType: v.string(), targetId: v.string(), text: v.string() },
  handler: async (ctx, { targetType, targetId, text }) => {
    const user = await requireUser(ctx);
    await ctx.db.insert("comments", {
      targetType,
      targetId,
      text,
      ownerId: user._id,
    });
  },
});

export const quizBest = query({
  args: { surahNumber: v.number() },
  handler: async (ctx, { surahNumber }) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("quizResults")
      .withIndex("by_user_surah", (q) =>
        q.eq("userId", user._id).eq("surahNumber", surahNumber),
      )
      .collect();
    if (rows.length === 0) return null;
    return rows.reduce((a, b) => (b.score / b.total > a.score / a.total ? b : a));
  },
});

export const quizSummary = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("quizResults")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const best = rows.length
      ? rows.reduce((a, b) => (b.score / b.total > a.score / a.total ? b : a))
      : undefined;
    return { taken: rows.length, best };
  },
});

export const saveQuizResult = mutation({
  args: { surahNumber: v.number(), score: v.number(), total: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ctx.db.insert("quizResults", { ...args, userId: user._id });
  },
});
