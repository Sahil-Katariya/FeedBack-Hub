class UnifiedProfilePage {
  constructor() {
    this.user = null;
    this.userStats = null;
    this.dashboardStats = null;
    this.userReviews = [];
    this.allReviews = [];
    this.products = [];
    this.init();
  }

  async init() {
    console.log('🚀 Initializing profile page...');

    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found, redirecting to login');
      window.location.href = 'login.html';
      return;
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');

    try {
      console.log('📡 Loading user data...');

      // Load critical data first (user info)
      console.log('🔄 Loading user information...');
      this.user = await api.getUser();
      console.log('✅ User data loaded:', this.user);

      // Load other data with individual error handling
      const dataPromises = [
        this.loadUserStats(),
        this.loadDashboardStats(),
        this.loadReviews(),
        this.loadProducts()
      ];

      // Wait for all data loading attempts
      await Promise.allSettled(dataPromises);

      // Filter user's reviews if we have both user and reviews data
      if (this.user && this.allReviews.length > 0) {
        this.userReviews = this.allReviews.filter(review =>
          review.userId._id === this.user._id || review.userId === this.user._id
        );
        console.log('✅ User reviews filtered:', this.userReviews.length, 'user reviews');
      }

      console.log('🎨 Rendering profile...');
      this.renderProfile();
      this.setupEventListeners();
      console.log('✅ Profile initialization complete!');
    } catch (error) {
      console.error('❌ Profile initialization error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // Handle different types of errors
      if (error.message.includes('Authentication failed') ||
          error.message.includes('token expired') ||
          error.message.includes('401')) {
        console.log('🔄 Authentication failed, clearing storage and redirecting...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.showErrorMessage('Session expired. Redirecting to login...', 'warning');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      } else if (error.message.includes('Cannot connect to server')) {
        console.log('🔄 Server connection failed');
        this.showErrorMessage('Cannot connect to server. Please check your connection and try again.', 'error');
        this.showRetryButton();
      } else {
        // Show error message to user with retry option
        console.log('🔄 General error occurred');
        this.showErrorMessage('Failed to load profile data. Please try again.', 'error');
        this.showRetryButton();
      }
    }
  }

  async loadUserStats() {
    try {
      console.log('🔄 Loading user stats...');
      this.userStats = await api.getUserStats();
      console.log('✅ User stats loaded:', this.userStats);
    } catch (error) {
      console.error('❌ Failed to load user stats:', error);
      this.userStats = { totalReviews: 0, avgRating: 0, badges: 4, followers: 0, following: 0, score: 500 };
      this.showErrorMessage('Failed to load user statistics', 'warning');
    }
  }

  async loadDashboardStats() {
    try {
      console.log('🔄 Loading dashboard stats...');
      this.dashboardStats = await api.getDashboardStats();
      console.log('✅ Dashboard stats loaded:', this.dashboardStats);
    } catch (error) {
      console.error('❌ Failed to load dashboard stats:', error);
      this.dashboardStats = { totalReviews: 0, avgRating: 0, totalProducts: 0, userReviews: 0 };
      this.showErrorMessage('Failed to load dashboard statistics', 'warning');
    }
  }

  async loadReviews() {
    try {
      console.log('🔄 Loading reviews...');
      this.allReviews = await api.getReviews();
      console.log('✅ Reviews loaded:', this.allReviews.length, 'reviews');
    } catch (error) {
      console.error('❌ Failed to load reviews:', error);
      this.allReviews = [];
      this.showErrorMessage('Failed to load reviews', 'warning');
    }
  }

  async loadProducts() {
    try {
      console.log('🔄 Loading products...');
      this.products = await api.getProducts();
      console.log('✅ Products loaded:', this.products.length, 'products');
    } catch (error) {
      console.error('❌ Failed to load products:', error);
      this.products = [];
      this.showErrorMessage('Failed to load products', 'warning');
    }
  }

  renderProfile() {
    this.renderUserInfo();
    this.renderDashboardStats();
    this.renderUserStats();
    this.renderProducts();
    this.renderReviews();
    this.renderBadges();
  }

  renderUserInfo() {
    console.log('🎨 Rendering user info...', this.user);

    const profileName = document.getElementById('profile-title');
    const profileRole = document.querySelector('.profile-role');
    const profileLocation = document.querySelector('.profile-location');
    const profileAvatar = document.querySelector('.profile-avatar');

    if (profileName) {
      const fullName = `${this.user.firstName} ${this.user.lastName}`;
      profileName.textContent = fullName;
      console.log('✅ Profile name set to:', fullName);
    } else {
      console.log('❌ Profile name element not found');
    }

    if (profileRole) {
      profileRole.textContent = 'Customer';
      console.log('✅ Profile role set');
    } else {
      console.log('❌ Profile role element not found');
    }

    if (profileLocation) {
      const location = this.user.location || 'Location not set';
      profileLocation.textContent = location;
      console.log('✅ Profile location set to:', location);
    } else {
      console.log('❌ Profile location element not found');
    }

    if (profileAvatar) {
      const avatarSrc = this.user.profilePicture || 'profile photo.svg';
      profileAvatar.src = avatarSrc;
      console.log('✅ Profile avatar set to:', avatarSrc);
    } else {
      console.log('❌ Profile avatar element not found');
    }
  }

  showErrorMessage(message, type = 'error') {
    // Remove any existing error messages
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';

    const backgroundColor = type === 'warning' ? '#ff9800' : type === 'error' ? '#ff4444' : '#4CAF50';

    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${backgroundColor};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 1000;
      max-width: 350px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.4;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    // Auto-remove after 8 seconds for errors, 3 seconds for warnings
    const timeout = type === 'warning' ? 3000 : 8000;
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, timeout);
  }

  showRetryButton() {
    // Remove any existing retry buttons
    const existingRetry = document.querySelectorAll('.retry-button');
    existingRetry.forEach(button => button.remove());

    const retryDiv = document.createElement('div');
    retryDiv.className = 'retry-button';
    retryDiv.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #2196F3;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 1000;
      cursor: pointer;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    retryDiv.textContent = '🔄 Retry Loading';
    retryDiv.addEventListener('click', () => {
      retryDiv.remove();
      this.init();
    });
    document.body.appendChild(retryDiv);
  }

  renderDashboardStats() {
    console.log('📊 Rendering dashboard stats...', this.dashboardStats);

    // Update dashboard overview stats
    const totalReviewsElement = document.getElementById('total-reviews');
    const avgRatingElement = document.getElementById('avg-rating');
    const totalProductsElement = document.getElementById('total-products');

    if (totalReviewsElement) {
      totalReviewsElement.textContent = this.dashboardStats.totalReviews || 0;
      console.log('✅ Total reviews set to:', this.dashboardStats.totalReviews || 0);
    } else {
      console.log('❌ Total reviews element not found');
    }

    if (avgRatingElement) {
      avgRatingElement.textContent = this.dashboardStats.avgRating || '0.0';
      console.log('✅ Avg rating set to:', this.dashboardStats.avgRating || '0.0');
    } else {
      console.log('❌ Avg rating element not found');
    }

    if (totalProductsElement) {
      totalProductsElement.textContent = this.dashboardStats.totalProducts || 0;
      console.log('✅ Total products set to:', this.dashboardStats.totalProducts || 0);
    } else {
      console.log('❌ Total products element not found');
    }
  }

  renderUserStats() {
    console.log('👤 Rendering user stats...', this.userStats);

    // Update sidebar user stats
    const userBadges = document.getElementById('user-badges');
    const userScore = document.getElementById('user-score');
    const userFollowers = document.getElementById('user-followers');
    const userFollowing = document.getElementById('user-following');
    const userReviewsCount = document.getElementById('user-reviews-count');

    if (userBadges) {
      userBadges.textContent = this.userStats.badges || 4;
      console.log('✅ User badges set to:', this.userStats.badges || 4);
    } else {
      console.log('❌ User badges element not found');
    }

    if (userScore) {
      userScore.textContent = this.userStats.score || 500;
      console.log('✅ User score set to:', this.userStats.score || 500);
    } else {
      console.log('❌ User score element not found');
    }

    if (userFollowers) {
      userFollowers.textContent = this.userStats.followers || 0;
      console.log('✅ User followers set to:', this.userStats.followers || 0);
    } else {
      console.log('❌ User followers element not found');
    }

    if (userFollowing) {
      userFollowing.textContent = this.userStats.following || 0;
      console.log('✅ User following set to:', this.userStats.following || 0);
    } else {
      console.log('❌ User following element not found');
    }

    if (userReviewsCount) {
      userReviewsCount.textContent = this.userStats.totalReviews || 0;
      console.log('✅ User reviews count set to:', this.userStats.totalReviews || 0);
    } else {
      console.log('❌ User reviews count element not found');
    }
  }

  renderProducts() {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;

    productsContainer.innerHTML = this.products.length ?
      this.products.map(product => `
        <div class="product-card" data-id="${product._id}">
          <img src="${product.imageUrl || 'placeholder1.jpg'}" alt="${product.name}">
          <h3>${product.name}</h3>
          <p>${product.description.substring(0, 100)}...</p>
          <p class="price">$${product.price.toFixed(2)}</p>
          <div class="product-actions">
            <a href="product.html?id=${product._id}" class="btn btn-outline">View Details</a>
            <button class="btn review-btn" data-id="${product._id}">Add Review</button>
          </div>
        </div>
      `).join('') :
      '<p>No products available.</p>';
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

    // Product review buttons
    document.querySelectorAll('.review-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const productId = e.target.dataset.id;
        this.showReviewForm(productId);
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

    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.showEditProfileModal();
      });
    }

    // Logout functionality
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
      });
    }
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

  setupProductEventListeners() {
    // Re-setup product review buttons
    document.querySelectorAll('.review-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const productId = e.target.dataset.id;
        this.showReviewForm(productId);
      });
    });
  }
}

// Initialize unified profile page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new UnifiedProfilePage();
});
