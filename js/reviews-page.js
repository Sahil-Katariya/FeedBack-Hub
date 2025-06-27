class ReviewsPage {
  constructor() {
    this.reviews = [];
    this.filteredReviews = [];
    this.currentPage = 1;
    this.reviewsPerPage = 12;
    this.isCompactView = false;
    this.init();
  }

  async init() {
    try {
      console.log('🚀 Initializing Reviews Page...');

      console.log('📡 Step 1: Loading reviews...');
      await this.loadReviews();

      console.log('🎛️ Step 2: Setting up event listeners...');
      this.setupEventListeners();

      console.log('🎨 Step 3: Rendering reviews...');
      this.renderReviews();

      console.log('⭐ Step 4: Rendering featured reviews...');
      this.renderFeaturedReviews();

      console.log('📊 Step 5: Updating statistics...');
      this.updateStatistics();

      console.log('🔧 Step 6: Populating product filter...');
      this.populateProductFilter();

      console.log('✅ Reviews page initialization complete!');
    } catch (error) {
      console.error('❌ Error initializing reviews page:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      this.showError(`Failed to load reviews: ${error.message}`);
    }
  }

  async loadReviews() {
    try {
      console.log('🔄 Loading reviews from API...');

      // Try to load from API first
      const response = await fetch('http://localhost:5000/api/reviews');
      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const reviewsData = await response.json();
        console.log('✅ Reviews loaded from API:', reviewsData.length, 'reviews');
        console.log('📊 Sample review data:', reviewsData[0]);

        this.reviews = reviewsData;

        // Validate review data structure
        if (this.reviews.length > 0) {
          const sampleReview = this.reviews[0];
          if (!sampleReview.productId || !sampleReview.userId) {
            console.warn('⚠️ Review data structure issue detected');
            console.log('Sample review structure:', sampleReview);
          }
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Failed to load reviews from API:', error);
      console.log('🔄 Falling back to sample data...');

      // Fallback to sample data
      this.reviews = this.getSampleReviews();
      console.log('✅ Sample data loaded:', this.reviews.length, 'reviews');
    }

    this.filteredReviews = [...this.reviews];
    console.log('✅ Filtered reviews initialized:', this.filteredReviews.length, 'reviews');
  }

  getSampleReviews() {
    return [
      {
        _id: '1',
        productId: { _id: '1', name: 'iPhone 15 Pro' },
        userId: { firstName: 'John', lastName: 'Doe' },
        rating: 5,
        content: 'Absolutely amazing phone! The camera quality is outstanding and the performance is incredibly smooth. The titanium build feels premium and the battery life easily lasts a full day of heavy usage.',
        source: 'Amazon',
        createdAt: '2024-01-15T10:30:00Z',
        helpfulCount: 45,
        verified: true
      },
      {
        _id: '2',
        productId: { _id: '2', name: 'Samsung Galaxy S24 Ultra' },
        userId: { firstName: 'Sarah', lastName: 'Johnson' },
        rating: 4,
        content: 'Great Android phone with excellent S Pen functionality. The display is gorgeous and the camera system is very versatile. Only minor complaint is the size - it\'s quite large for one-handed use.',
        source: 'Best Buy',
        createdAt: '2024-01-14T15:45:00Z',
        helpfulCount: 32,
        verified: true
      },
      {
        _id: '3',
        productId: { _id: '3', name: 'MacBook Air M3' },
        userId: { firstName: 'Mike', lastName: 'Chen' },
        rating: 5,
        content: 'Perfect laptop for productivity and creative work. The M3 chip handles everything I throw at it effortlessly. Silent operation and incredible battery life make it ideal for travel.',
        source: 'TechCrunch',
        createdAt: '2024-01-13T09:20:00Z',
        helpfulCount: 67,
        verified: true
      },
      {
        _id: '4',
        productId: { _id: '4', name: 'Sony WH-1000XM5' },
        userId: { firstName: 'Emily', lastName: 'Davis' },
        rating: 5,
        content: 'Best noise-canceling headphones I\'ve ever owned. The sound quality is exceptional and the noise cancellation is industry-leading. Comfortable for long listening sessions.',
        source: 'CNET',
        createdAt: '2024-01-12T14:10:00Z',
        helpfulCount: 89,
        verified: true
      },
      {
        _id: '5',
        productId: { _id: '5', name: 'Nike Air Max 270' },
        userId: { firstName: 'David', lastName: 'Wilson' },
        rating: 4,
        content: 'Very comfortable running shoes with great cushioning. The design looks modern and stylish. Good for both running and casual wear. Sizing runs slightly large.',
        source: 'Target',
        createdAt: '2024-01-11T11:30:00Z',
        helpfulCount: 23,
        verified: true
      },
      {
        _id: '6',
        productId: { _id: '6', name: 'Instant Pot Duo 7-in-1' },
        userId: { firstName: 'Lisa', lastName: 'Brown' },
        rating: 5,
        content: 'Game-changer for meal prep! This pressure cooker has replaced multiple appliances in my kitchen. Easy to use, easy to clean, and the results are consistently excellent.',
        source: 'Walmart',
        createdAt: '2024-01-10T16:45:00Z',
        helpfulCount: 156,
        verified: true
      },
      {
        _id: '7',
        productId: { _id: '7', name: 'Fitbit Charge 6' },
        userId: { firstName: 'Alex', lastName: 'Taylor' },
        rating: 4,
        content: 'Solid fitness tracker with accurate heart rate monitoring and GPS. The sleep tracking features are particularly useful. Battery life could be better but overall very satisfied.',
        source: 'Consumer Reports',
        createdAt: '2024-01-09T08:15:00Z',
        helpfulCount: 41,
        verified: true
      },
      {
        _id: '8',
        productId: { _id: '8', name: 'The Psychology of Money' },
        userId: { firstName: 'Rachel', lastName: 'Green' },
        rating: 5,
        content: 'Excellent book that changed my perspective on money and investing. Written in an accessible way with great real-world examples. Highly recommend for anyone interested in personal finance.',
        source: 'Amazon',
        createdAt: '2024-01-08T13:20:00Z',
        helpfulCount: 78,
        verified: true
      },
      {
        _id: '9',
        productId: { _id: '9', name: 'Yeti Rambler Tumbler' },
        userId: { firstName: 'Chris', lastName: 'Martinez' },
        rating: 4,
        content: 'Keeps drinks cold for hours and hot drinks stay warm all day. Build quality is excellent and it fits perfectly in car cup holders. Worth the premium price.',
        source: 'Website',
        createdAt: '2024-01-07T12:00:00Z',
        helpfulCount: 29,
        verified: true
      },
      {
        _id: '10',
        productId: { _id: '10', name: 'Wilson Tennis Racket' },
        userId: { firstName: 'Jessica', lastName: 'Lee' },
        rating: 4,
        content: 'Great racket for intermediate players. Good balance of power and control. The grip feels comfortable and the string tension is perfect out of the box.',
        source: 'Amazon',
        createdAt: '2024-01-06T17:30:00Z',
        helpfulCount: 15,
        verified: true
      },
      {
        _id: '11',
        productId: { _id: '11', name: 'Kindle Paperwhite' },
        userId: { firstName: 'Tom', lastName: 'Anderson' },
        rating: 5,
        content: 'Perfect e-reader for book lovers. The display is easy on the eyes even in bright sunlight. Waterproof design gives peace of mind. Battery lasts for weeks.',
        source: 'Best Buy',
        createdAt: '2024-01-05T10:45:00Z',
        helpfulCount: 92,
        verified: true
      },
      {
        _id: '12',
        productId: { _id: '12', name: 'Levi\'s 501 Original Jeans' },
        userId: { firstName: 'Amanda', lastName: 'White' },
        rating: 3,
        content: 'Classic jeans with timeless style. Quality is good but the fit is inconsistent between different washes. Recommend trying on in store before purchasing online.',
        source: 'Target',
        createdAt: '2024-01-04T14:20:00Z',
        helpfulCount: 18,
        verified: true
      }
    ];
  }

  setupEventListeners() {
    try {
      console.log('🎛️ Setting up event listeners...');

      // Search functionality
      const searchInput = document.getElementById('review-search');
      const searchBtn = document.getElementById('search-btn');

      if (searchInput) {
        searchInput.addEventListener('input', () => {
          this.debounce(() => this.filterReviews(), 300)();
        });
        console.log('✅ Search input listener added');
      } else {
        console.warn('⚠️ Search input element not found');
      }

      if (searchBtn) {
        searchBtn.addEventListener('click', () => {
          this.filterReviews();
        });
        console.log('✅ Search button listener added');
      } else {
        console.warn('⚠️ Search button element not found');
      }

      // Filter controls
      const filterElements = [
        { id: 'product-filter', name: 'Product filter' },
        { id: 'source-filter', name: 'Source filter' },
        { id: 'rating-filter', name: 'Rating filter' }
      ];

      filterElements.forEach(({ id, name }) => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener('change', () => {
            this.filterReviews();
          });
          console.log(`✅ ${name} listener added`);
        } else {
          console.warn(`⚠️ ${name} element not found`);
        }
      });

      const sortBy = document.getElementById('sort-by');
      if (sortBy) {
        sortBy.addEventListener('change', () => {
          this.sortReviews();
        });
        console.log('✅ Sort by listener added');
      } else {
        console.warn('⚠️ Sort by element not found');
      }

      // View toggle
      const viewToggle = document.getElementById('view-toggle');
      if (viewToggle) {
        viewToggle.addEventListener('click', () => {
          this.toggleView();
        });
        console.log('✅ View toggle listener added');
      } else {
        console.warn('⚠️ View toggle element not found');
      }

      // Load more reviews
      const loadMoreBtn = document.getElementById('load-more-reviews');
      if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
          this.loadMoreReviews();
        });
        console.log('✅ Load more button listener added');
      } else {
        console.warn('⚠️ Load more button element not found');
      }

      console.log('✅ Event listeners setup complete');
    } catch (error) {
      console.error('❌ Error setting up event listeners:', error);
    }
  }

  populateProductFilter() {
    try {
      console.log('🔧 Populating product filter...');
      const productFilter = document.getElementById('product-filter');

      if (!productFilter) {
        console.warn('⚠️ Product filter element not found');
        return;
      }

      if (!this.reviews || this.reviews.length === 0) {
        console.warn('⚠️ No reviews available for product filter');
        return;
      }

      // Clear existing options (except the first "All Products" option)
      while (productFilter.children.length > 1) {
        productFilter.removeChild(productFilter.lastChild);
      }

      // Extract unique product names safely
      const uniqueProducts = [...new Set(
        this.reviews
          .filter(review => review.productId && review.productId.name)
          .map(review => review.productId.name)
      )];

      console.log('📦 Found unique products:', uniqueProducts);

      uniqueProducts.forEach(productName => {
        const option = document.createElement('option');
        option.value = productName;
        option.textContent = productName;
        productFilter.appendChild(option);
      });

      console.log('✅ Product filter populated with', uniqueProducts.length, 'products');
    } catch (error) {
      console.error('❌ Error populating product filter:', error);
    }
  }

  filterReviews() {
    const searchTerm = document.getElementById('review-search').value.toLowerCase();
    const productFilter = document.getElementById('product-filter').value;
    const sourceFilter = document.getElementById('source-filter').value;
    const ratingFilter = document.getElementById('rating-filter').value;

    this.filteredReviews = this.reviews.filter(review => {
      // Search filter
      const matchesSearch = !searchTerm || 
        review.productId.name.toLowerCase().includes(searchTerm) ||
        review.content.toLowerCase().includes(searchTerm) ||
        review.source.toLowerCase().includes(searchTerm) ||
        `${review.userId.firstName} ${review.userId.lastName}`.toLowerCase().includes(searchTerm);

      // Product filter
      const matchesProduct = !productFilter || review.productId.name === productFilter;

      // Source filter
      const matchesSource = !sourceFilter || review.source === sourceFilter;

      // Rating filter
      const matchesRating = !ratingFilter || review.rating >= parseInt(ratingFilter);

      return matchesSearch && matchesProduct && matchesSource && matchesRating;
    });

    this.currentPage = 1;
    this.sortReviews();
    this.renderReviews();
    this.updateReviewsCount();
  }

  sortReviews() {
    const sortBy = document.getElementById('sort-by').value;
    
    this.filteredReviews.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        case 'helpful':
          return b.helpfulCount - a.helpfulCount;
        default:
          return 0;
      }
    });

    this.renderReviews();
  }

  renderReviews() {
    try {
      console.log('🎨 Rendering reviews...');
      const container = document.getElementById('reviews-grid');

      if (!container) {
        console.error('❌ Reviews grid container not found');
        return;
      }

      const reviewsToShow = this.filteredReviews.slice(0, this.currentPage * this.reviewsPerPage);
      console.log('📊 Reviews to show:', reviewsToShow.length, 'of', this.filteredReviews.length);

      if (reviewsToShow.length === 0) {
        container.innerHTML = `
          <div class="loading-reviews">
            <p class="body-large">No reviews found matching your criteria.</p>
            <button class="button-outline" onclick="location.reload()">
              <span class="body-small">Reset Filters</span>
            </button>
          </div>
        `;
        console.log('📝 No reviews message displayed');
        return;
      }

      // Render review cards with error handling
      const reviewCards = reviewsToShow.map(review => {
        try {
          return this.createReviewCard(review);
        } catch (error) {
          console.error('❌ Error creating review card:', error, review);
          return `<div class="review-card error">Error loading review</div>`;
        }
      }).join('');

      container.innerHTML = reviewCards;
      console.log('✅ Reviews rendered successfully');

      // Update load more button visibility
      const loadMoreBtn = document.getElementById('load-more-reviews');
      if (loadMoreBtn) {
        if (reviewsToShow.length >= this.filteredReviews.length) {
          loadMoreBtn.style.display = 'none';
        } else {
          loadMoreBtn.style.display = 'block';
        }
      }

      // Add click event listeners to review cards
      this.addReviewCardListeners();

      // Update reviews count
      this.updateReviewsCount();
    } catch (error) {
      console.error('❌ Error rendering reviews:', error);
      const container = document.getElementById('reviews-grid');
      if (container) {
        container.innerHTML = `
          <div class="loading-reviews">
            <p class="body-large" style="color: #e74c3c;">Error loading reviews: ${error.message}</p>
            <button class="button-outline" onclick="location.reload()">
              <span class="body-small">Try Again</span>
            </button>
          </div>
        `;
      }
    }
  }

  createReviewCard(review) {
    try {
      // Safely extract data with fallbacks
      const productId = review.productId?._id || review.productId || 'unknown';
      const productName = review.productId?.name || 'Unknown Product';
      const rating = review.rating || 0;
      const content = review.content || 'No review content available';
      const source = review.source || 'Unknown Source';
      const helpfulCount = review.helpfulCount || 0;
      const createdAt = review.createdAt || new Date().toISOString();
      const verified = review.verified || false;

      const stars = this.generateStars(rating);
      const date = new Date(createdAt).toLocaleDateString();
      const verifiedBadge = verified ? '<span class="verified-badge">✓ Verified</span>' : '';

      return `
        <div class="review-card" data-product-id="${productId}">
          <div class="review-header">
            <div class="review-product-info">
              <h3 class="review-product-name">${productName}</h3>
              <div class="review-meta">
                <div class="review-rating">
                  <span class="rating-stars">${stars}</span>
                  <span class="rating-value">${rating}/5</span>
                </div>
                <span class="review-source">${source}</span>
                ${verifiedBadge}
              </div>
            </div>
            <span class="review-date">${date}</span>
          </div>
          <div class="review-content">
            <p class="review-text">${content}</p>
            <div class="review-actions">
              <div class="review-helpful">
                <span>👍</span>
                <span class="helpful-count">${helpfulCount}</span>
                <span>found this helpful</span>
              </div>
              <button class="btn-view-product" onclick="window.location.href='product.html?id=${productId}'">
                View Product
              </button>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('❌ Error creating review card:', error, review);
      return `
        <div class="review-card error">
          <div class="review-header">
            <h3>Error Loading Review</h3>
          </div>
          <div class="review-content">
            <p>Unable to display this review due to data issues.</p>
          </div>
        </div>
      `;
    }
  }

  renderFeaturedReviews() {
    const container = document.getElementById('featured-reviews');
    const featuredReviews = this.reviews
      .filter(review => review.helpfulCount > 50)
      .sort((a, b) => b.helpfulCount - a.helpfulCount)
      .slice(0, 3);

    container.innerHTML = featuredReviews.map(review => `
      <div class="featured-review-card">
        <h3 class="review-product-name">${review.productId.name}</h3>
        <p class="review-text">"${review.content}"</p>
        <div class="review-meta">
          <span class="review-source">${review.source}</span>
          <span class="rating-stars">${this.generateStars(review.rating)}</span>
        </div>
      </div>
    `).join('');
  }

  generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  }

  addReviewCardListeners() {
    const reviewCards = document.querySelectorAll('.review-card');
    reviewCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't navigate if clicking on buttons
        if (e.target.tagName === 'BUTTON') return;
        
        const productId = card.dataset.productId;
        window.location.href = `product.html?id=${productId}`;
      });
    });
  }

  toggleView() {
    const grid = document.getElementById('reviews-grid');
    const toggleBtn = document.getElementById('view-toggle');
    
    this.isCompactView = !this.isCompactView;
    
    if (this.isCompactView) {
      grid.classList.add('compact-view');
      toggleBtn.querySelector('.view-text').textContent = 'Card View';
    } else {
      grid.classList.remove('compact-view');
      toggleBtn.querySelector('.view-text').textContent = 'Compact View';
    }
  }

  loadMoreReviews() {
    this.currentPage++;
    this.renderReviews();
  }

  updateReviewsCount() {
    const countElement = document.getElementById('reviews-count');
    const total = this.filteredReviews.length;
    const showing = Math.min(this.currentPage * this.reviewsPerPage, total);
    
    countElement.textContent = `Showing ${showing} of ${total} reviews`;
  }

  updateStatistics() {
    try {
      console.log('📊 Updating statistics...');

      if (!this.reviews || this.reviews.length === 0) {
        console.warn('⚠️ No reviews available for statistics');
        return;
      }

      const totalReviews = this.reviews.length;
      const avgRating = this.reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews;
      const uniqueProducts = new Set(
        this.reviews
          .filter(review => review.productId && review.productId._id)
          .map(review => review.productId._id)
      ).size;
      const uniqueSources = new Set(
        this.reviews
          .filter(review => review.source)
          .map(review => review.source)
      ).size;

      // Update statistics with safe element access
      const elements = [
        { id: 'total-reviews', value: totalReviews },
        { id: 'avg-rating', value: avgRating.toFixed(1) },
        { id: 'total-products', value: uniqueProducts },
        { id: 'total-sources', value: uniqueSources }
      ];

      elements.forEach(({ id, value }) => {
        const element = document.getElementById(id);
        if (element) {
          element.textContent = value;
          console.log(`✅ Updated ${id}: ${value}`);
        } else {
          console.warn(`⚠️ Element ${id} not found`);
        }
      });

      console.log('✅ Statistics updated successfully');
    } catch (error) {
      console.error('❌ Error updating statistics:', error);
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  showError(message) {
    const container = document.getElementById('reviews-grid');
    container.innerHTML = `
      <div class="loading-reviews">
        <p class="body-large" style="color: #e74c3c;">${message}</p>
        <button class="button-outline" onclick="location.reload()">
          <span class="body-small">Try Again</span>
        </button>
      </div>
    `;
  }
}

// Initialize reviews page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ReviewsPage();
});
