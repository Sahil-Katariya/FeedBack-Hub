// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPage = {
            users: 1,
            products: 1,
            reviews: 1
        };
        this.pageSize = 10;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboard();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        // Search and filter buttons
        document.getElementById('users-search-btn')?.addEventListener('click', () => this.loadUsers());
        document.getElementById('products-search-btn')?.addEventListener('click', () => this.loadProducts());
        document.getElementById('reviews-search-btn')?.addEventListener('click', () => this.loadReviews());
        document.getElementById('refresh-analytics-btn')?.addEventListener('click', () => this.loadAnalytics());

        // Modal close events
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Enter key for search inputs
        document.querySelectorAll('.search-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const section = input.id.split('-')[0];
                    if (section === 'users') this.loadUsers();
                    else if (section === 'products') this.loadProducts();
                    else if (section === 'reviews') this.loadReviews();
                }
            });
        });

        // Bulk operation form handlers
        document.getElementById('bulk-user-action')?.addEventListener('change', (e) => {
            const roleGroup = document.getElementById('bulk-user-role-group');
            if (e.target.value === 'updateRole') {
                roleGroup.style.display = 'block';
            } else {
                roleGroup.style.display = 'none';
            }
        });

        document.getElementById('bulk-product-action')?.addEventListener('change', (e) => {
            const categoryGroup = document.getElementById('bulk-product-category-group');
            const multiplierGroup = document.getElementById('bulk-product-multiplier-group');

            if (e.target.value === 'updateCategory') {
                categoryGroup.style.display = 'block';
                multiplierGroup.style.display = 'none';
            } else if (e.target.value === 'updatePrice') {
                categoryGroup.style.display = 'none';
                multiplierGroup.style.display = 'block';
            } else {
                categoryGroup.style.display = 'none';
                multiplierGroup.style.display = 'none';
            }
        });

        // Logs refresh button
        document.getElementById('logs-refresh-btn')?.addEventListener('click', () => this.loadLogs());
    }

    showSection(section) {
        // Update navigation
        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(`${section}-section`).classList.add('active');

        this.currentSection = section;

        // Load section data
        switch (section) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'reviews':
                this.loadReviews();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'bulk-operations':
                this.loadBulkOperations();
                break;
            case 'system':
                this.loadSystemSection();
                break;
            case 'logs':
                this.loadLogs();
                break;
        }
    }

    async loadDashboard() {
        try {
            const response = await fetch('/api/admin/stats', {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });

            if (!response.ok) throw new Error('Failed to load dashboard stats');

            const data = await response.json();
            this.updateDashboardStats(data);
            this.loadRecentActivity();
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    updateDashboardStats(data) {
        document.getElementById('total-users').textContent = data.overview.totalUsers;
        document.getElementById('total-products').textContent = data.overview.totalProducts;
        document.getElementById('total-reviews').textContent = data.overview.totalReviews;
        document.getElementById('avg-rating').textContent = data.overview.avgRating;
        
        document.getElementById('active-users').textContent = `${data.overview.activeUsers} active`;
        document.getElementById('new-products').textContent = `${data.recentActivity.newProducts} this week`;
        document.getElementById('new-reviews').textContent = `${data.recentActivity.newReviews} this week`;
        document.getElementById('new-users').textContent = `${data.recentActivity.newUsers} new users`;
    }

    async loadRecentActivity() {
        try {
            // Load recent users
            const usersResponse = await fetch('/api/admin/users?limit=5', {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            
            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                this.renderRecentUsers(usersData.users);
            }

            // Load recent reviews
            const reviewsResponse = await fetch('/api/admin/reviews?limit=5', {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            
            if (reviewsResponse.ok) {
                const reviewsData = await reviewsResponse.json();
                this.renderRecentReviews(reviewsData.reviews);
            }
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

    renderRecentUsers(users) {
        const container = document.getElementById('recent-users-list');
        if (!users || users.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No recent users</p></div>';
            return;
        }

        container.innerHTML = users.map(user => `
            <div class="activity-item">
                <img src="${user.profilePicture || 'profile photo.svg'}" alt="${user.firstName}" class="activity-avatar">
                <div class="activity-content">
                    <h4>${user.firstName} ${user.lastName}</h4>
                    <p>${user.email}</p>
                </div>
                <div class="activity-time">${this.formatDate(user.createdAt)}</div>
            </div>
        `).join('');
    }

    renderRecentReviews(reviews) {
        const container = document.getElementById('recent-reviews-list');
        if (!reviews || reviews.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No recent reviews</p></div>';
            return;
        }

        container.innerHTML = reviews.map(review => `
            <div class="activity-item">
                <img src="${review.userId?.profilePicture || 'profile photo.svg'}" alt="${review.userId?.firstName}" class="activity-avatar">
                <div class="activity-content">
                    <h4>${review.productId?.name || 'Unknown Product'}</h4>
                    <p>${this.truncateText(review.content, 50)}</p>
                </div>
                <div class="activity-time">
                    <div class="rating-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                    <div>${this.formatDate(review.createdAt)}</div>
                </div>
            </div>
        `).join('');
    }

    async loadUsers() {
        try {
            const search = document.getElementById('users-search').value;
            const role = document.getElementById('users-role-filter').value;
            const status = document.getElementById('users-status-filter').value;
            const page = this.currentPage.users;

            const params = new URLSearchParams({
                page,
                limit: this.pageSize,
                ...(search && { search }),
                ...(role && { role }),
                ...(status && { status })
            });

            const response = await fetch(`/api/admin/users?${params}`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });

            if (!response.ok) throw new Error('Failed to load users');

            const data = await response.json();
            this.renderUsersTable(data.users);
            this.renderPagination('users', data.currentPage, data.totalPages);
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Failed to load users');
        }
    }

    renderUsersTable(users) {
        const tbody = document.getElementById('users-table-body');
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <div class="user-info">
                        <img src="${user.profilePicture || 'profile photo.svg'}" alt="${user.firstName}" class="user-avatar">
                        <div class="user-details">
                            <h4>${user.firstName} ${user.lastName}</h4>
                            <p>ID: ${user._id.slice(-8)}</p>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="role-badge role-${user.role}">${user.role}</span></td>
                <td><span class="status-badge status-${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>${this.formatDate(user.createdAt)}</td>
                <td>${user.lastLogin ? this.formatDate(user.lastLogin) : 'Never'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="adminPanel.editUser('${user._id}', '${user.role}', ${user.isActive})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="adminPanel.deleteUser('${user._id}', '${user.firstName} ${user.lastName}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadProducts() {
        try {
            const search = document.getElementById('products-search').value;
            const category = document.getElementById('products-category-filter').value;
            const page = this.currentPage.products;

            const params = new URLSearchParams({
                page,
                limit: this.pageSize,
                ...(search && { search }),
                ...(category && { category })
            });

            const response = await fetch(`/api/admin/products?${params}`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });

            if (!response.ok) throw new Error('Failed to load products');

            const data = await response.json();
            this.renderProductsTable(data.products);
            this.renderPagination('products', data.currentPage, data.totalPages);
            this.updateCategoryFilter(data.products);
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products');
        }
    }

    renderProductsTable(products) {
        const tbody = document.getElementById('products-table-body');
        
        if (!products || products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No products found</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>
                    <div class="product-info">
                        <img src="${product.imageUrl || 'placeholder1.jpg'}" alt="${product.name}" class="product-image">
                        <div class="user-details">
                            <h4>${product.name}</h4>
                            <p>${this.truncateText(product.description, 30)}</p>
                        </div>
                    </div>
                </td>
                <td>${product.category}</td>
                <td>$${product.price}</td>
                <td>${product.reviewCount || 0}</td>
                <td>
                    <div class="rating-stars">${'★'.repeat(Math.floor(product.avgRating || 0))}${'☆'.repeat(5 - Math.floor(product.avgRating || 0))}</div>
                    <small>${(product.avgRating || 0).toFixed(1)}</small>
                </td>
                <td>${this.formatDate(product.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="adminPanel.editProduct('${product._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="adminPanel.deleteProduct('${product._id}', '${product.name}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    updateCategoryFilter(products) {
        const categoryFilter = document.getElementById('products-category-filter');
        const categories = [...new Set(products.map(p => p.category))];

        // Keep existing options and add new ones
        const existingOptions = Array.from(categoryFilter.options).map(opt => opt.value);
        categories.forEach(category => {
            if (!existingOptions.includes(category)) {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            }
        });
    }

    async loadReviews() {
        try {
            const search = document.getElementById('reviews-search').value;
            const rating = document.getElementById('reviews-rating-filter').value;
            const verified = document.getElementById('reviews-verified-filter').value;
            const page = this.currentPage.reviews;

            const params = new URLSearchParams({
                page,
                limit: this.pageSize,
                ...(search && { search }),
                ...(rating && { rating }),
                ...(verified !== '' && { verified })
            });

            const response = await fetch(`/api/admin/reviews?${params}`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });

            if (!response.ok) throw new Error('Failed to load reviews');

            const data = await response.json();
            this.renderReviewsTable(data.reviews);
            this.renderPagination('reviews', data.currentPage, data.totalPages);
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.showError('Failed to load reviews');
        }
    }

    renderReviewsTable(reviews) {
        const tbody = document.getElementById('reviews-table-body');

        if (!reviews || reviews.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No reviews found</td></tr>';
            return;
        }

        tbody.innerHTML = reviews.map(review => `
            <tr>
                <td>
                    <div class="user-info">
                        <img src="${review.userId?.profilePicture || 'profile photo.svg'}" alt="${review.userId?.firstName}" class="user-avatar">
                        <div class="user-details">
                            <h4>${review.userId?.firstName || 'Unknown'} ${review.userId?.lastName || 'User'}</h4>
                            <p>${review.userId?.email || 'No email'}</p>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="product-info">
                        <img src="${review.productId?.imageUrl || 'placeholder1.jpg'}" alt="${review.productId?.name}" class="product-image">
                        <div class="user-details">
                            <h4>${review.productId?.name || 'Unknown Product'}</h4>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="rating-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                </td>
                <td>
                    <div class="review-content" title="${review.content}">
                        ${this.truncateText(review.content, 50)}
                    </div>
                </td>
                <td><span class="verified-badge verified-${review.verified}">${review.verified ? 'Verified' : 'Unverified'}</span></td>
                <td>${this.formatDate(review.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn verify" onclick="toggleReviewVerification('${review._id}', ${review.verified})" title="${review.verified ? 'Unverify' : 'Verify'} review">
                            <i class="fas fa-${review.verified ? 'times' : 'check'}"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteReview('${review._id}', '${review.productId?.name || 'Unknown Product'}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadAnalytics() {
        try {
            const period = document.getElementById('analytics-period').value;

            const response = await fetch(`/api/admin/analytics?period=${period}`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });

            if (!response.ok) throw new Error('Failed to load analytics');

            const data = await response.json();
            this.renderAnalytics(data);
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError('Failed to load analytics');
        }
    }

    renderAnalytics(data) {
        // Render top categories
        this.renderTopCategories(data.topCategories);

        // For now, we'll show simple charts. In a real implementation,
        // you'd use a charting library like Chart.js
        this.renderSimpleCharts(data);
    }

    renderTopCategories(categories) {
        const container = document.getElementById('top-categories-list');

        if (!categories || categories.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No categories found</p></div>';
            return;
        }

        container.innerHTML = categories.map(category => `
            <div class="category-item">
                <span class="category-name">${category._id}</span>
                <span class="category-count">${category.count}</span>
            </div>
        `).join('');
    }

    renderSimpleCharts(data) {
        // Simple text-based charts for now
        // In a real implementation, you'd use Chart.js or similar

        const userTrendChart = document.getElementById('user-trend-chart');
        const reviewTrendChart = document.getElementById('review-trend-chart');
        const ratingChart = document.getElementById('rating-distribution-chart');

        // Replace canvas with simple text for now
        userTrendChart.style.display = 'none';
        reviewTrendChart.style.display = 'none';
        ratingChart.style.display = 'none';

        // Add simple text representations
        if (!userTrendChart.nextElementSibling?.classList.contains('simple-chart')) {
            const userChartText = document.createElement('div');
            userChartText.className = 'simple-chart';
            userChartText.innerHTML = `<p>User registrations over time: ${data.userTrend?.length || 0} data points</p>`;
            userTrendChart.parentNode.appendChild(userChartText);
        }

        if (!reviewTrendChart.nextElementSibling?.classList.contains('simple-chart')) {
            const reviewChartText = document.createElement('div');
            reviewChartText.className = 'simple-chart';
            reviewChartText.innerHTML = `<p>Review activity over time: ${data.reviewTrend?.length || 0} data points</p>`;
            reviewTrendChart.parentNode.appendChild(reviewChartText);
        }

        if (!ratingChart.nextElementSibling?.classList.contains('simple-chart')) {
            const ratingChartText = document.createElement('div');
            ratingChartText.className = 'simple-chart';
            ratingChartText.innerHTML = data.ratingDistribution?.map(rating =>
                `<p>${rating._id} stars: ${rating.count} reviews</p>`
            ).join('') || '<p>No rating data available</p>';
            ratingChart.parentNode.appendChild(ratingChartText);
        }
    }

    renderPagination(section, currentPage, totalPages) {
        const container = document.getElementById(`${section}-pagination`);

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let pagination = '<button onclick="adminPanel.changePage(\'' + section + '\', 1)" ' +
                        (currentPage === 1 ? 'disabled' : '') + '>First</button>';

        pagination += '<button onclick="adminPanel.changePage(\'' + section + '\', ' + (currentPage - 1) + ')" ' +
                     (currentPage === 1 ? 'disabled' : '') + '>Previous</button>';

        // Show page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            pagination += '<button onclick="adminPanel.changePage(\'' + section + '\', ' + i + ')" ' +
                         (i === currentPage ? 'class="active"' : '') + '>' + i + '</button>';
        }

        pagination += '<button onclick="adminPanel.changePage(\'' + section + '\', ' + (currentPage + 1) + ')" ' +
                     (currentPage === totalPages ? 'disabled' : '') + '>Next</button>';

        pagination += '<button onclick="adminPanel.changePage(\'' + section + '\', ' + totalPages + ')" ' +
                     (currentPage === totalPages ? 'disabled' : '') + '>Last</button>';

        container.innerHTML = pagination;
    }

    changePage(section, page) {
        this.currentPage[section] = page;

        switch (section) {
            case 'users':
                this.loadUsers();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'reviews':
                this.loadReviews();
                break;
            case 'logs':
                this.loadLogs();
                break;
        }
    }

    loadBulkOperations() {
        // Bulk operations section is static, no loading needed
        console.log('Bulk operations section loaded');
    }

    async loadSystemSection() {
        try {
            await Promise.all([
                this.loadSystemHealth(),
                this.loadSystemSettings()
            ]);
        } catch (error) {
            console.error('Error loading system section:', error);
            this.showError('Failed to load system information');
        }
    }

    async loadSystemHealth() {
        try {
            const response = await fetch('/api/admin/health', {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });

            if (!response.ok) throw new Error('Failed to load system health');

            const health = await response.json();
            this.renderSystemHealth(health);
        } catch (error) {
            console.error('Error loading system health:', error);
            document.getElementById('system-health-content').innerHTML =
                '<div class="error-message">Failed to load system health</div>';
        }
    }

    renderSystemHealth(health) {
        const container = document.getElementById('system-health-content');

        container.innerHTML = `
            <div class="health-grid">
                <div class="health-item ${health.status === 'healthy' ? 'healthy' : 'error'}">
                    <h4>System Status</h4>
                    <div class="value">${health.status}</div>
                </div>
                <div class="health-item healthy">
                    <h4>Uptime</h4>
                    <div class="value">${Math.floor(health.uptime / 3600)}<span class="unit">hours</span></div>
                </div>
                <div class="health-item ${health.database?.status === 'connected' ? 'healthy' : 'error'}">
                    <h4>Database</h4>
                    <div class="value">${health.database?.status}</div>
                </div>
                <div class="health-item healthy">
                    <h4>Response Time</h4>
                    <div class="value">${health.database?.responseTime}</div>
                </div>
                <div class="health-item healthy">
                    <h4>Memory Used</h4>
                    <div class="value">${health.memory?.used}<span class="unit">MB</span></div>
                </div>
                <div class="health-item healthy">
                    <h4>Node Version</h4>
                    <div class="value">${health.nodeVersion}</div>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <p><strong>Last Updated:</strong> ${new Date(health.timestamp).toLocaleString()}</p>
                <p><strong>Platform:</strong> ${health.platform}</p>
            </div>
        `;
    }

    async loadSystemSettings() {
        try {
            const response = await fetch('/api/admin/settings', {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });

            if (!response.ok) throw new Error('Failed to load system settings');

            const settings = await response.json();
            this.renderSystemSettings(settings);
        } catch (error) {
            console.error('Error loading system settings:', error);
            document.getElementById('system-settings-content').innerHTML =
                '<div class="error-message">Failed to load system settings</div>';
        }
    }

    renderSystemSettings(settings) {
        const container = document.getElementById('system-settings-content');

        container.innerHTML = `
            <div class="settings-grid">
                ${Object.entries(settings).map(([key, value]) => `
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>${this.formatSettingName(key)}</h4>
                            <p>${this.getSettingDescription(key)}</p>
                        </div>
                        <div class="setting-value ${typeof value === 'boolean' ? 'boolean ' + value : ''}">
                            ${Array.isArray(value) ? value.join(', ') : String(value)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    formatSettingName(key) {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    getSettingDescription(key) {
        const descriptions = {
            siteName: 'The name of the website',
            allowRegistration: 'Whether new users can register',
            requireEmailVerification: 'Whether email verification is required',
            maxReviewsPerUser: 'Maximum reviews per user',
            minPasswordLength: 'Minimum password length',
            sessionTimeout: 'Session timeout in hours',
            maintenanceMode: 'Whether the site is in maintenance mode',
            featuredCategories: 'Featured product categories',
            systemVersion: 'Current system version'
        };
        return descriptions[key] || 'System setting';
    }

    async loadLogs() {
        try {
            const type = document.getElementById('logs-type-filter')?.value || 'all';
            const page = this.currentPage.logs || 1;

            const params = new URLSearchParams({
                page,
                limit: this.pageSize,
                type
            });

            const response = await fetch(`/api/admin/logs?${params}`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });

            if (!response.ok) throw new Error('Failed to load logs');

            const data = await response.json();
            this.renderLogsTable(data.logs);
            this.renderPagination('logs', data.page, data.totalPages);
        } catch (error) {
            console.error('Error loading logs:', error);
            this.showError('Failed to load activity logs');
        }
    }

    renderLogsTable(logs) {
        const tbody = document.getElementById('logs-table-body');

        if (!logs || logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No logs found</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr>
                <td class="timestamp-cell">${this.formatDate(log.timestamp)}</td>
                <td>
                    <span class="log-type-badge log-type-${log.type.replace('_', '-')}">${log.type}</span>
                </td>
                <td>${log.message}</td>
                <td class="id-cell">${log.userId || 'System'}</td>
                <td>${log.ip || 'N/A'}</td>
            </tr>
        `).join('');
    }

    // Utility functions
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    showError(message) {
        // You can implement a toast notification system here
        console.error(message);
        alert(message);
    }

    showSuccess(message) {
        // You can implement a toast notification system here
        console.log(message);
        alert(message);
    }
}

// Initialize admin panel
let adminPanel;

function initializeAdminPanel() {
    adminPanel = new AdminPanel();
}

// Global functions for modal and actions
function showSection(section) {
    if (adminPanel) {
        adminPanel.showSection(section);
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

// User management functions
function editUser(userId, role, isActive) {
    document.getElementById('edit-user-id').value = userId;
    document.getElementById('edit-user-role').value = role;
    document.getElementById('edit-user-status').value = isActive.toString();
    showModal('edit-user-modal');
}

async function saveUser() {
    try {
        const userId = document.getElementById('edit-user-id').value;
        const role = document.getElementById('edit-user-role').value;
        const isActive = document.getElementById('edit-user-status').value === 'true';

        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ role, isActive })
        });

        if (!response.ok) throw new Error('Failed to update user');

        adminPanel.showSuccess('User updated successfully');
        closeModal('edit-user-modal');
        adminPanel.loadUsers();
    } catch (error) {
        console.error('Error updating user:', error);
        adminPanel.showError('Failed to update user');
    }
}

function deleteUser(userId, userName) {
    document.getElementById('confirm-title').textContent = 'Delete User';
    document.getElementById('confirm-message').textContent = `Are you sure you want to delete user "${userName}"? This action cannot be undone.`;

    document.getElementById('confirm-action-btn').onclick = async () => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });

            if (!response.ok) throw new Error('Failed to delete user');

            adminPanel.showSuccess('User deleted successfully');
            closeModal('confirm-modal');
            adminPanel.loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            adminPanel.showError('Failed to delete user');
        }
    };

    showModal('confirm-modal');
}

// Product management functions
async function editProduct(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) throw new Error('Failed to load product');

        const product = await response.json();

        document.getElementById('edit-product-id').value = product._id;
        document.getElementById('edit-product-name').value = product.name;
        document.getElementById('edit-product-description').value = product.description;
        document.getElementById('edit-product-price').value = product.price;
        document.getElementById('edit-product-category').value = product.category;
        document.getElementById('edit-product-image').value = product.imageUrl || '';

        showModal('edit-product-modal');
    } catch (error) {
        console.error('Error loading product:', error);
        adminPanel.showError('Failed to load product details');
    }
}

async function saveProduct() {
    try {
        const productId = document.getElementById('edit-product-id').value;
        const name = document.getElementById('edit-product-name').value;
        const description = document.getElementById('edit-product-description').value;
        const price = parseFloat(document.getElementById('edit-product-price').value);
        const category = document.getElementById('edit-product-category').value;
        const imageUrl = document.getElementById('edit-product-image').value;

        const response = await fetch(`/api/admin/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ name, description, price, category, imageUrl })
        });

        if (!response.ok) throw new Error('Failed to update product');

        adminPanel.showSuccess('Product updated successfully');
        closeModal('edit-product-modal');
        adminPanel.loadProducts();
    } catch (error) {
        console.error('Error updating product:', error);
        adminPanel.showError('Failed to update product');
    }
}

function deleteProduct(productId, productName) {
    document.getElementById('confirm-title').textContent = 'Delete Product';
    document.getElementById('confirm-message').textContent = `Are you sure you want to delete product "${productName}"? This will also delete all associated reviews.`;

    document.getElementById('confirm-action-btn').onclick = async () => {
        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });

            if (!response.ok) throw new Error('Failed to delete product');

            adminPanel.showSuccess('Product deleted successfully');
            closeModal('confirm-modal');
            adminPanel.loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            adminPanel.showError('Failed to delete product');
        }
    };

    showModal('confirm-modal');
}

// Review management functions
async function toggleReviewVerification(reviewId, currentStatus) {
    try {
        const response = await fetch(`/api/admin/reviews/${reviewId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ verified: !currentStatus })
        });

        if (!response.ok) throw new Error('Failed to update review');

        adminPanel.showSuccess('Review updated successfully');
        adminPanel.loadReviews();
    } catch (error) {
        console.error('Error updating review:', error);
        adminPanel.showError('Failed to update review');
    }
}

function deleteReview(reviewId, productName) {
    document.getElementById('confirm-title').textContent = 'Delete Review';
    document.getElementById('confirm-message').textContent = `Are you sure you want to delete this review for "${productName}"?`;

    document.getElementById('confirm-action-btn').onclick = async () => {
        try {
            const response = await fetch(`/api/admin/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });

            if (!response.ok) throw new Error('Failed to delete review');

            adminPanel.showSuccess('Review deleted successfully');
            closeModal('confirm-modal');
            adminPanel.loadReviews();
        } catch (error) {
            console.error('Error deleting review:', error);
            adminPanel.showError('Failed to delete review');
        }
    };

    showModal('confirm-modal');
}

// Bulk Operations Functions
async function executeBulkUserOperation() {
    try {
        const userIds = document.getElementById('bulk-user-ids').value
            .split(',')
            .map(id => id.trim())
            .filter(id => id);

        if (userIds.length === 0) {
            alert('Please enter at least one user ID');
            return;
        }

        const action = document.getElementById('bulk-user-action').value;
        const data = {};

        if (action === 'updateRole') {
            data.role = document.getElementById('bulk-user-role').value;
        }

        const confirmed = confirm(`Are you sure you want to ${action} ${userIds.length} users?`);
        if (!confirmed) return;

        const response = await fetch('/api/admin/bulk/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ action, userIds, data })
        });

        if (!response.ok) throw new Error('Bulk operation failed');

        const result = await response.json();
        adminPanel.showSuccess(result.message);

        // Clear the form
        document.getElementById('bulk-user-ids').value = '';

        // Refresh users if on users section
        if (adminPanel.currentSection === 'users') {
            adminPanel.loadUsers();
        }
    } catch (error) {
        console.error('Bulk user operation error:', error);
        adminPanel.showError('Failed to execute bulk user operation');
    }
}

async function executeBulkProductOperation() {
    try {
        const productIds = document.getElementById('bulk-product-ids').value
            .split(',')
            .map(id => id.trim())
            .filter(id => id);

        if (productIds.length === 0) {
            alert('Please enter at least one product ID');
            return;
        }

        const action = document.getElementById('bulk-product-action').value;
        const data = {};

        if (action === 'updateCategory') {
            data.category = document.getElementById('bulk-product-category').value;
            if (!data.category) {
                alert('Please enter a category');
                return;
            }
        } else if (action === 'updatePrice') {
            data.multiplier = parseFloat(document.getElementById('bulk-product-multiplier').value);
            if (isNaN(data.multiplier) || data.multiplier <= 0) {
                alert('Please enter a valid price multiplier');
                return;
            }
        }

        const confirmed = confirm(`Are you sure you want to ${action} ${productIds.length} products?`);
        if (!confirmed) return;

        const response = await fetch('/api/admin/bulk/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ action, productIds, data })
        });

        if (!response.ok) throw new Error('Bulk operation failed');

        const result = await response.json();
        adminPanel.showSuccess(result.message);

        // Clear the form
        document.getElementById('bulk-product-ids').value = '';

        // Refresh products if on products section
        if (adminPanel.currentSection === 'products') {
            adminPanel.loadProducts();
        }
    } catch (error) {
        console.error('Bulk product operation error:', error);
        adminPanel.showError('Failed to execute bulk product operation');
    }
}

async function executeBulkReviewOperation() {
    try {
        const reviewIds = document.getElementById('bulk-review-ids').value
            .split(',')
            .map(id => id.trim())
            .filter(id => id);

        if (reviewIds.length === 0) {
            alert('Please enter at least one review ID');
            return;
        }

        const action = document.getElementById('bulk-review-action').value;

        const confirmed = confirm(`Are you sure you want to ${action} ${reviewIds.length} reviews?`);
        if (!confirmed) return;

        const response = await fetch('/api/admin/bulk/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ action, reviewIds })
        });

        if (!response.ok) throw new Error('Bulk operation failed');

        const result = await response.json();
        adminPanel.showSuccess(result.message);

        // Clear the form
        document.getElementById('bulk-review-ids').value = '';

        // Refresh reviews if on reviews section
        if (adminPanel.currentSection === 'reviews') {
            adminPanel.loadReviews();
        }
    } catch (error) {
        console.error('Bulk review operation error:', error);
        adminPanel.showError('Failed to execute bulk review operation');
    }
}

// System Functions
async function refreshSystemHealth() {
    if (adminPanel) {
        await adminPanel.loadSystemHealth();
    }
}

async function exportData(type, format) {
    try {
        const response = await fetch(`/api/admin/export/${type}?format=${format}`, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        adminPanel.showSuccess(`${type} data exported successfully`);
    } catch (error) {
        console.error('Export error:', error);
        adminPanel.showError(`Failed to export ${type} data`);
    }
}
