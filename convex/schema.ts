import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  surahs: defineTable({
    number: v.number(),
    name: v.string(),
    englishName: v.string(),
    englishNameTranslation: v.string(),
    numberOfAyahs: v.number(),
    revelationType: v.string(),
    // Verse text only; audio is stored in the parallel audioUrls array to
    // keep documents small (audio is derivable: cdn.islamic.network/{number}.mp3).
    ayahs: v.optional(
      v.array(
        v.object({
          number: v.number(),
          numberInSurah: v.number(),
          text: v.string(),
          transliteration: v.string(),
          translation: v.string(),
        }),
      ),
    ),
    audioUrls: v.optional(v.array(v.string())),
  }).index("by_number", ["number"]),

  practiced: defineTable({
    userId: v.id("users"),
    surahNumber: v.number(),
    ayahNumber: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_surah", ["userId", "surahNumber"])
    .index("by_user_surah_ayah", ["userId", "surahNumber", "ayahNumber"]),

  recordings: defineTable({
    ownerId: v.id("users"),
    storageId: v.optional(v.id("_storage")),
    title: v.string(),
    description: v.optional(v.string()),
    surahNumber: v.optional(v.number()),
    surahName: v.optional(v.string()),
    ayahNumber: v.optional(v.number()),
    audioDataUrl: v.optional(v.string()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_surah", ["surahNumber"]),

  comments: defineTable({
    ownerId: v.id("users"),
    targetType: v.string(),
    targetId: v.string(),
    text: v.string(),
  }).index("by_target", ["targetType", "targetId"]),

  quizResults: defineTable({
    userId: v.id("users"),
    surahNumber: v.number(),
    score: v.number(),
    total: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_surah", ["userId", "surahNumber"]),
});
