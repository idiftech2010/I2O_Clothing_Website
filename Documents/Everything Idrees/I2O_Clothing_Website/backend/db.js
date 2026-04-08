const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Create database
const db = new sqlite3.Database('./i2o_clothing.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

const seedProducts = () => {
  const products = [
    {
      name: 'Luxury Gold Cufflinks',
      category: 'Accessories',
      price: 25000,
      description: 'Elegant 18k gold-plated cufflinks with intricate Nigerian patterns.',
      image_url: 'images/a.jpg',
      sizes: JSON.stringify(['One Size']),
      stock: 15
    },
    {
      name: 'Bespoke Navy Blue Suit',
      category: 'Bespoke Suits',
      price: 150000,
      description: 'Custom-tailored navy blue suit made from premium wool fabric.',
      image_url: 'images/c.jpg',
      sizes: JSON.stringify(['Custom Measurements']),
      stock: 8
    },
    {
      name: 'Silk Tie Collection',
      category: 'Accessories',
      price: 15000,
      description: 'Handcrafted silk ties in various colors, perfect for formal occasions.',
      image_url: 'images/f.jpg',
      sizes: JSON.stringify(['One Size']),
      stock: 25
    },
    {
      name: 'Premium Leather Belt',
      category: 'Accessories',
      price: 20000,
      description: 'Genuine leather belt with gold buckle, crafted for durability and style.',
      image_url: 'images/t.jpg',
      sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
      stock: 12
    },
    {
      name: 'Bespoke White Shirt',
      category: 'Bespoke Suits',
      price: 35000,
      description: 'Custom-fitted white cotton shirt with French cuffs.',
      image_url: 'https://source.unsplash.com/featured/?white+shirt,tailoring',
      sizes: JSON.stringify(['Custom Measurements']),
      stock: 6
    },
    {
      name: 'Elegant Wristwatch',
      category: 'Accessories',
      price: 75000,
      description: 'Swiss movement watch with gold case and leather strap.',
      image_url: 'https://source.unsplash.com/featured/?luxury+wristwatch',
      sizes: JSON.stringify(['One Size']),
      stock: 10
    }
  ];

  products.forEach(product => {
    db.run(`INSERT OR IGNORE INTO products (name, category, price, description, image_url, sizes, stock) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [product.name, product.category, product.price, product.description, product.image_url, product.sizes, product.stock],
      function(err) {
        if (err) {
          console.error(err.message);
        }
      });
  });
};

const seedAdminUser = () => {
  const adminEmail = 'admin@i2oclothing.com';
  const adminPassword = 'Admin123!';
  const hashedPassword = bcrypt.hashSync(adminPassword, 10);

  db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, row) => {
    if (err) {
      console.error(err.message);
      return;
    }

    if (!row) {
      db.run('INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)',
        ['Admin', adminEmail, hashedPassword, 1],
        function(err) {
          if (err) {
            console.error(err.message);
            return;
          }
          console.log('Admin user created:', adminEmail);
        });
    }
  });
};

// Create tables
db.serialize(() => {
  // Products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    image_url TEXT,
    sizes TEXT,
    stock INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    order_notes TEXT,
    items TEXT,
    total REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.all(`PRAGMA table_info(orders)`, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return;
    }

    const hasPaymentMethod = rows.some(column => column.name === 'payment_method');
    if (!hasPaymentMethod) {
      db.run('ALTER TABLE orders ADD COLUMN payment_method TEXT', (alterErr) => {
        if (alterErr) {
          console.error(alterErr.message);
        }
      });
    }
  });

  db.all(`PRAGMA table_info(products)`, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return;
    }

    const hasStock = rows.some(column => column.name === 'stock');
    if (!hasStock) {
      db.run('ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 10', (alterErr) => {
        if (alterErr) {
          console.error(alterErr.message);
        }
        seedProducts();
      });
    } else {
      seedProducts();
    }
  });

  db.all(`PRAGMA table_info(users)`, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return;
    }

    const hasIsAdmin = rows.some(column => column.name === 'is_admin');
    if (!hasIsAdmin) {
      db.run('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0', (alterErr) => {
        if (alterErr) {
          console.error(alterErr.message);
        }
        seedAdminUser();
      });
    } else {
      seedAdminUser();
    }
  });
});

module.exports = db;