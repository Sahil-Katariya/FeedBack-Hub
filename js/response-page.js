class ResponsePage {
  constructor() {
    this.products = [];
    this.currentProduct = null;
    this.chatHistory = [];
    this.communityMessages = [];
    this.aiResponses = 0;
    this.userReviews = 0;
    this.anonymousUsername = this.generateAnonymousUsername();
    this.onlineUsers = 12;
    this.init();
  }

  async init() {
    try {
      await this.loadProducts();
      this.setupEventListeners();
      this.renderProducts();
      this.initializeCommunityChat();
      this.startCommunitySimulation();
    } catch (error) {
      console.error('Error initializing response page:', error);
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
  }

  getSampleProducts() {
    return [
      {
        _id: '1',
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with advanced camera system',
        price: 999.99,
        category: 'Electronics',
        imageUrl: 'placeholder1.jpg',
        rating: 4.8,
        reviewCount: 1250
      },
      {
        _id: '2',
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Premium Android smartphone with S Pen',
        price: 1199.99,
        category: 'Electronics',
        imageUrl: 'placeholder2.jpg',
        rating: 4.7,
        reviewCount: 890
      },
      {
        _id: '3',
        name: 'MacBook Air M3',
        description: 'Ultra-thin laptop with M3 chip',
        price: 1299.99,
        category: 'Electronics',
        imageUrl: 'placeholder3.jpg',
        rating: 4.9,
        reviewCount: 2100
      },
      {
        _id: '4',
        name: 'Sony WH-1000XM5',
        description: 'Industry-leading noise canceling headphones',
        price: 399.99,
        category: 'Electronics',
        imageUrl: 'placeholder4.jpg',
        rating: 4.6,
        reviewCount: 1580
      },
      {
        _id: '5',
        name: 'Nike Air Max 270',
        description: 'Comfortable running shoes with Max Air',
        price: 149.99,
        category: 'Fashion',
        imageUrl: 'placeholder5.jpg',
        rating: 4.4,
        reviewCount: 750
      },
      {
        _id: '6',
        name: 'Instant Pot Duo 7-in-1',
        description: 'Multi-functional pressure cooker',
        price: 89.99,
        category: 'Home & Garden',
        imageUrl: 'placeholder6.jpg',
        rating: 4.5,
        reviewCount: 3200
      }
    ];
  }

  setupEventListeners() {
    // Product search
    const productSearch = document.getElementById('product-search');
    productSearch.addEventListener('input', () => {
      this.debounce(() => this.filterProducts(), 300)();
    });

    // Chat input
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    sendBtn.addEventListener('click', () => {
      this.sendMessage();
    });

    // Community chat input
    const communityInput = document.getElementById('community-input');
    const communitySendBtn = document.getElementById('community-send-btn');

    communityInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendCommunityMessage();
      }
    });

    communitySendBtn.addEventListener('click', () => {
      this.sendCommunityMessage();
    });

    // Chat tabs
    document.getElementById('summary-tab').addEventListener('click', () => {
      this.switchTab('summary');
    });

    document.getElementById('community-tab').addEventListener('click', () => {
      this.switchTab('community');
    });

    // Floating action buttons
    document.getElementById('clear-chat-btn').addEventListener('click', () => {
      this.clearChat();
    });

    document.getElementById('export-chat-btn').addEventListener('click', () => {
      this.exportChat();
    });

    document.getElementById('toggle-panel-btn').addEventListener('click', () => {
      this.togglePanel();
    });

    document.getElementById('join-community-btn').addEventListener('click', () => {
      this.joinCommunityChat();
    });

    // Close panel
    document.getElementById('close-panel').addEventListener('click', () => {
      this.closePanel();
    });

    // Change username
    document.getElementById('change-username-btn').addEventListener('click', () => {
      this.changeAnonymousUsername();
    });

    // Chat option buttons
    document.getElementById('ask-ai-btn').addEventListener('click', () => {
      this.askAIInCommunity();
    });

    document.getElementById('share-opinion-btn').addEventListener('click', () => {
      this.shareOpinion();
    });

    document.getElementById('ask-community-btn').addEventListener('click', () => {
      this.askCommunity();
    });
  }

  renderProducts() {
    const container = document.getElementById('products-list');
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    
    const filteredProducts = this.products.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );

    if (filteredProducts.length === 0) {
      container.innerHTML = `
        <div class="loading-products">
          <p>No products found</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredProducts.map(product => `
      <div class="product-item" data-product-id="${product._id}">
        <img src="${product.imageUrl}" alt="${product.name}" class="product-item-img">
        <div class="product-item-info">
          <h4>${product.name}</h4>
          <p>${product.category} • $${product.price.toFixed(2)}</p>
        </div>
      </div>
    `).join('');

    // Add click listeners
    container.querySelectorAll('.product-item').forEach(item => {
      item.addEventListener('click', () => {
        const productId = item.dataset.productId;
        this.selectProduct(productId);
      });
    });
  }

  filterProducts() {
    this.renderProducts();
  }

  selectProduct(productId) {
    this.currentProduct = this.products.find(p => p._id === productId);
    if (!this.currentProduct) return;

    // Update active product in sidebar
    document.querySelectorAll('.product-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-product-id="${productId}"]`).classList.add('active');

    // Update chat header
    this.updateChatHeader();
    
    // Clear previous chat and start new conversation
    this.clearChat();
    this.startConversation();
    
    // Show chat input
    document.getElementById('chat-input-container').style.display = 'block';
  }

  updateChatHeader() {
    const chatWelcome = document.getElementById('chat-welcome');
    const chatProductInfo = document.querySelector('.chat-product-info');
    
    chatWelcome.style.display = 'none';
    chatProductInfo.style.display = 'flex';
    
    document.getElementById('chat-product-image').src = this.currentProduct.imageUrl;
    document.getElementById('chat-product-name').textContent = this.currentProduct.name;
    document.getElementById('chat-product-category').textContent = 
      `${this.currentProduct.category} • $${this.currentProduct.price.toFixed(2)}`;
  }

  startConversation() {
    const welcomeMessage = {
      type: 'ai',
      content: `Hi! I'm your AI assistant for ${this.currentProduct.name}. I can help you with detailed information, reviews analysis, comparisons, and answer any questions you have about this product. What would you like to know?`,
      timestamp: new Date()
    };

    this.addMessage(welcomeMessage);
    this.showQuickQuestions();
    this.aiResponses++;
    this.updateSummaryStats();
  }

  showQuickQuestions() {
    const quickQuestions = [
      'What are the pros and cons?',
      'How does it compare to competitors?',
      'What do reviews say about quality?',
      'Is it worth the price?',
      'What are common issues?'
    ];

    const container = document.getElementById('quick-questions');
    container.innerHTML = quickQuestions.map(question => `
      <button class="quick-question-btn" data-question="${question}">
        ${question}
      </button>
    `).join('');

    // Add click listeners
    container.querySelectorAll('.quick-question-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const question = btn.dataset.question;
        this.sendQuickQuestion(question);
      });
    });
  }

  sendQuickQuestion(question) {
    // Add user message
    const userMessage = {
      type: 'user',
      content: question,
      timestamp: new Date()
    };
    this.addMessage(userMessage);

    // Generate AI response
    setTimeout(() => {
      this.generateAIResponse(question);
    }, 1000);
  }

  sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message || !this.currentProduct) return;

    // Add user message
    const userMessage = {
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    this.addMessage(userMessage);
    
    // Clear input
    input.value = '';
    
    // Show typing indicator and generate response
    this.showTypingIndicator();
    setTimeout(() => {
      this.generateAIResponse(message);
    }, 1500);
  }

  addMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageElement = this.createMessageElement(message);
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    this.chatHistory.push(message);
  }

  createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.type}`;
    
    const avatar = message.type === 'ai' ? '🤖' : 'U';
    const time = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <p class="message-text">${message.content}</p>
        <div class="message-time">${time}</div>
        ${message.type === 'ai' ? this.getMessageActions() : ''}
      </div>
    `;

    return messageDiv;
  }

  getMessageActions() {
    return `
      <div class="message-actions">
        <button class="action-btn" onclick="this.closest('.message').querySelector('.message-text').style.fontSize = '0.9rem'">👍</button>
        <button class="action-btn" onclick="this.closest('.message').querySelector('.message-text').style.fontSize = '0.9rem'">👎</button>
        <button class="action-btn" onclick="navigator.clipboard.writeText(this.closest('.message').querySelector('.message-text').textContent)">📋</button>
      </div>
    `;
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  generateAIResponse(userMessage) {
    this.removeTypingIndicator();
    
    const responses = this.getAIResponses(userMessage);
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    const aiMessage = {
      type: 'ai',
      content: response,
      timestamp: new Date()
    };
    
    this.addMessage(aiMessage);
    this.aiResponses++;
    this.updateSummaryStats();
  }

  getAIResponses(userMessage) {
    const product = this.currentProduct;
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('pros') || lowerMessage.includes('cons')) {
      return [
        `Based on aggregated reviews for ${product.name}:\n\n Pros: \n• Excellent build quality and premium materials\n• Outstanding performance for the price range\n• Great user experience and intuitive interface\n• Strong battery life and fast charging\n\n Cons: \n• Higher price point compared to competitors\n• Limited color options available\n• Some users report minor software quirks\n• Accessories sold separately`
      ];
    }
    
    if (lowerMessage.includes('compare') || lowerMessage.includes('competitor')) {
      return [
        `${product.name} stands out in several key areas:\n\n vs Competitors: \n• Superior build quality and materials\n• Better performance benchmarks\n• More comprehensive feature set\n• Higher customer satisfaction ratings (${product.rating}/5)\n\n Price Comparison: \nAt $${product.price}, it's positioned as a premium option but offers excellent value for the features provided. Most competitors in this range lack some of the advanced features included here.`
      ];
    }
    
    if (lowerMessage.includes('quality') || lowerMessage.includes('review')) {
      return [
        `Review analysis for ${product.name} (${product.reviewCount} reviews):\n\n Quality Highlights: \n• 89% of users rate build quality as "Excellent"\n• Durability tests show above-average performance\n• Materials feel premium and well-constructed\n• Quality control appears consistent across units\n\n Common Praise: \n• "Feels solid and well-made"\n• "Attention to detail is impressive"\n• "Worth the investment for the quality"`
      ];
    }
    
    if (lowerMessage.includes('price') || lowerMessage.includes('worth')) {
      return [
        `Price Analysis for ${product.name}:\n\n Value Assessment: \n• Current price: $${product.price}\n• Market average for similar products: $${(product.price * 0.85).toFixed(2)}\n• Price-to-feature ratio: Excellent\n\n Is it worth it? \nBased on user feedback and feature comparison, 87% of buyers say "yes" - the premium price is justified by the quality, features, and long-term reliability. Consider it an investment rather than just a purchase.`
      ];
    }
    
    if (lowerMessage.includes('issue') || lowerMessage.includes('problem')) {
      return [
        `Common Issues Analysis for ${product.name}:\n\n Reported Issues (frequency): \n• Minor software glitches (8% of users)\n• Initial setup complexity (5% of users)\n• Compatibility with older accessories (3% of users)\n\n Solutions Available: \n• Most software issues resolved with updates\n• Setup guides and video tutorials available\n• Adapter options for compatibility\n\n Overall Reliability:  94% issue-free experience rate`
      ];
    }
    
    // Default responses
    return [
      `Great question about ${product.name}! Based on ${product.reviewCount} user reviews and expert analysis, this product has earned a ${product.rating}/5 rating. The consensus is that it offers excellent value in the ${product.category} category. Users particularly appreciate its reliability and performance. Would you like me to dive deeper into any specific aspect?`,
      
      `${product.name} is highly regarded in the ${product.category} space. At $${product.price}, it's positioned as a premium option that delivers on its promises. The ${product.reviewCount} reviews show consistent satisfaction with quality and performance. What specific features are you most interested in learning about?`,
      
      `From analyzing user feedback and expert reviews, ${product.name} stands out for its build quality and user experience. The ${product.rating}/5 rating reflects strong customer satisfaction. Most users report that it meets or exceeds their expectations. Is there a particular use case or feature you'd like me to focus on?`
    ];
  }

  clearChat() {
    document.getElementById('chat-messages').innerHTML = '';
    this.chatHistory = [];
    this.aiResponses = 0;
    this.userReviews = 0;
    this.updateSummaryStats();
  }

  exportChat() {
    if (this.chatHistory.length === 0) {
      alert('No chat history to export');
      return;
    }

    const chatText = this.chatHistory.map(msg => 
      `[${msg.timestamp.toLocaleString()}] ${msg.type.toUpperCase()}: ${msg.content}`
    ).join('\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${this.currentProduct?.name || 'conversation'}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  toggleSummary() {
    const summary = document.getElementById('response-summary');
    if (summary.style.display === 'none' || !summary.style.display) {
      summary.style.display = 'flex';
      this.updateSummaryInsights();
    } else {
      summary.style.display = 'none';
    }
  }

  closeSummary() {
    document.getElementById('response-summary').style.display = 'none';
  }

  updateSummaryStats() {
    document.getElementById('ai-responses-count').textContent = this.aiResponses;
    document.getElementById('user-reviews-count').textContent = this.userReviews;
    document.getElementById('summary-avg-rating').textContent = 
      this.currentProduct ? this.currentProduct.rating.toFixed(1) : '0.0';
  }

  updateSummaryInsights() {
    const insights = document.getElementById('summary-insights');
    if (!this.currentProduct) {
      insights.innerHTML = '<p>Select a product to see insights</p>';
      return;
    }

    insights.innerHTML = `
      <h4>Key Insights</h4>
      <ul>
        <li>High customer satisfaction (${this.currentProduct.rating}/5)</li>
        <li>${this.currentProduct.reviewCount} verified reviews</li>
        <li>Premium ${this.currentProduct.category} product</li>
        <li>Strong value proposition at $${this.currentProduct.price}</li>
      </ul>
    `;
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
    const container = document.getElementById('products-list');
    container.innerHTML = `
      <div class="loading-products">
        <p style="color: #e74c3c;">${message}</p>
        <button class="button-outline" onclick="location.reload()">
          Try Again
        </button>
      </div>
    `;
  }

  // Community Chat Methods
  generateAnonymousUsername() {
    const adjectives = ['Cool', 'Smart', 'Quick', 'Bright', 'Sharp', 'Swift', 'Bold', 'Wise', 'Kind', 'Calm'];
    const nouns = ['User', 'Reviewer', 'Buyer', 'Expert', 'Critic', 'Fan', 'Shopper', 'Guide', 'Helper', 'Advisor'];
    const numbers = Math.floor(Math.random() * 999) + 1;

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${adjective}_${noun}_${numbers}`;
  }

  initializeCommunityChat() {
    document.getElementById('anonymous-username').textContent = this.anonymousUsername;
    document.getElementById('online-users-count').textContent = this.onlineUsers;

    // Add some initial community messages
    this.addInitialCommunityMessages();
  }

  addInitialCommunityMessages() {
    const initialMessages = [
      {
        type: 'user',
        username: 'Tech_Guru_456',
        content: 'Has anyone tried the new iPhone 15 Pro? Thinking about upgrading from my 13.',
        timestamp: new Date(Date.now() - 300000) // 5 minutes ago
      },
      {
        type: 'ai',
        username: 'AI Assistant',
        content: 'The iPhone 15 Pro offers significant improvements in camera quality and performance. Based on user reviews, 89% of upgraders from iPhone 13 are satisfied with the upgrade.',
        timestamp: new Date(Date.now() - 240000) // 4 minutes ago
      },
      {
        type: 'user',
        username: 'Budget_Shopper_789',
        content: 'What about the price though? Is it worth the extra cost?',
        timestamp: new Date(Date.now() - 180000) // 3 minutes ago
      }
    ];

    initialMessages.forEach(msg => {
      this.communityMessages.push(msg);
    });

    this.renderCommunityMessages();
  }

  startCommunitySimulation() {
    // Simulate other users joining and chatting
    setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every 30 seconds
        this.simulateUserMessage();
      }
    }, 30000);

    // Update online users count occasionally
    setInterval(() => {
      this.onlineUsers = Math.floor(Math.random() * 20) + 8; // 8-28 users
      document.getElementById('online-users-count').textContent = this.onlineUsers;
    }, 60000);
  }

  simulateUserMessage() {
    const simulatedUsers = [
      'Product_Expert_123', 'Deal_Hunter_456', 'Tech_Lover_789',
      'Smart_Buyer_321', 'Review_Reader_654', 'Gadget_Fan_987'
    ];

    const simulatedMessages = [
      'Just got this product and loving it so far!',
      'Anyone know if there are any deals coming up?',
      'The reviews on this are really mixed, what do you think?',
      'Compared to the competition, this seems like a solid choice.',
      'Has anyone had any issues with durability?',
      'The AI recommendations here are pretty helpful!',
      'Worth waiting for the next version or buy now?',
      'Customer service experience has been great with this brand.'
    ];

    const username = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
    const content = simulatedMessages[Math.floor(Math.random() * simulatedMessages.length)];

    const message = {
      type: 'user',
      username: username,
      content: content,
      timestamp: new Date()
    };

    this.communityMessages.push(message);
    this.renderCommunityMessages();

    // Sometimes AI responds to simulated messages
    if (Math.random() < 0.4) {
      setTimeout(() => {
        this.generateAICommunityResponse(content);
      }, 2000 + Math.random() * 3000);
    }
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.chat-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-content`).classList.add('active');
  }

  sendCommunityMessage() {
    const input = document.getElementById('community-input');
    const message = input.value.trim();

    if (!message) return;

    const communityMessage = {
      type: 'own',
      username: this.anonymousUsername,
      content: message,
      timestamp: new Date()
    };

    this.communityMessages.push(communityMessage);
    this.renderCommunityMessages();

    input.value = '';

    // Sometimes trigger AI response
    if (message.includes('?') || message.toLowerCase().includes('ai') || Math.random() < 0.3) {
      setTimeout(() => {
        this.generateAICommunityResponse(message);
      }, 1000 + Math.random() * 2000);
    }
  }

  generateAICommunityResponse(userMessage) {
    const aiResponses = [
      'Based on the reviews I\'ve analyzed, that\'s a great question! Most users report positive experiences with that aspect.',
      'I can help with that! From aggregated data, here\'s what users typically experience...',
      'That\'s a common concern. Looking at user feedback, about 85% of buyers are satisfied with that feature.',
      'Great point! The data shows mixed opinions on that, but the majority lean positive.',
      'I\'ve processed thousands of reviews on this topic. The consensus seems to be quite favorable.',
      'Interesting question! Based on price comparisons and user satisfaction, it offers good value.',
      'From what I can see in the review data, that\'s definitely worth considering before purchasing.'
    ];

    const response = aiResponses[Math.floor(Math.random() * aiResponses.length)];

    const aiMessage = {
      type: 'ai',
      username: 'AI Assistant',
      content: response,
      timestamp: new Date()
    };

    this.communityMessages.push(aiMessage);
    this.renderCommunityMessages();
  }

  renderCommunityMessages() {
    const container = document.getElementById('community-messages');

    container.innerHTML = this.communityMessages.map(msg => {
      const time = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const avatarText = msg.type === 'ai' ? '🤖' : msg.username.charAt(0).toUpperCase();

      return `
        <div class="community-message ${msg.type}">
          <div class="community-avatar ${msg.type}">${avatarText}</div>
          <div class="community-message-content">
            <p class="community-message-text">${msg.content}</p>
            <div class="community-message-meta">
              <span class="community-username">${msg.username}</span>
              <span class="community-time">${time}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.scrollTop = container.scrollHeight;
  }

  changeAnonymousUsername() {
    this.anonymousUsername = this.generateAnonymousUsername();
    document.getElementById('anonymous-username').textContent = this.anonymousUsername;
  }

  askAIInCommunity() {
    const input = document.getElementById('community-input');
    input.value = '🤖 AI, what do you think about ';
    input.focus();
  }

  shareOpinion() {
    const input = document.getElementById('community-input');
    input.value = '💭 In my opinion, ';
    input.focus();
  }

  askCommunity() {
    const input = document.getElementById('community-input');
    input.value = '❓ Has anyone here ';
    input.focus();
  }

  joinCommunityChat() {
    this.switchTab('community');
    document.getElementById('anonymous-chat-panel').style.display = 'flex';

    // Add join message
    const joinMessage = {
      type: 'ai',
      username: 'System',
      content: `${this.anonymousUsername} joined the community chat! 👋`,
      timestamp: new Date()
    };

    this.communityMessages.push(joinMessage);
    this.renderCommunityMessages();
  }

  togglePanel() {
    const panel = document.getElementById('anonymous-chat-panel');
    if (panel.style.display === 'none' || !panel.style.display) {
      panel.style.display = 'flex';
      this.updateSummaryInsights();
    } else {
      panel.style.display = 'none';
    }
  }

  closePanel() {
    document.getElementById('anonymous-chat-panel').style.display = 'none';
  }

  // Update existing methods
  toggleSummary() {
    this.togglePanel();
  }

  closeSummary() {
    this.closePanel();
  }
}

// Initialize response page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ResponsePage();
});
