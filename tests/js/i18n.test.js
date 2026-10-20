import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANGS, DEFAULT_LANG, resolveLang, withLang, t, STRINGS, DIRECTION, LOCALE } from '../../src/lib/i18n.js';

test('resolveLang defaults to Hebrew when lang is missing or invalid', () => {
  assert.equal(resolveLang(''), 'he');
  assert.equal(resolveLang('?amount=500'), 'he');
  assert.equal(resolveLang('?lang=fr'), 'he');
  assert.equal(resolveLang(undefined), 'he');
});

test('resolveLang reads a valid lang param', () => {
  assert.equal(resolveLang('?lang=en'), 'en');
  assert.equal(resolveLang('?amount=500&lang=en'), 'en');
});

test('withLang sets lang while preserving other params', () => {
  assert.equal(withLang('', 'en'), '?lang=en');
  assert.equal(withLang('?amount=500', 'en'), '?amount=500&lang=en');
  assert.equal(withLang('?amount=500&lang=he', 'en'), '?amount=500&lang=en');
});

test('t falls back to the default language for a missing key in the requested language', () => {
  assert.equal(t('en', 'colFund'), 'Fund');
  assert.equal(t('he', 'colFund'), 'קרן');
});

test('t falls back to the key itself when missing everywhere', () => {
  assert.equal(t('en', 'definitelyNotAKey'), 'definitelyNotAKey');
});

test('every string key defined for Hebrew is also defined for English, and vice versa', () => {
  const heKeys = Object.keys(STRINGS.he).sort();
  const enKeys = Object.keys(STRINGS.en).sort();
  assert.deepEqual(enKeys, heKeys);
});

test('LANGS, DIRECTION and LOCALE agree on supported languages', () => {
  assert.deepEqual([...LANGS].sort(), ['en', 'he']);
  assert.deepEqual(Object.keys(DIRECTION).sort(), ['en', 'he']);
  assert.deepEqual(Object.keys(LOCALE).sort(), ['en', 'he']);
  assert.equal(DEFAULT_LANG, 'he');
});
