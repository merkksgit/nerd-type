// achievements.js - Handles achievement logic and notifications for NerdType
// This module manages achievement unlocks, notifications, and storage

// Import storage manager
import storageManager from "./storage-manager.js";

class AchievementSystem {
  constructor() {
    // Load existing achievements from localStorage
    const existingData = storageManager.getAchievements();

    // Default structure
    const defaultData = {
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
          alice: 0,
        },
        bestHardcoreProgress: 0,
        practiceWordsTyped: 0,
      },
      // Track pending notifications
      pendingNotifications: [],
    };

    // Merge existing data with defaults, ensuring all required properties exist
    if (existingData && typeof existingData === "object") {
      this.achievementsData = {
        unlockedAchievements: existingData.unlockedAchievements || {},
        stats: {
          ...defaultData.stats,
          ...(existingData.stats || {}),
          languageWPM: {
            ...defaultData.stats.languageWPM,
            ...(existingData.stats?.languageWPM || {}),
          },
        },
        pendingNotifications: existingData.pendingNotifications || [],
      };
    } else {
      this.achievementsData = defaultData;
    }

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
        progressTarget: 10,
        getProgress: (stats) => Math.min(stats.gamesPlayedToday || 0, 10),
        check: (stats) => stats.gamesPlayedToday >= 10,
      },
      typing_marathon: {
        id: "typing_marathon",
        name: "Typing Marathon",
        description: "Play 20 games in a single day",
        icon: "fa-solid fa-calendar-check",
        category: "frequency",
        secret: false,
        progressTarget: 20,
        getProgress: (stats) => Math.min(stats.gamesPlayedToday || 0, 20),
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

      system_architect: {
        id: "system_architect",
        name: "System Architect",
        description: "Score over 1500 points in a single game",
        icon: "fa-solid fa-microchip",
        category: "score",
        secret: false,
        check: (stats, gameData) =>
          (gameData && gameData.score >= 1500) || stats.highestScore >= 1500,
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
      energy_reservoir: {
        id: "energy_reservoir",
        name: "Energy Reservoir",
        description:
          "Complete a Hard Mode game with at least 10 energy remaining",
        icon: "fa-solid fa-battery-full",
        category: "gameplay",
        secret: false,
        check: (stats, gameData) =>
          gameData &&
          gameData.mode === "Hard Mode" &&
          gameData.timeLeft !== undefined &&
          gameData.timeLeft >= 10,
      },
      speed_demon: {
        id: "speed_demon",
        name: "Speed Demon",
        description:
          "Complete a Zen Mode game with default word goal (30) in under 50 seconds",
        icon: "fa-solid fa-gauge-high",
        category: "speed",
        secret: false,
        check: function (stats, gameData) {
          // Check if this is a Zen Mode game
          if (!gameData || gameData.mode !== "Zen Mode") {
            return false;
          }

          // Check if the word goal is the default (30)
          if (!gameData.wordGoal || gameData.wordGoal !== 30) {
            return false;
          }

          // Check if the player completed the full goal (typed all 30 words)
          if (!gameData.wordsTyped || gameData.wordsTyped < 30) {
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
          return false;
        },
      },
      config_commander: {
        id: "config_commander",
        name: "Config Commander",
        description: "Complete 15 custom mode games in a single day",
        icon: "fa-solid fa-compass",
        category: "exploration",
        secret: false,
        progressTarget: 15,
        getProgress: (stats) => Math.min(stats.customGamesPlayedToday || 0, 15),
        check: function (stats, gameData) {
          if (!gameData) {
            return stats.customGamesPlayedToday >= 15;
          }

          if (gameData.mode === "Custom Mode" && gameData.timeLeft > 0) {
            if (typeof stats.customGamesPlayedToday === "undefined") {
              stats.customGamesPlayedToday = 1;
              stats.lastCustomGameDate = new Date().toLocaleDateString();
            } else if (
              stats.lastCustomGameDate !== new Date().toLocaleDateString()
            ) {
              stats.customGamesPlayedToday = 1;
              stats.lastCustomGameDate = new Date().toLocaleDateString();
            } else {
              stats.customGamesPlayedToday++;
              this.saveData();
            }
            return stats.customGamesPlayedToday >= 15;
          }

          return false;
        },
      },
      // WPM Achievements
      script_kiddie: {
        id: "script_kiddie",
        name: "Script Kiddie",
        description: "Hello, World!",
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
      advanced_operator: {
        id: "advanced_operator",
        name: "Advanced Operator",
        description: "Win a game with at least 1.5x difficulty multiplier",
        icon: "fa-solid fa-chart-simple",
        category: "difficulty",
        secret: false,
        check: function (stats, gameData) {
          if (!gameData || !gameData.mode || !gameData.mode.includes("Mode"))
            return false;
          if (gameData.mode === "Zen Mode") return false;
          if (gameData.timeLeft <= 0) return false;

          return (
            gameData.difficultyMultiplier &&
            gameData.difficultyMultiplier >= 1.49
          );
        },
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
      spray_and_pray: {
        id: "spray_and_pray",
        name: "Spray and Pray",
        description: "Win a game with less than 90% accuracy",
        icon: "fa-solid fa-fire",
        category: "gameplay",
        secret: false,
        check: (stats, gameData) => {
          if (!gameData) return false;

          const isVictory = gameData.timeLeft > 0;
          const accuracy = parseFloat(gameData.accuracy);

          return !isNaN(accuracy) && accuracy < 90 && isVictory;
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
          if (!gameData || gameData.timeLeft <= 0) return false;

          const currentHour = new Date().getHours();
          return currentHour >= 0 && currentHour < 5;
        },
      },
      polyglot_programmer: {
        id: "polyglot_programmer",
        name: "Polyglot Programmer",
        description: "Achieve 50+ WPM in Finnish, English, and Swedish",
        icon: "fa-solid fa-language",
        category: "mastery",
        secret: false,
        progressTarget: 3,
        getProgress: function (stats) {
          if (!stats.languageWPM) return 0;

          let completedLanguages = 0;
          if (stats.languageWPM.english >= 50) completedLanguages++;
          if (stats.languageWPM.finnish >= 50) completedLanguages++;
          if (stats.languageWPM.swedish >= 50) completedLanguages++;

          return completedLanguages;
        },
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
            stats.languageWPM.swedish >= 50
          );
        },
      },

      down_the_rabbit_hole: {
        id: "down_the_rabbit_hole",
        name: "Down the Rabbit Hole",
        description: "Complete the Alice in Wonderland story",
        icon: "fa-solid fa-hat-wizard",
        category: "story",
        secret: true,
        check: (stats, gameData) => {
          // Check if this is Alice wordlist and Zen mode
          if (
            !gameData ||
            gameData.wordList !== "alice" ||
            gameData.mode !== "Zen Mode"
          ) {
            return false;
          }

          // Check if the full story was completed (all 254 words)
          return gameData.wordsTyped >= 254 && gameData.wordGoal >= 254;
        },
      },

      minimal_mind: {
        id: "minimal_mind",
        name: "Minimal Mind",
        description: "Complete a Zen Mode game with minimal UI enabled",
        icon: "fa-solid fa-eye-slash",
        category: "gameplay",
        secret: false,
        check: function (stats, gameData) {
          // Check if this is a Zen Mode game
          if (!gameData || gameData.mode !== "Zen Mode") {
            return false;
          }

          // Check if the game was completed successfully
          if (
            !gameData.wordsTyped ||
            gameData.wordsTyped < (gameData.wordGoal || 30)
          ) {
            return false;
          }

          // Check if minimal UI was enabled during the game
          const minimalUIEnabled =
            storageManager.getItem("nerdtype_hide_ui", "false") === "true";
          return minimalUIEnabled;
        },
      },

      flawless_victory: {
        id: "flawless_victory",
        name: "Flawless Victory",
        description: "Survive Hardcore Mode",
        icon: "fa-solid fa-skull",
        category: "gameplay",
        secret: false,
        check: function (stats, gameData) {
          // Check if this is a Hardcore Mode game
          if (!gameData || gameData.mode !== "Hardcore Mode") {
            return false;
          }

          // Check if the game was completed successfully (not ended due to mistake)
          if (
            !gameData.wordsTyped ||
            gameData.wordsTyped < (gameData.wordGoal || gameData.timeLimit)
          ) {
            return false;
          }

          // Check if the game ended with success (no mistakes)
          return gameData.success === true;
        },
      },

      season_1_veteran: {
        id: "season_1_veteran",
        name: "Season 1 Veteran",
        description: "Participated in Season 1 (July 1 - September 30, 2025)",
        icon: "fa-solid fa-flag-checkered",
        category: "seasonal",
        secret: false,
        check: function (stats, gameData) {
          // Check if the player is logged in
          const currentUser = window.getCurrentUser && window.getCurrentUser();
          if (!currentUser) {
            return false; // Achievement not available if user is not logged in
          }

          // Check if the player has data sharing enabled
          const dataShareEnabled = storageManager.isDataCollectionEnabled();
          if (!dataShareEnabled) {
            return false; // Achievement not available if data sharing is disabled
          }

          // Define Season 1 date range
          const season1Start = new Date("2025-07-01T00:00:00");
          const season1End = new Date("2025-09-30T23:59:59");

          // If we have gameData (current game), check if it's during Season 1
          if (gameData && gameData.timeLeft > 0) {
            // Only count completed games
            const currentDate = new Date();

            // Check if current date is within Season 1
            if (currentDate >= season1Start && currentDate <= season1End) {
              // Mark that the player played during Season 1
              if (!stats.playedDuringSeason1) {
                stats.playedDuringSeason1 = true;
                stats.season1PlayDate = currentDate.toISOString();
                // Save the data immediately
                this.saveData();
              }
              return true;
            }
          }

          // Check if player has already played during Season 1 (from saved stats)
          return stats.playedDuringSeason1 === true;
        },
      },

      season_2_veteran: {
        id: "season_2_veteran",
        name: "Back for More",
        description: "Participated in Season 2 (October 1 - December 31, 2025)",
        icon: "fa-solid fa-flag-checkered",
        category: "seasonal",
        secret: false,
        check: function (stats, gameData) {
          // Check if the player is logged in
          const currentUser = window.getCurrentUser && window.getCurrentUser();
          if (!currentUser) {
            return false; // Achievement not available if user is not logged in
          }

          // Check if the player has data sharing enabled
          const dataShareEnabled = storageManager.isDataCollectionEnabled();
          if (!dataShareEnabled) {
            return false; // Achievement not available if data sharing is disabled
          }

          // Define Season 2 date range
          const season2Start = new Date("2025-10-01T00:00:00");
          const season2End = new Date("2025-12-31T23:59:59");

          // If we have gameData (current game), check if it's during Season 2
          if (gameData && gameData.timeLeft > 0) {
            // Only count completed games
            const currentDate = new Date();

            // Check if current date is within Season 2
            if (currentDate >= season2Start && currentDate <= season2End) {
              // Mark that the player played during Season 2
              if (!stats.playedDuringSeason2) {
                stats.playedDuringSeason2 = true;
                stats.season2PlayDate = currentDate.toISOString();
                // Save the data immediately
                this.saveData();
              }
              return true;
            }
          }

          // Check if player has already played during Season 2 (from saved stats)
          return stats.playedDuringSeason2 === true;
        },
      },

      summer_sprint_champion: {
        id: "summer_sprint_champion",
        name: "Summer Sprint Champion",
        description: "Complete 100 games during Season 1",
        icon: "fa-solid fa-sun",
        category: "seasonal",
        secret: false,
        progressTarget: 100,
        getProgress: function (stats) {
          return stats.season1GamesCompleted || 0;
        },
        check: function (stats, gameData) {
          // Check if the player is logged in
          const currentUser = window.getCurrentUser && window.getCurrentUser();
          if (!currentUser) {
            return false; // Achievement not available if user is not logged in
          }

          // Check if the player has data sharing enabled
          const dataShareEnabled = storageManager.isDataCollectionEnabled();
          if (!dataShareEnabled) {
            return false; // Achievement not available if data sharing is disabled
          }

          // Define Season 1 date range
          const season1Start = new Date("2025-07-01T00:00:00");
          const season1End = new Date("2025-09-30T23:59:59");

          // If we have gameData (current game), check if it's during Season 1
          if (gameData && gameData.timeLeft > 0) {
            // Only count completed games
            const currentDate = new Date();

            // Check if current date is within Season 1
            if (currentDate >= season1Start && currentDate <= season1End) {
              // Initialize counter if not exists
              if (!stats.season1GamesCompleted) {
                stats.season1GamesCompleted = 0;
              }

              // Increment counter
              stats.season1GamesCompleted++;

              // Save the data immediately
              this.saveData();

              // Check if target reached
              return stats.season1GamesCompleted >= 100;
            }
          }

          // Check if player has already reached the target
          return (stats.season1GamesCompleted || 0) >= 100;
        },
      },

      frost_fingers: {
        id: "frost_fingers",
        name: "Frost Fingers",
        description: "Complete 100 games during Season 2",
        icon: "fa-solid fa-snowflake",
        category: "seasonal",
        secret: false,
        progressTarget: 100,
        getProgress: function (stats) {
          return stats.season2GamesCompleted || 0;
        },
        check: function (stats, gameData) {
          // Check if the player is logged in
          const currentUser = window.getCurrentUser && window.getCurrentUser();
          if (!currentUser) {
            return false; // Achievement not available if user is not logged in
          }

          // Check if the player has data sharing enabled
          const dataShareEnabled = storageManager.isDataCollectionEnabled();
          if (!dataShareEnabled) {
            return false; // Achievement not available if data sharing is disabled
          }

          // Define Season 2 date range
          const season2Start = new Date("2025-10-01T00:00:00");
          const season2End = new Date("2025-12-31T23:59:59");

          // If we have gameData (current game), check if it's during Season 2
          if (gameData && gameData.timeLeft > 0) {
            // Only count completed games
            const currentDate = new Date();

            // Check if current date is within Season 2
            if (currentDate >= season2Start && currentDate <= season2End) {
              // Initialize counter if not exists
              if (!stats.season2GamesCompleted) {
                stats.season2GamesCompleted = 0;
              }

              // Increment counter
              stats.season2GamesCompleted++;

              // Save the data immediately
              this.saveData();

              // Check if target reached
              return stats.season2GamesCompleted >= 100;
            }
          }

          // Check if player has already reached the target
          return (stats.season2GamesCompleted || 0) >= 100;
        },
      },

      let_him_cook: {
        id: "let_him_cook",
        name: "LET HIM COOK",
        description: "Type for over 2 minutes in any Classic mode game",
        icon: "fa-solid fa-fire-flame-curved",
        category: "gameplay",
        secret: false,
        check: function (stats, gameData) {
          if (!gameData || gameData.mode === "Zen Mode") {
            return false;
          }

          // Check if the game was completed successfully (timeLeft > 0)
          if (gameData.timeLeft <= 0) {
            return false;
          }

          // Check gameDurationSeconds for over 120 seconds (2 minutes)
          return (
            gameData.gameDurationSeconds && gameData.gameDurationSeconds > 120
          );
        },
      },

      i_know_kung_fu: {
        id: "i_know_kung_fu",
        name: "I Know Kung Fu",
        description: "Complete 30 words in a /prac session",
        icon: "fa-solid fa-user-ninja",
        category: "gameplay",
        secret: false,
        check: function (stats, gameData) {
          return stats.practiceWordsTyped >= 30;
        },
      },

      // Level milestone achievements
      level_10: {
        id: "level_10",
        name: "Young Padawan",
        description: "Reach level 10",
        icon: "fa-solid fa-star-half-stroke",
        category: "progression",
        secret: false,
        check: function () {
          if (!window.levelSystem) return false;
          const levelInfo = window.levelSystem.getLevelInfo();
          return levelInfo.level >= 10;
        },
      },

      level_25: {
        id: "level_25",
        name: "Unplugged",
        description: "Reach level 25",
        icon: "fa-solid fa-certificate",
        category: "progression",
        secret: false,
        check: function () {
          if (!window.levelSystem) return false;
          const levelInfo = window.levelSystem.getLevelInfo();
          return levelInfo.level >= 25;
        },
      },

      level_50: {
        id: "level_50",
        name: "There is No Spoon",
        description: "Reach level 50",
        icon: "fa-solid fa-gem",
        category: "progression",
        secret: false,
        check: function () {
          if (!window.levelSystem) return false;
          const levelInfo = window.levelSystem.getLevelInfo();
          return levelInfo.level >= 50;
        },
      },

      completionist: {
        id: "completionist",
        name: "Completionist",
        description: "Unlock all core achievements",
        icon: "fa-solid fa-shield-halved",
        category: "meta",
        secret: false,
        check: () => false,
      },
    };

    // Initialize the notification system
    this.initNotificationSystem();

    // Update stats based on current date
    this.updateDailyStats();

    // Save the properly structured data to ensure consistency
    this.saveData();
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
          font-family: jetbrains-mono, monospace;
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
          font-family: "jetbrains-mono";
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
        i {
        background-color: inherit;
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
    // Check if the date has changed and reset counter if needed
    const today = new Date().toLocaleDateString();
    if (this.achievementsData.stats.lastGameDate !== today) {
      // Reset the counter if it's a new day
      this.achievementsData.stats.gamesPlayedToday = 0;
      this.achievementsData.stats.lastGameDate = today;
    }

    // Now increment the counter after potential reset
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
      // Track game completion for achievements

      if (
        this.achievementsData.stats.languageWPM &&
        this.achievementsData.stats.languageWPM[language] !== undefined
      ) {
        // Update if new WPM is higher
        if (gameData.wpm > this.achievementsData.stats.languageWPM[language]) {
          this.achievementsData.stats.languageWPM[language] = gameData.wpm;
          // Updated language WPM for tracking
        }

        // Track language WPM stats
      }
    }

    // Update best hardcore progress if this was a hardcore game
    if (gameData && gameData.mode === "Hardcore Mode" && gameData.wordsTyped) {
      const hardcoreProgress = gameData.wordsTyped;
      if (hardcoreProgress > this.achievementsData.stats.bestHardcoreProgress) {
        this.achievementsData.stats.bestHardcoreProgress = hardcoreProgress;
      }
    }

    // Save date of this game (already set earlier if it was a new day)
    this.achievementsData.stats.lastGameDate = today;

    // Check for newly unlocked achievements
    this.checkAchievements(gameData);

    // Language WPM stats tracked

    // Save updated data
    this.saveData();

    // Sync to Firebase if possible (async, don't block game flow)
    if (this.canSyncToFirebase()) {
      this.syncAchievementsToFirebase().catch((error) => {
        console.error("❌ Failed to sync achievements to Firebase:", error);
      });
    }
  }

  // Check for any newly unlocked achievements
  checkAchievements(gameData = null) {
    const newlyUnlocked = [];

    // First pass: Check all achievements EXCEPT completionist
    Object.values(this.achievements).forEach((achievement) => {
      const achievementId = achievement.id;

      // Skip completionist for now - we'll check it separately
      if (achievementId === "completionist") {
        return;
      }

      // Skip if already unlocked
      if (this.achievementsData.unlockedAchievements[achievementId]) {
        return;
      }

      try {
        // Check if achievement conditions are met
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

    // Second pass: Check completionist achievement AFTER all others
    const completionistAchievement = this.achievements.completionist;
    if (completionistAchievement) {
      try {
        // Get all achievement IDs except completionist and seasonal achievements
        const allOtherAchievementIds = Object.keys(this.achievements).filter(
          (id) =>
            id !== "completionist" &&
            this.achievements[id].category !== "seasonal",
        );

        // Check completionist achievement progress

        // Count how many are unlocked
        const unlockedCount = allOtherAchievementIds.filter(
          (id) => this.achievementsData.unlockedAchievements[id] !== undefined,
        ).length;

        // Check if ALL other achievements are unlocked
        const allOthersUnlocked = allOtherAchievementIds.every(
          (id) => this.achievementsData.unlockedAchievements[id] !== undefined,
        );

        console.log("All others unlocked?", allOthersUnlocked);

        const isCurrentlyUnlocked =
          this.achievementsData.unlockedAchievements.completionist;

        if (allOthersUnlocked && allOtherAchievementIds.length > 0) {
          // Should be unlocked
          if (!isCurrentlyUnlocked) {
            // Mark completionist as unlocked
            this.achievementsData.unlockedAchievements.completionist = {
              unlockedAt: new Date().toISOString(),
            };

            // Add to newly unlocked list
            newlyUnlocked.push(completionistAchievement);
            console.log("Completionist achievement unlocked!");
          }
        } else if (isCurrentlyUnlocked) {
          // Should NOT be unlocked but currently is - revoke it
          delete this.achievementsData.unlockedAchievements.completionist;
          console.log(
            "🔄 Completionist achievement revoked due to new achievements being added",
          );
        }
      } catch (error) {
        console.error("Error checking completionist achievement:", error);
      }
    }

    // Show notifications for new achievements
    newlyUnlocked.forEach((achievement) => {
      this.showNotification(achievement);
    });

    return newlyUnlocked;
  }

  // sound toggle
  setAchievementSoundEnabled(enabled) {
    this.soundEnabled = enabled;

    // If achievementSound exists globally, update its muted status
    if (typeof window.achievementSound !== "undefined") {
      window.achievementSound.muted = !enabled;
    }
  }

  // Send achievement unlock to Discord via n8n webhook
  sendAchievementToDiscord(achievement) {
    // Check if user is logged in
    const username = localStorage.getItem("nerdtype_username");
    if (
      !username ||
      username === "Anonymous" ||
      username === "runner" ||
      username.trim() === ""
    ) {
      return;
    }

    // Check if Discord webhook is enabled
    const discordWebhookEnabled = localStorage.getItem(
      "discord_webhook_enabled",
    );
    const shouldSendToDiscord =
      discordWebhookEnabled === null || discordWebhookEnabled === "true";

    if (!shouldSendToDiscord) {
      return;
    }

    // Get current user's stats for additional context
    const userStats = this.achievementsData.stats;

    // Prepare webhook payload
    const webhookData = {
      type: "achievement",
      username: username,
      achievement: {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        secret: achievement.secret || false,
      },
      userStats: {
        highestScore: userStats.highestScore,
        highestWPM: userStats.highestWPM,
        highestAccuracy: userStats.highestAccuracy,
        gamesPlayedToday: userStats.gamesPlayedToday,
      },
      timestamp: new Date().toISOString(),
    };

    // Send to webhooks (Discord and Dashboard)
    Promise.all([
      fetch(
        "https://n8n.n8nmerkks.uk/webhook/69ca988a-ac61-45c1-aad3-72293724d749",
        {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookData),
        },
      ),
      fetch("https://n8n.n8nmerkks.uk/webhook/typing-achievements-feed", {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookData),
      }),
    ])
      .then(() => {
        console.log("Achievement sent to Discord and Dashboard");
      })
      .catch((error) => {
        console.error("Error sending achievement:", error);
      });
  }

  // Show achievement unlock notification
  showNotification(achievement) {
    // Send Discord webhook notification for achievement unlock
    this.sendAchievementToDiscord(achievement);

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
    if (this.soundEnabled !== false) {
      const achievementSound = window.getAchievementSound?.();
      if (achievementSound) {
        achievementSound.currentTime = 0;
        achievementSound
          .play()
          .catch((e) => console.log("Sound play prevented:", e));
      }
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

  // Get best hardcore progress
  getBestHardcoreProgress() {
    return this.achievementsData.stats.bestHardcoreProgress || 0;
  }

  // Update hardcore progress only (for failed hardcore games)
  updateHardcoreProgress(gameData) {
    if (gameData && gameData.mode === "Hardcore Mode" && gameData.wordsTyped) {
      const hardcoreProgress = gameData.wordsTyped;
      if (hardcoreProgress > this.achievementsData.stats.bestHardcoreProgress) {
        this.achievementsData.stats.bestHardcoreProgress = hardcoreProgress;
        this.saveData();
      }
    }
  }

  // Reset all achievements (called when clearing scoreboard)
  resetAchievements() {
    this.achievementsData = {
      unlockedAchievements: {},
      stats: this.getDefaultStats(),
      pendingNotifications: [],
    };
    this.saveData();
  }

  // Smart reset for logout - preserves guest achievements if returning to guest mode
  resetToGuestMode() {
    // Check if there might be legitimate guest achievements to preserve
    const currentData =
      JSON.parse(localStorage.getItem("nerdtype_achievements")) || {};

    // If we have existing guest achievements (from before login), try to restore them
    const guestBackup =
      JSON.parse(localStorage.getItem("nerdtype_guest_achievements_backup")) ||
      null;

    if (
      guestBackup &&
      guestBackup.unlockedAchievements &&
      Object.keys(guestBackup.unlockedAchievements).length > 0
    ) {
      // Restore previous guest achievements
      this.achievementsData = {
        ...guestBackup,
        pendingNotifications: [], // Clear any pending notifications
      };
      console.log("🔄 Restored previous guest achievements");
    } else {
      // No guest backup, reset to fresh state but keep any current achievements that might be from guest play
      const wasInGuestMode =
        localStorage.getItem("nerdtype_guest_mode") === "true";
      if (!wasInGuestMode) {
        // We're transitioning from logged-in to guest, reset completely
        this.resetAchievements();
        console.log("🆕 Started fresh guest session");
      } else {
        // Already in guest mode, keep current achievements
        console.log("🏠 Staying in guest mode, keeping current achievements");
      }
    }

    this.saveData();
  }

  // Save achievement data to localStorage
  saveData() {
    storageManager.setAchievements(this.achievementsData);
  }

  // Firebase Achievement Sync Methods
  async syncAchievementsToFirebase() {
    if (!this.canSyncToFirebase()) {
      return;
    }

    try {
      const currentUser = window.getCurrentUser();
      if (!currentUser) return;

      const { ref, set } = window.firebaseModules;
      const userAchievementsRef = ref(
        window.database,
        `users/${currentUser.uid}/achievements`,
      );

      // Sync ALL achievements including seasonal ones (seasonal require login to earn, so safe to sync)
      const syncableAchievements = {
        ...this.achievementsData.unlockedAchievements,
      };

      // Sync ALL stats including seasonal ones (since seasonal achievements require login)
      const syncableStats = { ...this.achievementsData.stats };

      const syncData = {
        unlockedAchievements: syncableAchievements,
        stats: syncableStats,
        lastSyncAt: new Date().toISOString(),
      };

      await set(userAchievementsRef, syncData);
      console.log("✅ Achievements synced to Firebase");
    } catch (error) {
      console.error("❌ Error syncing achievements to Firebase:", error);
    }
  }

  async loadAchievementsFromFirebase() {
    if (!this.canSyncToFirebase()) {
      return null;
    }

    try {
      const currentUser = window.getCurrentUser();
      if (!currentUser) return null;

      const { ref, get } = window.firebaseModules;
      const userAchievementsRef = ref(
        window.database,
        `users/${currentUser.uid}/achievements`,
      );
      const snapshot = await get(userAchievementsRef);

      if (snapshot.exists()) {
        const cloudData = snapshot.val();
        console.log("📥 Loaded achievements from Firebase:", cloudData);
        return cloudData;
      }
      return null;
    } catch (error) {
      console.error("❌ Error loading achievements from Firebase:", error);
      return null;
    }
  }

  canSyncToFirebase() {
    // Check if user is logged in
    const currentUser = window.getCurrentUser && window.getCurrentUser();
    if (!currentUser) return false;

    // Check if Firebase is available
    if (!window.firebaseModules || !window.database) return false;

    // Always allow achievements sync if user is logged in (personal data)
    return true;
  }

  getDefaultStats() {
    return {
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
        alice: 0,
      },
      bestHardcoreProgress: 0,
      practiceWordsTyped: 0,
    };
  }

  async mergeCloudAndLocalAchievements(
    wasGuestMode = null,
    prevUsername = null,
  ) {
    if (!this.canSyncToFirebase()) {
      console.log("🔒 Cannot sync - using local achievements only");
      return;
    }

    try {
      console.log("🔄 Merging cloud and local achievements...");

      // Use passed parameters if available, otherwise check localStorage
      const guestMode =
        wasGuestMode !== null
          ? wasGuestMode
          : localStorage.getItem("nerdtype_guest_mode") === "true";
      const localUsername =
        prevUsername !== null
          ? prevUsername
          : localStorage.getItem("nerdtype_username");
      const currentUser = window.getCurrentUser();
      const currentUsername = currentUser
        ? currentUser.email.split("@")[0]
        : null;

      // If there are local achievements but they're from guest mode or different user,
      // don't merge them - start fresh from cloud only
      const hasLocalAchievements =
        Object.keys(this.achievementsData.unlockedAchievements).length > 0;
      const shouldIgnoreLocal =
        hasLocalAchievements &&
        (guestMode === true ||
          (localUsername &&
            localUsername !== currentUsername &&
            localUsername === "runner"));

      if (shouldIgnoreLocal) {
        console.log("🚫 Ignoring local achievements from guest/different user");

        // If these are legitimate guest achievements, back them up before clearing
        if (guestMode === true && hasLocalAchievements) {
          localStorage.setItem(
            "nerdtype_guest_achievements_backup",
            JSON.stringify(this.achievementsData),
          );
          console.log("💾 Backed up guest achievements before login");
        }

        // Load only cloud data, ignore local
        const cloudData = await this.loadAchievementsFromFirebase();
        if (cloudData) {
          this.achievementsData.unlockedAchievements =
            cloudData.unlockedAchievements || {};
          this.achievementsData.stats =
            cloudData.stats || this.getDefaultStats();
          this.saveData();
          console.log("✅ Loaded achievements from cloud only");
          this.checkAchievements();
          return;
        } else {
          // No cloud data, reset to fresh state for this user
          this.resetAchievements();
          console.log("✅ Started fresh achievement state for new user");
          return;
        }
      }

      // Load cloud achievements
      const cloudData = await this.loadAchievementsFromFirebase();
      if (!cloudData) {
        console.log("📤 No cloud data found - uploading local achievements");
        await this.syncAchievementsToFirebase();
        return;
      }

      // Merge achievements (keep the earliest unlock date for each achievement)
      const mergedAchievements = {
        ...this.achievementsData.unlockedAchievements,
      };

      Object.entries(cloudData.unlockedAchievements || {}).forEach(
        ([achievementId, cloudUnlock]) => {
          const localUnlock = mergedAchievements[achievementId];

          if (!localUnlock) {
            // Achievement only exists in cloud
            mergedAchievements[achievementId] = cloudUnlock;
            console.log(`📥 Restored achievement from cloud: ${achievementId}`);
          } else if (cloudUnlock.unlockedAt && localUnlock.unlockedAt) {
            // Both exist - keep the earlier unlock date
            const cloudDate = new Date(cloudUnlock.unlockedAt);
            const localDate = new Date(localUnlock.unlockedAt);

            if (cloudDate < localDate) {
              mergedAchievements[achievementId] = cloudUnlock;
              console.log(
                `📅 Used earlier cloud unlock date for: ${achievementId}`,
              );
            }
          }
        },
      );

      // Merge stats (take the highest values)
      const mergedStats = { ...this.achievementsData.stats };
      const cloudStats = cloudData.stats || {};

      // Merge numeric stats (take highest)
      ["highestScore", "highestWPM", "highestAccuracy"].forEach((stat) => {
        if (cloudStats[stat] && cloudStats[stat] > mergedStats[stat]) {
          mergedStats[stat] = cloudStats[stat];
          console.log(`📊 Updated ${stat} from cloud: ${cloudStats[stat]}`);
        }
      });

      // Merge language WPM stats (take highest for each language)
      if (cloudStats.languageWPM) {
        Object.entries(cloudStats.languageWPM).forEach(([language, wpm]) => {
          if (wpm > (mergedStats.languageWPM[language] || 0)) {
            mergedStats.languageWPM[language] = wpm;
            console.log(`🌐 Updated ${language} WPM from cloud: ${wpm}`);
          }
        });
      }

      // Update local data with merged results
      this.achievementsData.unlockedAchievements = mergedAchievements;
      this.achievementsData.stats = mergedStats;

      // Save locally and sync back to cloud
      this.saveData();
      await this.syncAchievementsToFirebase();

      console.log("✅ Achievement merge completed successfully");

      // Check for any newly completed achievements after merge
      this.checkAchievements();
    } catch (error) {
      console.error("❌ Error merging achievements:", error);
    }
  }

  // Manual sync method for user control or testing
  async forceSyncToFirebase() {
    if (!this.canSyncToFirebase()) {
      console.log(
        "🔒 Cannot sync - user not logged in or data sharing disabled",
      );
      return { success: false, message: "Sync not available" };
    }

    try {
      await this.syncAchievementsToFirebase();
      return { success: true, message: "Achievements synced successfully" };
    } catch (error) {
      console.error("❌ Force sync failed:", error);
      return { success: false, message: "Sync failed: " + error.message };
    }
  }

  // Method to get sync status
  getSyncStatus() {
    const canSync = this.canSyncToFirebase();
    const user = window.getCurrentUser && window.getCurrentUser();

    return {
      canSync,
      isLoggedIn: !!user,
      dataShareEnabled:
        localStorage.getItem("data_collection_enabled") !== "false",
      firebaseReady: !!(window.firebaseModules && window.database),
      lastSyncAt: this.achievementsData.lastSyncAt || null,
    };
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

    this._renderAchievementsToContainer(container, achievements);
  }

  // Render core achievements to a container element
  renderCoreAchievementsToContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear existing content
    container.innerHTML = "";

    // Get core achievements (all except seasonal), sorted by unlock status
    const coreAchievements = this.getAllAchievements()
      .filter((achievement) => achievement.category !== "seasonal")
      .sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        if (a.unlocked && b.unlocked) {
          return new Date(b.unlockedAt) - new Date(a.unlockedAt);
        }
        return 0;
      });

    this._renderAchievementsToContainer(container, coreAchievements);

    // Update core achievement counter
    const earnedCount = coreAchievements.filter((a) => a.unlocked).length;
    const totalCount = coreAchievements.length;
    const counterElement = document.getElementById("core-achievement-counter");
    if (counterElement) {
      counterElement.textContent = `[${earnedCount}/${totalCount}]`;
    }
  }

  // Render seasonal achievements to a container element
  renderSeasonalAchievementsToContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear existing content
    container.innerHTML = "";

    // Get seasonal achievements, sorted by unlock status
    const seasonalAchievements = this.getAllAchievements()
      .filter((achievement) => achievement.category === "seasonal")
      .sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        if (a.unlocked && b.unlocked) {
          return new Date(b.unlockedAt) - new Date(a.unlockedAt);
        }
        return 0;
      });

    this._renderAchievementsToContainer(container, seasonalAchievements);

    // Update seasonal achievement counter
    const earnedCount = seasonalAchievements.filter((a) => a.unlocked).length;
    const totalCount = seasonalAchievements.length;
    const counterElement = document.getElementById(
      "seasonal-achievement-counter",
    );
    if (counterElement) {
      counterElement.textContent = `[${earnedCount}/${totalCount}]`;
    }
  }

  // Private method to render achievements to a container
  _renderAchievementsToContainer(container, achievements) {
    // Create a row for the achievements
    const row = document.createElement("div");
    row.className = "row";
    container.appendChild(row);

    // Add each achievement
    achievements.forEach((achievement) => {
      const col = document.createElement("div");
      col.className = "col-12 col-md-6 col-lg-4 pt-3";

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
        // Create a container for the achievement content
        const contentDiv = document.createElement("div");
        contentDiv.style.color = "#c0caf5";

        // Add the description
        const description = document.createElement("div");
        description.textContent = achievement.description;
        description.style.marginBottom = "10px";

        // Dynamically adjust font size based on description length
        if (achievement.description.length > 30) {
          description.style.fontSize = "0.85rem";
        }
        if (achievement.description.length > 45) {
          description.style.fontSize = "0.8rem";
        }
        if (achievement.description.length > 60) {
          description.style.fontSize = "0.75rem";
        }

        // Add the unlock date
        const unlockDate = document.createElement("div");
        const date = new Date(achievement.unlockedAt);
        const formattedDate = date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        unlockDate.textContent = `Unlocked: ${formattedDate}`;
        unlockDate.style.fontSize = "0.7rem";
        unlockDate.style.color = "#565f89";
        unlockDate.style.marginTop = "6px";
        unlockDate.style.marginBottom = "0";
        unlockDate.style.borderTop = "1px solid #3b4261";
        unlockDate.style.paddingTop = "6px";
        unlockDate.style.paddingBottom = "0";

        contentDiv.appendChild(description);
        contentDiv.appendChild(unlockDate);
        body.appendChild(contentDiv);
      } else {
        // For locked achievements, show progress or "Locked"
        const lockedIcon = document.createElement("i");
        lockedIcon.className = "fa-solid fa-lock me-2";

        const lockedText = document.createElement("span");

        // For secret achievements, show different text
        if (achievement.secret) {
          lockedText.textContent = "Secret Achievement";
          body.appendChild(lockedIcon);
          body.appendChild(lockedText);
        } else {
          // Check if this achievement has progress tracking
          if (achievement.progressTarget && achievement.getProgress) {
            const currentProgress = achievement.getProgress(
              this.achievementsData.stats,
            );
            const progressPercent = Math.min(
              (currentProgress / achievement.progressTarget) * 100,
              100,
            );

            // Create progress container
            const progressContainer = document.createElement("div");
            progressContainer.style.width = "100%";

            // Progress text
            const progressText = document.createElement("div");
            progressText.textContent = `${currentProgress}/${achievement.progressTarget}`;
            progressText.style.fontSize = "0.85rem";
            progressText.style.marginBottom = "8px";
            progressText.style.color = "#c0caf5";

            // Special handling for polyglot programmer achievement
            if (achievement.id === "polyglot_programmer") {
              const stats = this.achievementsData.stats;
              const languages = [
                {
                  name: "English",
                  wpm: stats.languageWPM?.english || 0,
                  completed: (stats.languageWPM?.english || 0) >= 50,
                },
                {
                  name: "Finnish",
                  wpm: stats.languageWPM?.finnish || 0,
                  completed: (stats.languageWPM?.finnish || 0) >= 50,
                },
                {
                  name: "Swedish",
                  wpm: stats.languageWPM?.swedish || 0,
                  completed: (stats.languageWPM?.swedish || 0) >= 50,
                },
              ];

              // Create language progress list
              const languageList = document.createElement("div");
              languageList.style.fontSize = "0.75rem";
              languageList.style.marginTop = "8px";
              languageList.style.display = "flex";
              languageList.style.flexDirection = "row";
              languageList.style.flexWrap = "wrap";
              languageList.style.justifyContent = "center";
              languageList.style.gap = "12px";
              languageList.style.color = "#c0caf5";

              languages.forEach((lang) => {
                const langItem = document.createElement("div");
                langItem.style.display = "flex";
                langItem.style.alignItems = "center";
                langItem.style.justifyContent = "center";

                const icon = document.createElement("i");
                icon.className = lang.completed
                  ? "fa-solid fa-circle-check"
                  : "fa-regular fa-circle";
                icon.style.marginRight = "6px";
                icon.style.color = lang.completed ? "#9ece6a" : "#565f89";

                const text = document.createTextNode(lang.name);

                langItem.appendChild(icon);
                langItem.appendChild(text);
                languageList.appendChild(langItem);
              });

              progressContainer.appendChild(progressText);
              progressContainer.appendChild(languageList);
            } else {
              // Progress bar container
              const progressBarContainer = document.createElement("div");
              progressBarContainer.style.width = "100%";
              progressBarContainer.style.height = "8px";
              progressBarContainer.style.backgroundColor = "#3b4261";
              progressBarContainer.style.borderRadius = "4px";
              progressBarContainer.style.overflow = "hidden";

              // Progress bar fill
              const progressBarFill = document.createElement("div");
              progressBarFill.style.width = `${progressPercent}%`;
              progressBarFill.style.height = "100%";
              progressBarFill.style.backgroundColor = "#bb9af7";
              progressBarFill.style.transition = "width 0.3s ease";

              progressBarContainer.appendChild(progressBarFill);
              progressContainer.appendChild(progressText);
              progressContainer.appendChild(progressBarContainer);
            }

            body.appendChild(progressContainer);
          } else {
            lockedText.textContent = "Locked";
            body.appendChild(lockedIcon);
            body.appendChild(lockedText);
          }
        }
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

// Make it globally available for Firebase integration
window.achievementSystem = achievementSystem;

// Add method to clear achievements when switching users (seasonal now come from Firebase)
window.clearAchievementsForUserSwitch = function () {
  console.log(
    "🧹 Clearing achievements for user switch - all achievements will come from cloud",
  );
  achievementSystem.resetAchievements();
};

// Simple method to load achievements from cloud without complex merging
achievementSystem.loadUserAchievementsFromCloud = async function () {
  if (!this.canSyncToFirebase()) {
    console.log("🔒 Cannot load from cloud - staying with empty achievements");
    return;
  }

  try {
    console.log("📥 Loading user achievements from cloud...");
    const cloudData = await this.loadAchievementsFromFirebase();

    if (cloudData) {
      // Load ALL achievements from cloud (including seasonal)
      this.achievementsData.unlockedAchievements =
        cloudData.unlockedAchievements || {};
      this.achievementsData.stats = cloudData.stats || this.getDefaultStats();
      this.saveData();

      console.log("✅ Loaded achievements from cloud successfully");
      this.checkAchievements(); // Check for any newly completed achievements
    } else {
      console.log("📭 No cloud achievements found - starting fresh");
    }
  } catch (error) {
    console.error("❌ Error loading achievements from cloud:", error);
  }
};

export default achievementSystem;
