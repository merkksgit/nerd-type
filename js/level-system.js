// level-system.js - Handles player leveling and XP progression for NerdType

class LevelSystem {
  constructor() {
    this.levelData = this.loadLevelData();
  }

  /**
   * Loads level data from localStorage
   * @returns {Object} Level data object with currentLevel, currentXP, and totalXP
   */
  loadLevelData() {
    const stored = localStorage.getItem("nerdtype_level_data");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error("Error loading level data:", error);
      }
    }

    return {
      currentLevel: 1,
      currentXP: 0,
      totalXP: 0,
    };
  }

  /**
   * Saves level data to localStorage
   */
  saveLevelData() {
    try {
      localStorage.setItem(
        "nerdtype_level_data",
        JSON.stringify(this.levelData),
      );
    } catch (error) {
      console.error("Error saving level data:", error);
    }
  }

  /**
   * Calculates XP required to reach a specific level
   * Uses polynomial scaling: baseXP * level^1.5
   * @param {number} level - Target level
   * @returns {number} XP required for that level
   */
  getXPForLevel(level) {
    const baseXP = 1000;
    return Math.floor(baseXP * Math.pow(level, 1.5));
  }

  /**
   * Calculates total XP needed from level 1 to reach a specific level
   * @param {number} targetLevel - Target level
   * @returns {number} Total cumulative XP required
   */
  getTotalXPForLevel(targetLevel) {
    let total = 0;
    for (let i = 1; i < targetLevel; i++) {
      total += this.getXPForLevel(i);
    }
    return total;
  }

  /**
   * Calculates level from total XP
   * @param {number} totalXP - Total XP earned
   * @returns {Object} Object with level and XP progress in that level
   */
  getLevelFromXP(totalXP) {
    let level = 1;
    let xpInCurrentLevel = totalXP;

    while (xpInCurrentLevel >= this.getXPForLevel(level)) {
      xpInCurrentLevel -= this.getXPForLevel(level);
      level++;
    }

    return {
      level,
      currentXP: xpInCurrentLevel,
      xpForNextLevel: this.getXPForLevel(level),
    };
  }

  /**
   * Awards XP to the player based on game performance
   * Only called for victories (timeLeft > 0) or completed Zen Mode games
   * @param {Object} gameData - Game result data
   * @returns {Object} Result object with XP gained and level-up info
   */
  awardXP(gameData) {
    // Check if user is logged in
    const currentUser = window.getCurrentUser && window.getCurrentUser();
    if (!currentUser) {
      console.log("🚫 No XP awarded - user not logged in");
      return {
        xpGained: 0,
        leveledUp: false,
        message: "Login required to earn XP",
      };
    }

    // Check if this is a victory
    const isVictory =
      gameData.mode === "Zen Mode"
        ? gameData.wordsTyped >= (gameData.wordGoal || 30)
        : gameData.timeLeft > 0;

    if (!isVictory) {
      console.log("🚫 No XP awarded - game was lost or not completed");
      return {
        xpGained: 0,
        leveledUp: false,
        message: "No XP for losses",
      };
    }

    // Calculate XP based on game mode
    let xpGained = 0;

    if (gameData.mode === "Zen Mode") {
      // For Zen Mode: base XP on WPM and accuracy since there's no score
      const wpm = parseFloat(gameData.wpm) || 0;
      const accuracy = parseFloat(gameData.accuracy) || 100;
      const wordsTyped = gameData.wordsTyped || 30;

      // XP formula for Zen Mode: (WPM * accuracy² * words typed) / 3
      // Squared accuracy rewards precision, division by 3 balances with other modes
      xpGained = Math.floor(
        (wpm * Math.pow(accuracy / 100, 2) * wordsTyped) / 3,
      );
    } else {
      // For Classic/Hard/etc modes: score * difficultyMultiplier
      const baseXP = gameData.score || 0;
      const multiplier = gameData.difficultyMultiplier || 1.0;
      xpGained = Math.floor(baseXP * multiplier);
    }

    if (xpGained <= 0) {
      return {
        xpGained: 0,
        leveledUp: false,
        message: "No XP gained",
      };
    }

    // Store previous level
    const previousLevel = this.levelData.currentLevel;
    const previousXP = this.levelData.currentXP;

    // Add XP
    this.levelData.currentXP += xpGained;
    this.levelData.totalXP += xpGained;

    // Check for level ups
    let levelsGained = 0;
    let xpForNextLevel = this.getXPForLevel(this.levelData.currentLevel);

    while (this.levelData.currentXP >= xpForNextLevel) {
      this.levelData.currentXP -= xpForNextLevel;
      this.levelData.currentLevel++;
      levelsGained++;
      xpForNextLevel = this.getXPForLevel(this.levelData.currentLevel);

      console.log(`🎉 Level Up! Now level ${this.levelData.currentLevel}`);
    }

    // Save to localStorage
    this.saveLevelData();

    // Sync to Firebase if available
    if (this.canSyncToFirebase()) {
      this.syncToFirebase().catch((error) => {
        console.error("❌ Failed to sync level data to Firebase:", error);
      });
    }

    // Show level-up toast notification
    if (levelsGained > 0) {
      const milestones = [10, 25, 50];
      const isMilestone = milestones.includes(this.levelData.currentLevel);

      this.showLevelUpToast(
        this.levelData.currentLevel,
        levelsGained,
        isMilestone,
      );

      // Check for level milestone achievements
      if (window.achievementSystem) {
        this.checkLevelAchievements(this.levelData.currentLevel);
      }
    }

    return {
      xpGained,
      leveledUp: levelsGained > 0,
      levelsGained,
      previousLevel,
      newLevel: this.levelData.currentLevel,
      currentXP: this.levelData.currentXP,
      xpForNextLevel,
      totalXP: this.levelData.totalXP,
    };
  }

  /**
   * Checks and unlocks level milestone achievements
   * @param {number} level - Current level
   */
  checkLevelAchievements(level) {
    const milestones = [10, 25, 50];
    if (milestones.includes(level) && window.achievementSystem) {
      window.achievementSystem.checkAchievements();
    }
  }

  /**
   * Shows a toast notification for level up
   * @param {number} newLevel - The new level reached
   * @param {number} levelsGained - Number of levels gained
   * @param {boolean} isMilestone - Whether this level is a milestone (10, 25, 50)
   */
  showLevelUpToast(newLevel, levelsGained, isMilestone = false) {
    // Use achievement system's notification system if available
    if (
      window.achievementSystem &&
      window.achievementSystem.notificationContainer
    ) {
      const notification = document.createElement("div");
      notification.className = "achievement-notification";

      const levelText =
        levelsGained > 1
          ? `Levels ${newLevel - levelsGained + 1}-${newLevel}`
          : `Level ${newLevel}`;

      notification.innerHTML = `
        <div class="icon">
          <i class="fa-solid fa-star"></i>
        </div>
        <div class="content">
          <div class="title">Level Up!</div>
          <div class="description">${levelText} Reached</div>
        </div>
      `;

      window.achievementSystem.notificationContainer.appendChild(notification);

      // Play level-up sound if enabled, but skip if this is a milestone level
      // to give priority to achievement sound
      const masterSoundEnabled = localStorage.getItem("master_sound_enabled");
      const shouldPlaySound =
        masterSoundEnabled === null || masterSoundEnabled !== "false";

      if (shouldPlaySound && !isMilestone) {
        this.playLevelUpSound();
      }

      // Trigger animation
      setTimeout(() => {
        notification.classList.add("show");
      }, 10);

      // Auto-remove after delay
      setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 4000);
    }
  }

  /**
   * Plays level-up sound
   */
  playLevelUpSound() {
    try {
      const audio = new Audio("../sounds/levelup.wav");
      audio.volume = 0.3;
      audio.play().catch((error) => {
        console.log("Could not play level-up sound:", error);
      });
    } catch (error) {
      console.log("Error playing level-up sound:", error);
    }
  }

  /**
   * Gets current level progress as a percentage
   * @returns {number} Progress percentage (0-100)
   */
  getLevelProgress() {
    const xpForNextLevel = this.getXPForLevel(this.levelData.currentLevel);
    return (this.levelData.currentXP / xpForNextLevel) * 100;
  }

  /**
   * Gets formatted level information for display
   * @returns {Object} Formatted level data
   */
  getLevelInfo() {
    const xpForNextLevel = this.getXPForLevel(this.levelData.currentLevel);
    const progress = this.getLevelProgress();

    return {
      level: this.levelData.currentLevel,
      currentXP: this.levelData.currentXP,
      xpForNextLevel,
      totalXP: this.levelData.totalXP,
      progress: parseFloat(progress.toFixed(1)),
    };
  }

  /**
   * Checks if Firebase sync is available
   * @returns {boolean} True if Firebase sync is possible
   */
  canSyncToFirebase() {
    const currentUser = window.getCurrentUser && window.getCurrentUser();
    if (!currentUser) return false;

    if (!window.firebaseModules || !window.database) return false;

    return true;
  }

  /**
   * Syncs level data to Firebase
   */
  async syncToFirebase() {
    if (!this.canSyncToFirebase()) {
      return;
    }

    try {
      const currentUser = window.getCurrentUser();
      if (!currentUser) return;

      const { ref, set } = window.firebaseModules;
      const levelDataRef = ref(
        window.database,
        `users/${currentUser.uid}/levelData`,
      );

      const syncData = {
        ...this.levelData,
        lastSyncAt: new Date().toISOString(),
      };

      await set(levelDataRef, syncData);
      console.log("✅ Level data synced to Firebase");
    } catch (error) {
      console.error("❌ Error syncing level data to Firebase:", error);
      throw error;
    }
  }

  /**
   * Loads level data from Firebase
   */
  async loadFromFirebase() {
    if (!this.canSyncToFirebase()) {
      return null;
    }

    try {
      const currentUser = window.getCurrentUser();
      if (!currentUser) return null;

      const { ref, get } = window.firebaseModules;
      const levelDataRef = ref(
        window.database,
        `users/${currentUser.uid}/levelData`,
      );

      const snapshot = await get(levelDataRef);

      if (snapshot.exists()) {
        const cloudData = snapshot.val();
        console.log("📥 Loaded level data from Firebase:", cloudData);
        return cloudData;
      }

      return null;
    } catch (error) {
      console.error("❌ Error loading level data from Firebase:", error);
      return null;
    }
  }

  /**
   * Loads user's level data from Firebase after login
   */
  async loadUserLevelDataFromCloud() {
    if (!this.canSyncToFirebase()) {
      console.log("🔒 Cannot load from cloud - staying with local data");
      return;
    }

    try {
      console.log("📥 Loading user level data from cloud...");
      const cloudData = await this.loadFromFirebase();

      if (cloudData) {
        this.levelData = {
          currentLevel: cloudData.currentLevel || 1,
          currentXP: cloudData.currentXP || 0,
          totalXP: cloudData.totalXP || 0,
        };
        this.saveLevelData();
        console.log("✅ Loaded level data from cloud successfully");
      } else {
        console.log(
          "📭 No cloud level data found - syncing local data to cloud",
        );
        await this.syncToFirebase();
      }
    } catch (error) {
      console.error("❌ Error loading level data from cloud:", error);
    }
  }

  /**
   * Resets level data (for logout, user switch, or debug purposes)
   */
  resetLevelData() {
    this.levelData = {
      currentLevel: 1,
      currentXP: 0,
      totalXP: 0,
    };
    this.saveLevelData();
    console.log("🔄 Level data reset");

    // Sync to Firebase if user is logged in
    if (this.canSyncToFirebase()) {
      this.syncToFirebase().catch((error) => {
        console.error("❌ Failed to sync reset level data to Firebase:", error);
      });
    }
  }
}

// Create and export singleton instance
const levelSystem = new LevelSystem();

// Make it globally available
window.levelSystem = levelSystem;

// Dispatch event to notify that level system is ready
if (typeof window !== "undefined") {
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent("levelSystemReady"));
  }, 100);
}

export default levelSystem;
