import { DEFAULT_OPTIONS } from './crawler.js';

const OPTIONS_SCHEMA_VERSION = 2;

const KEYS = Object.freeze({
  OPTIONS: 'options',
  CONTEXT: 'recentContext',
  RESULTS: 'recentResults',
  CACHE: 'resultCache',
  DIAGNOSTICS: 'recentDiagnostics'
});

const OPTION_LIMITS = Object.freeze({
  maxResults: { min: 1, max: 100 },
  requestDelayMs: { min: 300 }
});

function localStorageArea() {
  return chrome.storage.local;
}

function clampNumber(value, fallback, limits) {
  const number = Number(value);
  const finite = Number.isFinite(number) ? number : fallback;
  const aboveMin = Math.max(limits.min, finite);
  return limits.max === undefined ? aboveMin : Math.min(limits.max, aboveMin);
}

function normalizeOptions(options) {
  const source = options || {};
  const legacyMaxResults = source.maxResults ?? source.maxSearchSteps ?? DEFAULT_OPTIONS.maxResults;
  const merged = {
    ...DEFAULT_OPTIONS,
    ...source,
    maxResults: legacyMaxResults,
    optionsSchemaVersion: OPTIONS_SCHEMA_VERSION
  };
  const { useCache, maxSearchSteps, ...withoutLegacyOptions } = merged;
  return {
    ...withoutLegacyOptions,
    maxResults: clampNumber(merged.maxResults, DEFAULT_OPTIONS.maxResults, OPTION_LIMITS.maxResults),
    requestDelayMs: clampNumber(merged.requestDelayMs, DEFAULT_OPTIONS.requestDelayMs, OPTION_LIMITS.requestDelayMs)
  };
}

export async function getOptions() {
  const data = await localStorageArea().get(KEYS.OPTIONS);
  await localStorageArea().remove([KEYS.CACHE]);
  const stored = data[KEYS.OPTIONS] || null;
  if (!stored) {
    return normalizeOptions();
  }
  const migrated = normalizeOptions(stored);
  await localStorageArea().set({ [KEYS.OPTIONS]: migrated });
  return migrated;
}

export async function saveOptions(options) {
  await localStorageArea().set({
    [KEYS.OPTIONS]: normalizeOptions(options)
  });
}

export async function saveContext(context) {
  await localStorageArea().set({ [KEYS.CONTEXT]: context });
}

export async function getContext() {
  return (await localStorageArea().get(KEYS.CONTEXT))[KEYS.CONTEXT] || null;
}

export async function saveResults(results) {
  await localStorageArea().set({ [KEYS.RESULTS]: results });
}

export async function getResults() {
  return (await localStorageArea().get(KEYS.RESULTS))[KEYS.RESULTS] || [];
}

export async function saveDiagnostics(diagnostics) {
  await localStorageArea().set({ [KEYS.DIAGNOSTICS]: diagnostics });
}

export async function getDiagnostics() {
  return (await localStorageArea().get(KEYS.DIAGNOSTICS))[KEYS.DIAGNOSTICS] || null;
}

export async function clearAllLocalData() {
  await localStorageArea().remove([KEYS.CONTEXT, KEYS.RESULTS, KEYS.DIAGNOSTICS]);
}
