const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  is_admin: Boolean(user.is_admin)
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes

// GET /api/products - Fetch all products
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET /api/products/:id - Fetch specific product
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(row);
  });
});

// POST /api/products - Create new product
app.post('/api/products', (req, res) => {
  const { name, category, price, description, image_url, sizes, stock } = req.body;

  if (!name || !category || !price || !image_url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sizesJson = JSON.stringify(sizes || ['One Size']);
  const stockValue = Number(stock) || 0;

  db.run(`INSERT INTO products (name, category, price, description, image_url, sizes, stock) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, category, price, description, image_url, sizesJson, stockValue],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Product created successfully' });
    });
});

// PUT /api/products/:id - Update product
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, price, description, image_url, sizes, stock } = req.body;

  if (!name || !category || !price || !image_url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sizesJson = JSON.stringify(sizes || ['One Size']);
  const stockValue = Number(stock) || 0;

  db.run(`UPDATE products SET name = ?, category = ?, price = ?, description = ?, image_url = ?, sizes = ?, stock = ? WHERE id = ?`,
    [name, category, price, description, image_url, sizesJson, stockValue, id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ message: 'Product updated successfully' });
    });
});

// DELETE /api/products/:id - Delete product
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (user) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    db.run('INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 0], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        db.get('SELECT id, name, email, is_admin FROM users WHERE id = ?', [this.lastID], (err2, newUser) => {
          if (err2) {
            res.status(500).json({ error: err2.message });
            return;
          }
          res.json({ user: sanitizeUser(newUser) });
        });
      });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ user: sanitizeUser(user) });
  });
});

app.get('/api/users', (req, res) => {
  db.all('SELECT id, name, email, is_admin, created_at FROM users', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST /api/orders - Submit order
app.post('/api/orders', (req, res) => {
  const { customer_name, email, phone, address, order_notes, items, total, payment_method } = req.body;

  if (!customer_name || !email || !items || !total) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const itemsJson = JSON.stringify(items);

  db.run(`INSERT INTO orders (customer_name, email, phone, address, order_notes, items, total, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [customer_name, email, phone, address, order_notes, itemsJson, total, payment_method],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Order submitted successfully' });
    });
});

// Catch all handler: send back index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});