'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

test('billing permits buying the exact remaining sellable quantity', function () {
  var products = [
    { id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', stock: 1, reserved: 0 },
    { id: 20, sku: 'SPC-001', name: 'Byadgi Kashmiri Chilli Powder 500g', stock: 4, reserved: 3 }
  ];

  assert.deepEqual(inventory.check(products, [{ id: 6, qty: 1 }]), { ok: true });
  assert.deepEqual(inventory.check(products, [{ id: 20, qty: 1 }]), { ok: true });
});

test('cancelling order 1007 returns its ghee and sunflower oil to physical stock', function () {
  var db = {
    nextOrderId: 1008,
    products: [
      { id: 6, sku: 'DRY-001', stock: 0, reserved: 0 },
      { id: 4, sku: 'OIL-001', stock: 2, reserved: 0 }
    ],
    orders: [{
      id: 1007,
      customer: 'Suresh Deshmukh',
      status: 'pending',
      items: [{ id: 6, qty: 2 }, { id: 4, qty: 2 }]
    }]
  };

  var result = orders.cancel(db, 1007, 'Cancelled from Order History');

  assert.equal(result.ok, true);
  assert.equal(db.products[0].stock, 2);
  assert.equal(db.products[1].stock, 4);
});
