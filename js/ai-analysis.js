class AIReviewAnalyzer {
  constructor() {
    this.positiveWords = [
      'excellent', 'amazing', 'great', 'good', 'fantastic', 'wonderful', 'awesome', 'perfect',
      'outstanding', 'superb', 'brilliant', 'impressive', 'love', 'recommend', 'satisfied',
      'happy', 'pleased', 'quality', 'durable', 'reliable', 'fast', 'smooth', 'easy',
      'comfortable', 'stylish', 'beautiful', 'worth', 'value', 'affordable', 'cheap'
    ];
    
    this.negativeWords = [
      'terrible', 'awful', 'bad', 'horrible', 'disappointing', 'poor', 'worst', 'hate',
      'broken', 'defective', 'useless', 'waste', 'expensive', 'overpriced', 'slow',
      'difficult', 'hard', 'complicated', 'uncomfortable', 'ugly', 'cheap', 'flimsy',
      'fragile', 'unreliable', 'problem', 'issue', 'fault', 'error', 'fail', 'regret'
    ];
    
    this.aspectKeywords = {
      'build-quality': ['build', 'quality', 'construction', 'material', 'durable', 'solid', 'sturdy', 'cheap', 'flimsy'],
      'performance': ['performance', 'speed', 'fast', 'slow', 'efficient', 'responsive', 'lag', 'smooth'],
      'battery-life': ['battery', 'charge', 'power', 'lasting', 'drain', 'life', 'hours', 'usage'],
      'price-value': ['price', 'value', 'money', 'worth', 'expensive', 'cheap', 'affordable', 'cost'],
      'ease-of-use': ['easy', 'difficult', 'simple', 'complex', 'user-friendly', 'intuitive', 'confusing']
    };
  }

  analyzeReviews(reviews) {
    if (!reviews || reviews.length === 0) {
      return this.getEmptyAnalysis();
    }

    const analysis = {
      summary: this.generateSummary(reviews),
      pros: this.extractPros(reviews),
      cons: this.extractCons(reviews),
      sentiment: this.analyzeSentiment(reviews),
      ratings: this.analyzeRatings(reviews),
      aspects: this.analyzeAspects(reviews)
    };

    return analysis;
  }

  generateSummary(reviews) {
    const totalReviews = reviews.length;
    const avgRating = this.calculateAverageRating(reviews);
    const sentiment = this.analyzeSentiment(reviews);
    
    // Extract common themes
    const allText = reviews.map(r => r.content.toLowerCase()).join(' ');
    const commonPositives = this.positiveWords.filter(word => 
      allText.includes(word)
    ).slice(0, 3);
    const commonNegatives = this.negativeWords.filter(word => 
      allText.includes(word)
    ).slice(0, 3);

    let summary = `Based on ${totalReviews} reviews, this product has an average rating of ${avgRating.toFixed(1)} out of 5 stars. `;
    
    if (sentiment.positive > 60) {
      summary += `Users are generally very satisfied with the product. `;
    } else if (sentiment.positive > 40) {
      summary += `Users have mixed but generally positive opinions about the product. `;
    } else {
      summary += `Users have expressed significant concerns about the product. `;
    }

    if (commonPositives.length > 0) {
      summary += `Commonly praised aspects include ${commonPositives.join(', ')}. `;
    }

    if (commonNegatives.length > 0) {
      summary += `Main concerns mentioned are related to ${commonNegatives.join(', ')}. `;
    }

    summary += `Overall, ${sentiment.positive}% of reviews are positive, making this a ${sentiment.positive > 70 ? 'highly recommended' : sentiment.positive > 50 ? 'generally recommended' : 'mixed reception'} product.`;

    return summary;
  }

  extractPros(reviews) {
    const pros = [];
    const prosMap = new Map();

    reviews.forEach(review => {
      const text = review.content.toLowerCase();
      
      // Look for positive patterns
      this.positiveWords.forEach(word => {
        if (text.includes(word)) {
          const context = this.extractContext(text, word);
          if (context) {
            const key = this.normalizeProCon(context);
            prosMap.set(key, (prosMap.get(key) || 0) + 1);
          }
        }
      });
    });

    // Sort by frequency and take top pros
    const sortedPros = Array.from(prosMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pro, count]) => `${pro} (mentioned ${count} times)`);

    return sortedPros.length > 0 ? sortedPros : ['High user satisfaction', 'Good overall quality', 'Meets expectations'];
  }

  extractCons(reviews) {
    const cons = [];
    const consMap = new Map();

    reviews.forEach(review => {
      const text = review.content.toLowerCase();
      
      // Look for negative patterns
      this.negativeWords.forEach(word => {
        if (text.includes(word)) {
          const context = this.extractContext(text, word);
          if (context) {
            const key = this.normalizeProCon(context);
            consMap.set(key, (consMap.get(key) || 0) + 1);
          }
        }
      });
    });

    // Sort by frequency and take top cons
    const sortedCons = Array.from(consMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([con, count]) => `${con} (mentioned ${count} times)`);

    return sortedCons.length > 0 ? sortedCons : ['Minor quality issues', 'Price concerns', 'Limited features'];
  }

  analyzeSentiment(reviews) {
    let positive = 0;
    let negative = 0;
    let neutral = 0;

    reviews.forEach(review => {
      const text = review.content.toLowerCase();
      let positiveScore = 0;
      let negativeScore = 0;

      // Count positive words
      this.positiveWords.forEach(word => {
        if (text.includes(word)) positiveScore++;
      });

      // Count negative words
      this.negativeWords.forEach(word => {
        if (text.includes(word)) negativeScore++;
      });

      // Consider rating if available
      if (review.rating) {
        if (review.rating >= 4) positiveScore += 2;
        else if (review.rating <= 2) negativeScore += 2;
      }

      // Classify sentiment
      if (positiveScore > negativeScore) {
        positive++;
      } else if (negativeScore > positiveScore) {
        negative++;
      } else {
        neutral++;
      }
    });

    const total = reviews.length;
    return {
      positive: Math.round((positive / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      negative: Math.round((negative / total) * 100)
    };
  }

  analyzeRatings(reviews) {
    const ratings = reviews
      .map(review => review.rating)
      .filter(rating => rating && rating > 0);

    if (ratings.length === 0) {
      return {
        extracted: [],
        average: 0,
        total: 0
      };
    }

    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

    return {
      extracted: ratings,
      average: Math.round(average * 10) / 10,
      total: ratings.length
    };
  }

  analyzeAspects(reviews) {
    const aspects = {
      'build-quality': 0,
      'performance': 0,
      'battery-life': 0,
      'price-value': 0,
      'ease-of-use': 0
    };

    const aspectCounts = {
      'build-quality': 0,
      'performance': 0,
      'battery-life': 0,
      'price-value': 0,
      'ease-of-use': 0
    };

    reviews.forEach(review => {
      const text = review.content.toLowerCase();
      
      Object.keys(this.aspectKeywords).forEach(aspect => {
        const keywords = this.aspectKeywords[aspect];
        let aspectScore = 0;
        let mentions = 0;

        keywords.forEach(keyword => {
          if (text.includes(keyword)) {
            mentions++;
            // Determine if mention is positive or negative
            const context = this.extractContext(text, keyword, 20);
            const positiveInContext = this.positiveWords.some(word => context.includes(word));
            const negativeInContext = this.negativeWords.some(word => context.includes(word));
            
            if (positiveInContext && !negativeInContext) {
              aspectScore += 4;
            } else if (negativeInContext && !positiveInContext) {
              aspectScore += 2;
            } else {
              aspectScore += 3; // neutral
            }
          }
        });

        if (mentions > 0) {
          aspects[aspect] += aspectScore / mentions;
          aspectCounts[aspect]++;
        }
      });
    });

    // Calculate final aspect ratings
    Object.keys(aspects).forEach(aspect => {
      if (aspectCounts[aspect] > 0) {
        aspects[aspect] = Math.round((aspects[aspect] / aspectCounts[aspect]) * 10) / 10;
        aspects[aspect] = Math.min(5, Math.max(1, aspects[aspect])); // Clamp between 1-5
      } else {
        aspects[aspect] = null; // No data available
      }
    });

    return aspects;
  }

  extractContext(text, word, contextLength = 30) {
    const index = text.indexOf(word);
    if (index === -1) return '';
    
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + word.length + contextLength);
    
    return text.substring(start, end);
  }

  normalizeProCon(text) {
    // Simple normalization - remove extra spaces and capitalize
    return text.trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .substring(0, 50); // Limit length
  }

  calculateAverageRating(reviews) {
    const ratings = reviews
      .map(review => review.rating)
      .filter(rating => rating && rating > 0);
    
    if (ratings.length === 0) return 0;
    
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }

  getEmptyAnalysis() {
    return {
      summary: "No reviews available for analysis. Be the first to review this product!",
      pros: ["No data available"],
      cons: ["No data available"],
      sentiment: { positive: 0, neutral: 0, negative: 0 },
      ratings: { extracted: [], average: 0, total: 0 },
      aspects: {
        'build-quality': null,
        'performance': null,
        'battery-life': null,
        'price-value': null,
        'ease-of-use': null
      }
    };
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIReviewAnalyzer;
}
