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
        review.userId._id === user._id || review.userId === user._id
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
  }

  renderUserInfo() {
    const profileName = document.getElementById('profile-title');
    const profileRole = document.querySelector('.profile-role');
    const profileLocation = document.querySelector('.profile-location');
    const profileAvatar = document.querySelector('.profile-avatar');

    if (profileName) {
      profileName.textContent = `${this.user.firstName} ${this.user.lastName}`;
    }

    if (profileRole) {
      profileRole.textContent = 'Customer';
    }

    if (profileLocation) {
      profileLocation.textContent = this.user.location || 'Location not set';
    }

    if (profileAvatar && this.user.profilePicture) {
      profileAvatar.src = this.user.profilePicture;
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
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;

    productsContainer.innerHTML = this.products.length ?
      this.products.map(product => `
        <div class="product-card" data-id="${product._id}">
          <img src="${product.imageUrl || 'placeholder1.jpg'}" alt="${product.name}">
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
