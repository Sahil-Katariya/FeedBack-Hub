class ProductsCatalog {
  constructor() {
    this.products = [];
    this.filteredProducts = [];
    this.currentPage = 1;
    this.productsPerPage = 12;
    this.isListView = false;
    this.init();
  }

  async init() {
    try {
      await this.loadProducts();
      this.setupEventListeners();
      this.renderProducts();
      this.updateProductsCount();
    } catch (error) {
      console.error('Error initializing products catalog:', error);
      this.showError('Failed to load products. Please try again later.');
    }
  }

  async loadProducts() {
    try {
      // Try to load from API first
      const response = await fetch('http://localhost:5000/api/products');
      if (response.ok) {
        this.products = await response.json();
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      console.log('API not available, using sample data');
      // Fallback to sample data
      this.products = this.getSampleProducts();
    }
    
    this.filteredProducts = [...this.products];
  }

  getSampleProducts() {
    return [
      {
        _id: '1',
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with advanced camera system and A17 Pro chip for professional photography and gaming.',
        price: 999.99,
        category: 'Electronics',
        imageUrl: 'placeholder1.jpg',
        rating: 4.8,
        reviewCount: 1250,
        isNew: true
      },
      {
        _id: '2',
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Premium Android smartphone with S Pen, exceptional camera, and powerful performance.',
        price: 1199.99,
        category: 'Electronics',
        imageUrl: 'placeholder2.jpg',
        rating: 4.7,
        reviewCount: 890,
        isNew: true
      },
      {
        _id: '3',
        name: 'MacBook Air M3',
        description: 'Ultra-thin laptop with M3 chip, all-day battery life, and stunning Retina display.',
        price: 1299.99,
        category: 'Electronics',
        imageUrl: 'placeholder3.jpg',
        rating: 4.9,
        reviewCount: 2100,
        isNew: false
      },
      {
        _id: '4',
        name: 'Sony WH-1000XM5',
        description: 'Industry-leading noise canceling headphones with exceptional sound quality.',
        price: 399.99,
        category: 'Electronics',
        imageUrl: 'placeholder4.jpg',
        rating: 4.6,
        reviewCount: 1580,
        isNew: false
      },
      {
        _id: '5',
        name: 'Nike Air Max 270',
        description: 'Comfortable running shoes with Max Air cushioning and modern design.',
        price: 149.99,
        category: 'Fashion',
        imageUrl: 'placeholder5.jpg',
        rating: 4.4,
        reviewCount: 750,
        isNew: false
      },
      {
        _id: '6',
        name: 'Instant Pot Duo 7-in-1',
        description: 'Multi-functional pressure cooker that replaces 7 kitchen appliances.',
        price: 89.99,
        category: 'Home & Garden',
        imageUrl: 'placeholder6.jpg',
        rating: 4.5,
        reviewCount: 3200,
        isNew: false
      },
      {
        _id: '7',
        name: 'Fitbit Charge 6',
        description: 'Advanced fitness tracker with GPS, heart rate monitoring, and health insights.',
        price: 199.99,
        category: 'Health',
        imageUrl: 'placeholder7.jpg',
        rating: 4.3,
        reviewCount: 920,
        isNew: true
      },
      {
        _id: '8',
        name: 'The Psychology of Money',
        description: 'Bestselling book about the psychology behind financial decisions and wealth building.',
        price: 16.99,
        category: 'Books',
        imageUrl: 'placeholder8.jpg',
        rating: 4.7,
        reviewCount: 4500,
        isNew: false
      },
      {
        _id: '9',
        name: 'Yeti Rambler Tumbler',
        description: 'Insulated stainless steel tumbler that keeps drinks hot or cold for hours.',
        price: 34.99,
        category: 'Home & Garden',
        imageUrl: 'placeholder9.jpg',
        rating: 4.8,
        reviewCount: 1100,
        isNew: false
      },
      {
        _id: '10',
        name: 'Wilson Tennis Racket',
        description: 'Professional-grade tennis racket with excellent control and power.',
        price: 179.99,
        category: 'Sports',
        imageUrl: 'placeholder10.jpg',
        rating: 4.5,
        reviewCount: 340,
        isNew: false
      },
      {
        _id: '11',
        name: 'Kindle Paperwhite',
        description: 'Waterproof e-reader with high-resolution display and adjustable warm light.',
        price: 139.99,
        category: 'Electronics',
        imageUrl: 'placeholder1.jpg',
        rating: 4.6,
        reviewCount: 2800,
        isNew: false
      },
      {
        _id: '12',
        name: 'Levi\'s 501 Original Jeans',
        description: 'Classic straight-leg jeans with authentic fit and timeless style.',
        price: 69.99,
        category: 'Fashion',
        imageUrl: 'placeholder2.jpg',
        rating: 4.2,
        reviewCount: 1900,
        isNew: false
      }
    ];
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('product-search');
    const searchBtn = document.getElementById('search-btn');
    
    searchInput.addEventListener('input', () => {
      this.debounce(() => this.filterProducts(), 300)();
    });
    
    searchBtn.addEventListener('click', () => {
      this.filterProducts();
    });

    // Filter controls
    document.getElementById('category-filter').addEventListener('change', () => {
      this.filterProducts();
    });
    
    document.getElementById('price-filter').addEventListener('change', () => {
      this.filterProducts();
    });
    
    document.getElementById('rating-filter').addEventListener('change', () => {
      this.filterProducts();
    });
    
    document.getElementById('sort-by').addEventListener('change', () => {
      this.sortProducts();
    });

    // View toggle
    document.getElementById('view-toggle').addEventListener('click', () => {
      this.toggleView();
    });

    // Load more products
    document.getElementById('load-more-products').addEventListener('click', () => {
      this.loadMoreProducts();
    });
  }

  filterProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const priceFilter = document.getElementById('price-filter').value;
    const ratingFilter = document.getElementById('rating-filter').value;

    this.filteredProducts = this.products.filter(product => {
      // Search filter
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm);

      // Category filter
      const matchesCategory = !categoryFilter || product.category === categoryFilter;

      // Price filter
      let matchesPrice = true;
      if (priceFilter) {
        const price = product.price;
        switch (priceFilter) {
          case '0-50':
            matchesPrice = price <= 50;
            break;
          case '50-100':
            matchesPrice = price > 50 && price <= 100;
            break;
          case '100-200':
            matchesPrice = price > 100 && price <= 200;
            break;
          case '200-500':
            matchesPrice = price > 200 && price <= 500;
            break;
          case '500+':
            matchesPrice = price > 500;
            break;
        }
      }

      // Rating filter
      let matchesRating = true;
      if (ratingFilter) {
        const minRating = parseFloat(ratingFilter.replace('+', ''));
        matchesRating = product.rating >= minRating;
      }

      return matchesSearch && matchesCategory && matchesPrice && matchesRating;
    });

    this.currentPage = 1;
    this.sortProducts();
    this.renderProducts();
    this.updateProductsCount();
  }

  sortProducts() {
    const sortBy = document.getElementById('sort-by').value;
    
    this.filteredProducts.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return b.isNew - a.isNew;
        default:
          return 0;
      }
    });

    this.renderProducts();
  }

  renderProducts() {
    const container = document.getElementById('products-grid');
    const productsToShow = this.filteredProducts.slice(0, this.currentPage * this.productsPerPage);

    if (productsToShow.length === 0) {
      container.innerHTML = `
        <div class="loading-products">
          <p class="body-large">No products found matching your criteria.</p>
          <button class="button-outline" onclick="location.reload()">
            <span class="body-small">Reset Filters</span>
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = productsToShow.map(product => this.createProductCard(product)).join('');

    // Update load more button visibility
    const loadMoreBtn = document.getElementById('load-more-products');
    if (productsToShow.length >= this.filteredProducts.length) {
      loadMoreBtn.style.display = 'none';
    } else {
      loadMoreBtn.style.display = 'block';
    }

    // Add click event listeners to product cards
    this.addProductCardListeners();
  }

  createProductCard(product) {
    const stars = this.generateStars(product.rating);
    const badge = product.isNew ? '<div class="product-badge">New</div>' : '';
    
    return `
      <div class="product-card" data-product-id="${product._id}">
        <div class="product-image-container">
          <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
          ${badge}
        </div>
        <div class="product-info">
          <div class="product-category">${product.category}</div>
          <h3 class="product-name">${product.name}</h3>
          <p class="product-description">${product.description}</p>
          <div class="product-meta">
            <span class="product-price">$${product.price.toFixed(2)}</span>
            <div class="product-rating">
              <span class="rating-stars">${stars}</span>
              <span class="rating-count">(${product.reviewCount})</span>
            </div>
          </div>
          <div class="product-actions">
            <button class="btn-view" onclick="window.location.href='product.html?id=${product._id}'">
              View Details
            </button>
            <button class="btn-favorite" title="Add to Favorites">
              ♡
            </button>
          </div>
        </div>
      </div>
    `;
  }

  generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  }

  addProductCardListeners() {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't navigate if clicking on buttons
        if (e.target.tagName === 'BUTTON') return;
        
        const productId = card.dataset.productId;
        window.location.href = `product.html?id=${productId}`;
      });
    });

    // Favorite button functionality
    const favoriteButtons = document.querySelectorAll('.btn-favorite');
    favoriteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFavorite(btn);
      });
    });
  }

  toggleFavorite(button) {
    if (button.textContent === '♡') {
      button.textContent = '♥';
      button.style.color = '#e74c3c';
      button.title = 'Remove from Favorites';
    } else {
      button.textContent = '♡';
      button.style.color = '';
      button.title = 'Add to Favorites';
    }
  }

  toggleView() {
    const grid = document.getElementById('products-grid');
    const toggleBtn = document.getElementById('view-toggle');
    
    this.isListView = !this.isListView;
    
    if (this.isListView) {
      grid.classList.add('list-view');
      toggleBtn.querySelector('.view-text').textContent = 'Grid View';
    } else {
      grid.classList.remove('list-view');
      toggleBtn.querySelector('.view-text').textContent = 'List View';
    }
  }

  loadMoreProducts() {
    this.currentPage++;
    this.renderProducts();
  }

  updateProductsCount() {
    const countElement = document.getElementById('products-count');
    const total = this.filteredProducts.length;
    const showing = Math.min(this.currentPage * this.productsPerPage, total);
    
    countElement.textContent = `Showing ${showing} of ${total} products`;
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
    const container = document.getElementById('products-grid');
    container.innerHTML = `
      <div class="loading-products">
        <p class="body-large" style="color: #e74c3c;">${message}</p>
        <button class="button-outline" onclick="location.reload()">
          <span class="body-small">Try Again</span>
        </button>
      </div>
    `;
  }
}

// Initialize products catalog when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ProductsCatalog();
});
