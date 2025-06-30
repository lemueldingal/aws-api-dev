const express = require('express');
const serverless = require('serverless-http');

const app = express();
app.use(express.json()); 

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

let orders = {
  '1':     { orderId: '1', details: 'Order 1 details' },
  '2':     { orderId: '2', details: 'Order 2 details' },
  '10':    { orderId: '10', details: 'Order 10 details' },
  '100':   { orderId: '100', details: 'Order 100 details' },
  '101':   { orderId: '101', details: 'Order 101 details' },
  '110':   { orderId: '110', details: 'Order 110 details' },
  '210':   { orderId: '210', details: 'Order 210 details' },
  '31110': { orderId: '31110', details: 'Order 31010 details' },
  '410':   { orderId: '410', details: 'Order 410 details' },
  '51010': { orderId: '51010', details: 'Order 51010 details' },
};

// ✅ GET /orders?query=*
app.get('/orders', (req, res) => {
  const query = req.query.query;
  let result = Object.keys(orders).sort();

  if (query) {
    const wildcardCount = (query.match(/\*/g) || []).length;

    if (wildcardCount === 0) {
      result = result.filter(id => id === query);
    } else if (wildcardCount === 1) {
      if (query.startsWith('*')) {
        const suffix = query.slice(1);
        result = result.filter(id => id.endsWith(suffix));
      } else if (query.endsWith('*')) {
        const prefix = query.slice(0, -1);
        result = result.filter(id => id.startsWith(prefix));
      } else {
        const [start, end] = query.split('*');
        result = result.filter(id => id.startsWith(start) && id.endsWith(end));
      }
    } else if (wildcardCount === 2 && query.startsWith('*') && query.endsWith('*')) {
      const keyword = query.slice(1, -1);
      result = result.filter(id => {
        const index = id.indexOf(keyword);
        return index > 0 && index + keyword.length < id.length;
      });
    } else {
      return res.status(400).json({ error: 'Invalid search pattern' });
    }
  }

  res.json(result.slice(0, 10));
});

// ✅ GET /orders/:orderId
app.get('/orders/:orderId', (req, res) => {
  const order = orders[req.params.orderId];
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// ✅ POST /orders
app.post('/orders', (req, res) => {
  const { orderId, details } = req.body;
  if (!orderId || !details) {
    return res.status(400).json({ error: 'Missing orderId or details' });
  }
  if (orders[orderId]) {
    return res.status(409).json({ error: 'Order already exists' });
  }
  orders[orderId] = { orderId, details };
  res.status(201).json(orders[orderId]);
});

// ✅ PUT /orders/:orderId
app.put('/orders/:orderId', (req, res) => {
  const { details } = req.body;
  const id = req.params.orderId;
  if (!orders[id]) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (!details) {
    return res.status(400).json({ error: 'Missing order details' });
  }
  orders[id].details = details;
  res.json(orders[id]);
});

// ✅ DELETE /orders/:orderId
app.delete('/orders/:orderId', (req, res) => {
  const id = req.params.orderId;
  if (!orders[id]) {
    return res.status(404).json({ error: 'Order not found' });
  }
  delete orders[id];
  res.json({ deleted: id });
});

module.exports.handler = serverless(app, {
  request: (req, event, context) => {
    if (
      event.body &&
      typeof event.body === 'string' &&
      event.headers['Content-Type'] === 'application/json'
    ) {
      try {
        req.body = JSON.parse(event.body);
      } catch (err) {
        console.error('Failed to parse body:', err);
        req.body = {};
      }
    }
  }
});
