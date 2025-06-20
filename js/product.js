class ProductPage {
  constructor() {
    this.currentProduct = null;
    this.currentReviews = [];
    this.filteredReviews = [];
    this.aiAnalyzer = new AIReviewAnalyzer();
    this.currentPage = 1;
    this.reviewsPerPage = 10;
    this.init();
  }

  async init() {
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
      this.renderReviews();
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

    // Image gallery
    const galleryBtns = document.querySelectorAll('.gallery-btn');
    galleryBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const imageSrc = e.currentTarget.dataset.image;
        document.getElementById('product-image').src = imageSrc;
      });
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

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
      <div class="alert alert-danger">
        <strong>Error:</strong> ${message}
      </div>
    `;
    
    document.querySelector('.product-page').prepend(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }
}

// Initialize product page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ProductPage();
});
