import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMobileNumber } from './phoneNumber.js';

test('accepts local and international mobile numbers with display separators', () => {
  for (const input of ['09171234567', '+639171234567', ' 0917 123 4567 ', '+63 917-123-4567']) {
    assert.equal(normalizeMobileNumber(input), '09171234567');
  }
});

test('allows clearing the optional phone number', () => {
  for (const input of ['', '   ', null, undefined]) assert.equal(normalizeMobileNumber(input), null);
});

test('rejects wrong prefixes, lengths, letters, extensions and separator-only input', () => {
  for (const input of ['08171234567', '0917123456', '091712345678', '+63917123456', '+6391712345678', '+19171234567', '0917abc4567', '09171234567 ext 1', '---', '0917.123.4567']) {
    assert.throws(() => normalizeMobileNumber(input), /Philippine mobile number/);
  }
});
