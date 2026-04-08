// Global variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentSlide = 0;
let autoSlideInterval;

const chatResponses = {
  greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
  about: ['about', 'brand', 'company', 'story', 'history'],
  products: ['product', 'suit', 'shirt', 'tie', 'cufflink', 'belt', 'watch', 'accessory'],
  pricing: ['price', 'cost', 'expensive', 'cheap', 'afford'],
  contact: ['contact', 'phone', 'email', 'address', 'location'],
  consultation: ['consultation', 'book', 'appointment', 'meeting'],
  bespoke: ['bespoke', 'custom', 'tailor', 'measurement'],
  shipping: ['shipping', 'delivery', 'order', 'when'],
  return: ['return', 'refund', 'exchange']
};

// DOM Content Loaded
window.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  updateCartCount();
  updateAuthNav();
  setupEventListeners();
  initChat();

  if (document.querySelector('#signup-form')) {
    setupSignupPage();
  }
  if (document.querySelector('#signin-form')) {
    setupSigninPage();
  }
  if (document.querySelector('#admin-dashboard')) {
    loadAdminDashboard();
  }
  if (document.querySelector('#product-carousel')) {
    loadProductCarousel();
  }
  if (document.querySelector('#product-grid')) {
    loadShopProducts();
  }
  if (document.querySelector('#product-detail')) {
    loadProductDetail();
  }
  if (document.querySelector('#cart-items')) {
    loadCartItems();
  }
  if (document.querySelector('#checkout-form')) {
    setupCheckoutForm();
  }
});

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, function(match) {
    const replacements = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return replacements[match];
  });
}

function updateAuthNav() {
  const authNav = document.getElementById('auth-nav');
  if (!authNav) return;

  if (currentUser) {
    authNav.innerHTML = `
      <span class="nav-user">Hi, ${escapeHtml(currentUser.name)}</span>
      ${currentUser.is_admin ? '<a class="auth-btn primary" href="admin.html">Dashboard</a>' : ''}
      <button class="auth-btn" onclick="logout()">Logout</button>
    `;
  } else {
    authNav.innerHTML = `
      <a class="auth-btn" href="signin.html">Sign In</a>
      <a class="auth-btn primary" href="signup.html">Sign Up</a>
    `;
  }
}

function setCurrentUser(user) {
  currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(user));
  updateAuthNav();
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  updateAuthNav();
  window.location.href = 'index.html';
}

async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    products = await response.json();
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

function updateCartCount() {
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const countElements = document.querySelectorAll('.cart-count');
  countElements.forEach(el => el.textContent = cartCount);
}

function setupSignupPage() {
  const signupForm = document.getElementById('signup-form');
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(signupForm);
    const payload = {
      name: formData.get('name').trim(),
      email: formData.get('email').trim(),
      password: formData.get('password').trim()
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        showAuthMessage(data.error || 'Registration failed', 'error');
        return;
      }
      setCurrentUser(data.user);
      showAuthMessage('Signup successful! Redirecting...', 'success');
      setTimeout(() => {
        if (data.user.is_admin) {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'index.html';
        }
      }, 1000);
    } catch (error) {
      console.error(error);
      showAuthMessage('Registration failed. Please try again.', 'error');
    }
  });
}

function setupSigninPage() {
  const signinForm = document.getElementById('signin-form');
  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(signinForm);
    const payload = {
      email: formData.get('email').trim(),
      password: formData.get('password').trim()
    };

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        showAuthMessage(data.error || 'Login failed', 'error');
        return;
      }
      setCurrentUser(data.user);
      showAuthMessage('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        if (data.user.is_admin) {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'index.html';
        }
      }, 800);
    } catch (error) {
      console.error(error);
      showAuthMessage('Login failed. Please try again.', 'error');
    }
  });
}

function showAuthMessage(message, type) {
  const messageEl = document.getElementById('auth-message');
  if (!messageEl) return;
  messageEl.textContent = message;
  messageEl.className = `auth-message ${type}`;
}

function setupEventListeners() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const category = this.dataset.category;
      filterProducts(category);
    });
  });
}

