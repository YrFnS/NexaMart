import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canSetReturnDisposition,
  canTransitionReplacement,
  dispositionRestoresInventory,
  replacementRequiresTracking,
  replacementTransitionReservesInventory,
  replacementTransitionRestoresInventory,
} from './fulfillment-operations.ts';

test('return inventory disposition is recorded only once after approval', () => {
  assert.equal(canSetReturnDisposition('pending', null), false);
  assert.equal(canSetReturnDisposition('approved', null), true);
  assert.equal(canSetReturnDisposition('processing', null), true);
  assert.equal(canSetReturnDisposition('completed', null), true);
  assert.equal(canSetReturnDisposition('approved', 'restock'), false);
});

test('only restock returns inventory to sellable stock', () => {
  assert.equal(dispositionRestoresInventory('restock'), true);
  assert.equal(dispositionRestoresInventory('quarantine'), false);
  assert.equal(dispositionRestoresInventory('discard'), false);
});

test('replacement shipments follow a controlled lifecycle', () => {
  assert.equal(canTransitionReplacement('preparing', 'shipped'), true);
  assert.equal(canTransitionReplacement('preparing', 'cancelled'), true);
  assert.equal(canTransitionReplacement('shipped', 'delivered'), true);
  assert.equal(canTransitionReplacement('shipped', 'cancelled'), false);
  assert.equal(canTransitionReplacement('delivered', 'preparing'), false);
  assert.equal(canTransitionReplacement('cancelled', 'preparing'), true);
});

test('replacement tracking and inventory transitions are explicit', () => {
  assert.equal(replacementRequiresTracking('preparing'), false);
  assert.equal(replacementRequiresTracking('shipped'), true);
  assert.equal(replacementRequiresTracking('delivered'), true);
  assert.equal(
    replacementTransitionRestoresInventory('preparing', 'cancelled'),
    true,
  );
  assert.equal(
    replacementTransitionReservesInventory('cancelled', 'preparing'),
    true,
  );
});
