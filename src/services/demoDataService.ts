/**
 * Offline Demo Data Service for BEM UNDIP Survey Platform
 * Provides 1-click loading of authentic pre-bundled sample datasets without network calls.
 */

import { SurveyDataset } from '../types/survey';
import { profileDataset } from '../core/parser/csvParser';
import {
  DEMO_SURVEY_1_HEADERS,
  DEMO_SURVEY_1_ROWS,
} from '../data/demoSurvey1';
import {
  DEMO_SURVEY_2_HEADERS,
  DEMO_SURVEY_2_ROWS,
} from '../data/demoSurvey2';

export interface DemoSurveyMeta {
  id: string;
  title: string;
  category: string;
  description: string;
  respondentsCount: number;
  questionsCount: number;
  highlightFeatures: string[];
}

export const DEMO_SURVEYS_META: DemoSurveyMeta[] = [
  {
    id: 'demo_1',
    title: 'UPGRADING Fungsionaris BEM UNDIP 2026',
    category: 'Internal BEM Governance & Capacity',
    description:
      'Survei komprehensif evaluasi beban kerja, stres, manajemen konflik, dan efektivitas metode upgrading fungsionaris BEM Universitas Diponegoro.',
    respondentsCount: 134,
    questionsCount: 27,
    highlightFeatures: [
      'Multi-Select Checkboxes (Token Repeat Ratio > 3.0)',
      'Likert Scale 1-4 & 1-5',
      'Demografi Biro / Bidang',
    ],
  },
  {
    id: 'demo_2',
    title: 'Survei Keamanan Kampus & Catcalling di Area Konstruksi',
    category: 'Advokasi Mahasiswa & Kebijakan Kampus',
    description:
      'Survei advokasi fasilitas dan keselamatan mahasiswa terkait pelecehan verbal (catcalling) di area pembangunan kampus Universitas Diponegoro.',
    respondentsCount: 197,
    questionsCount: 15,
    highlightFeatures: [
      'Dichotomous Binary (Ya/Tidak)',
      'Filter PII Otomatis (Nama & NIM)',
      'Konsensus Likert Kuat (85.8%)',
    ],
  },
];

/**
 * Loads Demo Survey 1 (UPGRADING BEM UNDIP 2026) instantly with 0ms network latency.
 */
export function loadDemoSurvey1(): SurveyDataset {
  return profileDataset(
    DEMO_SURVEY_1_HEADERS,
    DEMO_SURVEY_1_ROWS,
    'Survei UPGRADING BEM UNDIP 2026',
    'survey_sample_1.csv'
  );
}

/**
 * Loads Demo Survey 2 (Campus Safety & Catcalling) instantly with 0ms network latency.
 */
export function loadDemoSurvey2(): SurveyDataset {
  return profileDataset(
    DEMO_SURVEY_2_HEADERS,
    DEMO_SURVEY_2_ROWS,
    'Survei Keamanan Kampus & Catcalling UNDIP',
    'survey_sample_2.csv'
  );
}

/**
 * Loads demo survey by ID ('demo_1' | 'demo_2').
 */
export function loadDemoSurveyById(id: string): SurveyDataset {
  if (id === 'demo_2') {
    return loadDemoSurvey2();
  }
  return loadDemoSurvey1();
}
