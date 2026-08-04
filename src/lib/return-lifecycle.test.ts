import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canCompleteReturn,
  canTransitionReturn,
  normalizeReturnStatus,
  resolutionRequiresOfflineRefund,
} from './return-lifecycle.ts';

test('return transitions follow the controlled seller workflow', () => {
  assert.equal(canTransitionReturn('pending', 'approved', 'seller'), true);
  assert.equal(canTransitionReturn('pending', 'rejected', 'seller'), true);
  assert.equal(canTransitionReturn('approved', 'processing', 'seller'), true);
  assert.equal(canTransitionReturn('processing', 'completed', 'seller'), true);
  assert.equal(canTransitionReturn('completed', 'processing', 'seller'), false);
  assert.equal(canTransitionReturn('pending', 'completed', 'admin'), false);
});

test('offline refunds must be manually confirmed before completion', () => {
  assert.equal(resolutionRequiresOfflineRefund('offline_refund'), true);
  assert.equal(resolutionRequiresOfflineRefund('exchange'), false);
  assert.equal(canCompleteReturn('offline_refund', 'required'), false);
  assert.equal(canCompleteReturn('offline_refund', 'confirmed'), true);
  assert.equal(canCompleteReturn('return_only', 'not_required'), true);
});

test('unknown return statuses are rejected', () => {
  assert.equal(normalizeReturnStatus('pending'), 'pending');
  assert.equal(normalizeReturnStatus('refunded'), null);
});
