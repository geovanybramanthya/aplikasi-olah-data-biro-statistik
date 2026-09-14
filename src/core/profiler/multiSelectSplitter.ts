/**
 * Multi-Select Checkbox Splitter and Token Frequency Profiler
 * Splits comma-delimited responses from survey questions, calculates token repeat ratios,
 * and computes selection percentages relative to total valid respondents (N).
 */

export interface TokenFrequency {
  token: string;
  count: number;
  percentage: number;
}

export interface MultiSelectAnalysis {
  totalSelections: number;
  averageSelectionsPerRespondent: number;
  tokenFrequencies: TokenFrequency[];
  uniqueTokensCount: number;
  tokenRepeatRatio: number;
}

/**
 * Calculates Token Repeat Ratio to distinguish multi-select checkboxes from free text.
 * Formula: totalTokens / uniqueTokens
 * Checkboxes with fixed options yield ratio > 3.0 (often 10-30).
 * Free text narrative sentences yield ratio ~ 1.0 - 1.5.
 */
export function calculateTokenRepeatRatio(values: string[]): {
  totalTokens: number;
  uniqueTokens: number;
  ratio: number;
} {
  let totalTokens = 0;
  const uniqueSet = new Set<string>();

  for (const val of values) {
    if (!val || typeof val !== 'string') continue;
    const tokens = val
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t !== '-' && t !== '_');

    for (const token of tokens) {
      totalTokens++;
      uniqueSet.add(token.toLowerCase());
    }
  }

  const uniqueTokens = uniqueSet.size;
  const ratio = uniqueTokens > 0 ? totalTokens / uniqueTokens : 0;

  return {
    totalTokens,
    uniqueTokens,
    ratio,
  };
}

/**
 * Splits and tabulates multi-select responses across respondents.
 * For each respondent, deduplicates options selected in that row so each option
 * is counted at most once per respondent.
 * 
 * @param values - Array of raw cell strings from respondents
 * @param totalRespondents - Total number of valid respondents (N)
 */
export function splitMultiSelectResponses(
  values: string[],
  totalRespondents: number
): MultiSelectAnalysis {
  const tokenCounts: Map<string, number> = new Map();
  let totalSelections = 0;

  for (const rowVal of values) {
    if (!rowVal || typeof rowVal !== 'string') continue;

    // Split on comma and trim
    const rowTokens = rowVal
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t !== '-' && t !== '_');

    // Deduplicate within the row so a respondent only counts once per option
    const uniqueRowTokens = Array.from(new Set(rowTokens));

    for (const token of uniqueRowTokens) {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
      totalSelections++;
    }
  }

  const effectiveN = totalRespondents > 0 ? totalRespondents : 1;
  const tokenFrequencies: TokenFrequency[] = [];

  for (const [token, count] of tokenCounts.entries()) {
    const percentage = Number(((count / effectiveN) * 100).toFixed(1));
    tokenFrequencies.push({
      token,
      count,
      percentage,
    });
  }

  // Sort descending by count, then alphabetically
  tokenFrequencies.sort((a, b) => b.count - a.count || a.token.localeCompare(b.token));

  const uniqueTokensCount = tokenCounts.size;
  const tokenRepeatRatio = uniqueTokensCount > 0 ? totalSelections / uniqueTokensCount : 0;
  const averageSelectionsPerRespondent = Number(
    (totalSelections / effectiveN).toFixed(2)
  );

  return {
    totalSelections,
    averageSelectionsPerRespondent,
    tokenFrequencies,
    uniqueTokensCount,
    tokenRepeatRatio,
  };
}
