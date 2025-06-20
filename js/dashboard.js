class Dashboard {
  constructor() {
    this.products = [];
    this.reviews = [];
    this.init();
  }
  
  async init() {
    // Check authentication
    if (!localStorage.getItem('token')) {
      window.location.href = 'login.html';
      return;
    }

    try {
      // Load user data
      const user = await api.getUser();
      this.renderUserInfo(user);

      // Load dashboard stats
      const stats = await api.getDashboardStats();
      this.renderStats(stats);

      // Load products and reviews
      const [products, reviews] = await Promise.all([
        api.getProducts(),
        api.getReviews()
      ]);

      this.products = products;
      this.reviews = reviews;

      this.renderDashboard();
    } catch (error) {
      console.error('Dashboard initialization error:', error);
      if (error.message === 'Token is not valid' || error.message === 'Failed to fetch user data') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
      }
    }
  }
  
  renderUserInfo(user) {
    const userInfoElement = document.getElementById('user-info');
    const profileTitle = document.getElementById('profile-title');

    if (userInfoElement) {
      userInfoElement.innerHTML = `
        <h1 id="profile-title" class="profile-name">${user.firstName} ${user.lastName}</h1>
        <p class="profile-role">Customer</p>
        <p class="profile-location">${user.email}</p>
      `;
    }

    if (profileTitle) {
      profileTitle.textContent = `${user.firstName} ${user.lastName}`;
    }
  }

  renderStats(stats) {
    const totalReviewsElement = document.getElementById('total-reviews');
    const avgRatingElement = document.getElementById('avg-rating');
    const totalProductsElement = document.getElementById('total-products');

    if (totalReviewsElement) totalReviewsElement.textContent = stats.totalReviews || 0;
    if (avgRatingElement) avgRatingElement.textContent = stats.avgRating || '0.0';
    if (totalProductsElement) totalProductsElement.textContent = stats.totalProducts || 0;
  }
  
  renderDashboard() {
    this.renderProducts();
    this.renderReviews();
    this.setupEventListeners();
  }
  
  renderProducts() {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;
    
    productsContainer.innerHTML = this.products.length ? 
      this.products.map(product => `
        <div class="product-card" data-id="${product._id}">
          <img src="${product.imageUrl || 'img/placeholder.png'}" alt="${product.name}">
          <h3>${product.name}</h3>
          <p>${product.description.substring(0, 100)}...</p>
          <p class="price">$${product.price.toFixed(2)}</p>
          <button class="btn review-btn" data-id="${product._id}">Add Review</button>
        </div>
      `).join('') : 
      '<p>No products available.</p>';
  }
  
  renderReviews() {
    const reviewsContainer = document.getElementById('reviews-container');
    if (!reviewsContainer) return;
    
    reviewsContainer.innerHTML = this.reviews.length ?
      this.reviews.map(review => {
        const product = this.products.find(p => p._id === review.productId) || { name: 'Unknown Product' };
        return `
          <div class="review-card">
            <h4>${product.name}</h4>
            <div class="rating">
              ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
            </div>
            <p>${review.content}</p>
            <small>Source: ${review.source}</small>
          </div>
        `;
      }).join('') :
      '<p>No reviews available.</p>';
  }
  
  setupEventListeners() {
    // Add review buttons
    document.querySelectorAll('.review-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const productId = e.target.dataset.id;
        this.showReviewForm(productId);
      });
    });

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
      });
    }

    // Quick action buttons
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
      addProductBtn.addEventListener('click', () => {
        this.showAddProductForm();
      });
    }

    const viewNotificationsBtn = document.getElementById('view-notifications-btn');
    if (viewNotificationsBtn) {
      viewNotificationsBtn.addEventListener('click', () => {
        this.showNotifications();
      });
    }

    // Settings button from profile menu
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showSettingsModal();
      });
    }

    // Notifications button from profile menu
    const notificationsBtnMenu = document.getElementById('notifications-btn');
    if (notificationsBtnMenu) {
      notificationsBtnMenu.addEventListener('click', (e) => {
        e.preventDefault();
        this.showNotifications();
      });
    }
  }
  
  showReviewForm(productId) {
    const product = this.products.find(p => p._id === productId);
    if (!product) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Review for ${product.name}</h2>
        <form id="review-form">
          <div class="form-group">
            <label for="rating">Rating:</label>
            <select id="rating" required>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          <div class="form-group">
            <label for="review-content">Your Review:</label>
            <textarea id="review-content" required></textarea>
          </div>
          <div class="form-group">
            <label for="source">Source:</label>
            <select id="source" required>
              <option value="Website">Website</option>
              <option value="Mobile App">Mobile App</option>
              <option value="In-store">In-store</option>
            </select>
          </div>
          <button type="submit" class="btn">Submit Review</button>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal
    modal.querySelector('.close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Submit review
    modal.querySelector('#review-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const reviewData = {
        productId,
        rating: parseInt(document.getElementById('rating').value),
        content: document.getElementById('review-content').value,
        source: document.getElementById('source').value,
        userId: JSON.parse(localStorage.getItem('user')).id
      };
      
      try {
        await api.submitReview(reviewData);
        document.body.removeChild(modal);
        
        // Refresh reviews
        this.reviews = await api.getReviews();
        this.renderReviews();
        
        alert('Review submitted successfully!');
      } catch (error) {
        console.error('Error submitting review:', error);
        alert('Failed to submit review. Please try again.');
      }
    });
  }

  showAddProductForm() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Add New Product</h2>
        <form id="product-form">
          <div class="form-group">
            <label for="product-name">Product Name:</label>
            <input type="text" id="product-name" required>
          </div>
          <div class="form-group">
            <label for="product-description">Description:</label>
            <textarea id="product-description" required></textarea>
          </div>
          <div class="form-group">
            <label for="product-price">Price:</label>
            <input type="number" id="product-price" step="0.01" required>
          </div>
          <div class="form-group">
            <label for="product-category">Category:</label>
            <select id="product-category" required>
              <option value="Electronics">Electronics</option>
              <option value="Computers">Computers</option>
              <option value="Audio">Audio</option>
              <option value="Gaming">Gaming</option>
              <option value="Home Appliances">Home Appliances</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label for="product-image">Image URL:</label>
            <input type="url" id="product-image">
          </div>
          <button type="submit" class="btn">Add Product</button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Close modal
    modal.querySelector('.close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Submit product
    modal.querySelector('#product-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const productData = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        price: parseFloat(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value,
        imageUrl: document.getElementById('product-image').value || 'placeholder1.jpg'
      };

      try {
        await api.addProduct(productData);
        document.body.removeChild(modal);

        // Refresh products
        this.products = await api.getProducts();
        this.renderProducts();

        alert('Product added successfully!');
      } catch (error) {
        console.error('Error adding product:', error);
        alert('Failed to add product. Please try again.');
      }
    });
  }

  async showNotifications() {
    try {
      const notifications = await api.getNotifications();

      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Notifications</h2>
          <div class="notifications-list">
            ${notifications.length ?
              notifications.map(notification => `
                <div class="notification-item ${notification.read ? 'read' : 'unread'}">
                  <p>${notification.message}</p>
                  <small>${new Date(notification.createdAt).toLocaleDateString()}</small>
                  ${!notification.read ? `<button class="mark-read-btn" data-id="${notification._id}">Mark as Read</button>` : ''}
                </div>
              `).join('') :
              '<p>No notifications available.</p>'
            }
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Close modal
      modal.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(modal);
      });

      // Mark as read functionality
      modal.querySelectorAll('.mark-read-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
          const notificationId = e.target.dataset.id;
          try {
            await api.markNotificationRead(notificationId);
            e.target.parentElement.classList.add('read');
            e.target.remove();
          } catch (error) {
            console.error('Error marking notification as read:', error);
          }
        });
      });

    } catch (error) {
      console.error('Error fetching notifications:', error);
      alert('Failed to load notifications.');
    }
  }

  showSettingsModal() {
    // Use the profile menu settings modal
    if (window.ProfileMenu) {
      const profileMenu = new window.ProfileMenu();
      profileMenu.showSettingsModal();
    } else {
      alert('Settings will be available soon!');
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Dashboard();
});