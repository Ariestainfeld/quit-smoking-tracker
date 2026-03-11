import type { SmokingReason } from '../types';

export interface ReasonOption {
  value: SmokingReason;
  label: string;
  emoji: string;
}

export const SMOKING_REASONS: ReasonOption[] = [
  { value: 'קפה', label: 'קפה', emoji: '☕' },
  { value: 'אחרי אוכל', label: 'אחרי אוכל', emoji: '🍽️' },
  { value: 'צריך להתרכז', label: 'צריך להתרכז', emoji: '🧠' },
  { value: 'עצבני/לא רגוע', label: 'עצבני / לא רגוע', emoji: '😤' },
  { value: 'עם חברים', label: 'עם חברים', emoji: '👥' },
  { value: 'רגע של הפסקה', label: 'רגע של הפסקה', emoji: '☀️' },
  { value: 'אחר', label: 'אחר', emoji: '✏️' },
];

export const CRAVING_LABELS = [
  { value: 1, emoji: '😐', label: 'קצת' },
  { value: 2, emoji: '🤔', label: 'בינוני' },
  { value: 3, emoji: '😤', label: 'רוצה' },
  { value: 4, emoji: '🥵', label: 'צריך' },
  { value: 5, emoji: '🤯', label: 'חייב' },
];

export const ENJOYMENT_LABELS = [
  { value: 1, emoji: '😑', label: 'בכלל לא' },
  { value: 2, emoji: '🤷', label: 'מה' },
  { value: 3, emoji: '😊', label: 'בסדר' },
  { value: 4, emoji: '😌', label: 'טוב' },
  { value: 5, emoji: '🤤', label: 'מעולה' },
];
