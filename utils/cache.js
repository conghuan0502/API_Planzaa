const NodeCache = require('node-cache');

// Create cache instance with default options
const cache = new NodeCache({
    stdTTL: 600, // Default TTL: 10 minutes
    checkperiod: 120, // Check for expired keys every 2 minutes
    useClones: false // Better performance for objects
});

/**
 * Cache utility class providing methods for caching operations
 */
class CacheService {
    constructor() {
        this.cache = cache;
    }

    /**
     * Set a key-value pair in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in seconds (optional)
     * @returns {boolean} - Success status
     */
    set(key, value, ttl = null) {
        try {
            if (ttl) {
                return this.cache.set(key, value, ttl);
            }
            return this.cache.set(key, value);
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    /**
     * Get value from cache by key
     * @param {string} key - Cache key
     * @returns {any} - Cached value or undefined if not found
     */
    get(key) {
        try {
            return this.cache.get(key);
        } catch (error) {
            console.error('Cache get error:', error);
            return undefined;
        }
    }

    /**
     * Delete a key from cache
     * @param {string} key - Cache key to delete
     * @returns {number} - Number of keys deleted
     */
    del(key) {
        try {
            return this.cache.del(key);
        } catch (error) {
            console.error('Cache delete error:', error);
            return 0;
        }
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key to check
     * @returns {boolean} - True if key exists
     */
    has(key) {
        try {
            return this.cache.has(key);
        } catch (error) {
            console.error('Cache has error:', error);
            return false;
        }
    }

    /**
     * Get multiple values from cache
     * @param {string[]} keys - Array of cache keys
     * @returns {Object} - Object with key-value pairs
     */
    mget(keys) {
        try {
            return this.cache.mget(keys);
        } catch (error) {
            console.error('Cache mget error:', error);
            return {};
        }
    }

    /**
     * Set multiple key-value pairs in cache
     * @param {Object} keyValuePairs - Object with key-value pairs
     * @param {number} ttl - Time to live in seconds (optional)
     * @returns {boolean} - Success status
     */
    mset(keyValuePairs, ttl = null) {
        try {
            if (ttl) {
                return this.cache.mset(keyValuePairs, ttl);
            }
            return this.cache.mset(keyValuePairs);
        } catch (error) {
            console.error('Cache mset error:', error);
            return false;
        }
    }

    /**
     * Delete multiple keys from cache
     * @param {string[]} keys - Array of keys to delete
     * @returns {number} - Number of keys deleted
     */
    mdel(keys) {
        try {
            return this.cache.del(keys);
        } catch (error) {
            console.error('Cache mdel error:', error);
            return 0;
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} - Cache statistics
     */
    getStats() {
        try {
            return this.cache.getStats();
        } catch (error) {
            console.error('Cache stats error:', error);
            return {};
        }
    }

    /**
     * Flush all cache entries
     * @returns {boolean} - Success status
     */
    flushAll() {
        try {
            this.cache.flushAll();
            return true;
        } catch (error) {
            console.error('Cache flush error:', error);
            return false;
        }
    }

    /**
     * Get all cache keys
     * @returns {string[]} - Array of all cache keys
     */
    keys() {
        try {
            return this.cache.keys();
        } catch (error) {
            console.error('Cache keys error:', error);
            return [];
        }
    }

    /**
     * Get TTL (Time To Live) for a key
     * @param {string} key - Cache key
     * @returns {number} - TTL in seconds, -1 if key doesn't exist
     */
    getTtl(key) {
        try {
            return this.cache.getTtl(key);
        } catch (error) {
            console.error('Cache getTtl error:', error);
            return -1;
        }
    }

    /**
     * Update TTL for an existing key
     * @param {string} key - Cache key
     * @param {number} ttl - New TTL in seconds
     * @returns {boolean} - Success status
     */
    updateTtl(key, ttl) {
        try {
            return this.cache.ttl(key, ttl);
        } catch (error) {
            console.error('Cache updateTtl error:', error);
            return false;
        }
    }

    /**
     * Cache with automatic refresh - useful for API responses
     * @param {string} key - Cache key
     * @param {Function} fetchFunction - Function to fetch fresh data
     * @param {number} ttl - Time to live in seconds (optional)
     * @returns {Promise<any>} - Cached or fresh data
     */
    async remember(key, fetchFunction, ttl = null) {
        try {
            // Try to get from cache first
            let data = this.get(key);
            
            if (data !== undefined) {
                return data;
            }

            // If not in cache, fetch fresh data
            data = await fetchFunction();
            
            // Cache the fresh data
            this.set(key, data, ttl);
            
            return data;
        } catch (error) {
            console.error('Cache remember error:', error);
            // Fallback to fresh data if caching fails
            return await fetchFunction();
        }
    }

    /**
     * Cache invalidation patterns
     */
    invalidatePattern(pattern) {
        try {
            const keys = this.keys();
            const regex = new RegExp(pattern);
            const keysToDelete = keys.filter(key => regex.test(key));
            
            if (keysToDelete.length > 0) {
                return this.mdel(keysToDelete);
            }
            return 0;
        } catch (error) {
            console.error('Cache invalidatePattern error:', error);
            return 0;
        }
    }
}

// Create and export a singleton instance
const cacheService = new CacheService();

module.exports = {
    cacheService,
    CacheService
};