function loadProductCarousel() {
  const carousel = document.getElementById('product-carousel');
  const dotsContainer = document.getElementById('carousel-dots');
  carousel.innerHTML = '';
  dotsContainer.innerHTML = '';

  const visibleProducts = products.filter(product => product.stock === undefined || product.stock > 0);
  if (visibleProducts.length === 0) {
    carousel.innerHTML = '<p class="empty-state">No products available at this time.</p>';
    return;
  }

  visibleProducts.forEach((product, index) => {
    const carouselItem = document.createElement('div');
    carouselItem.className = 'carousel-item';
    carouselItem.innerHTML = `
      <div class="product-card">
        <img src="${product.image_url}" alt="${escapeHtml(product.name)}">
        <h3>${escapeHtml(product.name)}</h3>
        <p>${product.price.toLocaleString()}</p>
        <button class="cta-button" onclick="viewProduct(${product.id})">View Details</button>
      </div>
    `;
    carousel.appendChild(carouselItem);

    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.onclick = () => goToSlide(index);
    dotsContainer.appendChild(dot);
  });

  currentSlide = 0;
  updateCarousel();
  startAutoSlide();

  const carouselContainer = document.querySelector('.carousel-container');
  if (carouselContainer) {
    carouselContainer.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
    carouselContainer.addEventListener('mouseleave', startAutoSlide);
  }
}

function updateCarousel() {
  const carousel = document.getElementById('product-carousel');
  const dots = document.querySelectorAll('.dot');
  if (!carousel) return;
  carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
  dots.forEach((dot, index) => dot.classList.toggle('active', index === currentSlide));
}

function nextSlide() {
  const visibleProducts = products.filter(product => product.stock === undefined || product.stock > 0);
  currentSlide = (currentSlide + 1) % visibleProducts.length;
  updateCarousel();
  resetAutoSlide();
}

function prevSlide() {
  const visibleProducts = products.filter(product => product.stock === undefined || product.stock > 0);
  currentSlide = (currentSlide - 1 + visibleProducts.length) % visibleProducts.length;
  updateCarousel();
  resetAutoSlide();
}

function goToSlide(index) {
  currentSlide = index;
  updateCarousel();
  resetAutoSlide();
}

function startAutoSlide() {
  clearInterval(autoSlideInterval);
  autoSlideInterval = setInterval(nextSlide, 5000);
}

function resetAutoSlide() {
  clearInterval(autoSlideInterval);
  startAutoSlide();
}

function loadShopProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const activeProducts = products.filter(product => product.stock === undefined || product.stock > 0);
  if (activeProducts.length === 0) {
    grid.innerHTML = '<p class="empty-state">No products are available right now.</p>';
    return;
  }
  activeProducts.forEach(product => {
    const productCard = createProductCard(product);
    grid.appendChild(productCard);
  });
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <img src="${product.image_url}" alt="${escapeHtml(product.name)}">
    <h3>${escapeHtml(product.name)}</h3>
    <p>${product.price.toLocaleString()}</p>
    <button class="cta-button" onclick="viewProduct(${product.id})">View Details</button>
  `;
  return card;
}

function viewProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

async function loadProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (!id) return;

  try {
    const response = await fetch(`/api/products/${id}`);
    const product = await response.json();
    const detailSection = document.getElementById('product-detail');
    const sizes = JSON.parse(product.sizes || '[]');
    detailSection.innerHTML = `
      <div class="product-images">
        <img src="${product.image_url}" alt="${escapeHtml(product.name)}">
      </div>
      <div class="product-info">
        <h1>${escapeHtml(product.name)}</h1>
        <p class="price">${product.price.toLocaleString()}</p>
        <p>${escapeHtml(product.description)}</p>
        ${product.stock !== undefined && product.stock <= 0 ? '<p class="out-of-stock">Out of Stock</p>' : ''}
        <div class="size-selection">
          <label for="size">Size/Option:</label>
          <select id="size">
            ${sizes.map(size => `<option value="${escapeHtml(size)}">${escapeHtml(size)}</option>`).join('')}
          </select>
        </div>
        <div class="quantity">
          <label for="quantity">Quantity:</label>
          <input type="number" id="quantity" value="1" min="1" ${product.stock !== undefined && product.stock <= 0 ? 'disabled' : ''}>
        </div>
        <button class="cta-button" onclick="addToCart(${product.id})" ${product.stock !== undefined && product.stock <= 0 ? 'disabled' : ''}>Add to Cart</button>
      </div>
    `;
  } catch (error) {
    console.error('Error loading product:', error);
  }
}

function addToCart(productId) {
  const product = products.find(p => p.id == productId);
  if (!product) return;
  if (product.stock !== undefined && product.stock <= 0) {
    alert('This item is currently out of stock.');
    return;
  }

  const size = document.getElementById('size').value;
  const quantity = parseInt(document.getElementById('quantity').value);

  const cartItem = {
    id: product.id,
    name: product.name,
    price: product.price,
    image_url: product.image_url,
    size: size,
    quantity: quantity
  };

  const existingItem = cart.find(item => item.id == productId && item.size === size);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push(cartItem);
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert('Added to cart!');
}

function loadCartItems() {
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  if (!cartItems || !cartTotal) return;

  if (cart.length === 0) {
    cartItems.innerHTML = '<p>Your cart is empty.</p>';
    cartTotal.textContent = '0';
    return;
  }

  cartItems.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const itemElement = document.createElement('div');
    itemElement.className = 'cart-item';
    itemElement.innerHTML = `
      <img src="${item.image_url}" alt="${escapeHtml(item.name)}">
      <div class="cart-item-details">
        <h3>${escapeHtml(item.name)}</h3>
        <p>Size: ${escapeHtml(item.size)}</p>
        <p>${item.price.toLocaleString()} x ${item.quantity}</p>
      </div>
      <div>
        <p>${itemTotal.toLocaleString()}</p>
        <button class="cart-action" onclick="removeFromCart(${index})">Remove</button>
      </div>
    `;
    cartItems.appendChild(itemElement);
  });

  cartTotal.textContent = total.toLocaleString();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCartItems();
  updateCartCount();
}

function setupCheckoutForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(form);
    const orderData = {
      customer_name: formData.get('customer_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      order_notes: formData.get('order_notes'),
      payment_method: formData.get('payment_method'),
      items: cart,
      total: cart.reduce((total, item) => total + (item.price * item.quantity), 0)
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        alert('Order submitted successfully!');
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        window.location.href = 'index.html';
      } else {
        alert('Error submitting order. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error submitting order. Please try again.');
    }
  });
}

async function loadAdminDashboard() {
  const adminContent = document.getElementById('admin-content');
  if (!adminContent) return;

  if (!currentUser || !currentUser.is_admin) {
    adminContent.innerHTML = '<p class="empty-state">Admin access required. Please sign in with an admin account.</p>';
    return;
  }

  document.getElementById('admin-welcome').textContent = `Welcome, ${currentUser.name}`;
  document.getElementById('admin-product-form').addEventListener('submit', submitAdminProductForm);
  const cancelButton = document.getElementById('product-cancel-button');
  if (cancelButton) {
    cancelButton.addEventListener('click', resetProductForm);
  }
  loadAdminProducts();
  loadAdminUsers();
  loadAdminOrders();
}

async function loadAdminProducts() {
  const table = document.getElementById('admin-products-table');
  const message = document.getElementById('admin-product-message');
  if (!table) return;
  table.innerHTML = '';

  try {
    const response = await fetch('/api/products');
    const items = await response.json();
    if (!items.length) {
      table.innerHTML = '<tr><td colspan="6">No products found.</td></tr>';
      return;
    }

    table.innerHTML = `
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Category</th>
        <th>Price</th>
        <th>Stock</th>
        <th>Actions</th>
      </tr>
    `;

    items.forEach(product => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${product.id}</td>
        <td>${escapeHtml(product.name)}</td>
        <td>${escapeHtml(product.category)}</td>
        <td>${product.price.toLocaleString()}</td>
        <td>${product.stock !== undefined ? product.stock : 'N/A'}</td>
        <td class="table-actions">
          <button class="auth-btn" onclick="editProduct(${product.id})">Edit</button>
          <button class="auth-btn primary" onclick="deleteProduct(${product.id})">Delete</button>
        </td>
      `;
      table.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading admin products:', error);
    if (message) message.textContent = 'Unable to load products.';
  }
}

