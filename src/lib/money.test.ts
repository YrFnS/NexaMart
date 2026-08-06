import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BASE_CURRENCY,
  centsToDecimal,
  moneyNumber,
  percentageToBasisPoints,
  toCents,
} from './money.ts';

test('money values round once using integer minor units', () => {
  assert.equal(toCents('10.004'), 1000);
  assert.equal(toCents('10.005'), 1001);
  assert.equal(toCents(0.1 + 0.2), 30);
  assert.equal(centsToDecimal(1001), '10.01');
  assert.equal(moneyNumber('19.999'), 20);
});

test('percentage values use basis points and one base currency', () => {
  assert.equal(percentageToBasisPoints('12.50'), 1250);
  assert.equal(BASE_CURRENCY, 'USD');
  assert.throws(() => percentageToBasisPoints('100.01'));
});
