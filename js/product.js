class ProductPage {
  constructor() {
    this.currentProduct = null;
    this.currentReviews = [];
    this.filteredReviews = [];
    this.aiAnalyzer = new AIReviewAnalyzer();
    this.currentPage = 1;
    this.reviewsPerPage = 10;
    this.isAnalyzing = false;
    this.analysisResults = null;
    this.activeFilters = {
      sentiment: 'all',
      source: 'all',
      rating: 'all'
    };
    this.sortBy = 'newest';
    this.userInteractions = {
      favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
      wishlist: JSON.parse(localStorage.getItem('wishlist') || '[]'),
      viewHistory: JSON.parse(localStorage.getItem('viewHistory') || '[]'),
      comparisons: JSON.parse(localStorage.getItem('comparisons') || '[]')
    };
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.init();
  }

  async init() {
    // Initialize user authentication state
    this.initializeUserState();

    // Get product ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
      // If no product ID, redirect to profile page
      window.location.href = 'profile.html';
      return;
    }

    try {
      await this.loadProduct(productId);
      await this.loadReviews(productId);
      this.setupEventListeners();
      this.setupDynamicFeatures();
      this.addToViewHistory();
      this.renderReviews();
      this.loadUserInteractions();
    } catch (error) {
      console.error('Error initializing product page:', error);
      this.showError('Failed to load product information.');
    }
  }

  async loadProduct(productId) {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`);
      if (!response.ok) {
        throw new Error('Product not found');
      }
      
      this.currentProduct = await response.json();
      this.renderProductInfo();
    } catch (error) {
      console.error('Error loading product:', error);
      throw error;
    }
  }

  async loadReviews(productId) {
    try {
      const response = await fetch(`http://localhost:5000/api/reviews/product/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to load reviews');
      }
      
      this.currentReviews = await response.json();
      this.filteredReviews = [...this.currentReviews];
      this.updateRatingSummary();
    } catch (error) {
      console.error('Error loading reviews:', error);
      this.currentReviews = [];
      this.filteredReviews = [];
    }
  }

  renderProductInfo() {
    if (!this.currentProduct) return;

    document.getElementById('product-name').textContent = this.currentProduct.name;
    document.getElementById('product-category').textContent = this.currentProduct.category;
    document.getElementById('product-price').textContent = `$${this.currentProduct.price.toFixed(2)}`;
    document.getElementById('product-description').textContent = this.currentProduct.description;
    
    // Update product image
    const productImage = document.getElementById('product-image');
    if (this.currentProduct.imageUrl) {
      productImage.src = this.currentProduct.imageUrl;
      productImage.alt = this.currentProduct.name;
    }

    // Update page title
    document.title = `${this.currentProduct.name} - FeedbackHub`;
  }

  updateRatingSummary() {
    const ratings = this.currentReviews
      .map(review => review.rating)
      .filter(rating => rating && rating > 0);

    if (ratings.length === 0) {
      document.getElementById('overall-rating').textContent = '0.0';
      document.getElementById('overall-stars').textContent = '☆☆☆☆☆';
      document.getElementById('rating-count').textContent = '(0 reviews)';
      return;
    }

    const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    const roundedRating = Math.round(averageRating * 10) / 10;

    document.getElementById('overall-rating').textContent = roundedRating.toFixed(1);
    document.getElementById('overall-stars').textContent = this.generateStars(roundedRating);
    document.getElementById('rating-count').textContent = `(${ratings.length} reviews)`;
  }

  generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  }

  setupEventListeners() {
    // Analyze reviews button
    const analyzeBtn = document.getElementById('analyze-reviews-btn');
    analyzeBtn.addEventListener('click', () => {
      this.performAIAnalysis();
    });

    // Add review button
    const addReviewBtn = document.getElementById('add-review-btn');
    addReviewBtn.addEventListener('click', () => {
      this.showAddReviewModal();
    });

    // Product action buttons
    const compareBtn = document.getElementById('compare-btn');
    const wishlistBtn = document.getElementById('wishlist-btn');
    const favoriteBtn = document.getElementById('favorite-btn');
    const shareBtn = document.getElementById('share-btn');
    const zoomBtn = document.getElementById('zoom-btn');

    compareBtn?.addEventListener('click', () => this.toggleComparePanel());
    wishlistBtn?.addEventListener('click', () => this.toggleWishlist());
    favoriteBtn?.addEventListener('click', () => this.toggleFavorite());
    shareBtn?.addEventListener('click', () => this.shareProduct());
    zoomBtn?.addEventListener('click', () => this.zoomImage());

    // Review filter and sort
    const reviewFilter = document.getElementById('review-filter');
    const reviewSort = document.getElementById('review-sort');

    reviewFilter.addEventListener('change', () => {
      this.filterReviews();
    });

    reviewSort.addEventListener('change', () => {
      this.sortReviews();
    });

    // Load more reviews
    const loadMoreBtn = document.getElementById('load-more-reviews');
    loadMoreBtn.addEventListener('click', () => {
      this.loadMoreReviews();
    });

    // Image gallery with enhanced interactions
    const galleryBtns = document.querySelectorAll('.gallery-btn');
    galleryBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.changeProductImage(e.currentTarget.dataset.image);
      });
    });

    // Interactive stars
    const interactiveStars = document.querySelector('.interactive-stars');
    if (interactiveStars) {
      this.setupInteractiveStars(interactiveStars);
    }

    // Tab navigation for user interaction panel
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Auto-refresh checkbox
    const autoRefresh = document.getElementById('auto-refresh');
    autoRefresh?.addEventListener('change', (e) => {
      this.autoRefreshEnabled = e.target.checked;
    });

    // Save analysis button
    const saveAnalysisBtn = document.getElementById('save-analysis-btn');
    saveAnalysisBtn?.addEventListener('click', () => {
      this.saveAnalysisToProfile();
    });
  }

  async performAIAnalysis() {
    const analyzeBtn = document.getElementById('analyze-reviews-btn');
    const btnText = analyzeBtn.querySelector('.btn-text');
    const btnLoading = analyzeBtn.querySelector('.btn-loading');

    // Show loading state
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    analyzeBtn.disabled = true;

    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      const analysis = this.aiAnalyzer.analyzeReviews(this.currentReviews);
      this.renderAIAnalysis(analysis);
    } catch (error) {
      console.error('Error performing AI analysis:', error);
      this.showError('Failed to analyze reviews. Please try again.');
    } finally {
      // Reset button state
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
      analyzeBtn.disabled = false;
    }
  }

  renderAIAnalysis(analysis) {
    // Render summary
    document.getElementById('ai-summary').innerHTML = `<p>${analysis.summary}</p>`;

    // Render pros
    const prosList = document.getElementById('pros-list');
    prosList.innerHTML = analysis.pros.map(pro => `<li>${pro}</li>`).join('');

    // Render cons
    const consList = document.getElementById('cons-list');
    consList.innerHTML = analysis.cons.map(con => `<li>${con}</li>`).join('');

    // Render sentiment analysis
    this.renderSentimentChart(analysis.sentiment);

    // Render ratings analysis
    document.getElementById('ratings-extracted').textContent = `[${analysis.ratings.extracted.join(', ')}]`;
    document.getElementById('average-rating').textContent = `${analysis.ratings.average} / 5`;
    document.getElementById('total-ratings').textContent = analysis.ratings.total;

    // Render aspect ratings
    this.renderAspectRatings(analysis.aspects);
  }

  renderSentimentChart(sentiment) {
    const positiveBar = document.getElementById('positive-bar');
    const neutralBar = document.getElementById('neutral-bar');
    const negativeBar = document.getElementById('negative-bar');

    // Update widths with animation
    setTimeout(() => {
      positiveBar.style.width = `${sentiment.positive}%`;
      neutralBar.style.width = `${sentiment.neutral}%`;
      negativeBar.style.width = `${sentiment.negative}%`;
    }, 100);

    // Update percentages
    document.getElementById('positive-percentage').textContent = `${sentiment.positive}%`;
    document.getElementById('neutral-percentage').textContent = `${sentiment.neutral}%`;
    document.getElementById('negative-percentage').textContent = `${sentiment.negative}%`;
  }

  renderAspectRatings(aspects) {
    Object.keys(aspects).forEach(aspect => {
      const score = aspects[aspect];
      const scoreElement = document.getElementById(`${aspect}-score`);
      const starsElement = document.querySelector(`[data-aspect="${aspect}"]`);

      if (score === null) {
        scoreElement.textContent = 'N/A';
        starsElement.textContent = '☆☆☆☆☆';
      } else {
        scoreElement.textContent = score.toFixed(1);
        starsElement.textContent = this.generateStars(score);
      }
    });
  }

  renderReviews() {
    const container = document.getElementById('reviews-container');
    const reviewsToShow = this.filteredReviews.slice(0, this.currentPage * this.reviewsPerPage);

    if (reviewsToShow.length === 0) {
      container.innerHTML = `
        <div class="loading-reviews">
          <p>No reviews available for this product.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = reviewsToShow.map(review => `
      <div class="review-item">
        <div class="review-header">
          <div>
            <div class="review-author">${review.userId?.firstName || 'Anonymous'} ${review.userId?.lastName || ''}</div>
            <div class="review-rating">${this.generateStars(review.rating)}</div>
          </div>
          <div class="review-date">${new Date(review.createdAt).toLocaleDateString()}</div>
        </div>
        <div class="review-content">${review.content}</div>
        <div class="review-source">${review.source}</div>
      </div>
    `).join('');

    // Update load more button visibility
    const loadMoreBtn = document.getElementById('load-more-reviews');
    if (reviewsToShow.length >= this.filteredReviews.length) {
      loadMoreBtn.style.display = 'none';
    } else {
      loadMoreBtn.style.display = 'block';
    }
  }

  filterReviews() {
    const filter = document.getElementById('review-filter').value;
    
    if (filter === 'all') {
      this.filteredReviews = [...this.currentReviews];
    } else {
      this.filteredReviews = this.currentReviews.filter(review => {
        if (filter === 'positive') return review.rating >= 4;
        if (filter === 'neutral') return review.rating === 3;
        if (filter === 'negative') return review.rating <= 2;
        return true;
      });
    }

    this.currentPage = 1;
    this.renderReviews();
  }

  sortReviews() {
    const sort = document.getElementById('review-sort').value;
    
    this.filteredReviews.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    this.currentPage = 1;
    this.renderReviews();
  }

  loadMoreReviews() {
    this.currentPage++;
    this.renderReviews();
  }

  showAddReviewModal() {
    if (!localStorage.getItem('token')) {
      alert('Please log in to add a review.');
      window.location.href = 'login.html';
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Add Review for ${this.currentProduct.name}</h2>
        <form id="review-form">
          <div class="form-group">
            <label for="rating">Rating:</label>
            <select id="rating" required>
              <option value="5">5 Stars - Excellent</option>
              <option value="4">4 Stars - Good</option>
              <option value="3">3 Stars - Average</option>
              <option value="2">2 Stars - Poor</option>
              <option value="1">1 Star - Terrible</option>
            </select>
          </div>
          <div class="form-group">
            <label for="review-content">Your Review:</label>
            <textarea id="review-content" required placeholder="Share your experience with this product..."></textarea>
          </div>
          <div class="form-group">
            <label for="source">Source:</label>
            <select id="source" required>
              <option value="Website">Website</option>
              <option value="Mobile App">Mobile App</option>
              <option value="In-store">In-store</option>
              <option value="Amazon">Amazon</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Submit Review</button>
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
      await this.submitReview(modal);
    });
  }

  async submitReview(modal) {
    try {
      const reviewData = {
        productId: this.currentProduct._id,
        rating: parseInt(document.getElementById('rating').value),
        content: document.getElementById('review-content').value,
        source: document.getElementById('source').value
      };

      const response = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify(reviewData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      document.body.removeChild(modal);
      
      // Reload reviews
      await this.loadReviews(this.currentProduct._id);
      this.renderReviews();
      
      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
  }

  // Dynamic User Interaction Methods
  initializeUserState() {
    // Authentication is now handled by universal-auth.js
    // Just update current user reference
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  }

  setupDynamicFeatures() {
    // Add real-time search for comparison
    this.setupComparisonSearch();

    // Load user's wishlist and favorites
    this.updateButtonStates();

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Initialize tooltips
    this.initializeTooltips();
  }

  addToViewHistory() {
    if (!this.currentProduct) return;

    const history = this.userInteractions.viewHistory;
    const productId = this.currentProduct._id;

    // Remove if already exists
    const existingIndex = history.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
      history.splice(existingIndex, 1);
    }

    // Add to beginning
    history.unshift({
      id: productId,
      name: this.currentProduct.name,
      price: this.currentProduct.price,
      imageUrl: this.currentProduct.imageUrl,
      viewedAt: new Date().toISOString()
    });

    // Keep only last 10 items
    if (history.length > 10) {
      history.splice(10);
    }

    localStorage.setItem('viewHistory', JSON.stringify(history));
  }

  toggleComparePanel() {
    const panel = document.getElementById('interaction-panel');
    if (panel.style.display === 'none') {
      panel.style.display = 'block';
      this.switchTab('compare');
      panel.scrollIntoView({ behavior: 'smooth' });
    } else {
      panel.style.display = 'none';
    }
  }

  toggleWishlist() {
    if (!this.currentProduct) return;

    const wishlist = this.userInteractions.wishlist;
    const productId = this.currentProduct._id;
    const existingIndex = wishlist.findIndex(item => item.id === productId);

    if (existingIndex > -1) {
      // Remove from wishlist
      wishlist.splice(existingIndex, 1);
      this.showNotification('Removed from wishlist', 'info');
    } else {
      // Add to wishlist
      wishlist.push({
        id: productId,
        name: this.currentProduct.name,
        price: this.currentProduct.price,
        imageUrl: this.currentProduct.imageUrl,
        addedAt: new Date().toISOString()
      });
      this.showNotification('Added to wishlist', 'success');
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    this.updateButtonStates();
    this.renderWishlist();
  }

  toggleFavorite() {
    if (!this.currentProduct) return;

    const favorites = this.userInteractions.favorites;
    const productId = this.currentProduct._id;
    const existingIndex = favorites.findIndex(item => item.id === productId);
    const favoriteBtn = document.getElementById('favorite-btn');

    if (existingIndex > -1) {
      // Remove from favorites
      favorites.splice(existingIndex, 1);
      favoriteBtn.innerHTML = '♡';
      favoriteBtn.classList.remove('favorited');
      this.showNotification('Removed from favorites', 'info');
    } else {
      // Add to favorites
      favorites.push({
        id: productId,
        name: this.currentProduct.name,
        addedAt: new Date().toISOString()
      });
      favoriteBtn.innerHTML = '♥';
      favoriteBtn.classList.add('favorited');
      this.showNotification('Added to favorites', 'success');
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
  }

  shareProduct() {
    if (!this.currentProduct) return;

    const shareData = {
      title: this.currentProduct.name,
      text: `Check out this product: ${this.currentProduct.name}`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.showNotification('Product link copied to clipboard!', 'success');
      });
    }
  }

  zoomImage() {
    const productImage = document.getElementById('product-image');
    const modal = document.createElement('div');
    modal.className = 'image-zoom-modal';
    modal.innerHTML = `
      <div class="zoom-modal-content">
        <span class="close-zoom">&times;</span>
        <img src="${productImage.src}" alt="${productImage.alt}" class="zoomed-image">
      </div>
    `;

    document.body.appendChild(modal);

    // Close modal
    modal.querySelector('.close-zoom').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto remove
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);

    // Manual close
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    });
  }
}

  // Additional Dynamic Methods
  changeProductImage(imageSrc) {
    const productImage = document.getElementById('product-image');

    // Add fade out effect
    productImage.style.opacity = '0';

    setTimeout(() => {
      productImage.src = imageSrc;
      productImage.style.opacity = '1';
    }, 200);

    // Update active gallery button
    document.querySelectorAll('.gallery-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-image="${imageSrc}"]`).classList.add('active');
  }

  setupInteractiveStars(starsElement) {
    const stars = starsElement.textContent;
    starsElement.innerHTML = '';

    for (let i = 0; i < 5; i++) {
      const star = document.createElement('span');
      star.className = 'interactive-star';
      star.textContent = stars[i] || '☆';
      star.addEventListener('mouseenter', () => {
        this.highlightStars(starsElement, i + 1);
      });
      star.addEventListener('mouseleave', () => {
        this.resetStars(starsElement);
      });
      starsElement.appendChild(star);
    }
  }

  highlightStars(container, rating) {
    const stars = container.querySelectorAll('.interactive-star');
    stars.forEach((star, index) => {
      star.textContent = index < rating ? '★' : '☆';
      star.style.color = index < rating ? '#ffd700' : '#ccc';
    });
  }

  resetStars(container) {
    const originalRating = parseFloat(document.getElementById('overall-rating').textContent);
    this.highlightStars(container, originalRating);
  }

  switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load tab-specific content
    switch (tabName) {
      case 'wishlist':
        this.renderWishlist();
        break;
      case 'history':
        this.renderHistory();
        break;
      case 'recommendations':
        this.loadRecommendations();
        break;
    }
  }

  renderWishlist() {
    const container = document.getElementById('wishlist-container');
    const wishlist = this.userInteractions.wishlist;

    if (wishlist.length === 0) {
      container.innerHTML = '<p class="body-small">Your wishlist is empty</p>';
      return;
    }

    container.innerHTML = wishlist.map(item => `
      <div class="wishlist-item">
        <img src="${item.imageUrl || 'placeholder1.jpg'}" alt="${item.name}" class="wishlist-image">
        <div class="wishlist-info">
          <h4 class="body-large">${item.name}</h4>
          <p class="body-small">$${item.price.toFixed(2)}</p>
          <button class="button-outline remove-wishlist" data-id="${item.id}">Remove</button>
        </div>
      </div>
    `).join('');

    // Add remove functionality
    container.querySelectorAll('.remove-wishlist').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = e.target.dataset.id;
        const index = wishlist.findIndex(item => item.id === productId);
        if (index > -1) {
          wishlist.splice(index, 1);
          localStorage.setItem('wishlist', JSON.stringify(wishlist));
          this.renderWishlist();
        }
      });
    });
  }

  renderHistory() {
    const container = document.getElementById('history-container');
    const history = this.userInteractions.viewHistory;

    if (history.length === 0) {
      container.innerHTML = '<p class="body-small">No recent products</p>';
      return;
    }

    container.innerHTML = history.map(item => `
      <div class="history-item">
        <img src="${item.imageUrl || 'placeholder1.jpg'}" alt="${item.name}" class="history-image">
        <div class="history-info">
          <h4 class="body-large">${item.name}</h4>
          <p class="body-small">$${item.price.toFixed(2)}</p>
          <p class="body-small">Viewed: ${new Date(item.viewedAt).toLocaleDateString()}</p>
          <a href="product.html?id=${item.id}" class="button-outline">View Again</a>
        </div>
      </div>
    `).join('');
  }

  updateButtonStates() {
    if (!this.currentProduct) return;

    const productId = this.currentProduct._id;
    const wishlistBtn = document.getElementById('wishlist-btn');
    const favoriteBtn = document.getElementById('favorite-btn');

    // Update wishlist button
    const isInWishlist = this.userInteractions.wishlist.some(item => item.id === productId);
    if (wishlistBtn) {
      wishlistBtn.innerHTML = `<span class="body-small">${isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>`;
      wishlistBtn.classList.toggle('active', isInWishlist);
    }

    // Update favorite button
    const isFavorited = this.userInteractions.favorites.some(item => item.id === productId);
    if (favoriteBtn) {
      favoriteBtn.innerHTML = isFavorited ? '♥' : '♡';
      favoriteBtn.classList.toggle('favorited', isFavorited);
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // ESC to close modals
      if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal, .image-zoom-modal');
        modals.forEach(modal => modal.remove());
      }

      // Ctrl+Enter to trigger analysis
      if (e.key === 'Enter' && e.ctrlKey) {
        if (!this.isAnalyzing) {
          this.performAIAnalysis();
        }
      }

      // F for favorite
      if (e.key === 'f' || e.key === 'F') {
        if (!e.ctrlKey && !e.altKey) {
          this.toggleFavorite();
        }
      }

      // W for wishlist
      if (e.key === 'w' || e.key === 'W') {
        if (!e.ctrlKey && !e.altKey) {
          this.toggleWishlist();
        }
      }
    });
  }

  initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[title]');
    tooltipElements.forEach(element => {
      element.addEventListener('mouseenter', (e) => {
        this.showTooltip(e.target, e.target.title);
      });
      element.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    });
  }

  showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    document.body.appendChild(tooltip);

    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';

    setTimeout(() => tooltip.classList.add('show'), 10);
  }

  hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }

  loadUserInteractions() {
    // Load and display user-specific data
    this.updateButtonStates();

    // Auto-load recommendations if user is logged in
    if (this.currentUser.email) {
      this.loadRecommendations();
    }
  }

  async loadRecommendations() {
    const container = document.getElementById('recommendations-container');
    container.innerHTML = '<p class="body-small">Loading recommendations...</p>';

    try {
      // Simulate API call for recommendations
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock recommendations based on current product category
      const recommendations = [
        { id: '1', name: 'Similar Product 1', price: 299.99, imageUrl: 'placeholder1.jpg' },
        { id: '2', name: 'Similar Product 2', price: 399.99, imageUrl: 'placeholder2.jpg' },
        { id: '3', name: 'Similar Product 3', price: 199.99, imageUrl: 'placeholder3.jpg' }
      ];

      container.innerHTML = recommendations.map(item => `
        <div class="recommendation-item">
          <img src="${item.imageUrl}" alt="${item.name}" class="recommendation-image">
          <div class="recommendation-info">
            <h4 class="body-large">${item.name}</h4>
            <p class="body-small">$${item.price.toFixed(2)}</p>
            <a href="product.html?id=${item.id}" class="button-outline">View Product</a>
          </div>
        </div>
      `).join('');

    } catch (error) {
      container.innerHTML = '<p class="body-small">Failed to load recommendations</p>';
    }
  }

  setupComparisonSearch() {
    const searchInput = document.getElementById('compare-search');
    const resultsContainer = document.getElementById('compare-results');

    if (!searchInput) return;

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.searchProductsForComparison(e.target.value);
      }, 300);
    });
  }

  async searchProductsForComparison(query) {
    const resultsContainer = document.getElementById('compare-results');

    if (!query.trim()) {
      resultsContainer.innerHTML = '';
      return;
    }

    try {
      // Mock search results
      const results = [
        { id: '1', name: 'iPhone 15 Pro', price: 999.99 },
        { id: '2', name: 'Samsung Galaxy S24', price: 899.99 },
        { id: '3', name: 'Google Pixel 8', price: 699.99 }
      ].filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );

      resultsContainer.innerHTML = results.map(product => `
        <div class="search-result-item" data-id="${product.id}">
          <span class="body-small">${product.name} - $${product.price}</span>
          <button class="button-outline add-to-compare">Compare</button>
        </div>
      `).join('');

      // Add comparison functionality
      resultsContainer.querySelectorAll('.add-to-compare').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const productId = e.target.closest('.search-result-item').dataset.id;
          this.addToComparison(productId);
        });
      });

    } catch (error) {
      resultsContainer.innerHTML = '<p class="body-small">Search failed</p>';
    }
  }

  addToComparison(productId) {
    // Add product to comparison list
    const comparisons = this.userInteractions.comparisons;
    if (!comparisons.includes(productId)) {
      comparisons.push(productId);
      localStorage.setItem('comparisons', JSON.stringify(comparisons));
      this.showNotification('Product added to comparison', 'success');
      this.renderComparisonTable();
    }
  }

  renderComparisonTable() {
    const container = document.getElementById('comparison-table');
    const comparisons = this.userInteractions.comparisons;

    if (comparisons.length === 0) {
      container.innerHTML = '<p class="body-small">Select products to compare</p>';
      return;
    }

    // Mock comparison data
    container.innerHTML = `
      <div class="comparison-grid">
        <div class="comparison-header">
          <h4 class="body-large">Comparing ${comparisons.length} products</h4>
          <button class="button-outline clear-comparison">Clear All</button>
        </div>
        <div class="comparison-items">
          ${comparisons.map(id => `
            <div class="comparison-item">
              <h5 class="body-large">Product ${id}</h5>
              <p class="body-small">Price: $${(Math.random() * 1000).toFixed(2)}</p>
              <p class="body-small">Rating: ${(Math.random() * 5).toFixed(1)}/5</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Add clear functionality
    container.querySelector('.clear-comparison')?.addEventListener('click', () => {
      this.userInteractions.comparisons = [];
      localStorage.setItem('comparisons', JSON.stringify([]));
      this.renderComparisonTable();
    });
  }
}

// Initialize product page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ProductPage();
});