async function editProduct(id) {
  try {
    const response = await fetch(`/api/products/${id}`);
    const product = await response.json();
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-image').value = product.image_url;
    document.getElementById('product-stock').value = product.stock || 0;
    document.getElementById('product-description').value = product.description;
    const sizes = JSON.parse(product.sizes || '[]');
    document.getElementById('product-sizes').value = sizes.join(', ');
    document.getElementById('product-submit-button').textContent = 'Update Product';
    document.getElementById('product-cancel-button').style.display = 'inline-block';
  } catch (error) {
    console.error('Error editing product:', error);
  }
}

async function submitAdminProductForm(e) {
  e.preventDefault();
  const id = document.getElementById('product-id').value;
  let imageUrl = document.getElementById('product-image').value.trim();
  const fileInput = document.getElementById('product-image-file');

  // If file is selected, upload it first
  if (fileInput.files.length > 0) {
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    try {
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadResponse.json();
      if (uploadResponse.ok) {
        imageUrl = uploadData.image_url;
      } else {
        document.getElementById('admin-product-message').textContent = uploadData.error || 'Failed to upload image.';
        return;
      }
    } catch (error) {
      console.error('Upload error:', error);
      document.getElementById('admin-product-message').textContent = 'Failed to upload image.';
      return;
    }
  }

  const payload = {
    name: document.getElementById('product-name').value.trim(),
    category: document.getElementById('product-category').value.trim(),
    price: parseFloat(document.getElementById('product-price').value),
    description: document.getElementById('product-description').value.trim(),
    image_url: imageUrl,
    sizes: document.getElementById('product-sizes').value.split(',').map(s => s.trim()).filter(Boolean),
    stock: parseInt(document.getElementById('product-stock').value, 10)
  };

  try {
    const url = id ? `/api/products/${id}` : '/api/products';
    const method = id ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      document.getElementById('admin-product-message').textContent = data.error || 'Unable to save product.';
      return;
    }
    document.getElementById('admin-product-message').textContent = data.message || 'Saved successfully.';
    resetProductForm();
    loadAdminProducts();
    await loadProducts();
  } catch (error) {
    console.error('Error saving product:', error);
    document.getElementById('admin-product-message').textContent = 'Unable to save product.';
  }
}

function resetProductForm() {
  document.getElementById('product-id').value = '';
  document.getElementById('product-name').value = '';
  document.getElementById('product-category').value = '';
  document.getElementById('product-price').value = '';
  document.getElementById('product-description').value = '';
  document.getElementById('product-image').value = '';
  document.getElementById('product-image-file').value = '';
  document.getElementById('product-sizes').value = '';
  document.getElementById('product-stock').value = 0;
  document.getElementById('product-submit-button').textContent = 'Create Product';
  document.getElementById('product-cancel-button').style.display = 'none';
}

async function deleteProduct(id) {
  if (!confirm('Delete this product permanently?')) return;

  try {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    if (!response.ok) {
      alert(result.error || 'Unable to delete product.');
      return;
    }
    await loadAdminProducts();
    await loadProducts();
  } catch (error) {
    console.error('Error deleting product:', error);
  }
}

