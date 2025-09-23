const { cacheService } = require('./cache');

/**
 * Cache helper utilities for controllers
 * Provides easy-to-use functions for cache operations
 */

/**
 * Invalidate cache entries matching patterns
 * @param {string|Array} patterns - Cache key patterns to invalidate
 * @param {string} context - Context for logging (optional)
 */
const invalidateCache = (patterns, context = '') => {
  try {
    const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
    let totalInvalidated = 0;
    
    patternsArray.forEach(pattern => {
      const invalidatedCount = cacheService.invalidatePattern(pattern);
      totalInvalidated += invalidatedCount;
      
      if (context && invalidatedCount > 0) {
        console.log(`[${context}] Invalidated ${invalidatedCount} cache entries matching: ${pattern}`);
      }
    });
    
    return totalInvalidated;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
};

/**
 * Invalidate user-specific cache entries
 * @param {string} userId - User ID
 * @param {Array} additionalPatterns - Additional patterns to invalidate
 */
const invalidateUserCache = (userId, additionalPatterns = []) => {
  const patterns = [
    `user:${userId}:.*`,
    `cache:GET:.*:${userId}`,
    ...additionalPatterns
  ];
  
  return invalidateCache(patterns, 'UserCache');
};

/**
 * Invalidate event-related cache entries
 * @param {string} eventId - Event ID (optional)
 * @param {Array} additionalPatterns - Additional patterns to invalidate
 */
const invalidateEventCache = (eventId = null, additionalPatterns = []) => {
  const patterns = [
    'events:.*',
    'user:.*:my-events',
    'user:.*:events:.*',
    ...additionalPatterns
  ];
  
  if (eventId) {
    patterns.push(`events:.*:${eventId}.*`);
    patterns.push(`user:.*:event:${eventId}.*`);
  }
  
  return invalidateCache(patterns, 'EventCache');
};

/**
 * Invalidate location cache entries
 * @param {string} locationKey - Location identifier (optional)
 */
const invalidateLocationCache = (locationKey = null) => {
  const patterns = ['location:.*'];
  
  if (locationKey) {
    patterns.push(`location:.*:${locationKey}.*`);
  }
  
  return invalidateCache(patterns, 'LocationCache');
};

/**
 * Invalidate weather cache entries
 * @param {string} locationKey - Location identifier (optional)
 */
const invalidateWeatherCache = (locationKey = null) => {
  const patterns = ['weather:.*'];
  
  if (locationKey) {
    patterns.push(`weather:.*:${locationKey}.*`);
  }
  
  return invalidateCache(patterns, 'WeatherCache');
};

/**
 * Clear all cache entries
 */
const clearAllCache = () => {
  try {
    cacheService.flushAll();
    console.log('[CacheHelpers] All cache entries cleared');
    return true;
  } catch (error) {
    console.error('Clear all cache error:', error);
    return false;
  }
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  try {
    return cacheService.getStats();
  } catch (error) {
    console.error('Get cache stats error:', error);
    return {};
  }
};

/**
 * Pre-invalidate cache before database operations
 * This ensures cache is cleared before the operation completes
 */
const preInvalidateCache = (patterns, context = '') => {
  return invalidateCache(patterns, `Pre-${context}`);
};

/**
 * Post-invalidate cache after database operations
 * This ensures cache is cleared after successful operations
 */
const postInvalidateCache = (patterns, context = '') => {
  return invalidateCache(patterns, `Post-${context}`);
};

/**
 * Smart cache invalidation based on operation type
 * @param {string} operation - Operation type ('create', 'update', 'delete', 'join')
 * @param {Object} data - Operation data
 */
const smartInvalidate = (operation, data) => {
  const { userId, eventId, locationData } = data;
  
  switch (operation) {
    case 'user_update':
      return invalidateUserCache(userId, ['user:.*:profile']);
      
    case 'user_avatar':
      return invalidateUserCache(userId, ['user:.*:profile', 'user:.*:avatar']);
      
    case 'event_create':
      return invalidateEventCache(null, ['user:.*:my-events']);
      
    case 'event_update':
      return invalidateEventCache(eventId, ['user:.*:my-events']);
      
    case 'event_delete':
      return invalidateEventCache(eventId, ['user:.*:my-events', 'user:.*:joinedEvents']);
      
    case 'event_join':
      return invalidateEventCache(eventId, ['user:.*:joinedEvents']);
      
    case 'event_album':
      return invalidateEventCache(eventId, ['user:.*:album:.*']);
      
    case 'event_todo':
      return invalidateEventCache(eventId, ['user:.*:todos:.*']);
      
    case 'location_update':
      return invalidateLocationCache(locationData?.key);
      
    case 'weather_update':
      return invalidateWeatherCache(locationData?.key);
      
    default:
      console.warn(`Unknown operation type: ${operation}`);
      return 0;
  }
};

module.exports = {
  invalidateCache,
  invalidateUserCache,
  invalidateEventCache,
  invalidateLocationCache,
  invalidateWeatherCache,
  clearAllCache,
  getCacheStats,
  preInvalidateCache,
  postInvalidateCache,
  smartInvalidate
};
