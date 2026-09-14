export type QuestionType =
  | 'METADATA_PII'
  | 'DICHOTOMOUS_BINARY'
  | 'LIKERT_SCALE'
  | 'MULTI_SELECT_CHECKBOX'
  | 'NOMINAL_DEMOGRAPHIC'
  | 'OPEN_ENDED_TEXT';

export type ChartType =
  | 'donut'
  | 'vertical_bar'
  | 'horizontal_bar'
  | 'ranked_bar'
  | 'ordered_likert'
  | 'text_feed'
  | 'none';

export interface KeywordFrequency {
  keyword: string;
  count: number;
  percentage: number; // % of respondents who mentioned this keyword
  sampleQuotes: string[];
}

export interface QualitativeSummary {
  totalResponses: number;
  meaningfulResponses: number;
  topKeywords: KeywordFrequency[];
  quotes: string[];
}

export interface ColumnProfile {
  id: string;
  columnIndex: number;
  rawName: string;
  cleanName: string;
  displayTitle: string;
  type: QuestionType;
  isPII: boolean;
  isExcluded: boolean;
  recommendedChart: ChartType;
  selectedChart: ChartType;
  totalResponses: number;
  validResponses: number;
  missingResponses: number;
  uniqueValuesCount: number;
  distribution: Record<string, number>;
  likertScale?: {
    min: number;
    max: number;
    labels: Record<number, string>;
    mean: number;
    median: number;
    netPositivePercent: number; // % scoring 4 or 5
  };
  multiSelect?: {
    totalSelections: number;
    averageSelectionsPerRespondent: number;
    tokenFrequencies: Array<{ token: string; count: number; percentage: number }>;
  };
  qualitativeSummary?: QualitativeSummary;
  collapseMinorOptions?: boolean;
  offlineSummary: string;
  aiNarrative?: string;
}

export interface SurveyDataset {
  id: string;
  name: string;
  fileName: string;
  rowCount: number;
  columns: ColumnProfile[];
  rawRows: Record<string, string>[];
}
