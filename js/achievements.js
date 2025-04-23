// achievements.js - Handles achievement logic and notifications for NerdType
// This module manages achievement unlocks, notifications, and storage

class AchievementSystem {
  constructor() {
    // Load existing achievements from localStorage
    this.achievementsData = JSON.parse(
      localStorage.getItem("nerdtype_achievements"),
    ) || {
      // Tracks which achievements have been unlocked
      unlockedAchievements: {},
      // Additional data needed for achievement tracking
      stats: {
        gamesPlayedToday: 0,
        lastGameDate: null,
        highestScore: 0,
      },
      // Track pending notifications
      pendingNotifications: [],
    };

    // Define all available achievements
    this.achievements = {
      // Game count achievements
      dedicated_typist: {
        id: "dedicated_typist",
        name: "Dedicated Typist",
        description: "Play 10 games in a single day",
        icon: "fa-solid fa-calendar-day",
        category: "frequency",
        secret: false,
        check: (stats) => stats.gamesPlayedToday >= 10,
      },
      typing_marathon: {
        id: "typing_marathon",
        name: "Typing Marathon",
        description: "Play 20 games in a single day",
        icon: "fa-solid fa-calendar-check",
        category: "frequency",
        secret: false,
        check: (stats) => stats.gamesPlayedToday >= 20,
      },

      // Score achievements
      code_apprentice: {
        id: "code_apprentice",
        name: "Code Apprentice",
        description: "Score over 500 points in a single game",
        icon: "fa-solid fa-code",
        category: "score",
        secret: false,
        check: (stats, gameData) =>
          (gameData && gameData.score >= 500) || stats.highestScore >= 500,
      },
      code_journeyman: {
        id: "code_journeyman",
        name: "Code Journeyman",
        description: "Score over 800 points in a single game",
        icon: "fa-solid fa-laptop-code",
        category: "score",
        secret: false,
        check: (stats, gameData) =>
          (gameData && gameData.score >= 800) || stats.highestScore >= 800,
      },
      code_master: {
        id: "code_master",
        name: "Code Master",
        description: "Score over 1000 points in a single game",
        icon: "fa-solid fa-terminal",
        category: "score",
        secret: false,
        check: (stats, gameData) =>
          (gameData && gameData.score >= 1000) || stats.highestScore >= 1000,
      },

      running_on_fumes: {
        id: "running_on_fumes",
        name: "Running on Fumes",
        description: "Complete a game with less than 3 energy left",
        icon: "fa-solid fa-bolt",
        category: "gameplay",
        secret: false,
        check: (stats, gameData) =>
          gameData &&
          gameData.timeLeft !== undefined &&
          gameData.timeLeft > 0 &&
          gameData.timeLeft < 3,
      },
    };

    // Initialize the notification system
    this.initNotificationSystem();

    // Update stats based on current date
    this.updateDailyStats();
  }

