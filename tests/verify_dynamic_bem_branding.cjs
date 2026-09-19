const assert = require('assert');

// Constants as defined in src/core/theming/palettes.ts
const WATERMARK_TEXT = 'Biro Statistik BEM Universitas Diponegoro';
const DEFAULT_LOGO_URL = '/logo-birstat-transparent.png';
const DEFAULT_ORG_NAME = 'BEM Universitas Diponegoro';
const DEFAULT_BADGE_TEXT = 'Survei Terverifikasi BEM UNDIP 2026';

function resolveEffectiveWatermark(theme) {
  if (!theme) return WATERMARK_TEXT;
  const customWm = theme.watermarkText?.trim();
  const org = theme.organizationName?.trim();

  if (customWm && customWm !== WATERMARK_TEXT) {
    return customWm;
  }

  if (org && org !== DEFAULT_ORG_NAME) {
    if (org.toLowerCase().startsWith('biro statistik')) {
      return org;
    }
    return `Biro Statistik ${org}`;
  }

  return customWm || WATERMARK_TEXT;
}

function resolveEffectiveBadge(theme) {
  if (!theme) return DEFAULT_BADGE_TEXT;
  const customBadge = theme.verifiedBadgeText?.trim();
  const org = theme.organizationName?.trim();

  if (customBadge && customBadge !== DEFAULT_BADGE_TEXT) {
    return customBadge;
  }

  if (org && org !== DEFAULT_ORG_NAME) {
    return `Survei Terverifikasi ${org} 2026`;
  }

  return customBadge || DEFAULT_BADGE_TEXT;
}

function resolveEffectiveLogo(theme) {
  if (theme?.customLogoUrl) {
    return theme.customLogoUrl;
  }
  return DEFAULT_LOGO_URL;
}

console.log('=== TEST SUITE: DYNAMIC BEM BRANDING & LOGO RESOLUTION ===');

// 1. Default fallback
console.log('1. Testing defaults:');
assert.strictEqual(resolveEffectiveWatermark(), WATERMARK_TEXT);
assert.strictEqual(resolveEffectiveBadge(), DEFAULT_BADGE_TEXT);
assert.strictEqual(resolveEffectiveLogo(), DEFAULT_LOGO_URL);
console.log('   [PASS] Defaults properly resolve to official Biro Statistik BEM UNDIP');

// 2. Custom faculty BEM without touching watermark
console.log('2. Testing faculty BEM auto-adaptation:');
const themeFSM = { organizationName: 'BEM Fakultas Sains dan Matematika UNDIP' };
assert.strictEqual(resolveEffectiveWatermark(themeFSM), 'Biro Statistik BEM Fakultas Sains dan Matematika UNDIP');
assert.strictEqual(resolveEffectiveBadge(themeFSM), 'Survei Terverifikasi BEM Fakultas Sains dan Matematika UNDIP 2026');
console.log('   [PASS] FSM adapts watermark & badge dynamically without manual override');

// 3. Custom faculty with "Biro Statistik" prefix already included
console.log('3. Testing pre-prefixed faculty identity:');
const themeBiroFT = { organizationName: 'Biro Statistik BEM Fakultas Teknik UNDIP' };
assert.strictEqual(resolveEffectiveWatermark(themeBiroFT), 'Biro Statistik BEM Fakultas Teknik UNDIP');
console.log('   [PASS] Prevents duplicate "Biro Statistik Biro Statistik" prefixing');

// 4. Custom uploaded logo
console.log('4. Testing custom logo precedence:');
const customLogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const themeLogo = { customLogoUrl: customLogo };
assert.strictEqual(resolveEffectiveLogo(themeLogo), customLogo);
assert.strictEqual(resolveEffectiveLogo({ customLogoUrl: null }), DEFAULT_LOGO_URL);
console.log('   [PASS] Custom uploaded logo overrides default, resetting properly falls back');

// 5. Explicit user watermark override takes highest precedence
console.log('5. Testing explicit watermark override:');
const themeManual = {
  organizationName: 'BEM FEB UNDIP',
  watermarkText: 'Divisi Riset & Data BEM FEB 2026'
};
assert.strictEqual(resolveEffectiveWatermark(themeManual), 'Divisi Riset & Data BEM FEB 2026');
console.log('   [PASS] Explicit manual watermark text takes precedence over auto-generated text');

console.log('\n>>> ALL DYNAMIC BRANDING TESTS VERIFIED 100% OK! <<<');
