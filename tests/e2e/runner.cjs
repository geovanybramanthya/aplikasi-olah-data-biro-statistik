#!/usr/bin/env node
/**
 * Master E2E Test Runner
 * BEM UNDIP Survey Analytics & Visualization Platform
 * 
 * Executes all 4 test tiers:
 * - Tier 1: Feature Coverage (F1 - F29, >= 145 tests)
 * - Tier 2: Boundary & Corner Cases (>= 145 tests)
 * - Tier 3: Cross-Feature Interactions (>= 29 tests)
 * - Tier 4: Real-World Workloads (>= 5 scenarios)
 * 
 * Usage:
 *   node tests/e2e/runner.cjs
 *   node tests/e2e/runner.cjs --tier 1
 */

const path = require('path');
const harness = require('./harness.cjs');

// ANSI Color Helpers
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';
const BG_BLUE = '\x1b[44m';
const WHITE = '\x1b[37m';

function parseCliArgs() {
  const args = process.argv.slice(2);
  let selectedTier = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tier' && args[i + 1]) {
      selectedTier = `tier${args[i + 1]}`;
    }
  }
  return { selectedTier };
}

async function runRunner() {
  const { selectedTier } = parseCliArgs();
  const startTime = Date.now();

  console.log('\n' + BOLD + BG_BLUE + WHITE + ' ========================================================================= ' + RESET);
  console.log(BOLD + BG_BLUE + WHITE + '   BIRO STATISTIK BEM UNIVERSITAS DIPONEGORO - E2E TEST RUNNER             ' + RESET);
  console.log(BOLD + BG_BLUE + WHITE + ' ========================================================================= ' + RESET + '\n');

  console.log(`${CYAN}${BOLD}Platform:${RESET} Node.js ${process.version} on ${process.platform}`);
  console.log(`${CYAN}${BOLD}Test Directory:${RESET} ${path.resolve(__dirname)}\n`);

  harness.resetResults();

  const tiersToRun = selectedTier
    ? [selectedTier]
    : ['tier1', 'tier2', 'tier3', 'tier4'];

  for (const tier of tiersToRun) {
    harness.setTier(tier);
    const tierName = {
      tier1: 'Tier 1: Feature Coverage (F1 - F29)',
      tier2: 'Tier 2: Boundary & Corner Cases',
      tier3: 'Tier 3: Cross-Feature Interactions',
      tier4: 'Tier 4: Real-World Workloads',
    }[tier];

    console.log(`${BOLD}${YELLOW}► Running ${tierName}...${RESET}`);
    const tierFile = {
      tier1: './tier1_feature_coverage.test.cjs',
      tier2: './tier2_boundary_corner.test.cjs',
      tier3: './tier3_cross_feature.test.cjs',
      tier4: './tier4_real_world_workloads.test.cjs',
    }[tier];

    require(tierFile);

    // Give async tests in current tier time to resolve
    await new Promise((resolve) => setTimeout(resolve, 800));

    const tierResults = harness.getResults()[tier] || [];
    const passed = tierResults.filter((r) => r.status === 'pass').length;
    const failed = tierResults.filter((r) => r.status === 'fail').length;

    if (failed === 0) {
      console.log(`  ${GREEN}✓ ${tierResults.length} / ${tierResults.length} passed${RESET} ${GRAY}(all tests clean)${RESET}\n`);
    } else {
      console.log(`  ${RED}✗ ${failed} failed out of ${tierResults.length} tests${RESET}\n`);
    }
  }

  // Aggregate Results
  const allResults = harness.getResults();
  const totalDuration = Date.now() - startTime;

  console.log('-------------------------------------------------------------------------');
  console.log(`${BOLD}SUMMARY BREAKDOWN PER TIER:${RESET}`);
  console.log('-------------------------------------------------------------------------');

  let grandTotal = 0;
  let grandPassed = 0;
  let grandFailed = 0;
  const failedList = [];

  for (const tier of ['tier1', 'tier2', 'tier3', 'tier4']) {
    const list = allResults[tier] || [];
    const passed = list.filter((r) => r.status === 'pass').length;
    const failed = list.filter((r) => r.status === 'fail');

    grandTotal += list.length;
    grandPassed += passed;
    grandFailed += failed.length;
    failedList.push(...failed);

    const label = {
      tier1: 'Tier 1: Feature Coverage (F1-F29)   ',
      tier2: 'Tier 2: Boundary & Corner Cases     ',
      tier3: 'Tier 3: Cross-Feature Interactions  ',
      tier4: 'Tier 4: Real-World Workloads        ',
    }[tier];

    const statusBadge =
      failed.length === 0
        ? `${GREEN}${BOLD}PASS${RESET}`
        : `${RED}${BOLD}FAIL (${failed.length})${RESET}`;

    console.log(`  ${label} : ${passed.toString().padStart(3)} passed, ${failed.length.toString().padStart(2)} failed  [${statusBadge}]`);
  }

  console.log('-------------------------------------------------------------------------');
  console.log(`${BOLD}TOTAL TESTS : ${grandTotal}${RESET}`);
  console.log(`${BOLD}PASSED      : ${GREEN}${grandPassed}${RESET}`);
  console.log(`${BOLD}FAILED      : ${grandFailed > 0 ? RED + grandFailed : GREEN + '0'}${RESET}`);
  console.log(`${BOLD}DURATION    : ${totalDuration} ms${RESET}`);
  console.log('-------------------------------------------------------------------------');

  if (grandFailed > 0) {
    console.log(`\n${RED}${BOLD}FAILED TEST DETAILS:${RESET}`);
    failedList.forEach((f, idx) => {
      console.log(`\n${RED}${idx + 1}) ${f.name}${RESET}`);
      console.log(GRAY + (f.error && f.error.stack ? f.error.stack : String(f.error)) + RESET);
    });
    console.log(`\n${RED}${BOLD}E2E TEST RUN FAILED (exit code 1)${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`\n${GREEN}${BOLD}✓ ALL ${grandTotal} E2E TESTS PASSED PERFECTLY (exit code 0)${RESET}\n`);
    process.exit(0);
  }
}

runRunner().catch((err) => {
  console.error(`${RED}Fatal runner error:${RESET}`, err);
  process.exit(1);
});
