'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');

var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');
var reports = require('../lib/reports');

function makeOrder(items, coupon) {
  var totals = pricing.computeTotals(items, coupon || '');
  return {
    id: 42,
    date: '26/11/2026',
    customer: 'In-memory customer',
    paymentMode: 'cash',
    status: 'completed',
    items: items,
    coupon: coupon || '',
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total
  };
}

test('invoice GST follows HSN slabs when stored lines have no gstRate', function () {
  var items = [
    { id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 100, qty: 1 },
    { id: 2, name: 'Ghee', sku: 'GHEE', hsn: '0405', price: 100, qty: 1 }
  ];
  var ledger = pricing.computeTotals(items, '');
  var printed = invoice.computeInvoiceFigures(makeOrder(items, ''));

  assert.equal(ledger.tax, 17);
  assert.equal(printed.tax, ledger.tax);
  assert.deepEqual(printed.rows.map(function (row) { return row.gstPercent; }), [5, 12]);
});

test('invoice percentage coupon uses checkout subtotal and respects the discount cap', function () {
  var order = makeOrder([
    { id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 2000, qty: 1 }
  ], 'SAVE10');
  var printed = invoice.computeInvoiceFigures(order);

  assert.equal(order.discount, 150);
  assert.equal(order.tax, 92.5);
  assert.equal(order.total, 1942.5);
  assert.equal(printed.tax, order.tax);
  assert.equal(printed.discount, order.discount);
  assert.equal(printed.total, order.total);
  assert.equal(printed.rows[0].gstPercent, 5);
});

test('invoice does not apply a coupon below its configured minimum subtotal', function () {
  var order = makeOrder([
    { id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 250, qty: 1 }
  ], 'FLAT50');
  var printed = invoice.computeInvoiceFigures(order);

  assert.equal(order.discount, 0);
  assert.equal(printed.discount, order.discount);
  assert.equal(printed.total, order.total);
});

test('printable invoice shows the checkout GST amount in one combined CGST and SGST row', function () {
  var order = makeOrder([
    { id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 100, qty: 1 }
  ], '');
  var figures = invoice.computeInvoiceFigures(order);
  var html = invoice.render(order);

  assert.equal(figures.cgst, 2.5);
  assert.equal(figures.sgst, 2.5);
  assert.equal(figures.tax, 5);
  assert.match(html, /CGST \+ SGST \(Total GST\)/);
  assert.doesNotMatch(html, />CGST</);
  assert.doesNotMatch(html, />SGST</);
});

test('GST reconciliation matches checkout invoices and omits cancelled orders', function () {
  var active = makeOrder([
    { id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 640, qty: 1 }
  ], 'SAVE10');
  var cancelled = Object.assign({}, active, { id: 43, status: 'cancelled' });
  var result = reports.getGstReconciliation({
    orders: [active, cancelled],
    products: [],
    customers: [],
    settlements: []
  });

  assert.equal(result.totalChecked, 1);
  assert.equal(result.mismatchCount, 0);
  assert.equal(result.totalDelta, 0);
  assert.equal(result.rows[0].delta, 0);
  assert.equal(result.rows[0].matched, true);
});
