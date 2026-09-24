export type RevelationType = "Meccan" | "Medinan";

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: RevelationType;
  ayahs?: Ayah[];
  /** Count of the current user's practiced verses (server-computed on list). */
  practicedCount?: number;
}

export interface Ayah {
  number: number; // global ayah number (as used by alquran.cloud audio)
  numberInSurah: number;
  text: string;
  translation: string;
  transliteration: string;
  audioUrl: string;
}

export interface PracticedRecord {
  surahNumber: number;
  ayahNumber: number;
}

export interface Recording {
  _id: string;
  _creationTime: number;
  title: string;
  description?: string;
  surahNumber?: number;
  surahName?: string;
  ayahNumber?: number;
  url?: string;
  userName: string;
  isMine: boolean;
}

export interface Comment {
  _id: string;
  _creationTime: number;
  targetType: string; // "course" | other scopes
  targetId: string;
  text: string;
  userName: string;
  isMine?: boolean;
}

export interface QuizResult {
  _id: string;
  _creationTime: number;
  surahNumber: number;
  score: number;
  total: number;
}

export interface QuizBest {
  score: number;
  total: number;
}

export interface QuizSummary {
  taken: number;
  best?: QuizBest;
}

export interface AuthUser {
  name?: string;
  email?: string;
  isGuest?: boolean;
}
