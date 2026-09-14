/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Keyword & Topic Extractor for Open-Ended Qualitative Survey Responses
 */

import { KeywordFrequency, QualitativeSummary } from '../../types/survey';
import { isPlaceholderValue } from './questionClassifier';
export type { KeywordFrequency, QualitativeSummary };

/**
 * Common Indonesian stopwords to filter out from open-ended survey text
 */
export const INDONESIAN_STOPWORDS = new Set([
  '-', '_', '.', ',', '?', '!', ':', ';', 'tidak', 'ada', 'ga', 'gak', 'nggak',
  'yang', 'dan', 'di', 'dari', 'ini', 'itu', 'untuk', 'pada', 'ke', 'karena',
  'saya', 'kamu', 'aku', 'kita', 'kami', 'mereka', 'dia', 'anda', 'kalian',
  'agar', 'bisa', 'sudah', 'akan', 'terkait', 'kali', 'upgrading', 'maupun',
  'atau', 'ya', 'nih', 'saja', 'lebih', 'sangat', 'juga', 'dengan', 'dalam',
  'saat', 'tentang', 'seperti', 'terhadap', 'bagi', 'oleh', 'kepada', 'antara',
  'sehingga', 'namun', 'tetapi', 'walaupun', 'meskipun', 'maka', 'jika', 'kalau',
  'bila', 'apabila', 'secara', 'menurut', 'harus', 'perlu', 'ingin', 'dapat',
  'boleh', 'masih', 'belum', 'sudah', 'telah', 'sedang', 'akan', 'pernah',
  'banyak', 'beberapa', 'semua', 'setiap', 'tiap', 'seluruh', 'para', 'orang',
  'hal', 'hal-hal', 'hal2', 'lain', 'lainnya', 'tersebut', 'demikian', 'begitu',
  'apa', 'siapa', 'kapan', 'dimana', 'kenapa', 'mengapa', 'bagaimana', 'berapa',
  'saja', 'pun', 'lah', 'kah', 'tah', 'dong', 'sih', 'deh', 'kok', 'loh',
  'baik', 'bagus', 'oke', 'ok', 'cukup', 'kurang', 'sangat', 'amat', 'terlalu',
  'banget', 'bgt', 'tp', 'yg', 'dgn', 'dr', 'dlm', 'krn', 'utk', 'kpd', 'sy',
  'bbrp', 'sdh', 'blm', 'bisa', 'bs', 'bgtu', 'tdk', 'hrs', 'jd', 'jadi',
]);

/**
 * Common compound topic phrases in university and student organization surveys
 */
const COMPOUND_TOPICS: Array<{ phrase: string; regex: RegExp }> = [
  { phrase: 'manajemen stres', regex: /\b(manajemen\s+stres|stres\s+manajemen|stress\s+management)\b/i },
  { phrase: 'manajemen konflik', regex: /\b(manajemen\s+konflik|conflict\s+management)\b/i },
  { phrase: 'manajemen waktu', regex: /\b(manajemen\s+waktu|time\s+management)\b/i },
  { phrase: 'studi kasus', regex: /\b(studi\s+kasus|case\s+study)\b/i },
  { phrase: 'beban kerja', regex: /\b(beban\s+kerja|workload)\b/i },
  { phrase: 'program kerja', regex: /\b(program\s+kerja|proker)\b/i },
  { phrase: 'tuntutan akademik', regex: /\b(tuntutan\s+akademik|tugas\s+kuliah|akademik)\b/i },
  { phrase: 'kesehatan mental', regex: /\b(kesehatan\s+mental|mental\s+health)\b/i },
  { phrase: 'public speaking', regex: /\b(public\s+speaking|bicara\s+depan\s+umum)\b/i },
  { phrase: 'komunikasi efektif', regex: /\b(komunikasi\s+asertif|komunikasi\s+efektif|komunikasi)\b/i },
];

/**
 * Extract top keywords and qualitative themes from an array of open-ended string responses
 */
export function extractKeywordsAndThemes(
  rawTexts: string[],
  topN = 8
): QualitativeSummary {
  const quotes: string[] = [];
  const keywordMentions = new Map<string, { count: number; quotes: string[] }>();

  // Filter out blanks, placeholders (-), or empty responses
  const cleanResponses: string[] = [];

  for (const text of rawTexts) {
    if (isPlaceholderValue(text)) continue;
    const trimmed = String(text).trim();
    cleanResponses.push(trimmed);
    quotes.push(trimmed);

    const lower = trimmed.toLowerCase();

    // 1. Check for compound domain topics first
    const matchedCompounds = new Set<string>();
    for (const compound of COMPOUND_TOPICS) {
      if (compound.regex.test(lower)) {
        matchedCompounds.add(compound.phrase);
        const existing = keywordMentions.get(compound.phrase) || { count: 0, quotes: [] };
        existing.count += 1;
        if (existing.quotes.length < 3) {
          existing.quotes.push(trimmed);
        }
        keywordMentions.set(compound.phrase, existing);
      }
    }

    // 2. Tokenize individual words
    const tokens = lower
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 4 && !INDONESIAN_STOPWORDS.has(t));

    // Deduplicate within this single respondent so we measure % of respondents
    const uniqueTokensThisRespondent = new Set(tokens);

    for (const token of uniqueTokensThisRespondent) {
      // Don't duplicate if already covered by compound
      let alreadyCovered = false;
      for (const comp of matchedCompounds) {
        if (comp.includes(token)) {
          alreadyCovered = true;
          break;
        }
      }
      if (alreadyCovered) continue;

      const existing = keywordMentions.get(token) || { count: 0, quotes: [] };
      existing.count += 1;
      if (existing.quotes.length < 3) {
        existing.quotes.push(trimmed);
      }
      keywordMentions.set(token, existing);
    }
  }

  const totalN = cleanResponses.length || 1;

  // Sort keywords descending by count
  const sortedKeywords = Array.from(keywordMentions.entries())
    .map(([keyword, data]) => ({
      keyword: capitalizeWords(keyword),
      count: data.count,
      percentage: Math.round((data.count / totalN) * 1000) / 10,
      sampleQuotes: data.quotes,
    }))
    .filter((k) => k.count >= 2) // At least 2 mentions to be a trend
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  return {
    totalResponses: rawTexts.length,
    meaningfulResponses: cleanResponses.length,
    topKeywords: sortedKeywords,
    quotes,
  };
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (l) => l.toUpperCase());
}
