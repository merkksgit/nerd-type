/**
 * DOM Manager utility for caching frequently accessed elements
 * Reduces redundant DOM queries and improves performance
 */
class DOMManager {
  constructor() {
    this.cache = new Map();
    this.initialized = false;
  }

  /**
   * Initialize commonly used elements
   */
  init() {
    if (this.initialized) return;

    // Cache frequently accessed elements
    this.cacheElements([
      "userInput",
      "wordToType",
      "progressBar",
      "timer",
      "scoreDisplay",
      "wpmDisplay",
      "accuracyDisplay",
      "gameStartButton",
      "gameResetButton",
      "previousResults",
      "debugInfo",
      "zenProgress",
      "zenTimer",
      "usernameModal",
      "settingsModal",
      "scoreboardModal",
      "gameOverModal",
      "commandPaletteModal",
      "commandPaletteInput",
    ]);

    this.initialized = true;
  }

  /**
   * Cache multiple elements by their IDs
   */
  cacheElements(ids) {
    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        this.cache.set(id, element);
      }
    });
  }

  /**
   * Get cached element by ID with fallback to fresh lookup
   */
  get(id) {
    // Check cache first
    if (this.cache.has(id)) {
      const element = this.cache.get(id);
      // Verify element is still in DOM
      if (element && document.contains(element)) {
        return element;
      }
      // Remove stale cache entry
      this.cache.delete(id);
    }

    // Fresh lookup and cache
    const element = document.getElementById(id);
    if (element) {
      this.cache.set(id, element);
    }
    return element;
  }

  /**
   * Get element with error handling
   */
  safeGet(id) {
    try {
      return this.get(id);
    } catch (error) {
      console.error(`Failed to get element '${id}':`, error);
      return null;
    }
  }

  /**
   * Query selector with caching for common patterns
   */
  query(selector, useCache = true) {
    if (useCache && this.cache.has(selector)) {
      const element = this.cache.get(selector);
      if (element && document.contains(element)) {
        return element;
      }
      this.cache.delete(selector);
    }

    const element = document.querySelector(selector);
    if (element && useCache) {
      this.cache.set(selector, element);
    }
    return element;
  }

  /**
   * Query all with caching
   */
  queryAll(selector, useCache = false) {
    if (useCache && this.cache.has(selector)) {
      return this.cache.get(selector);
    }

    const elements = document.querySelectorAll(selector);
    if (useCache) {
      this.cache.set(selector, elements);
    }
    return elements;
  }

  /**
   * Set element value with null check
   */
  setValue(id, value) {
    const element = this.get(id);
    if (element) {
      element.value = value;
      return true;
    }
    return false;
  }

  /**
   * Set element text content with null check
   */
  setText(id, text) {
    const element = this.get(id);
    if (element) {
      element.textContent = text;
      return true;
    }
    return false;
  }

  /**
   * Set element HTML with null check
   */
  setHTML(id, html) {
    const element = this.get(id);
    if (element) {
      element.innerHTML = html;
      return true;
    }
    return false;
  }

  /**
   * Add class to element with null check
   */
  addClass(id, className) {
    const element = this.get(id);
    if (element) {
      element.classList.add(className);
      return true;
    }
    return false;
  }

  /**
   * Remove class from element with null check
   */
  removeClass(id, className) {
    const element = this.get(id);
    if (element) {
      element.classList.remove(className);
      return true;
    }
    return false;
  }

  /**
   * Toggle class on element with null check
   */
  toggleClass(id, className) {
    const element = this.get(id);
    if (element) {
      element.classList.toggle(className);
      return true;
    }
    return false;
  }

  /**
   * Show element (remove 'd-none' class)
   */
  show(id) {
    return this.removeClass(id, "d-none");
  }

  /**
   * Hide element (add 'd-none' class)
   */
  hide(id) {
    return this.addClass(id, "d-none");
  }

  /**
   * Focus element with null check
   */
  focus(id) {
    const element = this.get(id);
    if (element) {
      element.focus();
      return true;
    }
    return false;
  }

  /**
   * Clear cache for specific element or all
   */
  clearCache(id = null) {
    if (id) {
      this.cache.delete(id);
    } else {
      this.cache.clear();
      this.initialized = false;
    }
  }

  /**
   * Refresh cache for elements that might have changed
   */
  refreshCache() {
    // Clear and reinitialize
    this.cache.clear();
    this.initialized = false;
    this.init();
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      initialized: this.initialized,
    };
  }
}

// Create singleton instance
const domManager = new DOMManager();

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => domManager.init());
} else {
  domManager.init();
}

export default domManager;
