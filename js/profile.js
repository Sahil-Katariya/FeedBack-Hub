class ProfilePage {
  constructor() {
    this.user = null;
    this.userStats = null;
    this.userReviews = [];
    this.init();
  }

  async init() {
    // Check authentication
    if (!localStorage.getItem('token')) {
      window.location.href = 'login.html';
      return;
    }

    try {
      // Load user data and stats
      const [user, stats] = await Promise.all([
        api.getUser(),
        api.getUserStats()
      ]);

      this.user = user;
      this.userStats = stats;

      // Load user's reviews
      const allReviews = await api.getReviews();
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
    this.renderStats();
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

  renderStats() {
    // Update sidebar stats
    const statItems = document.querySelectorAll('.stat-item');
    
    if (statItems.length >= 2) {
      // Badges
      const badgesValue = statItems[0].querySelector('.stat-value');
      if (badgesValue) badgesValue.textContent = this.userStats.badges || 4;

      // Score
      const scoreValue = statItems[1].querySelector('.stat-value');
      if (scoreValue) scoreValue.textContent = this.userStats.score || 500;
    }

    // Update connections stats
    const connectionStats = document.querySelectorAll('.connection-stats .stat-item');
    if (connectionStats.length >= 3) {
      // Followers
      const followersValue = connectionStats[0].querySelector('.stat-value');
      if (followersValue) followersValue.textContent = this.userStats.followers || 0;

      // Following
      const followingValue = connectionStats[1].querySelector('.stat-value');
      if (followingValue) followingValue.textContent = this.userStats.following || 0;

      // Reviews
      const reviewsValue = connectionStats[2].querySelector('.stat-value');
      if (reviewsValue) reviewsValue.textContent = this.userStats.totalReviews || 0;
    }
  }

  renderReviews() {
    const reviewsSection = document.querySelector('.reviews-section');
    const addReviewCard = document.querySelector('.add-review-card');

    if (!reviewsSection) return;

    // Update the "Add Reviews" section
    if (addReviewCard) {
      const reviewCount = this.userReviews.length;
      const reviewText = addReviewCard.querySelector('p');
      
      if (reviewCount > 0) {
        addReviewCard.querySelector('h3').textContent = `Your Reviews (${reviewCount})`;
        if (reviewText) {
          reviewText.textContent = `You have written ${reviewCount} review${reviewCount !== 1 ? 's' : ''}. Keep sharing your experiences!`;
        }
      } else {
        if (reviewText) {
          reviewText.textContent = 'Start by adding your first review. Share your experience with products you\'ve used.';
        }
      }
    }

    // Add actual reviews display
    if (this.userReviews.length > 0) {
      this.createReviewsDisplay();
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

    // Add review functionality
    const addReviewCard = document.querySelector('.add-review-card');
    if (addReviewCard) {
      addReviewCard.style.cursor = 'pointer';
      addReviewCard.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
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
    // Reuse the profile settings modal from profile-menu.js
    if (window.ProfileMenu) {
      const profileMenu = new window.ProfileMenu();
      profileMenu.showSettingsModal();
    } else {
      alert('Profile editing will be available soon!');
    }
  }

  showAllReviews() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px;">
        <span class="close">&times;</span>
        <h2>All Your Reviews (${this.userReviews.length})</h2>
        <div class="all-reviews-container">
          ${this.userReviews.map(review => `
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
}

// Initialize profile page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ProfilePage();
});
