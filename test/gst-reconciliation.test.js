'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');

var invoice = require('../lib/invoice');
var reports = require('../lib/reports');

function line(id, name, hsn, price, qty) {
  return { id: id, name: name, hsn: hsn, price: price, qty: qty };
}

function order(id, date, customer, items, coupon, figures) {
  return Object.assign({
    id: id,
    date: date,
    customer: customer,
    items: items,
    coupon: coupon,
    status: 'completed'
  }, figures);
}

function suppliedOrders() {
  return [
    order(1001, '28/12/2021', 'Meera Joshi', [
      line(8, 'Assam CTC Masala Chai 250g', '0902', 140, 2),
      line(2, 'Unpolished Toor Dal 1kg', '0713', 165, 2)
    ], '', { subtotal: 610, discount: 0, tax: 66.9, total: 676.9 }),
    order(1002, '05/01/2022', 'Anil Kulkarni', [
      line(1, 'Indrayani Basmati Rice 5kg', '1006', 640, 1),
      line(4, 'Cold-Pressed Sunflower Oil 1L', '1512', 190, 2)
    ], 'SAVE10', { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }),
    order(1003, '20/01/2022', 'Test Customer 1003', [
      line(3, 'Toor Dal', '0713', 300, 1)
    ], '', { subtotal: 300, discount: 0, tax: 15, total: 315 }),
    order(1004, '30/01/2022', 'Kalyani Foods', [
      line(5, 'Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2)
    ], 'SAVE10', { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }),
    order(1005, '10/02/2022', 'Test Customer 1005', [
      line(6, 'Ghee', '0405', 500, 1)
    ], '', { subtotal: 500, discount: 0, tax: 60, total: 560 }),
    order(1006, '20/02/2022', 'Test Customer 1006', [
      line(7, 'Rice', '1006', 800, 1)
    ], '', { subtotal: 800, discount: 0, tax: 40, total: 840 }),
    order(1007, '04/03/2022', 'Suresh Deshmukh', [
      line(6, 'A2 Gir Cow Ghee 500ml', '0405', 450, 2),
      line(4, 'Cold-Pressed Sunflower Oil 1L', '1512', 190, 2)
    ], '', { subtotal: 1280, discount: 0, tax: 127, total: 1407 }),
    order(1008, '15/03/2022', 'Walk-in', [
      line(8, 'Assam CTC Masala Chai 250g', '0902', 140, 1),
      line(12, 'Kokum Sherbet Concentrate 750ml', '2106', 180, 2)
    ], '', { subtotal: 500, discount: 0, tax: 90, total: 590 })
  ];
}

test('invoice figures reconcile with checkout totals for the supplied order examples', function () {
  var rows = suppliedOrders();
  var db = { orders: rows };
  var result = reports.getGstReconciliation(db);

  assert.equal(result.totalChecked, 8);
  assert.equal(result.mismatchCount, 0);
  assert.equal(result.totalDelta, 0);
  result.rows.forEach(function (row) {
    assert.equal(row.matched, true, 'order #' + row.orderId + ' should reconcile');
  });

  var byId = {};
  result.rows.forEach(function (row) { byId[row.orderId] = row; });
  assert.equal(byId[1001].ledgerTax, 66.9);
  assert.equal(byId[1001].invoiceTax, 66.9);
  assert.equal(byId[1001].invoiceTotal, 676.9);
  assert.equal(byId[1002].ledgerTotal, 963.9);
  assert.equal(byId[1002].ledgerTax, 45.9);
  assert.equal(byId[1002].invoiceTotal, 963.9);
  assert.equal(byId[1002].invoiceTax, 45.9);
  assert.equal(byId[1002].invoiceDiscount, 102);
  assert.equal(byId[1004].ledgerDiscount, 150);
  assert.equal(byId[1004].invoiceDiscount, 150);
  assert.equal(byId[1004].invoiceTax, 104.5);
  assert.equal(byId[1004].invoiceTotal, 2194.5);
  assert.equal(byId[1007].invoiceTax, 127);
  assert.equal(byId[1007].invoiceTotal, 1407);
  assert.equal(byId[1008].invoiceTax, 90);
  assert.equal(byId[1008].invoiceTotal, 590);
  assert.equal(byId[1008].matched, true);
});

test('invoice uses HSN slab rates for 5% and 12% lines', function () {
  var calc = invoice.computeInvoiceFigures({
    items: [
      line(1, 'Groundnut oil', '1508', 100, 1),
      line(2, 'Ghee', '0405', 100, 1)
    ],
    coupon: ''
  });

  assert.equal(calc.rows[0].gstPercent, 5);
  assert.equal(calc.rows[1].gstPercent, 12);
  assert.equal(calc.tax, 17);
  assert.equal(calc.total, 217);
});

test('invoice applies checkout SAVE10 cap and subtotal discount basis', function () {
  var calc = invoice.computeInvoiceFigures({
    items: [line(5, 'Groundnut oil', '1508', 1120, 2)],
    coupon: 'SAVE10'
  });

  assert.equal(calc.subtotal, 2240);
  assert.equal(calc.tax, 104.5);
  assert.equal(calc.discount, 150);
  assert.equal(calc.total, 2194.5);
});

test('printed invoice uses reconciled totals and does not show a mismatch notice', function () {
  var sample = suppliedOrders()[1];
  var html = invoice.render(sample);

  assert.match(html, /₹963\.90/);
  assert.match(html, /₹45\.90/);
  assert.match(html, /₹102\.00/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
