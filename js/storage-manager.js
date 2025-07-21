import { STORAGE_KEYS, GAME_DEFAULTS } from "./constants.js";

/**
 * Centralized localStorage management utility
 * Reduces repetitive operations and provides consistent error handling
 */
class StorageManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5000; // 5 seconds cache timeout
  }

  /**
   * Get item from localStorage with caching and error handling
   */
  getItem(key, defaultValue = null) {
    // Check cache first
    const cacheKey = `get_${key}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.value;
    }

    try {
      const value = localStorage.getItem(key);
      const result = value !== null ? value : defaultValue;

      // Cache the result
      this.cache.set(cacheKey, {
        value: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error(`Failed to get localStorage item '${key}':`, error);
      return defaultValue;
    }
  }

  /**
   * Set item in localStorage with error handling
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
      // Clear cache for this key
      this.cache.delete(`get_${key}`);
      return true;
    } catch (error) {
      console.error(`Failed to set localStorage item '${key}':`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage with error handling
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      // Clear cache for this key
      this.cache.delete(`get_${key}`);
      return true;
    } catch (error) {
      console.error(`Failed to remove localStorage item '${key}':`, error);
      return false;
    }
  }

  /**
   * Get and parse JSON from localStorage with error handling
   */
  getJSON(key, defaultValue = null) {
    const value = this.getItem(key);
    if (value === null) return defaultValue;

    try {
      return JSON.parse(value);
    } catch (error) {
      console.error(
        `Failed to parse JSON from localStorage item '${key}':`,
        error,
      );
      return defaultValue;
    }
  }

  /**
   * Set JSON object in localStorage with error handling
   */
  setJSON(key, object) {
    try {
      const value = JSON.stringify(object);
      return this.setItem(key, value);
    } catch (error) {
      console.error(
        `Failed to stringify JSON for localStorage item '${key}':`,
        error,
      );
      return false;
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
  }

  // Convenience methods for common operations
  getUsername() {
    return this.getItem(STORAGE_KEYS.USERNAME, GAME_DEFAULTS.DEFAULT_USERNAME);
  }

  setUsername(username) {
    return this.setItem(STORAGE_KEYS.USERNAME, username);
  }

  isDataCollectionEnabled() {
    return (
      this.getItem(STORAGE_KEYS.DATA_COLLECTION_ENABLED, "true") !== "false"
    );
  }

  setDataCollectionEnabled(enabled) {
    return this.setItem(
      STORAGE_KEYS.DATA_COLLECTION_ENABLED,
      enabled.toString(),
    );
  }

  isZenModeEnabled() {
    return this.getItem(STORAGE_KEYS.ZEN_MODE, "false") === "true";
  }

  setZenModeEnabled(enabled) {
    return this.setItem(STORAGE_KEYS.ZEN_MODE, enabled.toString());
  }

  isGuestMode() {
    return this.getItem(STORAGE_KEYS.GUEST_MODE, "false") === "true";
  }

  setGuestMode(enabled) {
    return this.setItem(STORAGE_KEYS.GUEST_MODE, enabled.toString());
  }

  getFont() {
    return this.getItem(STORAGE_KEYS.FONT, GAME_DEFAULTS.DEFAULT_FONT);
  }

  setFont(font) {
    return this.setItem(STORAGE_KEYS.FONT, font);
  }

  getGameSettings() {
    return this.getJSON(STORAGE_KEYS.GAME_SETTINGS, {
      timeLimit: GAME_DEFAULTS.TIME_LIMIT,
      bonusTime: GAME_DEFAULTS.BONUS_TIME,
      initialTime: GAME_DEFAULTS.INITIAL_TIME,
      goalPercentage: GAME_DEFAULTS.GOAL_PERCENTAGE,
      currentMode: "classic",
      zenWordGoal: GAME_DEFAULTS.ZEN_WORD_GOAL,
    });
  }

  setGameSettings(settings) {
    return this.setJSON(STORAGE_KEYS.GAME_SETTINGS, settings);
  }

  getGameResults() {
    return this.getJSON(STORAGE_KEYS.GAME_RESULTS, []);
  }

  setGameResults(results) {
    return this.setJSON(STORAGE_KEYS.GAME_RESULTS, results);
  }

  getAchievements() {
    return this.getJSON(STORAGE_KEYS.ACHIEVEMENTS, null);
  }

  setAchievements(achievements) {
    return this.setJSON(STORAGE_KEYS.ACHIEVEMENTS, achievements);
  }

  getTotalGameCount() {
    return parseInt(this.getItem(STORAGE_KEYS.TOTAL_GAME_COUNT, "0"));
  }

  setTotalGameCount(count) {
    return this.setItem(STORAGE_KEYS.TOTAL_GAME_COUNT, count.toString());
  }

  getPendingSettingsNotification() {
    return this.getJSON(STORAGE_KEYS.PENDING_SETTINGS_NOTIFICATION);
  }

  setPendingSettingsNotification(notification) {
    return this.setJSON(
      STORAGE_KEYS.PENDING_SETTINGS_NOTIFICATION,
      notification,
    );
  }

  removePendingSettingsNotification() {
    return this.removeItem(STORAGE_KEYS.PENDING_SETTINGS_NOTIFICATION);
  }

  getGuestAchievementsBackup() {
    return this.getJSON(STORAGE_KEYS.GUEST_ACHIEVEMENTS_BACKUP);
  }

  setGuestAchievementsBackup(achievements) {
    return this.setJSON(STORAGE_KEYS.GUEST_ACHIEVEMENTS_BACKUP, achievements);
  }

  getGameResultsGuestBackup() {
    return this.getJSON(STORAGE_KEYS.GAME_RESULTS_GUEST_BACKUP);
  }

  setGameResultsGuestBackup(results) {
    return this.setJSON(STORAGE_KEYS.GAME_RESULTS_GUEST_BACKUP, results);
  }
}

// Create singleton instance
const storageManager = new StorageManager();

export default storageManager;