  // Initialize notification system
  initNotificationSystem() {
    this.notificationContainer = document.getElementById(
      "achievement-notifications",
    );
    if (!this.notificationContainer) {
      this.notificationContainer = document.createElement("div");
      this.notificationContainer.id = "achievement-notifications";
      this.notificationContainer.style.position = "fixed";
      this.notificationContainer.style.bottom = "10px";
      this.notificationContainer.style.right = "10px";
      this.notificationContainer.style.zIndex = "9999";
      document.body.appendChild(this.notificationContainer);

      // Check for pending notifications from localStorage
      this.checkPendingNotifications();

      // Add notification styles
      const style = document.createElement("style");
      style.textContent = `
        .achievement-notification {
          padding: 15px;
          margin-bottom: 10px;
          color: white;
          max-width: 350px;
          font-family: custom, monospace;
          animation: fadeInOut 4s forwards;
          box-shadow: 0 0 10px rgba(31, 35, 53, 1);
          display: flex;
          align-items: center;
          background-color: rgba(31, 35, 53, 0.95);
          border-left: 4px solid #bb9af7;
        }
        
        .achievement-notification .icon {
          margin-right: 15px;
          font-size: 24px;
          color: #bb9af7;
          background-color: rgba(31, 35, 53, 0.95);
        }
        
        .achievement-notification .content {
          flex: 1;
        }
        
        .achievement-notification .title {
          font-weight: bold;
          color: #ff9e64;
          padding-bottom: 5px;
          background-color: rgba(31, 35, 53, 0.95);
        }
        
        .achievement-notification .description {
          color: #c0caf5;
          font-size: 0.9em;
          background-color: rgba(31, 35, 53, 0.95);
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(20px); }
          10% { opacity: 1; transform: translateX(0); }
          80% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(20px); }
        }
        
        .custom-achievement-card.card {
          background-color: #1f2335 !important;
          border: 2px solid #3b4261 !important;
          border-radius: 1px;
          box-shadow: 0 0 15px rgba(59, 66, 97, 0.5);
          transition: all 0.3s ease;
        }
        
        .custom-achievement-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 15px rgba(187, 154, 247, 0.3);
        }
        
        .custom-achievement-card .card-header {
          background-color: #1f2335 !important;
          color: #c3e88d !important;
          font-weight: bold;
          padding: 0.75rem 1.25rem;
          border-bottom: 1px solid #3b4261;
        }
        
        .custom-achievement-card .card-header i {
          margin-right: 10px;
          color: #bb9af7;
        }
        
        .custom-achievement-card .card-body {
          color: #c0caf5;
          text-align: center;
          padding: 1.25rem;
        }
        
        .achievement-locked {
          filter: grayscale(100%);
          opacity: 0.6;
        }
        
        .achievement-locked .card-header {
          color: #7aa2f7 !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Reset daily stats if a new day has started
  updateDailyStats() {
    const today = new Date().toLocaleDateString();
    if (this.achievementsData.lastGameDate !== today) {
      this.achievementsData.gamesPlayedToday = 0;
      this.achievementsData.lastGameDate = today;
      this.saveData();
    }
  }

  // Check for pending notifications in localStorage
  checkPendingNotifications() {
    // If we have pending notifications in localStorage, display them
    if (
      this.achievementsData.pendingNotifications &&
      this.achievementsData.pendingNotifications.length > 0
    ) {
      const pendingNotifications = [
        ...this.achievementsData.pendingNotifications,
      ];

      // Clear pending notifications
      this.achievementsData.pendingNotifications = [];
      this.saveData();

      // Display each notification with a slight delay
      pendingNotifications.forEach((achievementId, index) => {
        // Find the achievement data
        const achievement = this.achievements[achievementId];
        if (achievement) {
          setTimeout(
            () => {
              this._displayNotification(achievement);
            },
            1000 + index * 1500,
          ); // Start after 1s, then stagger by 1.5s
        }
      });
    }
  }

  // Update stats and check for new achievements after a game
  handleGameCompletion(gameData) {
    // Update daily game count
    this.updateDailyStats();
    this.achievementsData.stats.gamesPlayedToday++;

    // Update highest score if this game's score is higher
    if (
      gameData &&
      gameData.score &&
      gameData.score > this.achievementsData.stats.highestScore
    ) {
      this.achievementsData.stats.highestScore = gameData.score;
    }

    // Save date of this game
    this.achievementsData.stats.lastGameDate = new Date().toLocaleDateString();

    // Check for newly unlocked achievements
    this.checkAchievements(gameData);

    // Save updated data
    this.saveData();
  }

  // Check for any newly unlocked achievements
  checkAchievements(gameData = null) {
    const newlyUnlocked = [];

    // Check each achievement
    Object.values(this.achievements).forEach((achievement) => {
      const achievementId = achievement.id;

      // Skip if already unlocked
      if (this.achievementsData.unlockedAchievements[achievementId]) {
        return;
      }

      // Check if achievement conditions are met
      if (achievement.check(this.achievementsData.stats, gameData)) {
        // Mark as unlocked
        this.achievementsData.unlockedAchievements[achievementId] = {
          unlockedAt: new Date().toISOString(),
        };

        // Add to newly unlocked list
        newlyUnlocked.push(achievement);
      }
    });

    // Show notifications for new achievements
    newlyUnlocked.forEach((achievement) => {
      this.showNotification(achievement);
    });

    return newlyUnlocked;
  }

  // Show achievement unlock notification
  showNotification(achievement) {
    // Store in localStorage for persistence across reloads
    if (!this.achievementsData.pendingNotifications) {
      this.achievementsData.pendingNotifications = [];
    }

    // Only add to pending if not already there
    if (!this.achievementsData.pendingNotifications.includes(achievement.id)) {
      this.achievementsData.pendingNotifications.push(achievement.id);
      this.saveData();
    }

    // Also keep in memory for current session
    if (!window.pendingAchievementNotifications) {
      window.pendingAchievementNotifications = [];
    }

    // Add this achievement to the pending queue
    window.pendingAchievementNotifications.push(achievement);

    // If there's no game over modal active, show notification immediately
    if (!document.querySelector("#gameOverModal.show")) {
      this._displayNotification(achievement);

      // Remove from pending in localStorage
      this.achievementsData.pendingNotifications =
        this.achievementsData.pendingNotifications.filter(
          (id) => id !== achievement.id,
        );
      this.saveData();
    }

    // Otherwise, set up listeners for when the modal is hidden
    else {
      // Only set up the listener once
      if (!window.achievementNotificationListenerActive) {
        const gameOverModal = document.getElementById("gameOverModal");
        if (gameOverModal) {
          gameOverModal.addEventListener("hidden.bs.modal", () => {
            // Show all pending notifications with a staggered delay
            if (
              window.pendingAchievementNotifications &&
              window.pendingAchievementNotifications.length > 0
            ) {
              // Create a copy of the array that won't be affected by page reloads
              const pendingAchievements = [
                ...window.pendingAchievementNotifications,
              ];

              // Clear the pending list
              window.pendingAchievementNotifications = [];

              // Clear localStorage pending notifications
              this.achievementsData.pendingNotifications = [];
              this.saveData();

              // Show each achievement with a staggered delay
              pendingAchievements.forEach((achievement, index) => {
                setTimeout(() => {
                  this._displayNotification(achievement);
                }, index * 1500); // Stagger notifications by 1.5 seconds
              });
            }
          });

          window.achievementNotificationListenerActive = true;
        }
      }
    }
  }

  // Internal method to actually display the notification
  _displayNotification(achievement) {
    const notification = document.createElement("div");
    notification.className = "achievement-notification";
    notification.innerHTML = `
      <div class="icon">
        <i class="${achievement.icon}"></i>
      </div>
      <div class="content">
        <div class="title">Achievement Unlocked: ${achievement.name}</div>
        <div class="description">${achievement.description}</div>
      </div>
    `;
    this.notificationContainer.appendChild(notification);

    // Play a sound if available
    if (window.achievementSound) {
      window.achievementSound.currentTime = 0;
      window.achievementSound
        .play()
        .catch((e) => console.log("Sound play prevented:", e));
    }

    // Remove after animation completes
    setTimeout(() => {
      notification.remove();
    }, 4000);
  }

  // Get all achievements with their unlock status
  getAllAchievements() {
    const result = [];

    Object.values(this.achievements).forEach((achievement) => {
      const unlockData =
        this.achievementsData.unlockedAchievements[achievement.id];
      result.push({
        ...achievement,
        unlocked: !!unlockData,
        unlockedAt: unlockData ? new Date(unlockData.unlockedAt) : null,
      });
    });

    return result;
  }

  // Get only unlocked achievements
  getUnlockedAchievements() {
    return this.getAllAchievements().filter((a) => a.unlocked);
  }

  // Reset all achievements (called when clearing scoreboard)
  resetAchievements() {
    this.achievementsData = {
      unlockedAchievements: {},
      stats: {
        gamesPlayedToday: 0,
        lastGameDate: null,
        highestScore: 0,
      },
      pendingNotifications: [],
    };
    this.saveData();
  }

  // Save achievement data to localStorage
  saveData() {
    localStorage.setItem(
      "nerdtype_achievements",
      JSON.stringify(this.achievementsData),
    );
  }

  // Render achievements to a container element
  renderAchievementsToContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear existing content
    container.innerHTML = "";

    // Get all achievements, sorted by unlock status (unlocked first)
    const achievements = this.getAllAchievements().sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      if (a.unlocked && b.unlocked) {
        return new Date(b.unlockedAt) - new Date(a.unlockedAt);
      }
      return 0;
    });

    // Create a row for the achievements
    const row = document.createElement("div");
    row.className = "row";
    container.appendChild(row);

    // Add each achievement - using the same structure as the existing achievements
    achievements.forEach((achievement) => {
      const col = document.createElement("div");
      col.className = "col-12 col-md-6 pt-3";

      const card = document.createElement("div");
      card.className = `card custom-achievement-card ${achievement.unlocked ? "" : "achievement-locked"}`;

      const header = document.createElement("div");
      header.className = "card-header achievement-header";
      header.innerHTML = `<i class="${achievement.icon}"></i> ${achievement.name}`;

      const body = document.createElement("div");
      body.className = "card-body text-center";

      if (achievement.unlocked) {
        // For unlocked achievements, show the description
        body.textContent = achievement.description;
      } else {
        // For locked achievements, show an icon and "Locked"
        const lockedIcon = document.createElement("i");
        lockedIcon.className = "fa-solid fa-lock me-2";

        const lockedText = document.createElement("span");
        lockedText.textContent = "Locked";

        body.appendChild(lockedIcon);
        body.appendChild(lockedText);
      }

      card.appendChild(header);
      card.appendChild(body);
      col.appendChild(card);
      row.appendChild(col);
    });
  }
}

// Create and export a singleton instance
const achievementSystem = new AchievementSystem();
export default achievementSystem;
