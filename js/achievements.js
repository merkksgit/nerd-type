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
        highestWPM: 0,
        highestAccuracy: 0,
        languageWPM: {
          english: 0,
          finnish: 0,
          swedish: 0,
          programming: 0,
          nightmare: 0,
        },
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
      speed_demon: {
        id: "speed_demon",
        name: "Speed Demon",
        description: "Complete a Zen Mode game in under 50 seconds",
        icon: "fa-solid fa-gauge-high",
        category: "speed",
        secret: false,
        check: function (stats, gameData) {
          // Check if this is a Zen Mode game
          if (!gameData || gameData.mode !== "Zen Mode") {
            return false;
          }

          if (gameData.totalTime) {
            console.log("Total time found:", gameData.totalTime);

            try {
              let totalSeconds = 0;

              // Handle different possible formats
              if (gameData.totalTime.includes(":")) {
                // Format: "m:ss"
                const timeParts = gameData.totalTime.split(":");
                const minutes = parseInt(timeParts[0]);
                const seconds = parseInt(timeParts[1]);
                totalSeconds = minutes * 60 + seconds;
              } else if (!isNaN(parseFloat(gameData.totalTime))) {
                // Format: numeric seconds
                totalSeconds = parseFloat(gameData.totalTime);
              }

              // Check if under 50 seconds
              return totalSeconds > 0 && totalSeconds < 50;
            } catch (error) {
              return false;
            }
          }
        },
      },
      the_admin: {
        id: "the_admin",
        name: "The Admin",
        description: "System breached!",
        icon: "fa-solid fa-user-secret",
        category: "secret",
        secret: true,
        check: (stats, gameData) => gameData && gameData.adminAccess === true,
      },
      // get_up_joel: {
      //   id: "get_up_joel",
      //   name: "Get Up, Joel!",
      //   description: "Lose a game, win the next one",
      //   icon: "fa-solid fa-person-arrow-up-from-line",
      //   category: "resilience",
      //   secret: true,
      //   check: function (stats, gameData) {
      //     if (
      //       !gameData ||
      //       (gameData.mode !== "Classic Mode" &&
      //         gameData.mode !== "Custom Mode" &&
      //         gameData.mode !== "Speedrunner Mode" &&
      //         gameData.mode !== "Hard Mode" &&
      //         gameData.mode !== "Practice Mode")
      //     ) {
      //       return false;
      //     }
      //
      //     if (this.achievementsData.stats.lastGameLostByEnergy === undefined) {
      //       this.achievementsData.stats.lastGameLostByEnergy = false;
      //     }
      //
      //     const isWin = gameData.timeLeft > 0;
      //     const wasLost = this.achievementsData.stats.lastGameLostByEnergy;
      //
      //     if (wasLost && isWin) {
      //       this.achievementsData.stats.lastGameLostByEnergy = false;
      //       return true; // Achievement unlocked!
      //     }
      //
      //     // Update tracking state if this game was lost by running out of energy
      //     if (gameData.timeLeft === 0) {
      //       this.achievementsData.stats.lastGameLostByEnergy = true;
      //     } else {
      //     }
      //
      //     return false;
      //   },
      // },

      // WPM Achievements
      script_kiddie: {
        id: "script_kiddie",
        name: "Script Kiddie",
        description: "Your first hack, gratz nerd!",
        icon: "fa-solid fa-graduation-cap",
        category: "progress",
        secret: true,
        check: (stats, gameData) => {
          // Check if gameData exists and has wpm
          if (!gameData || gameData.wpm === undefined) return false;

          // Check if the game was won (timeLeft > 0)
          return gameData.timeLeft > 0;
        },
      },

      quantum_typist: {
        id: "quantum_typist",
        name: "Quantum Typist",
        description: "Hit 80 WPM",
        icon: "fa-solid fa-atom",
        category: "speed",
        secret: false,
        check: (stats, gameData) =>
          (gameData && gameData.wpm >= 80) || stats.highestWPM >= 80,
      },

      digital_overlord: {
        id: "digital_overlord",
        name: "Digital Overlord",
        description: "Break 100 WPM",
        icon: "fa-solid fa-crown",
        category: "speed",
        secret: false,
        check: (stats, gameData) =>
          (gameData && gameData.wpm >= 100) || stats.highestWPM >= 100,
      },
      bug_eliminator: {
        id: "bug_eliminator",
        name: "Bug Eliminator",
        description: "Win with 100% accuracy",
        icon: "fa-solid fa-bug-slash",
        category: "accuracy",
        secret: false,
        check: (stats, gameData) => {
          if (!gameData) return false;

          const accuracy = parseFloat(gameData.accuracy);
          const isVictory = gameData.timeLeft > 0;

          // Achievement unlocks only when accuracy is 100% AND the game was won
          return accuracy === 100 && isVictory;
        },
      },
      night_owl: {
        id: "night_owl",
        name: "Night Owl",
        description: "Complete a game between midnight and 5am",
        icon: "fa-solid fa-moon",
        category: "lifestyle",
        secret: true,
        check: (stats, gameData) => {
          const currentHour = new Date().getHours();
          return currentHour >= 0 && currentHour < 5;
        },
      },
      polyglot_programmer: {
        id: "polyglot_programmer",
        name: "Polyglot Programmer",
        description: "Achieve 50+ WPM in all language modes",
        icon: "fa-solid fa-language",
        category: "mastery",
        secret: false,
        check: function (stats, gameData) {
          // Log language WPM stats for debugging
          console.log(
            "Checking polyglot achievement with stats:",
            stats.languageWPM,
          );

          return (
            stats.languageWPM &&
            stats.languageWPM.english >= 50 &&
            stats.languageWPM.finnish >= 50 &&
            stats.languageWPM.swedish >= 50 &&
            stats.languageWPM.nightmare >= 50 &&
            stats.languageWPM.programming >= 50
          );
        },
      },

      completionist: {
        id: "completionist",
        name: "Completionist",
        description: "Unlock all achievements",
        icon: "fa-solid fa-shield-halved",
        category: "meta",
        secret: false,
        check: function (stats, gameData) {
          // Get all achievements except this one
          const allOtherAchievements = Object.keys(
            this.achievements || {},
          ).filter((id) => id !== "completionist");

          // Check if all other achievements are unlocked
          return allOtherAchievements.every(
            (id) =>
              this.achievementsData.unlockedAchievements[id] !== undefined,
          );
        },
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
          animation: fadeInOut 9s forwards;
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
          5% { opacity: 1; transform: translateX(0); }
          90% { opacity: 1; transform: translateX(0); }
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

        /* Tooltip styles for achievements */
        .tooltip.achievement-tooltip .tooltip-inner {
          background-color: #1f2335;
          color: #7aa2f7;
          border: 2px solid #3b4261;
          padding: 10px 15px;
          font-family: "custom", monospace;
          max-width: 250px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .custom-achievement-card[data-bs-toggle="tooltip"]::after {
          content: "ℹ️";
          position: absolute;
          top: 8px;
          right: 8px;
          font-size: 0.8rem;
          opacity: 0.6;
          transition: opacity 0.2s ease;
        }

        .custom-achievement-card[data-bs-toggle="tooltip"]:hover::after {
          opacity: 1;
        }

        /* Special styling for secret achievements */
        .custom-achievement-card.achievement-locked i.fa-lock {
          color: #bb9af7;
          opacity: 0.7;
          transition: all 0.3s ease;
        }

        .custom-achievement-card.achievement-locked:hover i.fa-lock {
          color: #ff9e64;
          transform: scale(1.1);
        }

        .tooltip.achievement-tooltip {
          opacity: 1 !important;
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

    // Update highest WPM if this game's WPM is higher
    if (
      gameData &&
      gameData.wpm &&
      gameData.wpm > this.achievementsData.stats.highestWPM
    ) {
      this.achievementsData.stats.highestWPM = gameData.wpm;
    }

    // Update highest accuracy if this game's accuracy is higher
    if (gameData && gameData.accuracy) {
      const accuracyValue = parseFloat(gameData.accuracy);
      if (
        !isNaN(accuracyValue) &&
        accuracyValue > this.achievementsData.stats.highestAccuracy
      ) {
        this.achievementsData.stats.highestAccuracy = accuracyValue;
      }
    }

    // Update language-specific WPM stats
    if (gameData && gameData.wpm && gameData.wordList) {
      const language = gameData.wordList.toLowerCase();
      console.log(
        "Game completed in language:",
        language,
        "with WPM:",
        gameData.wpm,
      );

      if (
        this.achievementsData.stats.languageWPM &&
        this.achievementsData.stats.languageWPM[language] !== undefined
      ) {
        // Update if new WPM is higher
        if (gameData.wpm > this.achievementsData.stats.languageWPM[language]) {
          this.achievementsData.stats.languageWPM[language] = gameData.wpm;
          console.log("Updated language WPM for", language, "to", gameData.wpm);
        }

        // Log current language WPM stats
        console.log(
          "Current language WPM stats:",
          this.achievementsData.stats.languageWPM,
        );
      }
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

      try {
        // Check if achievement conditions are met
        // Bind 'this' context for function checks
        const checkResult =
          typeof achievement.check === "function"
            ? achievement.check.call(
                this,
                this.achievementsData.stats,
                gameData,
              )
            : achievement.check(this.achievementsData.stats, gameData);

        if (checkResult) {
          // Mark as unlocked
          this.achievementsData.unlockedAchievements[achievementId] = {
            unlockedAt: new Date().toISOString(),
          };

          // Add to newly unlocked list
          newlyUnlocked.push(achievement);
        }
      } catch (error) {
        console.error(`Error checking achievement ${achievementId}:`, error);
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
    }, 9000);
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
        highestWPM: 0,
        highestAccuracy: 0,
        languageWPM: {
          english: 0,
          finnish: 0,
          swedish: 0,
          programming: 0,
          nightmare: 0,
        },
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

  // Render achievements to a container element with tooltips for non-secret achievements
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
    // Add each achievement - using a 3-column layout
    achievements.forEach((achievement) => {
      const col = document.createElement("div");
      col.className = "col-12 col-md-4 pt-3"; // Changed to 4 for 3 cards per row

      const card = document.createElement("div");
      card.className = `card custom-achievement-card ${achievement.unlocked ? "" : "achievement-locked"}`;

      // Add tooltip data attributes only for non-secret locked achievements
      if (!achievement.secret && !achievement.unlocked) {
        card.setAttribute("data-bs-toggle", "tooltip");
        card.setAttribute("data-bs-placement", "top");
        card.setAttribute(
          "data-bs-template",
          '<div class="tooltip achievement-tooltip" role="tooltip"><div class="tooltip-inner"></div></div>',
        );
        card.setAttribute("title", achievement.description);
      }

      const header = document.createElement("div");
      header.className = "card-header achievement-header";
      header.innerHTML = `<i class="${achievement.icon}"></i> ${achievement.name}`;

      const body = document.createElement("div");
      body.className = "card-body text-center";

      if (achievement.unlocked) {
        // Dynamically adjust font size based on description length
        const description = achievement.description;
        body.textContent = description;

        // Default font size
        body.style.fontSize = "0.9rem";

        // Adjust based on text length
        if (description.length > 30) {
          body.style.fontSize = "0.85rem";
        }
        if (description.length > 45) {
          body.style.fontSize = "0.8rem";
        }
        if (description.length > 60) {
          body.style.fontSize = "0.75rem";
        }
      } else {
        // For locked achievements, show an icon and "Locked"
        const lockedIcon = document.createElement("i");
        lockedIcon.className = "fa-solid fa-lock me-2";

        const lockedText = document.createElement("span");

        // For secret achievements, show different text
        if (achievement.secret) {
          lockedText.textContent = "Secret Achievement";
        } else {
          lockedText.textContent = "Locked";
        }

        body.appendChild(lockedIcon);
        body.appendChild(lockedText);
      }

      card.appendChild(header);
      card.appendChild(body);
      col.appendChild(card);
      row.appendChild(col);
    });
    // Initialize tooltips after adding all achievement cards
    setTimeout(() => {
      const tooltipTriggerList = [].slice.call(
        container.querySelectorAll('[data-bs-toggle="tooltip"]'),
      );
      tooltipTriggerList.forEach((el) => {
        new bootstrap.Tooltip(el);
      });
    }, 100);
  }
}

// Create and export a singleton instance
const achievementSystem = new AchievementSystem();
export default achievementSystem;
