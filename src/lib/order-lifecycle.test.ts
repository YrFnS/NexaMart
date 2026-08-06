import assert from 'node:assert/strict';
import test from 'node:test';
import {
  allowedOrderTransitions,
  canTransitionOrder,
  confirmationDeadline,
  confirmationTtlHours,
  transitionRequiresTracking,
  transitionRestoresInventory,
} from './order-lifecycle.ts';

test('buyer cancellation is limited to an unconfirmed order', () => {
  assert.equal(canTransitionOrder('pending', 'cancelled', 'buyer'), true);
  assert.equal(canTransitionOrder('confirmed', 'cancelled', 'buyer'), false);
  assert.deepEqual(allowedOrderTransitions('delivered', 'buyer'), []);
});

test('seller follows the controlled fulfilment sequence', () => {
  assert.deepEqual(allowedOrderTransitions('pending', 'seller'), [
    'confirmed',
    'rejected',
  ]);
  assert.equal(canTransitionOrder('confirmed', 'preparing', 'seller'), true);
  assert.equal(canTransitionOrder('preparing', 'shipped', 'seller'), true);
  assert.equal(canTransitionOrder('shipped', 'delivered', 'seller'), true);
  assert.equal(canTransitionOrder('delivered', 'preparing', 'seller'), false);
});

test('only rejection and cancellation restore reserved inventory', () => {
  assert.equal(transitionRestoresInventory('cancelled'), true);
  assert.equal(transitionRestoresInventory('rejected'), true);
  assert.equal(transitionRestoresInventory('delivered'), false);
  assert.equal(transitionRequiresTracking('shipped'), true);
});

test('confirmation expiry is bounded and deterministic', () => {
  assert.equal(confirmationTtlHours('0'), 1);
  assert.equal(confirmationTtlHours('999'), 168);
  assert.equal(confirmationTtlHours('not-a-number'), 24);
  const now = new Date('2026-08-01T00:00:00.000Z');
  assert.equal(
    confirmationDeadline(now, 24).toISOString(),
    '2026-08-02T00:00:00.000Z',
  );
});
