import storageManager from "./storage-manager.js";

class StatsCard {
  constructor() {
    this.results = [];
    this.totalGameCount = 0;
  }

  async init() {
    await this.loadData();
    this.calculateAndDisplayStats();
    await this.loadAndDisplayUsername();
    this.setupAuthStateListener();
  }

  setupAuthStateListener() {
    // Listen for auth state changes to automatically refresh stats
    if (window.addEventListener) {
      window.addEventListener("authStateChanged", async (event) => {
        await this.forceRefresh();
      });
    }
  }

  async loadData() {
    // Clear any existing data first to prevent stale data from showing
    this.results = [];
    this.totalGameCount = 0;

    // Wait for Firebase auth to be ready
    await this.waitForAuth();

    // Check if user is logged in and can sync from Firebase
    if (this.isUserLoggedIn() && this.canAccessFirebase()) {
      try {
        const firebaseData = await this.loadFromFirebase();

        if (
          firebaseData &&
          firebaseData.scores &&
          firebaseData.scores.length > 0
        ) {
          this.results = firebaseData.scores;
          this.totalGameCount =
            firebaseData.totalCount || firebaseData.scores.length;
          return;
        }
      } catch (error) {
        console.warn(
          "Failed to load stats from Firebase, falling back to localStorage:",
          error,
        );
      }
    }

    // Fallback to localStorage (for guests or if Firebase fails)
    this.results = storageManager.getGameResults() || [];

    // For guest users, use actual results length
    if (!this.isUserLoggedIn()) {
      this.totalGameCount = this.results.length;
    } else {
      this.totalGameCount =
        storageManager.getTotalGameCount() || this.results.length;
    }
  }

  async waitForAuth() {
    // Wait up to 3 seconds for user to be logged in
    const maxWait = 3000;
    const checkInterval = 100;
    let waited = 0;

    while (waited < maxWait) {
      if (window.getCurrentUser !== undefined) {
        const user = window.getCurrentUser();
        if (user !== null && user !== undefined) {
          return;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }
  }

  isUserLoggedIn() {
    return window.getCurrentUser && window.getCurrentUser() !== null;
  }

  canAccessFirebase() {
    return (
      window.firebaseModules &&
      window.database &&
      window.loadScoreboardFromFirebasePaginated
    );
  }

  async loadFromFirebase() {
    if (!this.canAccessFirebase()) {
      throw new Error("Firebase not available");
    }

    const currentUser = window.getCurrentUser();
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    // Load all data from Firebase (not paginated for stats)
    const { ref, get } = window.firebaseModules;
    const userScoreboardRef = ref(
      window.database,
      `users/${currentUser.uid}/scoreboard`,
    );

    const snapshot = await get(userScoreboardRef);
    if (!snapshot.exists()) {
      return { scores: [], totalCount: 0 };
    }

    const firebaseData = snapshot.val();
    const scores = Object.values(firebaseData).sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
    );

    return {
      scores: scores,
      totalCount: scores.length,
    };
  }

  calculateAndDisplayStats() {
    const stats = {
      totalGames: this.calculateTotalGames(),
      gamesThisWeek: this.calculateGamesThisWeek(),
      currentStreak: this.calculateCurrentStreak(),
      totalTimePlayed: this.calculateTotalTimePlayed(),
      classicGames: this.calculateClassicGames(),
      zenGames: this.calculateZenGames(),
      favoriteMode: this.calculateFavoriteMode(),
      favoriteLanguage: this.calculateFavoriteLanguage(),
      highestScore: this.calculateHighestScore(),
      bestWpm: this.calculateBestWpm(),
      averageAccuracy: this.calculateAverageAccuracy(),
      averageWpm: this.calculateAverageWpm(),
    };

    this.displayStats(stats);
  }

  calculateTotalGames() {
    return this.totalGameCount || this.results.length;
  }

  calculateGamesThisWeek() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return this.results.filter((result) => {
      if (!result.timestamp) return false;
      const gameDate = new Date(result.timestamp);
      return gameDate >= oneWeekAgo;
    }).length;
  }

