class UnifiedProfilePage {
  constructor() {
    this.user = null;
    this.userStats = null;
    this.dashboardStats = null;
    this.userReviews = [];
    this.allReviews = [];
    this.products = [];
    this.filteredProducts = [];
    this.filteredReviews = [];
    this.currentProductPage = 1;
    this.currentReviewPage = 1;
    this.productsPerPage = 6;
    this.reviewsPerPage = 5;
    this.autoRefreshInterval = null;
    this.lastUpdateTime = Date.now();
    this.recentActivities = [];
    this.init();
  }

  async init() {
    // Check authentication
    if (!localStorage.getItem('token')) {
      window.location.href = 'login.html';
      return;
    }

    try {
      // Load all data in parallel
      const [user, userStats, dashboardStats, allReviews, products] = await Promise.all([
        api.getUser(),
        api.getUserStats(),
        api.getDashboardStats(),
        api.getReviews(),
        api.getProducts()
      ]);

      this.user = user;
      this.userStats = userStats;
      this.dashboardStats = dashboardStats;
      this.allReviews = allReviews;
      this.products = products;

      // Filter user's reviews
      this.userReviews = allReviews.filter(review =>
        review._id === user._id || review.userId === user._id
      );

      this.renderProfile();
      this.setupEventListeners();
    } catch (error) {
      console.error('Profile initialization error:', error);
      if (error.message === 'Failed to fetch user data') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
      }
    }
  }

  renderProfile() {
    this.renderUserInfo();
    this.renderDashboardStats();
    this.renderUserStats();
    this.renderProducts();
    this.renderReviews();
    this.renderBadges();
    this.renderProgressTracker();
    this.renderRecentActivity();
    this.setupAutoRefresh();
    this.updateOnlineStatus();
  }

  renderUserInfo() {
    const profileName = document.getElementById('profile-title');
    const profileRole = document.querySelector('.profile-role');
    const locationText = document.getElementById('location-text');
    const bioText = document.getElementById('bio-text');
    const profileAvatar = document.getElementById('main-profile-avatar');
    const miniReviews = document.getElementById('mini-reviews');
    const miniRating = document.getElementById('mini-rating');
    const joinDate = document.getElementById('join-date');

    if (profileName) {
      profileName.innerHTML = `${this.user.firstName} ${this.user.lastName}`;
    }

    if (profileRole) {
      profileRole.textContent = 'Customer';
    }

    if (locationText) {
      locationText.textContent = this.user.location || 'Location not set';
    }

    if (bioText) {
      bioText.textContent = this.user.bio || 'No bio available';
    }

    if (profileAvatar) {
      profileAvatar.src = this.user.profilePicture || 'profile photo.svg';
    }

    // Update mini stats
    if (miniReviews && this.userStats) {
      miniReviews.textContent = this.userStats.totalReviews || 0;
    }

    if (miniRating && this.userStats) {
      miniRating.textContent = this.userStats.avgRating || '0.0';
    }

    if (joinDate && this.user.createdAt) {
      const date = new Date(this.user.createdAt);
      joinDate.textContent = date.getFullYear();
    }
  }

  renderDashboardStats() {
    // Update dashboard overview stats
    const totalReviewsElement = document.getElementById('total-reviews');
    const avgRatingElement = document.getElementById('avg-rating');
    const totalProductsElement = document.getElementById('total-products');

    if (totalReviewsElement) totalReviewsElement.textContent = this.dashboardStats.totalReviews || 0;
    if (avgRatingElement) avgRatingElement.textContent = this.dashboardStats.avgRating || '0.0';
    if (totalProductsElement) totalProductsElement.textContent = this.dashboardStats.totalProducts || 0;
  }

  renderUserStats() {
    // Update sidebar user stats
    const userBadges = document.getElementById('user-badges');
    const userScore = document.getElementById('user-score');
    const userFollowers = document.getElementById('user-followers');
    const userFollowing = document.getElementById('user-following');
    const userReviewsCount = document.getElementById('user-reviews-count');

    if (userBadges) userBadges.textContent = this.userStats.badges || 4;
    if (userScore) userScore.textContent = this.userStats.score || 500;
    if (userFollowers) userFollowers.textContent = this.userStats.followers || 0;
    if (userFollowing) userFollowing.textContent = this.userStats.following || 0;
    if (userReviewsCount) userReviewsCount.textContent = this.userStats.totalReviews || 0;
  }

  renderProducts() {
    this.filteredProducts = [...this.products];
    this.applyProductFilters();
    this.renderProductsPage();
    this.updateProductsCount();
  }

  applyProductFilters() {
    const searchTerm = document.getElementById('product-search')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('product-category-filter')?.value || 'all';
    const sortOption = document.getElementById('product-sort')?.value || 'newest';

    // Apply search filter
    this.filteredProducts = this.products.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm)
    );

    // Apply category filter
    if (categoryFilter !== 'all') {
      this.filteredProducts = this.filteredProducts.filter(product =>
        product.category === categoryFilter
      );
    }

    // Apply sorting
    this.filteredProducts.sort((a, b) => {
      switch (sortOption) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        default: // newest
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }

  renderProductsPage() {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;

    const startIndex = (this.currentProductPage - 1) * this.productsPerPage;
    const endIndex = startIndex + this.productsPerPage;
    const pageProducts = this.filteredProducts.slice(startIndex, endIndex);

    const viewMode = document.querySelector('.view-btn.active')?.dataset.view || 'grid';
    productsContainer.className = `products-${viewMode}`;

    productsContainer.innerHTML = pageProducts.length ?
      pageProducts.map(product => `
        <div class="product-card" data-id="${product._id}">
          <div class="product-image">
            <img src="${product.imageUrl || 'placeholder1.jpg'}" alt="${product.name}" loading="lazy">
            <div class="product-overlay">
              <button class="quick-view-btn" data-id="${product._id}">Quick View</button>
            </div>
          </div>
          <div class="product-info">
            <h3>${product.name}</h3>
            <p class="product-description">${product.description.substring(0, 100)}...</p>
            <div class="product-meta">
              <span class="price">$${product.price.toFixed(2)}</span>
              <span class="category">${product.category || 'General'}</span>
            </div>
            <div class="product-actions">
              <a href="product.html?id=${product._id}" class="btn btn-outline">View Details</a>
              <button class="btn review-btn primary" data-id="${product._id}">Add Review</button>
              <button class="favorite-btn" data-id="${product._id}">
                <i class="icon-heart"></i>
              </button>
            </div>
          </div>
        </div>
      `).join('') :
      '<div class="no-data"><i class="icon-search"></i><p>No products found</p></div>';

    this.renderProductsPagination();
    this.setupProductEventListeners();
  }

  renderProductsPagination() {
    const paginationContainer = document.getElementById('products-pagination');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let paginationHTML = '<div class="pagination">';

    // Previous button
    paginationHTML += `
      <button class="page-btn ${this.currentProductPage === 1 ? 'disabled' : ''}"
              data-page="${this.currentProductPage - 1}">
        <i class="icon-chevron-left"></i>
      </button>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= this.currentProductPage - 2 && i <= this.currentProductPage + 2)) {
        paginationHTML += `
          <button class="page-btn ${i === this.currentProductPage ? 'active' : ''}"
                  data-page="${i}">${i}</button>
        `;
      } else if (i === this.currentProductPage - 3 || i === this.currentProductPage + 3) {
        paginationHTML += '<span class="page-ellipsis">...</span>';
      }
    }

    // Next button
    paginationHTML += `
      <button class="page-btn ${this.currentProductPage === totalPages ? 'disabled' : ''}"
              data-page="${this.currentProductPage + 1}">
        <i class="icon-chevron-right"></i>
      </button>
    `;

    paginationHTML += '</div>';
    paginationContainer.innerHTML = paginationHTML;
  }

  updateProductsCount() {
    const countElement = document.getElementById('products-count');
    if (countElement) {
      const total = this.filteredProducts.length;
      const showing = Math.min(this.productsPerPage, total - (this.currentProductPage - 1) * this.productsPerPage);
      countElement.textContent = `Showing ${showing} of ${total} products`;
    }
  }

  renderReviews() {
    const reviewsContainer = document.getElementById('reviews-container');
    if (!reviewsContainer) return;

    reviewsContainer.innerHTML = this.allReviews.length ?
      this.allReviews.slice(0, 6).map(review => {
        const product = this.products.find(p => p._id === review.productId) || { name: 'Unknown Product' };
        return `
          <div class="review-card">
            <h4>${product.name}</h4>
            <div class="rating">
              ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
            </div>
            <p>${review.content}</p>
            <div class="review-meta">
              <small>Source: ${review.source}</small>
              <small>${new Date(review.createdAt).toLocaleDateString()}</small>
            </div>
          </div>
        `;
      }).join('') :
      '<p>No reviews available.</p>';

    // Add "View All Reviews" button if there are more than 6 reviews
    if (this.allReviews.length > 6) {
      const viewAllBtn = document.createElement('button');
      viewAllBtn.className = 'view-all-reviews-btn';
      viewAllBtn.textContent = `View All ${this.allReviews.length} Reviews`;
      viewAllBtn.addEventListener('click', () => this.showAllReviews());
      reviewsContainer.appendChild(viewAllBtn);
    }
  }

  createReviewsDisplay() {
    const reviewsSection = document.querySelector('.reviews-section');
    
    // Remove existing reviews display if any
    const existingReviewsDisplay = document.getElementById('user-reviews-display');
    if (existingReviewsDisplay) {
      existingReviewsDisplay.remove();
    }

    // Create reviews display
    const reviewsDisplay = document.createElement('div');
    reviewsDisplay.id = 'user-reviews-display';
    reviewsDisplay.className = 'user-reviews-display';
    
    reviewsDisplay.innerHTML = `
      <h3>Recent Reviews</h3>
      <div class="reviews-grid">
        ${this.userReviews.slice(0, 6).map(review => `
          <div class="review-card">
            <div class="review-header">
              <h4>${review.productId?.name || 'Product'}</h4>
              <div class="review-rating">
                ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
              </div>
            </div>
            <p class="review-content">${review.content}</p>
            <div class="review-meta">
              <span class="review-source">${review.source}</span>
              <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        `).join('')}
      </div>
      ${this.userReviews.length > 6 ? `
        <button class="view-all-reviews-btn" id="view-all-reviews">
          View All ${this.userReviews.length} Reviews
        </button>
      ` : ''}
    `;

    reviewsSection.appendChild(reviewsDisplay);

    // Add event listener for "View All Reviews" button
    const viewAllBtn = document.getElementById('view-all-reviews');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        this.showAllReviews();
      });
    }
  }

  renderBadges() {
    const badgesGrid = document.querySelector('.badges-grid');
    if (!badgesGrid) return;

    // Generate badges based on user activity
    const badges = this.generateUserBadges();
    
    badgesGrid.innerHTML = badges.map(badge => `
      <li class="badge-item">
        <img src="badge.png" alt="${badge.name}" width="100" height="100">
        <p>${badge.name}</p>
      </li>
    `).join('');
  }

  generateUserBadges() {
    const badges = [];
    const reviewCount = this.userReviews.length;
    const avgRating = this.userStats.avgRating || 0;

    // Review count badges
    if (reviewCount >= 1) {
      badges.push({ name: 'First Review: Getting Started' });
    }
    if (reviewCount >= 5) {
      badges.push({ name: 'Active Reviewer: 5+ Reviews' });
    }
    if (reviewCount >= 10) {
      badges.push({ name: 'Expert Reviewer: 10+ Reviews' });
    }

    // Quality badges
    if (avgRating >= 4.0) {
      badges.push({ name: 'Quality Reviewer: High Ratings' });
    }

    // Default badges if none earned
    if (badges.length === 0) {
      badges.push({ name: 'Welcome to FeedbackHub' });
    }

    // Ensure we have at least 4 badges for display
    while (badges.length < 4) {
      badges.push({ name: 'Badge Coming Soon' });
    }

    return badges.slice(0, 4);
  }

  setupEventListeners() {
    // Edit profile button
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => {
        this.showEditProfileModal();
      });
    }

    // Share profile button
    const shareProfileBtn = document.getElementById('share-profile-btn');
    if (shareProfileBtn) {
      shareProfileBtn.addEventListener('click', () => {
        this.shareProfile();
      });
    }

    // Change avatar button
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    if (changeAvatarBtn) {
      changeAvatarBtn.addEventListener('click', () => {
        this.changeAvatar();
      });
    }

    // Stats refresh button
    const refreshStatsBtn = document.getElementById('refresh-stats-btn');
    if (refreshStatsBtn) {
      refreshStatsBtn.addEventListener('click', () => {
        this.refreshStats();
      });
    }

    // Stats time filter
    const statsTimeFilter = document.getElementById('stats-time-filter');
    if (statsTimeFilter) {
      statsTimeFilter.addEventListener('change', () => {
        this.filterStatsByTime();
      });
    }

    // Clickable stat cards
    document.querySelectorAll('.stat-card.clickable').forEach(card => {
      card.addEventListener('click', () => {
        const statType = card.dataset.stat;
        this.showStatDetails(statType);
      });
    });

    // Review tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filterReviewsByTab(e.target.dataset.tab);
      });
    });

    // Review rating filter
    const reviewRatingFilter = document.getElementById('review-rating-filter');
    if (reviewRatingFilter) {
      reviewRatingFilter.addEventListener('change', () => {
        this.filterReviewsByRating();
      });
    }

    // Quick add review button
    const quickAddReviewBtn = document.getElementById('quick-add-review');
    if (quickAddReviewBtn) {
      quickAddReviewBtn.addEventListener('click', () => {
        this.showQuickReviewForm();
      });
    }

    // Connection stats
    document.querySelectorAll('.stat-item.clickable').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        this.handleConnectionAction(action);
      });
    });

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

    const exportDataBtn = document.getElementById('export-data-btn');
    if (exportDataBtn) {
      exportDataBtn.addEventListener('click', () => {
        this.exportUserData();
      });
    }
  }

  // New dynamic methods for enhanced functionality
  shareProfile() {
    const profileUrl = `${window.location.origin}/profile.html?user=${this.user._id}`;

    if (navigator.share) {
      navigator.share({
        title: `${this.user.firstName} ${this.user.lastName}'s Profile`,
        text: 'Check out my FeedbackHub profile!',
        url: profileUrl
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(profileUrl).then(() => {
        this.addLiveUpdate('Profile link copied to clipboard!', 'success');
      });
    }
  }

  changeAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const avatar = document.getElementById('main-profile-avatar');
          if (avatar) {
            avatar.src = e.target.result;
            this.addLiveUpdate('Profile picture updated!', 'success');
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  refreshStats() {
    this.addLiveUpdate('Refreshing statistics...', 'info');

    // Simulate API call with loading animation
    const refreshBtn = document.getElementById('refresh-stats-btn');
    if (refreshBtn) {
      refreshBtn.innerHTML = '<i class="icon-loading spinning"></i>';
      refreshBtn.disabled = true;
    }

    setTimeout(async () => {
      try {
        const [userStats, dashboardStats] = await Promise.all([
          api.getUserStats(),
          api.getDashboardStats()
        ]);

        this.userStats = userStats;
        this.dashboardStats = dashboardStats;

        this.renderDashboardStats();
        this.renderUserStats();
        this.renderProgressTracker();

        this.addLiveUpdate('Statistics updated!', 'success');
      } catch (error) {
        this.addLiveUpdate('Failed to refresh statistics', 'error');
      } finally {
        if (refreshBtn) {
          refreshBtn.innerHTML = '<i class="icon-refresh"></i>';
          refreshBtn.disabled = false;
        }
      }
    }, 1000);
  }

  filterStatsByTime() {
    const timeFilter = document.getElementById('stats-time-filter').value;
    this.addLiveUpdate(`Filtering stats by: ${timeFilter}`, 'info');

    // This would typically filter the stats based on time period
    // For now, we'll just show a message
    const filterText = {
      'all': 'All Time',
      'month': 'This Month',
      'week': 'This Week'
    };

    this.addLiveUpdate(`Showing stats for: ${filterText[timeFilter]}`, 'info');
  }

  showStatDetails(statType) {
    const statNames = {
      'reviews': 'Reviews',
      'rating': 'Ratings',
      'products': 'Products',
      'engagement': 'Engagement'
    };

    this.addLiveUpdate(`Viewing ${statNames[statType]} details`, 'info');

    // Create a detailed view modal
    const modal = document.createElement('div');
    modal.className = 'modal stat-details-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>${statNames[statType]} Details</h2>
        <div class="stat-details">
          <p>Detailed ${statNames[statType].toLowerCase()} information would be displayed here.</p>
          <div class="chart-placeholder">
            <p>📊 Chart visualization coming soon...</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }

  filterReviewsByTab(tab) {
    this.addLiveUpdate(`Switching to ${tab} view`, 'info');

    switch (tab) {
      case 'my-reviews':
        this.filteredReviews = this.userReviews;
        break;
      case 'all-reviews':
        this.filteredReviews = this.allReviews;
        break;
      case 'recent':
        this.filteredReviews = this.allReviews.slice(0, 10);
        break;
    }

    this.renderReviewsPage();
  }

  filterReviewsByRating() {
    const ratingFilter = document.getElementById('review-rating-filter').value;

    if (ratingFilter === 'all') {
      this.filteredReviews = this.userReviews;
    } else {
      this.filteredReviews = this.userReviews.filter(review =>
        review.rating === parseInt(ratingFilter)
      );
    }

    this.renderReviewsPage();
    this.addLiveUpdate(`Filtered reviews by ${ratingFilter} stars`, 'info');
  }

  renderReviewsPage() {
    const reviewsContainer = document.getElementById('reviews-container');
    if (!reviewsContainer) return;

    const startIndex = (this.currentReviewPage - 1) * this.reviewsPerPage;
    const endIndex = startIndex + this.reviewsPerPage;
    const pageReviews = this.filteredReviews.slice(startIndex, endIndex);

    reviewsContainer.innerHTML = pageReviews.length ?
      pageReviews.map(review => `
        <div class="review-card">
          <div class="review-header">
            <div class="review-rating">
              ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
            </div>
            <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
          </div>
          <h4 class="review-product">${review.productId?.name || 'Product'}</h4>
          <p class="review-content">${review.content}</p>
          <div class="review-actions">
            <button class="btn-small edit-review" data-id="${review._id}">Edit</button>
            <button class="btn-small delete-review" data-id="${review._id}">Delete</button>
          </div>
        </div>
      `).join('') :
      '<div class="no-data"><i class="icon-review"></i><p>No reviews found</p></div>';

    this.updateReviewsCount();
  }

  updateReviewsCount() {
    const countElement = document.getElementById('reviews-count');
    if (countElement) {
      countElement.textContent = `${this.filteredReviews.length} reviews found`;
    }
  }

  showQuickReviewForm() {
    const modal = document.createElement('div');
    modal.className = 'modal quick-review-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Quick Review</h2>
        <form class="quick-review-form">
          <div class="form-group">
            <label>Select Product:</label>
            <select id="quick-review-product" required>
              <option value="">Choose a product...</option>
              ${this.products.map(product =>
                `<option value="${product._id}">${product.name}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Rating:</label>
            <div class="star-rating" id="quick-review-rating">
              ${[1,2,3,4,5].map(i => `<span class="star" data-rating="${i}">☆</span>`).join('')}
            </div>
          </div>
          <div class="form-group">
            <label>Review:</label>
            <textarea id="quick-review-content" placeholder="Write your review..." required></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Submit Review</button>
            <button type="button" class="btn btn-secondary cancel">Cancel</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup star rating
    modal.querySelectorAll('.star').forEach(star => {
      star.addEventListener('click', (e) => {
        const rating = parseInt(e.target.dataset.rating);
        modal.querySelectorAll('.star').forEach((s, i) => {
          s.textContent = i < rating ? '★' : '☆';
        });
        modal.querySelector('#quick-review-rating').dataset.rating = rating;
      });
    });

    // Setup form submission
    modal.querySelector('.quick-review-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitQuickReview(modal);
    });

    // Setup close buttons
    modal.querySelector('.close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('.cancel').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }

  submitQuickReview(modal) {
    const productId = modal.querySelector('#quick-review-product').value;
    const rating = modal.querySelector('#quick-review-rating').dataset.rating;
    const content = modal.querySelector('#quick-review-content').value;

    if (!productId || !rating || !content) {
      this.addLiveUpdate('Please fill in all fields', 'error');
      return;
    }

    // Simulate API call
    this.addLiveUpdate('Submitting review...', 'info');

    setTimeout(() => {
      this.addLiveUpdate('Review submitted successfully!', 'success');
      document.body.removeChild(modal);

      // Add the new review to the list (simulation)
      const newReview = {
        _id: Date.now().toString(),
        productId: this.products.find(p => p._id === productId),
        rating: parseInt(rating),
        content: content,
        createdAt: new Date().toISOString()
      };

      this.userReviews.unshift(newReview);
      this.filteredReviews = this.userReviews;
      this.renderReviewsPage();
      this.refreshStats();
    }, 1000);
  }

  handleConnectionAction(action) {
    switch (action) {
      case 'view-followers':
        this.showFollowersList();
        break;
      case 'view-following':
        this.showFollowingList();
        break;
      case 'view-reviews':
        this.scrollToReviews();
        break;
    }
  }

  showFollowersList() {
    this.addLiveUpdate('Followers feature coming soon!', 'info');
  }

  showFollowingList() {
    this.addLiveUpdate('Following feature coming soon!', 'info');
  }

  scrollToReviews() {
    const reviewsSection = document.querySelector('.reviews-section');
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  exportUserData() {
    this.addLiveUpdate('Preparing data export...', 'info');

    const userData = {
      profile: {
        name: `${this.user.firstName} ${this.user.lastName}`,
        email: this.user.email,
        location: this.user.location,
        bio: this.user.bio,
        joinDate: this.user.createdAt
      },
      stats: this.userStats,
      reviews: this.userReviews,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `feedbackhub-data-${this.user.firstName}-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
    this.addLiveUpdate('Data exported successfully!', 'success');
  }

  showEditProfileModal() {
    // Create and show the profile settings modal
    const modal = document.createElement('div');
    modal.className = 'modal profile-settings-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Profile Settings</h2>

        <div class="profile-settings-tabs">
          <button class="profile-tab active" data-tab="profile">Profile</button>
          <button class="profile-tab" data-tab="security">Security</button>
        </div>

        <div class="tab-content active" id="profile-tab">
          <div class="profile-avatar-section">
            <img src="profile photo.svg" alt="Profile Avatar" class="profile-avatar-preview" id="avatar-preview">
            <br>
            <button class="avatar-upload-btn" id="avatar-upload-btn">Change Avatar</button>
            <input type="file" id="avatar-input" accept="image/*" style="display: none;">
          </div>

          <form id="profile-form">
            <div class="profile-form-row">
              <div class="profile-form-group">
                <label for="edit-firstName">First Name</label>
                <input type="text" id="edit-firstName" required>
              </div>
              <div class="profile-form-group">
                <label for="edit-lastName">Last Name</label>
                <input type="text" id="edit-lastName" required>
              </div>
            </div>

            <div class="profile-form-group">
              <label for="edit-email">Email</label>
              <input type="email" id="edit-email" required>
            </div>

            <div class="profile-form-group">
              <label for="edit-location">Location</label>
              <input type="text" id="edit-location" placeholder="City, Country">
            </div>

            <div class="profile-form-group">
              <label for="edit-bio">Bio</label>
              <textarea id="edit-bio" rows="3" placeholder="Tell us about yourself..."></textarea>
            </div>

            <button type="submit" class="btn">Update Profile</button>
          </form>
        </div>

        <div class="tab-content" id="security-tab">
          <form id="password-form">
            <div class="profile-form-group">
              <label for="current-password">Current Password</label>
              <input type="password" id="current-password" required>
            </div>

            <div class="profile-form-group">
              <label for="new-password">New Password</label>
              <input type="password" id="new-password" required>
            </div>

            <div class="profile-form-group">
              <label for="confirm-password">Confirm New Password</label>
              <input type="password" id="confirm-password" required>
            </div>

            <button type="submit" class="btn">Update Password</button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.setupSettingsModal(modal);
  }

  async setupSettingsModal(modal) {
    // Load current user data
    try {
      document.getElementById('edit-firstName').value = this.user.firstName || '';
      document.getElementById('edit-lastName').value = this.user.lastName || '';
      document.getElementById('edit-email').value = this.user.email || '';
      document.getElementById('edit-location').value = this.user.location || '';
      document.getElementById('edit-bio').value = this.user.bio || '';

      const avatarPreview = document.getElementById('avatar-preview');
      if (this.user.profilePicture) {
        avatarPreview.src = this.user.profilePicture;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }

    // Close modal
    modal.querySelector('.close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Tab switching
    modal.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;

        // Update active tab
        modal.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update active content
        modal.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        modal.getElementById(`${tabName}-tab`).classList.add('active');
      });
    });

    // Avatar upload
    const avatarUploadBtn = modal.getElementById('avatar-upload-btn');
    const avatarInput = modal.getElementById('avatar-input');
    const avatarPreview = modal.getElementById('avatar-preview');

    avatarUploadBtn.addEventListener('click', () => {
      avatarInput.click();
    });

    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          avatarPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    // Profile form submission
    modal.getElementById('profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.updateProfile(modal);
    });

    // Password form submission
    modal.getElementById('password-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.updatePassword(modal);
    });
  }

  async updateProfile(modal) {
    try {
      const profileData = {
        firstName: document.getElementById('edit-firstName').value,
        lastName: document.getElementById('edit-lastName').value,
        email: document.getElementById('edit-email').value,
        location: document.getElementById('edit-location').value,
        bio: document.getElementById('edit-bio').value,
        profilePicture: document.getElementById('avatar-preview').src
      };

      const result = await api.updateProfile(profileData);

      if (result.success) {
        this.showMessage(modal, 'Profile updated successfully!', 'success');

        // Update local user data
        this.user = { ...this.user, ...result.user };

        // Update localStorage user data
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({...currentUser, ...result.user}));

        // Refresh the profile display
        this.renderUserInfo();

        // Update profile menu if it exists
        if (window.ProfileMenu) {
          const profileMenu = new window.ProfileMenu();
          profileMenu.updateUserInfo(this.user);
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      this.showMessage(modal, 'Failed to update profile. Please try again.', 'error');
    }
  }

  async updatePassword(modal) {
    try {
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (newPassword !== confirmPassword) {
        this.showMessage(modal, 'New passwords do not match.', 'error');
        return;
      }

      const passwordData = {
        currentPassword: document.getElementById('current-password').value,
        newPassword: newPassword
      };

      const result = await api.updatePassword(passwordData);

      if (result.success) {
        this.showMessage(modal, 'Password updated successfully!', 'success');
        modal.getElementById('password-form').reset();
      }
    } catch (error) {
      console.error('Error updating password:', error);
      this.showMessage(modal, 'Failed to update password. Please check your current password.', 'error');
    }
  }

  showMessage(modal, message, type) {
    // Remove existing messages
    const existingMessages = modal.querySelectorAll('.form-message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;

    // Insert at the top of the active tab content
    const activeTab = modal.querySelector('.tab-content.active');
    activeTab.insertBefore(messageDiv, activeTab.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 5000);
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
        userId: this.user._id
      };

      try {
        await api.submitReview(reviewData);
        document.body.removeChild(modal);

        // Refresh data
        await this.refreshData();

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

        // Refresh data
        await this.refreshData();

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

  showAllReviews() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px;">
        <span class="close">&times;</span>
        <h2>All Reviews (${this.allReviews.length})</h2>
        <div class="all-reviews-container">
          ${this.allReviews.map(review => {
            const product = this.products.find(p => p._id === review.productId) || { name: 'Unknown Product' };
            return `
              <div class="review-card">
                <div class="review-header">
                  <h4>${product.name}</h4>
                  <div class="review-rating">
                    ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                  </div>
                </div>
                <p class="review-content">${review.content}</p>
                <div class="review-meta">
                  <span class="review-source">${review.source}</span>
                  <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close modal
    modal.querySelector('.close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  async refreshData() {
    try {
      // Reload all data
      const [userStats, dashboardStats, allReviews, products] = await Promise.all([
        api.getUserStats(),
        api.getDashboardStats(),
        api.getReviews(),
        api.getProducts()
      ]);

      this.userStats = userStats;
      this.dashboardStats = dashboardStats;
      this.allReviews = allReviews;
      this.products = products;

      // Filter user's reviews
      this.userReviews = allReviews.filter(review =>
        review.userId._id === this.user._id || review.userId === this.user._id
      );

      // Re-render components
      this.renderDashboardStats();
      this.renderUserStats();
      this.renderProducts();
      this.renderReviews();

      // Re-setup event listeners for new elements
      this.setupProductEventListeners();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }

  renderProgressTracker() {
    const currentLevel = document.getElementById('current-level');
    const nextLevel = document.getElementById('next-level');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    if (!this.userStats) return;

    const score = this.userStats.score || 0;
    const level = Math.floor(score / 1000) + 1;
    const nextLevelScore = level * 1000;
    const currentLevelScore = (level - 1) * 1000;
    const progress = ((score - currentLevelScore) / (nextLevelScore - currentLevelScore)) * 100;

    if (currentLevel) currentLevel.textContent = `Level ${level}`;
    if (nextLevel) nextLevel.textContent = `Level ${level + 1}`;
    if (progressFill) progressFill.style.width = `${Math.min(progress, 100)}%`;
    if (progressText) progressText.textContent = `${score} / ${nextLevelScore} XP`;
  }

  renderRecentActivity() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;

    // Generate recent activities based on user data
    this.recentActivities = this.generateRecentActivities();

    activityList.innerHTML = this.recentActivities.length ?
      this.recentActivities.slice(0, 5).map(activity => `
        <div class="activity-item">
          <i class="icon-${activity.type}"></i>
          <div class="activity-content">
            <span class="activity-text">${activity.text}</span>
            <span class="activity-time">${this.formatTimeAgo(activity.timestamp)}</span>
          </div>
        </div>
      `).join('') :
      '<div class="no-activity">No recent activity</div>';
  }

  generateRecentActivities() {
    const activities = [];
    const now = Date.now();

    // Add review activities
    this.userReviews.slice(0, 3).forEach((review, index) => {
      activities.push({
        type: 'review',
        text: `Reviewed ${review.productId?.name || 'a product'}`,
        timestamp: new Date(review.createdAt).getTime()
      });
    });

    // Add profile update activity
    if (this.user.updatedAt) {
      activities.push({
        type: 'profile',
        text: 'Updated profile information',
        timestamp: new Date(this.user.updatedAt).getTime()
      });
    }

    // Add login activity
    activities.push({
      type: 'login',
      text: 'Logged in',
      timestamp: now - Math.random() * 3600000 // Random time within last hour
    });

    return activities.sort((a, b) => b.timestamp - a.timestamp);
  }

  formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  setupAutoRefresh() {
    const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
    if (!autoRefreshToggle) return;

    autoRefreshToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    });

    // Start auto-refresh by default
    if (autoRefreshToggle.checked) {
      this.startAutoRefresh();
    }
  }

  startAutoRefresh() {
    this.stopAutoRefresh(); // Clear any existing interval
    this.autoRefreshInterval = setInterval(() => {
      this.refreshData();
      this.addLiveUpdate('Data refreshed automatically', 'info');
    }, 30000); // Refresh every 30 seconds
  }

  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  updateOnlineStatus() {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');

    if (statusIndicator && statusText) {
      statusIndicator.className = 'status-indicator online';
      statusText.textContent = 'Online';
    }

    // Update last seen time
    this.lastUpdateTime = Date.now();
  }

  addLiveUpdate(message, type = 'info') {
    const updatesContainer = document.getElementById('updates-container');
    if (!updatesContainer) return;

    const updateItem = document.createElement('div');
    updateItem.className = 'update-item';
    updateItem.innerHTML = `
      <i class="icon-${type}"></i>
      <span>${message}</span>
      <span class="update-time">${new Date().toLocaleTimeString()}</span>
    `;

    updatesContainer.insertBefore(updateItem, updatesContainer.firstChild);

    // Keep only last 5 updates
    while (updatesContainer.children.length > 5) {
      updatesContainer.removeChild(updatesContainer.lastChild);
    }

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (updateItem.parentNode) {
        updateItem.remove();
      }
    }, 10000);
  }

  setupProductEventListeners() {
    // Re-setup product review buttons
    document.querySelectorAll('.review-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const productId = e.target.dataset.id;
        this.showReviewForm(productId);
      });
    });

    // Setup product search
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.currentProductPage = 1;
        this.renderProducts();
      });
    }

    // Setup product filters
    const categoryFilter = document.getElementById('product-category-filter');
    const sortSelect = document.getElementById('product-sort');

    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => {
        this.currentProductPage = 1;
        this.renderProducts();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        this.currentProductPage = 1;
        this.renderProducts();
      });
    }

    // Setup view toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.renderProductsPage();
      });
    });

    // Setup pagination
    document.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = parseInt(e.target.dataset.page);
        if (page && page !== this.currentProductPage) {
          this.currentProductPage = page;
          this.renderProductsPage();
        }
      });
    });

    // Setup quick view buttons
    document.querySelectorAll('.quick-view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = e.target.dataset.id;
        this.showQuickView(productId);
      });
    });

    // Setup favorite buttons
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = e.target.dataset.id;
        this.toggleFavorite(productId, e.target);
      });
    });
  }

  showQuickView(productId) {
    const product = this.products.find(p => p._id === productId);
    if (!product) return;

    // Create quick view modal
    const modal = document.createElement('div');
    modal.className = 'modal quick-view-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <div class="quick-view-content">
          <div class="quick-view-image">
            <img src="${product.imageUrl || 'placeholder1.jpg'}" alt="${product.name}">
          </div>
          <div class="quick-view-info">
            <h2>${product.name}</h2>
            <p class="price">$${product.price.toFixed(2)}</p>
            <p class="description">${product.description}</p>
            <div class="quick-view-actions">
              <a href="product.html?id=${product._id}" class="btn btn-primary">View Full Details</a>
              <button class="btn btn-outline review-btn" data-id="${product._id}">Write Review</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup modal close
    modal.querySelector('.close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Setup review button
    modal.querySelector('.review-btn').addEventListener('click', (e) => {
      document.body.removeChild(modal);
      this.showReviewForm(productId);
    });
  }

  toggleFavorite(productId, button) {
    // Toggle favorite state (this would typically involve an API call)
    const icon = button.querySelector('i');
    const isFavorited = icon.classList.contains('favorited');

    if (isFavorited) {
      icon.classList.remove('favorited');
      button.title = 'Add to favorites';
      this.addLiveUpdate('Removed from favorites', 'info');
    } else {
      icon.classList.add('favorited');
      button.title = 'Remove from favorites';
      this.addLiveUpdate('Added to favorites', 'success');
    }
  }
}

// Initialize unified profile page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new UnifiedProfilePage();
});