async function loadAdminUsers() {
  const table = document.getElementById('admin-users-table');
  if (!table) return;
  table.innerHTML = '';

  try {
    const response = await fetch('/api/users');
    const users = await response.json();
    if (!users.length) {
      table.innerHTML = '<tr><td colspan="4">No users found.</td></tr>';
      return;
    }
    table.innerHTML = `
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>Admin</th>
      </tr>
    `;
    users.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.id}</td>
        <td>${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${user.is_admin ? 'Yes' : 'No'}</td>
      `;
      table.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

async function loadAdminOrders() {
  const table = document.getElementById('admin-orders-table');
  if (!table) return;
  table.innerHTML = '';

  try {
    const response = await fetch('/api/orders');
    const orders = await response.json();
    if (!orders.length) {
      table.innerHTML = '<tr><td colspan="5">No orders found.</td></tr>';
      return;
    }
    table.innerHTML = `
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>Total</th>
        <th>Date</th>
      </tr>
    `;
    orders.forEach(order => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${order.id}</td>
        <td>${escapeHtml(order.customer_name)}</td>
        <td>${escapeHtml(order.email)}</td>
        <td>${order.total.toLocaleString()}</td>
        <td>${new Date(order.created_at).toLocaleString()}</td>
      `;
      table.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

function initChat() {
  const existing = document.getElementById('chat-button');
  if (existing) return;

  const chatButton = document.createElement('button');
  chatButton.id = 'chat-button';
  chatButton.className = 'chat-button';
  chatButton.title = 'Chat Support';
  chatButton.innerHTML = '<i class="fas fa-comments"></i>';
  chatButton.onclick = toggleChat;
  document.body.appendChild(chatButton);

  const chatModal = document.createElement('div');
  chatModal.className = 'chat-modal';
  chatModal.id = 'chat-modal';
  chatModal.innerHTML = `
    <div class="chat-header">IO Support - 24/7</div>
    <div class="chat-messages" id="chat-messages">
      <div class="message bot">Hello! I'm here to help with any questions about IO CLOTHING. How can I assist you today?</div>
    </div>
    <div class="chat-input">
      <input type="text" id="chat-input" placeholder="Type your message...">
      <button onclick="sendMessage()">Send</button>
    </div>
  `;
  document.body.appendChild(chatModal);

  document.getElementById('chat-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
  });
}

function toggleChat() {
  const modal = document.getElementById('chat-modal');
  if (!modal) return;
  modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  if (!input) return;
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, 'user');
  input.value = '';

  setTimeout(() => {
    const response = getBotResponse(message);
    addMessage(response, 'bot');
  }, 1000);
}

function addMessage(text, sender) {
  const messages = document.getElementById('chat-messages');
  if (!messages) return;
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  messageDiv.textContent = text;
  messages.appendChild(messageDiv);
  messages.scrollTop = messages.scrollHeight;
}

function getBotResponse(message) {
  const lowerMessage = message.toLowerCase();
  for (const [category, keywords] of Object.entries(chatResponses)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return getResponseForCategory(category);
    }
  }
  return "I'm sorry, I didn't understand that. Please ask about our products, pricing, consultations, or contact information.";
}

function getResponseForCategory(category) {
  switch (category) {
    case 'greeting': return "Hello! Welcome to IO CLOTHING. How can I help you today?";
    case 'about': return "IO CLOTHING is a Nigerian brand specializing in bespoke tailoring and premium accessories. We combine traditional craftsmanship with modern luxury to create pieces that reflect confidence and style.";
    case 'products': return "We offer bespoke suits, shirts, ties, cufflinks, belts, and wristwatches. All our products are made with premium materials and attention to detail.";
    case 'pricing': return "Our prices reflect the quality and craftsmanship of our products. Bespoke suits start from 150,000, while accessories range from 15,000 to 75,000.";
    case 'contact': return "You can reach us at info@i2oclothing.com or call +234 XXX XXX XXXX. We're located in Lagos, Nigeria. Our support is available 24/7.";
    case 'consultation': return "Book a consultation to discuss your bespoke tailoring needs. We offer personalized styling advice and custom fittings.";
    case 'bespoke': return "Our bespoke service includes custom measurements, fabric selection, and personalized styling. Each piece is handcrafted to perfection.";
    case 'shipping': return "We offer nationwide shipping in Nigeria. Orders are typically delivered within 7-14 business days. International shipping is available upon request.";
    case 'return': return "We accept returns within 30 days for unused items in original condition. Custom orders are final. Please contact us for return instructions.";
    default: return "Thank you for your interest in IO CLOTHING. Is there anything specific you'd like to know about our products or services?";
  }
}
