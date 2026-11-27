'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');

var inventory = require('../lib/inventory');

test('allows selling exactly all sellable stock, including stock after reservations', function () {
  var products = [
    { id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', stock: 1, reserved: 0 },
    { id: 11, sku: 'SPC-001', name: 'Byadgi Chilli Powder', stock: 4, reserved: 3 }
  ];

  assert.deepEqual(inventory.check(products, [{ id: 6, qty: 1 }]), { ok: true });
  assert.deepEqual(inventory.check(products, [{ id: 11, qty: 1 }]), { ok: true });
});

test('still rejects quantities greater than sellable stock', function () {
  var products = [
    { id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', stock: 1, reserved: 0 }
  ];

  assert.deepEqual(inventory.check(products, [{ id: 6, qty: 2 }]), {
    ok: false,
    msg: 'A2 Gir Cow Ghee 500ml is out of stock (1 sellable available)'
  });
});
