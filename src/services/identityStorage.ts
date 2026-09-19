/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Service for Persisting Organization Identity & Custom Logo in Local Browser Storage
 */

import { DEFAULT_ORG_NAME, DEFAULT_BADGE_TEXT, WATERMARK_TEXT } from '../core/theming/palettes';

export interface SavedOrgIdentity {
  organizationName: string;
  facultyName: string;
  customLogoUrl: string | null;
  watermarkText: string;
  verifiedBadgeText: string;
}

export const STORAGE_KEY = 'bem_stat_org_identity';

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

export function loadSavedOrgIdentity(): Partial<SavedOrgIdentity> | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[IdentityStorage] Failed to parse stored identity:', err);
  }
  return null;
}

export function saveOrgIdentity(identity: Partial<SavedOrgIdentity>): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    const existing = loadSavedOrgIdentity() || {};
    const merged: SavedOrgIdentity = {
      organizationName: identity.organizationName ?? existing.organizationName ?? DEFAULT_ORG_NAME,
      facultyName: identity.facultyName ?? existing.facultyName ?? '',
      customLogoUrl: identity.customLogoUrl !== undefined ? identity.customLogoUrl : (existing.customLogoUrl ?? null),
      watermarkText: identity.watermarkText ?? existing.watermarkText ?? WATERMARK_TEXT,
      verifiedBadgeText: identity.verifiedBadgeText ?? existing.verifiedBadgeText ?? DEFAULT_BADGE_TEXT,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.warn('[IdentityStorage] Failed to save identity to localStorage:', err);
  }
}

export function clearSavedOrgIdentity(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[IdentityStorage] Failed to remove stored identity:', err);
  }
}
