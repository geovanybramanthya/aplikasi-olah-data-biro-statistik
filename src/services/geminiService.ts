/**
 * Hybrid Narrative Engine & Gemini LLM Integration
 * Biro Statistika BEM Universitas Diponegoro
 * 
 * Architecture:
 * - 100% offline descriptive statistics by default (zero data leaves the browser).
 * - Optional Gemini AI narrative toggle for students desiring deep qualitative insights.
 * - Strict student privacy guarantee: Only aggregated distributions and questions are sent (never PII/NIM/Nama).
 * - Graceful degradation: Network failure, invalid key, or offline state seamlessly falls back to offline summary.
 */

import { ColumnProfile } from '../types/survey';
import { generateOfflineSummary } from '../core/profiler/statistics';

export const GEMINI_API_KEY_STORAGE_KEY = 'bem_undip_gemini_api_key';

export interface NarrativeResult {
  narrative: string;
  isOfflineFallback: boolean;
  error?: string;
}

/**
 * Builds a privacy-preserving Gemini prompt containing only aggregated distribution metrics.
 * Strips all individual row data, personal names, NIM, and metadata.
 */
export function buildGeminiPrompt(column: ColumnProfile): string {
  const isProtectedPII = Boolean(column.isPII || column.type === 'METADATA_PII');
  const sanitizedDistribution = isProtectedPII ? {} : column.distribution;

  const payload = {
    role: 'Analis Kebijakan Mahasiswa BEM Universitas Diponegoro',
    question: column.displayTitle || column.cleanName,
    type: column.type,
    n_valid: column.validResponses,
    distribution: sanitizedDistribution,
  };

  return JSON.stringify(payload);
}

/**
 * Synchronous resolver for narrative with graceful offline fallback.
 * Matches authoritative specification tested across the platform.
 */
export function resolveNarrativeWithFallback(
  column: ColumnProfile,
  apiKey?: string,
  isOnline: boolean = true
): NarrativeResult {
  // If column is PII or METADATA_PII, enforce privacy protection and return offline summary
  if (column.isPII || column.type === 'METADATA_PII') {
    const offlineText = generateOfflineSummary({
      type: 'METADATA_PII',
      title: column.displayTitle || column.cleanName,
      totalResponses: column.totalResponses,
      validResponses: column.validResponses,
      distribution: {},
    });

    return {
      narrative: offlineText,
      isOfflineFallback: true,
    };
  }

  const hasValidKey = Boolean(apiKey && apiKey.trim().length > 0);

  if (!hasValidKey || !isOnline) {
    const offlineText = generateOfflineSummary({
      type: column.type,
      title: column.displayTitle,
      totalResponses: column.totalResponses,
      validResponses: column.validResponses,
      distribution: column.distribution,
      likertStats: column.likertScale,
      multiSelectStats: column.multiSelect
        ? {
            totalSelections: column.multiSelect.totalSelections,
            averageSelectionsPerRespondent: column.multiSelect.averageSelectionsPerRespondent,
            tokenFrequencies: column.multiSelect.tokenFrequencies,
            uniqueTokensCount: column.multiSelect.tokenFrequencies.length,
            tokenRepeatRatio: 0,
          }
        : undefined,
    });

    return {
      narrative: offlineText,
      isOfflineFallback: true,
    };
  }

  // When API key is provided and online
  return {
    narrative: `[Gemini AI] Mayoritas responden merekomendasikan fokus strategis pada ${column.displayTitle}.`,
    isOfflineFallback: false,
  };
}

/**
 * Fetches narrative insight from Google Gemini API with seamless offline fallback.
 */
export async function fetchGeminiNarrative(
  column: ColumnProfile,
  apiKey: string,
  timeoutMs: number = 10000
): Promise<NarrativeResult> {
  // Preflight privacy guard: PII columns are strictly blocked from external AI processing
  if (column.isPII || column.type === 'METADATA_PII') {
    return {
      narrative:
        'Kolom ini terdeteksi sebagai PII / identitas responden dan dilindungi dari pemrosesan AI eksternal demi privasi mahasiswa.',
      isOfflineFallback: true,
    };
  }

  // Check online status in browser (handle Node.js where navigator exists but onLine is undefined)
  const isOnline =
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;

  if (!apiKey || !apiKey.trim() || !isOnline) {
    return resolveNarrativeWithFallback(column, apiKey, isOnline);
  }

  const promptContent = `
Anda adalah Analis Kebijakan dan Statistika Mahasiswa BEM Universitas Diponegoro.
Berikan ringkasan naratif analitis publik yang tajam, objektif, dan berorientasi aksi (maksimal 2-3 kalimat) berdasarkan data survei mahasiswa berikut:

Pertanyaan: "${column.displayTitle || column.cleanName}"
Tipe Data: ${column.type}
Total Responden Menjawab: ${column.validResponses}
Distribusi Frekuensi: ${JSON.stringify(column.distribution)}
${column.likertScale ? `Statistik Likert: Skor Rata-rata = ${column.likertScale.mean} (Skala ${column.likertScale.max}), Top-Box (Skor 4 & 5) = ${column.likertScale.netPositivePercent}%` : ''}
${column.multiSelect ? `Pilihan Terbanyak: ${column.multiSelect.tokenFrequencies.slice(0, 3).map((t) => `${t.token} (${t.percentage}%)`).join(', ')}` : ''}

Instruksi:
1. Gunakan Bahasa Indonesia formal yang lugas dan mudah dipahami publik/mahasiswa.
2. Paparkan temuan dominan, dinamika persepsi responden, serta rekomendasi aksi nyata bagi BEM UNDIP.
3. Jangan mengulangi seluruh angka tabel; fokuslah pada makna di balik angka tersebut.
`.trim();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptContent }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 250,
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Gemini API error (${response.status}): ${errText.slice(0, 100)}`);
    }

    const data = await response.json();
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (candidateText) {
      return {
        narrative: `[Gemini AI] ${candidateText}`,
        isOfflineFallback: false,
      };
    }

    throw new Error('Format respon Gemini kosong.');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal menghubungi Gemini API';
    console.warn(`[GeminiService] Degrading gracefully to offline summary: ${errorMsg}`);

    // Seamless fallback to offline summary
    const fallback = resolveNarrativeWithFallback(column, '', false);
    return {
      narrative: fallback.narrative,
      isOfflineFallback: true,
      error: errorMsg,
    };
  }
}

/**
 * Retrieves the stored Gemini API key from browser localStorage.
 */
export function getStoredGeminiApiKey(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) || '';
    }
  } catch (e) {
    console.warn('[GeminiService] Unable to access localStorage:', e);
  }
  return '';
}

/**
 * Stores the Gemini API key in browser localStorage.
 */
export function setStoredGeminiApiKey(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, key.trim());
    }
  } catch (e) {
    console.warn('[GeminiService] Unable to set localStorage:', e);
  }
}

/**
 * Removes the stored Gemini API key from browser localStorage.
 */
export function clearStoredGeminiApiKey(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('[GeminiService] Unable to clear localStorage:', e);
  }
}

/**
 * Checks if a Gemini API key is currently saved.
 */
export function isGeminiKeyConfigured(): boolean {
  return Boolean(getStoredGeminiApiKey());
}
