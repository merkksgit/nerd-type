// webhook-status.js - Monitors Discord webhook service status

class WebhookStatusChecker {
  constructor() {
    this.webhookUrl =
      "https://n8n.n8nmerkks.uk/webhook/1b5eabef-f77c-47c3-af6a-49081aee54ea";
    this.status = "unknown"; // unknown, online, offline
    this.lastCheck = null;
    this.checkInterval = null;
    this.listeners = [];
  }

  /**
   * Add a status change listener
   * @param {Function} callback - Called when status changes (status, timestamp)
   */
  addStatusListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove a status change listener
   * @param {Function} callback - The callback to remove
   */
  removeStatusListener(callback) {
    this.listeners = this.listeners.filter((cb) => cb !== callback);
  }

  /**
   * Notify all listeners of status change
   * @param {string} status - New status
   */
  notifyListeners(status) {
    const timestamp = Date.now();
    this.listeners.forEach((callback) => {
      try {
        callback(status, timestamp);
      } catch (error) {
        console.error("Error in webhook status listener:", error);
      }
    });
  }

  /**
   * Check webhook status by making a lightweight request
   * @returns {Promise<string>} Status: 'online' or 'offline'
   */
  async checkStatus() {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const timeout = 3000; // 3 second timeout
      let resolved = false;

      // Create an image element to test connectivity
      // This bypasses CORS issues and gives us better error detection
      const img = new Image();

      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          img.src = "";
        }
      };

      // Success - server responded (even with 404, that means it's online)
      img.onload = () => {
        if (resolved) return;
        cleanup();

        const newStatus = "online";
        if (this.status !== newStatus) {
          this.status = newStatus;
          this.notifyListeners(newStatus);
        }
        this.lastCheck = Date.now();
        resolve(newStatus);
      };

      // Error - could be network error, server down, or 404
      img.onerror = () => {
        if (resolved) return;
        cleanup();

        const responseTime = Date.now() - startTime;

        // If error happens very quickly (< 100ms), likely a network/DNS failure
        // If it takes longer, the server might be responding with 404 (which means it's online)
        let newStatus;
        if (responseTime < 100) {
          newStatus = "offline"; // Quick failure = network/server down
        } else {
          newStatus = "online"; // Slower failure = server responded with error (still online)
        }

        if (this.status !== newStatus) {
          this.status = newStatus;
          this.notifyListeners(newStatus);
        }
        this.lastCheck = Date.now();
        resolve(newStatus);
      };

      // Timeout
      setTimeout(() => {
        if (resolved) return;
        cleanup();

        const newStatus = "offline";
        if (this.status !== newStatus) {
          this.status = newStatus;
          this.notifyListeners(newStatus);
        }
        this.lastCheck = Date.now();
        resolve(newStatus);
      }, timeout);

      // Try to load a favicon or small resource from the same domain
      // Extract domain from webhook URL
      try {
        const url = new URL(this.webhookUrl);
        img.src = `${url.protocol}//${url.host}/favicon.ico?_=${Date.now()}`;
      } catch (error) {
        // Fallback: try the webhook URL directly
        img.src = `${this.webhookUrl}?_=${Date.now()}`;
      }
    });
  }

  /**
   * Start periodic status checking
   * @param {number} intervalMs - Check interval in milliseconds (default: 30 seconds)
   */
  startPeriodicCheck(intervalMs = 30000) {
    this.stopPeriodicCheck(); // Clear any existing interval

    // Initial check
    this.checkStatus();

    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.checkStatus();
    }, intervalMs);
  }

  /**
   * Stop periodic status checking
   */
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Get current status information
   * @returns {Object} Status info
   */
  getStatusInfo() {
    return {
      status: this.status,
      lastCheck: this.lastCheck,
      lastCheckFormatted: this.lastCheck
        ? new Date(this.lastCheck).toLocaleTimeString()
        : "Never",
    };
  }

  /**
   * Get status display info for UI
   * @returns {Object} Display info with text, color, icon
   */
  getStatusDisplay() {
    switch (this.status) {
      case "online":
        return {
          text: "Service Online",
          color: "#c3e88d", // green
          icon: "🟢",
          description: "Discord webhook is reachable",
        };
      case "offline":
        return {
          text: "Service Offline",
          color: "#ff007c", // red
          icon: "🔴",
          description: "Discord webhook is not reachable",
        };
      default:
        return {
          text: "Checking...",
          color: "#f7768e", // orange
          icon: "🟡",
          description: "Checking Discord webhook status",
        };
    }
  }
}

// Create global instance
window.webhookStatusChecker = new WebhookStatusChecker();

// Export for module use
if (typeof module !== "undefined" && module.exports) {
  module.exports = WebhookStatusChecker;
}

