const { cacheService } = require('../utils/cache');

/**
 * Cache middleware factory - creates cache middleware with configurable options
 * @param {Object} options - Cache configuration options
 * @param {number} options.ttl - Time to live in seconds (default: 600)
 * @param {Function} options.keyGenerator - Function to generate cache key (optional)
 * @param {Function} options.skipCache - Function to determine if request should skip cache (optional)
 * @param {Array} options.methods - HTTP methods to cache (default: ['GET'])
 * @param {Array} options.statusCodes - HTTP status codes to cache (default: [200])
 * @returns {Function} Express middleware function
 */
const createCacheMiddleware = (options = {}) => {
  const {
    ttl = 600, // 10 minutes default
    keyGenerator = null,
    skipCache = null,
    methods = ['GET'],
    statusCodes = [200]
  } = options;

  return (req, res, next) => {
    // Only cache specified HTTP methods
    if (!methods.includes(req.method)) {
      return next();
    }

    // Skip cache if skipCache function returns true
    if (skipCache && skipCache(req, res)) {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator ? 
      keyGenerator(req) : 
      generateDefaultCacheKey(req);

    // Try to get cached response
    const cachedResponse = cacheService.get(cacheKey);
    
    if (cachedResponse) {
      // Set cache headers
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Key', cacheKey);
      
      // Return cached response
      return res.status(cachedResponse.statusCode).json(cachedResponse.data);
    }

    // Cache miss - proceed with request
    res.set('X-Cache', 'MISS');
    res.set('X-Cache-Key', cacheKey);

    // Store original res.json method
    const originalJson = res.json.bind(res);

    // Override res.json to cache successful responses
    res.json = function(data) {
      // Only cache if status code is in allowed list
      if (statusCodes.includes(res.statusCode)) {
        const responseToCache = {
          statusCode: res.statusCode,
          data: data,
          timestamp: new Date().toISOString()
        };
        
        cacheService.set(cacheKey, responseToCache, ttl);
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
};

/**
 * Generate default cache key based on request
 * @param {Object} req - Express request object
 * @returns {string} Cache key
 */
const generateDefaultCacheKey = (req) => {
  const { method, originalUrl, query, user } = req;
  
  // Include user ID if authenticated
  const userId = user ? user._id : 'anonymous';
  
  // Create key from method, URL, query params, and user
  const keyData = {
    method,
    url: originalUrl,
    query: JSON.stringify(query),
    userId
  };
  
  return `cache:${method}:${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
};

/**
 * Cache middleware for specific routes with custom TTL
 * @param {number} ttl - Time to live in seconds
 * @returns {Function} Express middleware
 */
const cache = (ttl = 600) => {
  return createCacheMiddleware({ ttl });
};

/**
 * Cache middleware for user-specific data
 * @param {number} ttl - Time to live in seconds
 * @returns {Function} Express middleware
 */
const userCache = (ttl = 300) => {
  return createCacheMiddleware({
    ttl,
    keyGenerator: (req) => {
      if (!req.user) return null;
      const cacheKey = `user:${req.user._id}:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;
      console.log(`[UserCache] Generated key: ${cacheKey}`);
      return cacheKey;
    },
    skipCache: (req) => !req.user
  });
};

/**
 * Cache middleware for public data (no user context)
 * @param {number} ttl - Time to live in seconds
 * @returns {Function} Express middleware
 */
const publicCache = (ttl = 900) => {
  return createCacheMiddleware({
    ttl,
    skipCache: (req) => req.user // Skip if user is authenticated
  });
};

/**
 * Cache middleware for weather data
 * @param {number} ttl - Time to live in seconds (default: 1800 = 30 minutes)
 * @returns {Function} Express middleware
 */
const weatherCache = (ttl = 1800) => {
  return createCacheMiddleware({
    ttl,
    keyGenerator: (req) => {
      const { lat, lon, city } = req.query;
      return `weather:${lat || 'null'}:${lon || 'null'}:${city || 'null'}`;
    }
  });
};

/**
 * Cache middleware for location data
 * @param {number} ttl - Time to live in seconds (default: 3600 = 1 hour)
 * @returns {Function} Express middleware
 */
const locationCache = (ttl = 3600) => {
  return createCacheMiddleware({
    ttl,
    keyGenerator: (req) => {
      const { query, lat, lon } = req.query;
      return `location:${query || 'null'}:${lat || 'null'}:${lon || 'null'}`;
    }
  });
};

/**
 * Cache middleware for events data
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @returns {Function} Express middleware
 */
const eventsCache = (ttl = 300) => {
  return createCacheMiddleware({
    ttl,
    keyGenerator: (req) => {
      const { lat, lon, radius, category, date } = req.query;
      return `events:${lat || 'null'}:${lon || 'null'}:${radius || 'null'}:${category || 'null'}:${date || 'null'}`;
    }
  });
};

/**
 * Middleware to invalidate cache based on patterns
 * @param {string|Array} patterns - Cache key patterns to invalidate
 * @returns {Function} Express middleware
 */
const invalidateCache = (patterns) => {
  return (req, res, next) => {
    // Store original res.json method
    const originalJson = res.json.bind(res);

    // Override res.json to invalidate cache before sending response
    res.json = function(data) {
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
        
        patternsArray.forEach(pattern => {
          const invalidatedCount = cacheService.invalidatePattern(pattern);
          if (invalidatedCount > 0) {
            console.log(`[CacheMiddleware] Invalidated ${invalidatedCount} cache entries matching pattern: ${pattern}`);
          }
        });
      }

      // Call original json method
      return originalJson(data);
    };

    // Also store original res.send method for other response types
    const originalSend = res.send.bind(res);
    res.send = function(data) {
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
        
        patternsArray.forEach(pattern => {
          const invalidatedCount = cacheService.invalidatePattern(pattern);
          if (invalidatedCount > 0) {
            console.log(`[CacheMiddleware] Invalidated ${invalidatedCount} cache entries matching pattern: ${pattern}`);
          }
        });
      }

      // Call original send method
      return originalSend(data);
    };

    next();
  };
};

/**
 * Middleware to add cache headers without actually caching
 * @param {number} maxAge - Max age in seconds for Cache-Control header
 * @returns {Function} Express middleware
 */
const cacheHeaders = (maxAge = 300) => {
  return (req, res, next) => {
    res.set('Cache-Control', `public, max-age=${maxAge}`);
    res.set('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());
    next();
  };
};

module.exports = {
  createCacheMiddleware,
  cache,
  userCache,
  publicCache,
  weatherCache,
  locationCache,
  eventsCache,
  invalidateCache,
  cacheHeaders
};
