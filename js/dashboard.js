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
    if (userInfoElement) {
      userInfoElement.innerHTML = `
        <div class="user-welcome">
          <h3>Welcome, ${user.firstName}!</h3>
          <p>${user.email}</p>
        </div>
      `;
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
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
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
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Dashboard();
});