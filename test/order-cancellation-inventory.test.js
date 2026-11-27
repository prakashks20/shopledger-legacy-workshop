'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');

var orders = require('../lib/orders');

test('cancelling an order restores physical stock from order line ids', function () {
  var db = {
    products: [
      { id: 6, sku: 'DRY-001', stock: 1, reserved: 0 },
      { id: 4, sku: 'OIL-001', stock: 22, reserved: 4 }
    ],
    orders: [{
      id: 1007,
      status: 'pending',
      paymentMode: 'cash',
      items: [
        { id: 6, qty: 2 },
        { id: 4, qty: 2 }
      ]
    }]
  };

  var result = orders.cancel(db, 1007, 'Regression test');

  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.equal(db.products[0].stock, 3);
  assert.equal(db.products[1].stock, 24);
  assert.equal(db.products[1].reserved, 4);
});

test('cancelling the same order twice does not restore stock twice', function () {
  var db = {
    products: [{ id: 6, sku: 'DRY-001', stock: 0, reserved: 0 }],
    orders: [{
      id: 1007,
      status: 'pending',
      paymentMode: 'cash',
      items: [{ id: 6, qty: 1 }]
    }]
  };

  assert.equal(orders.cancel(db, 1007).ok, true);
  assert.equal(orders.cancel(db, 1007).ok, false);
  assert.equal(db.products[0].stock, 1);
});