  calculateCurrentStreak() {
    if (this.results.length === 0) return 0;

    const sortedResults = this.results
      .filter((result) => result.timestamp)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (sortedResults.length === 0) return 0;

    const uniqueDays = new Set();
    sortedResults.forEach((result) => {
      const date = new Date(result.timestamp);
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      uniqueDays.add(dayKey);
    });

    const days = Array.from(uniqueDays).sort().reverse();
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    let streak = 0;
    let currentDate = new Date();

    for (let i = 0; i < days.length; i++) {
      const dayKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;

      if (days.includes(dayKey)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  calculateTotalTimePlayed() {
    let totalSeconds = 0;

    this.results.forEach((result) => {
      if (result.mode === "Zen Mode") {
        if (result.totalTime && typeof result.totalTime === "string") {
          const [minutes, seconds] = result.totalTime.split(":").map(Number);
          totalSeconds += minutes * 60 + seconds;
        }
      } else {
        if (result.gameDurationSeconds) {
          totalSeconds += result.gameDurationSeconds;
        } else if (result.totalTimeSpent) {
          totalSeconds += result.totalTimeSpent;
        }
      }
    });

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  calculateClassicGames() {
    const classicModes = [
      "Classic Mode",
      "Hard Mode",
      "Hardcore Mode",
      "Practice Mode",
      "Speedrunner Mode",
      "Custom Mode",
    ];

    const classicResults = this.results.filter(
      (result) =>
        classicModes.includes(result.mode) ||
        (!result.mode && result.score !== undefined),
    );

    return classicResults.length;
  }

  calculateZenGames() {
    const zenResults = this.results.filter(
      (result) => result.mode === "Zen Mode",
    );

    return zenResults.length;
  }

  calculateFavoriteMode() {
    const modeCounts = {};

    this.results.forEach((result) => {
      const mode = result.mode || "Classic Mode";
      modeCounts[mode] = (modeCounts[mode] || 0) + 1;
    });

    let favoriteMode = "-";
    let maxCount = 0;

    for (const [mode, count] of Object.entries(modeCounts)) {
      if (count > maxCount) {
        maxCount = count;
        favoriteMode = mode.replace(" Mode", "");
      }
    }

    return favoriteMode;
  }

  calculateFavoriteLanguage() {
    const languageCounts = {};
    const languageMap = {
      english: "English",
      finnish: "Finnish",
      swedish: "Swedish",
      programming: "Programming",
      nightmare: "Nightmare",
    };

    this.results.forEach((result) => {
      const language = result.wordList || "english";
      const displayName = languageMap[language] || language;
      languageCounts[displayName] = (languageCounts[displayName] || 0) + 1;
    });

    let favoriteLanguage = "-";
    let maxCount = 0;

    for (const [language, count] of Object.entries(languageCounts)) {
      if (count > maxCount) {
        maxCount = count;
        favoriteLanguage = language;
      }
    }

    return favoriteLanguage;
  }

  calculateHighestScore() {
    const classicModes = [
      "Classic Mode",
      "Hard Mode",
      "Hardcore Mode",
      "Practice Mode",
      "Speedrunner Mode",
      "Custom Mode",
    ];

    const classicResults = this.results.filter(
      (result) =>
        classicModes.includes(result.mode) ||
        (!result.mode && result.score !== undefined),
    );

    if (classicResults.length === 0) return 0;

    return classicResults.reduce((max, result) => {
      const score = result.score || result.timeLeft * 256 || 0;
      return Math.max(max, score);
    }, 0);
  }

  calculateBestWpm() {
    if (this.results.length === 0) return 0;

    return this.results.reduce((max, result) => {
      const wpm = parseFloat(result.wpm) || 0;
      return Math.max(max, wpm);
    }, 0);
  }

  calculateBestAccuracy() {
    if (this.results.length === 0) return 0;

    return this.results.reduce((max, result) => {
      let accuracy = 0;
      if (result.accuracy !== undefined && result.accuracy !== null) {
        if (typeof result.accuracy === "string") {
          accuracy = parseFloat(result.accuracy.replace("%", "")) || 0;
        } else {
          accuracy = parseFloat(result.accuracy) || 0;
        }
      }
      return Math.max(max, accuracy);
    }, 0);
  }

  calculateAverageWpm() {
    if (this.results.length === 0) return 0;

    const totalWpm = this.results.reduce((sum, result) => {
      const wpm = parseFloat(result.wpm) || 0;
      return sum + wpm;
    }, 0);

    return totalWpm / this.results.length;
  }

  calculateAverageAccuracy() {
    if (this.results.length === 0) return 0;

    const totalAccuracy = this.results.reduce((sum, result) => {
      let accuracy = 0;
      if (result.accuracy !== undefined && result.accuracy !== null) {
        if (typeof result.accuracy === "string") {
          accuracy = parseFloat(result.accuracy.replace("%", "")) || 0;
        } else {
          accuracy = parseFloat(result.accuracy) || 0;
        }
      }
      return sum + accuracy;
    }, 0);

    return totalAccuracy / this.results.length;
  }

  async loadAndDisplayUsername() {
    const savedUsername = localStorage.getItem("nerdtype_username") || "runner";
    const usernameElement = document.getElementById("statsUsername");
    if (usernameElement) {
      usernameElement.textContent = savedUsername;
    }

    // Display level for logged-in users
    await this.loadAndDisplayLevel();

    // Display account creation date if user is logged in
    await this.loadAndDisplayAccountCreation();
  }

  async loadAndDisplayLevel() {
    const levelSectionElement = document.getElementById("statsLevelSection");
    const levelElement = document.getElementById("statsLevel");
    const levelProgressElement = document.getElementById("statsLevelProgress");

    if (!levelSectionElement || !levelElement) return;

    // Only show level for logged-in users
    const currentUser = window.getCurrentUser && window.getCurrentUser();
    if (!currentUser || !window.levelSystem) {
      if (levelSectionElement) levelSectionElement.style.display = "none";
      return;
    }

    // Get level info
    const levelInfo = window.levelSystem.getLevelInfo();

    // Update level badge
    if (levelElement) {
      levelElement.textContent = `Level ${levelInfo.level}`;
    }

    // Update progress bar
    if (levelProgressElement) {
      const progressPercentage = levelInfo.progress;
      levelProgressElement.innerHTML = `
        <div class="chart-level-progress-label">
          ${levelInfo.currentXP} / ${levelInfo.xpForNextLevel} XP
        </div>
        <div class="chart-level-progress-bar">
          <div class="chart-level-progress-fill" style="width: ${progressPercentage}%"></div>
        </div>
      `;
    }

    // Show the entire level section
    if (levelSectionElement) {
      levelSectionElement.style.display = "flex";
    }
  }

  async loadAndDisplayAccountCreation() {
    const nerdtypistSinceElement = document.getElementById("nerdtypistSince");
    if (!nerdtypistSinceElement) return;

    // Check if user is logged in
    const currentUser = window.getCurrentUser && window.getCurrentUser();
    if (!currentUser) {
      nerdtypistSinceElement.textContent = "guest user";
      return;
    }

    // Get account creation date
    try {
      if (window.getUserCreationDate) {
        const creationDate = await window.getUserCreationDate(currentUser.uid);
        if (creationDate) {
          const date = new Date(creationDate);
          const formattedDate = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          nerdtypistSinceElement.textContent = `nerdtypist since ${formattedDate}`;
        } else {
          nerdtypistSinceElement.textContent = "";
        }
      } else {
        nerdtypistSinceElement.textContent = "";
      }
    } catch (error) {
      console.error("Error loading account creation date:", error);
      nerdtypistSinceElement.textContent = "";
    }
  }

  displayStats(stats) {
    // Force clear and update each element to ensure old cached values are overwritten
    const totalGamesEl = document.getElementById("totalGames");
    totalGamesEl.textContent = "";
    totalGamesEl.textContent = stats.totalGames.toString();

    document.getElementById("gamesThisWeek").textContent = stats.gamesThisWeek;
    document.getElementById("currentStreak").textContent = stats.currentStreak;
    document.getElementById("totalTimePlayed").textContent =
      stats.totalTimePlayed;

    document.getElementById("classicGames").textContent = stats.classicGames;
    document.getElementById("zenGames").textContent = stats.zenGames;

    document.getElementById("favoriteMode").textContent = stats.favoriteMode;
    document.getElementById("favoriteLanguage").textContent =
      stats.favoriteLanguage;

    // New stats with formatting
    document.getElementById("highestScore").textContent =
      stats.highestScore > 0 ? stats.highestScore : "-";

    document.getElementById("bestWpm").textContent =
      stats.bestWpm > 0 ? Math.round(stats.bestWpm) : "-";

    document.getElementById("averageAccuracy").textContent =
      stats.averageAccuracy > 0 ? `${stats.averageAccuracy.toFixed(1)}%` : "-";

    document.getElementById("averageWpm").textContent =
      stats.averageWpm > 0 ? Math.round(stats.averageWpm) : "-";
  }

  async refresh() {
    await this.init();
  }

  async forceRefresh() {
    // Force a complete refresh by clearing any cached data
    this.results = [];
    this.totalGameCount = 0;
    await this.init();
  }
}

const statsCard = new StatsCard();

export default statsCard;
