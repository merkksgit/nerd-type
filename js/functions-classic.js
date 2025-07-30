// Import common dependencies
import {
  loadWordList,
  currentLanguage,
  availableWordLists,
} from "./word-list-manager.js";
import { DebugDisplay } from "./debug.js";
import achievementSystem from "./achievements.js";
import "./game-commands.js";
import {
  GAME_DEFAULTS,
  TIMERS,
  STORAGE_KEYS,
  LIMITS,
  RESERVED_USERNAMES,
} from "./constants.js";
import storageManager from "./storage-manager.js";
import domManager from "./dom-manager.js";

// Global variables for game state
let words = [];
let playerUsername = storageManager.getUsername();
let isUsernameModalOpen = false;
let isZenMode = storageManager.isZenModeEnabled();

// Variables shared between both modes
let currentWordIndex = 0;
let nextWordIndex = 0;
let wordsTyped = [];
let totalCharactersTyped = 0;
let hasStartedTyping = false;
let totalKeystrokes = 0;
let correctKeystrokes = 0;
let gameStartTime = null;
let gameEnded = false;

// Helper function to sync game state with window object
function syncGameStateToWindow() {
  window.hasStartedTyping = hasStartedTyping;
  window.gameEnded = gameEnded;
}

// Initial sync
syncGameStateToWindow();
let showSpacesAfterWords =
  storageManager.getItem("showSpacesAfterWords", "true") !== "false";

// Classic mode specific variables
let timeLeft = 10; // Default, will be updated from settings
let totalTimeSpent = 0;
let countDownInterval;
let totalTimeInterval;
let bonusTime = GAME_DEFAULTS.BONUS_TIME; // Default, will be updated from settings
let goalPercentage = GAME_DEFAULTS.GOAL_PERCENTAGE;
let isPaused = false; // Game pause state

// Zen mode specific variables
let sessionStartTime = null;
let zenWordGoal = GAME_DEFAULTS.ZEN_WORD_GOAL;

// Precision multiplier system variables
let precisionStreak = 0;
let peakPrecisionStreak = 0;
let currentWordHasMistakes = false;

// Per-second WPM tracking variables
let keystrokeTimestamps = [];
let perSecondWpmData = [];
let mistakeTimestamps = []; // Array of {timestamp, word, position} objects

// Practice mistakes tracking
let gameMistakes = {
  words: [], // Array of words where mistakes occurred
  totalMistakes: 0,
};
let isPracticeMistakesMode = false;
let practiceMistakesWords = [];

function isReservedUsername(username) {
  return RESERVED_USERNAMES.some(
    (reserved) => username.toLowerCase() === reserved.toLowerCase(),
  );
}

function canUseUsername(username) {
  // Check admin mode for "merkks"
  const isAdminMode =
    storageManager.getItem("nerdtype_admin", "false") === "true";

  if (username.toLowerCase() === "merkks") {
    return isAdminMode;
  }
  // Block other reserved usernames
  return !isReservedUsername(username);
}

// Font application function
function applyFont(fontFamily) {
  document.documentElement.style.setProperty("--game-font", fontFamily);

  const gameElements = document.querySelectorAll(`
    #userInput, 
    #nextWord, 
    #wordToType,
    #wordToType span,
    #currentGameMode,
    #timer,
    #progressPercentage,
    #precisionMultiplier,
    .game-interface,
    .typing-area
  `);

  gameElements.forEach((element) => {
    element.style.fontFamily = fontFamily;
  });
}

// UI hide state restoration function
function restoreUIHideState() {
  // Check if we're on the game page
  if (!window.location.pathname.includes("game.html")) return;

  const hideUIState =
    storageManager.getItem("nerdtype_hide_ui", "false") === "true";

  // Remove the preload CSS since we're taking over now
  const preloadStyle = document.getElementById("preload-ui-hide");
  if (preloadStyle) {
    preloadStyle.remove();
  }

  if (hideUIState) {
    console.log("🎨 Restoring UI hide state...");
    document.body.setAttribute("data-ui-hidden", "true");
  } else {
    // Make sure everything is visible if not hiding
    document.body.setAttribute("data-ui-hidden", "false");
  }
}

function showUsernameError(message) {
  const usernameInput = document.getElementById("usernameInput");

  // Add error styling
  usernameInput.classList.add("is-invalid");

  // Get or create error element
  let errorElement = document.getElementById("usernameInputError");
  if (!errorElement) {
    errorElement = document.createElement("div");
    errorElement.id = "usernameInputError";
    errorElement.className = "invalid-feedback";
    errorElement.style.marginTop = "5px";
    errorElement.style.fontSize = "0.875rem";
    errorElement.style.color = "#f7768e";

    // Insert after the input
    usernameInput.parentNode.insertBefore(
      errorElement,
      usernameInput.nextSibling,
    );
  }

  errorElement.textContent = message;
  errorElement.style.display = "block";
}

function clearUsernameError() {
  const usernameInput = document.getElementById("usernameInput");
  const errorElement = document.getElementById("usernameInputError");

  usernameInput.classList.remove("is-invalid");
  usernameInput.classList.remove("is-valid");

  if (errorElement) {
    errorElement.style.display = "none";
  }
}

function validateUsernameClassic(username) {
  const trimmedUsername = username.trim();

  // Check if empty
  if (!trimmedUsername) {
    showUsernameError("Username cannot be empty");
    return false;
  }

  // Check length (2-20 characters as per terms)
  if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
    showUsernameError("Username must be between 2-20 characters");
    return false;
  }

  // Check for reserved usernames
  if (!canUseUsername(trimmedUsername)) {
    if (isReservedUsername(trimmedUsername)) {
      showUsernameError(
        `"${trimmedUsername}" is a reserved codename and cannot be used`,
      );
    } else {
      showUsernameError("This codename is restricted");
    }
    return false;
  }

  // Check for invalid characters (only letters, numbers, spaces, underscores, hyphens)
  const validPattern = /^[a-zA-Z0-9 _-]+$/;
  if (!validPattern.test(trimmedUsername)) {
    showUsernameError(
      "Username can only contain letters, numbers, spaces, underscores, and hyphens",
    );
    return false;
  }

  return true;
}

// Set up sound for achievements
const achievementSound = new Audio("../sounds/achievement.mp3");
window.achievementSound = achievementSound;

// Check the sound setting on initialization
const achievementSoundEnabled = storageManager.getItem(
  "achievement_sound_enabled",
  "true",
);
if (achievementSoundEnabled === "false") {
  achievementSound.muted = true;
}

// Create keypress audio pool for better performance
const keypressAudioPool = [];
const poolSize = GAME_DEFAULTS.AUDIO_POOL_SIZE; // Create multiple instances
let currentAudioIndex = 0;

// Create the audio pool
for (let i = 0; i < poolSize; i++) {
  const audio = new Audio("../sounds/keypress_1.wav");
  audio.volume = 0.3;
  audio.preload = "auto"; // Ensure it's preloaded
  keypressAudioPool.push(audio);
}

// Keep reference for backward compatibility
window.keypressSound = keypressAudioPool[0];

// Check the keypress sound setting on initialization
const keypressSoundEnabled = storageManager.getItem(
  "keypress_sound_enabled",
  "false",
);
if (keypressSoundEnabled !== "true") {
  keypressAudioPool.forEach((audio) => (audio.muted = true));
}

// Dispatch an event to notify that the keypress sound is loaded
window.dispatchEvent(
  new CustomEvent("keypress_sound_loaded", {
    detail: { sound: keypressAudioPool[0] },
  }),
);

function playKeypressSound() {
  const keypressSoundEnabled = storageManager.getItem(
    "keypress_sound_enabled",
    "false",
  );
  if (keypressSoundEnabled === "true" && hasStartedTyping) {
    const audio = keypressAudioPool[currentAudioIndex];
    audio.currentTime = 0;
    audio.play().catch((e) => console.log("Keypress sound play prevented:", e));

    // Move to next audio in pool
    currentAudioIndex = (currentAudioIndex + 1) % poolSize;
  }
}

// Function to handle sound setting changes
function updateKeypressSoundSetting(enabled) {
  keypressAudioPool.forEach((audio) => {
    audio.muted = !enabled;
  });
}

// Make it available globally if needed by other modules
window.updateKeypressSoundSetting = updateKeypressSoundSetting;

// Dispatch an event to notify that the sound is loaded
window.dispatchEvent(
  new CustomEvent("achievement_sound_loaded", {
    detail: { sound: achievementSound },
  }),
);

// Create debug display instance
const debugDisplay = new DebugDisplay();

// Load saved settings or use defaults for Classic Mode
let gameSettings = storageManager.getGameSettings();

// Function to reload game settings from localStorage (used by settings sync)
window.reloadGameSettings = function () {
  const newSettings = storageManager.getGameSettings();

  // Update the global gameSettings variable
  Object.assign(gameSettings, newSettings);

  // Also update game commands settings if available
  if (window.gameCommands && window.gameCommands.gameSettings) {
    Object.assign(window.gameCommands.gameSettings, newSettings);
  }
};

// Define preset modes
const presetModes = {
  classic: {
    timeLimit: 30,
    bonusTime: 3,
    initialTime: 10,
  },
  hard: {
    timeLimit: 20,
    bonusTime: 2,
    initialTime: 8,
  },
  practice: {
    timeLimit: 60,
    bonusTime: 5,
    initialTime: 15,
  },
  speedrunner: {
    timeLimit: 10,
    bonusTime: 2,
    initialTime: 8,
  },
};

// Tips rotation

// Game Mode Utilities
function isZenModeActive() {
  return localStorage.getItem("nerdtype_zen_mode") === "true";
}

function setZenMode(enabled) {
  localStorage.setItem("nerdtype_zen_mode", enabled.toString());
  isZenMode = enabled;

  // If switching zen mode off and alice wordset is selected, fallback to english
  if (!enabled) {
    const currentWordlist = localStorage.getItem("nerdtype_wordlist");
    if (currentWordlist === "alice") {
      localStorage.setItem("nerdtype_wordlist", "english");
    }
  }

  updateUIForGameMode();
}

function updateUIForGameMode() {
  // Get DOM elements
  const gameIndicator = document.getElementById("currentGameMode");
  const classicElements = document.querySelectorAll(".classic-mode-element");
  const zenElements = document.querySelectorAll(".zen-mode-element");
  const classicSettings = document.querySelectorAll(".classic-mode-setting");

  // Update game indicator
  if (gameIndicator) {
    if (isZenMode) {
      gameIndicator.textContent = "Game Mode: Zen";
    } else {
      // Check current mode from gameSettings
      const settings = storageManager.getGameSettings();
      const currentMode = settings.currentMode || "classic";

      // Format the text based on mode
      if (currentMode === "classic") {
        gameIndicator.textContent = "Classic Mode";
      } else {
        const formattedMode =
          currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
        gameIndicator.textContent = `Game Mode: ${formattedMode}`;
      }
    }
    gameIndicator.style.color = isZenMode ? "#c3e88d" : "#ff9e64";
  }

  // Toggle visibility based on mode
  classicElements.forEach((el) => {
    el.style.display = isZenMode ? "none" : "block";
  });

  zenElements.forEach((el) => {
    el.style.display = isZenMode ? "block" : "none";
  });

  // Update settings modal UI
  const zenModeToggle = document.getElementById("zenModeToggle");
  if (zenModeToggle) {
    zenModeToggle.checked = isZenMode;
  }

  // Toggle visibility of classic mode settings
  classicSettings.forEach((el) => {
    el.style.display = isZenMode ? "none" : "block";
  });

  // Show/hide zen mode settings based on mode
  const zenModeSettings = document.getElementById("zenModeSettings");
  if (zenModeSettings && zenModeToggle) {
    zenModeSettings.style.display = zenModeToggle.checked ? "block" : "none";
  }

  // Hide precision multiplier in zen mode
  if (isZenMode) {
    hidePrecisionMultiplier();
  }
}

// Load words when the script initializes
async function initializeGame() {
  try {
    // Initialize DOM manager first
    domManager.init();

    // Load the Zen Mode state
    isZenMode = storageManager.isZenModeEnabled();

    // Font selection
    const currentFont = storageManager.getFont();
    applyFont(currentFont);

    // Load saved settings with error handling
    const settings = storageManager.getGameSettings();

    // Update the global gameSettings variable
    gameSettings = settings;

    // Set Zen Mode word goal
    zenWordGoal = settings.zenWordGoal || GAME_DEFAULTS.ZEN_WORD_GOAL;

    // Update UI based on mode
    updateUIForGameMode();

    // Load the selected word list with error handling
    try {
      words = await loadWordList(currentLanguage);
      if (!words || words.length === 0) {
        throw new Error("Word list is empty or failed to load");
      }
    } catch (error) {
      console.error("Failed to load word list:", error);
      // Fallback to basic English words
      words = [
        "the",
        "and",
        "you",
        "that",
        "was",
        "for",
        "are",
        "with",
        "his",
        "they",
      ];
      console.log("Using fallback word list");
    }

    // After words are loaded, set up the UI
    setupUI();

    // Initialize event listeners and other game elements
    initializeEventListeners();

    // Game-specific initialization - only call these on game page
    if (window.location.pathname.includes("game.html")) {
      displayPreviousResults();
    }

    // Username validation can be on any page that has the input
    setupUsernameValidation();

    // Set initial time from settings
    timeLeft = gameSettings.initialTime;
    bonusTime = gameSettings.bonusTime;
  } catch (error) {
    console.error("Critical error during game initialization:", error);
    // Show user-friendly error message
    const errorMessage = document.createElement("div");
    errorMessage.innerHTML = `
      <div class="alert alert-danger" role="alert">
        <h4 class="alert-heading">Game Initialization Failed</h4>
        <p>Something went wrong while loading the game. Please try refreshing the page.</p>
        <button class="btn btn-primary" onclick="location.reload()">Refresh Page</button>
      </div>
    `;
    document.body.prepend(errorMessage);
  }

  // Check for pending settings notification at the end
  setTimeout(() => {
    const pendingNotification = storageManager.getPendingSettingsNotification();
    if (pendingNotification) {
      // Remove the notification FIRST to prevent duplicate processing
      storageManager.removePendingSettingsNotification();
      try {
        const { message, type } = pendingNotification;
        showSettingsNotification(message, type);
      } catch (error) {
        console.error(
          "Failed to process pending settings notification:",
          error,
        );
      }
    }
  }, TIMERS.SETTINGS_NOTIFICATION_DELAY);

  setTimeout(() => {
    restoreUIHideState();
  }, 350);
}

function setupUI() {
  // Update the UI based on current game mode
  updateUIForGameMode();

  // Initialize game state variables but don't start timers
  gameEnded = false;
  syncGameStateToWindow();
  currentWordIndex = 0;
  nextWordIndex = 1;

  // Reset precision multiplier system
  resetPrecisionSystem();

  // Shuffle the words array for variety (unless it's a sequential word list)
  if (!availableWordLists[currentLanguage]?.sequential) {
    words = words.sort(() => Math.random() - 0.5);
  }

  // Show words immediately on page load
  updateWordDisplay();

  // Initialize smooth caret system
  if (window.smoothCaret) {
    window.smoothCaret.init();
  }

  // Mark game as inactive initially
  const gameElement = document.getElementById("game");
  if (gameElement) {
    gameElement.classList.add("inactive");
  }

  // Don't focus the input field initially - wait for user interaction
}

function updateDebugInfo() {
  const accuracy =
    totalKeystrokes > 0
      ? ((correctKeystrokes / totalKeystrokes) * 100).toFixed(1)
      : "0.0";
  const wrongKeystrokes = totalKeystrokes - correctKeystrokes;

  // Calculate time properly
  let effectiveTime = gameStartTime ? Date.now() - gameStartTime : 0;

  const debugCurrentWord = hasStartedTyping
    ? addPunctuationToWord(words[currentWordIndex], currentWordIndex)
    : "";
  debugDisplay.updateInfo({
    currentWord: debugCurrentWord,
    wordLength: debugCurrentWord?.length || 0,
    totalCharactersTyped,
    gameStartTime,
    wordsTyped,
    hasStartedTyping,
    accuracy,
    correctKeystrokes,
    wrongKeystrokes,
    totalKeystrokes,
    effectiveTime,
    timeLeft,
  });
}

// Set up your update interval (store reference for cleanup)
let debugUpdateInterval = setInterval(
  updateDebugInfo,
  TIMERS.DEBUG_UPDATE_INTERVAL,
);

function optimizeForMobile() {
  // Check if we're on a small screen
  const isMobile = window.innerWidth < 576;

  if (isMobile) {
    // Smaller font for game elements
    const wordToType = document.getElementById("wordToType");
    if (wordToType) {
      wordToType.style.fontSize = "20px";
    }

    const nextWord = document.getElementById("nextWord");
    if (nextWord) {
      nextWord.style.fontSize = "18px";
    }

    // Make sure input has appropriate size
    const userInput = document.getElementById("userInput");
    if (userInput) {
      userInput.style.fontSize = "22px";
      // Prevent zooming on mobile when focusing input
      userInput.setAttribute("autocomplete", "off");
      userInput.setAttribute("autocorrect", "off");
      userInput.setAttribute("autocapitalize", "off");
      userInput.setAttribute("spellcheck", "false");
    }
  }
}

// Debounced function to update word display on resize
let resizeTimeout;
function handleResize() {
  optimizeForMobile();

  // Debounce word display update to avoid too frequent recalculations
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (hasStartedTyping && !gameEnded) {
      updateWordDisplay();
    }
  }, 150);
}

// Call this during initialization
document.addEventListener("DOMContentLoaded", function () {
  // Add mobile optimization
  optimizeForMobile();

  // Re-optimize when window is resized
  window.addEventListener("resize", handleResize);
});

function initializeEventListeners() {
  // Check if we're on the game page - some elements only exist there
  const isGamePage = window.location.pathname.includes("game.html");

  // Track modal state
  const usernameModal = document.getElementById("usernameModal");
  if (usernameModal) {
    usernameModal.addEventListener("show.bs.modal", () => {
      isUsernameModalOpen = true;
    });

    usernameModal.addEventListener("hide.bs.modal", () => {
      isUsernameModalOpen = false;
    });
  }

  // Set up Zen Mode toggle in settings
  const zenModeToggle = document.getElementById("zenModeToggle");
  if (zenModeToggle) {
    zenModeToggle.checked = isZenMode;
    zenModeToggle.addEventListener("change", (e) => {
      setZenMode(e.target.checked);
    });
  }

  // Handle all keydown events
  document.addEventListener("keydown", (event) => {
    // Handle username input Enter key
    if (event.key === "Enter" && isUsernameModalOpen) {
      event.preventDefault();
      event.stopPropagation();
      handleUsernameConfirmation();
      return;
    }
    // Open settings panel with Ctrl + O
    if (event.ctrlKey && event.key === "o") {
      event.preventDefault(); // Prevent browser's default "Open file" dialog

      // Check if settings modal is currently open
      const settingsModal = document.getElementById("settingsModal");
      const isSettingsOpen =
        settingsModal && settingsModal.classList.contains("show");

      if (isSettingsOpen) {
        // Close the settings modal
        const settingsModalInstance =
          bootstrap.Modal.getInstance(settingsModal);
        if (settingsModalInstance) {
          settingsModalInstance.hide();
        }
      } else {
        // Check if any other modal is currently open
        const otherOpenModals = document.querySelectorAll(
          ".modal.show:not(#settingsModal)",
        );
        if (otherOpenModals.length > 0) {
          return; // Don't open if another modal is already open
        }

        // Open the settings modal
        openSettingsModal();
      }
      return;
    }

    // Handle game controls - Enter key focuses input and starts game
    if (event.key === "Enter" && !event.ctrlKey && !isUsernameModalOpen) {
      // Check if game is inactive (showing start message)
      const gameElement = document.getElementById("game");
      const isGameInactive =
        gameElement && gameElement.classList.contains("inactive");

      if (isGameInactive) {
        // Just activate the game without changing words when showing start message
        activateGame();
      } else {
        // Always restart the game when Enter is pressed during active gameplay
        startGame();
        activateGame();
      }
    }
    if (event.key === "Enter" && event.ctrlKey) {
      location.reload();
    }
  });

  // Listen for game settings changes
  window.addEventListener("gameSettingsChanged", function (e) {
    const { setting, value } = e.detail;

    if (setting === "language") {
      if (value !== currentLanguage) {
        localStorage.setItem("nerdtype_wordlist", value);
        location.reload(); // Simple reload instead of custom modal
      }
      return;
    }

    // Handle Zen mode toggle specifically
    if (setting === "zenMode") {
      setZenMode(value);
      return;
    }

    // First update the setting
    switch (setting) {
      case "timeLimit":
        gameSettings.timeLimit = value;
        break;
      case "bonusTime":
        gameSettings.bonusTime = value;
        bonusTime = value; // Update current game
        break;
      case "initialTime":
        gameSettings.initialTime = value;
        break;
      case "currentMode":
        gameSettings.currentMode = value;
        break;
      case "zenWordGoal":
        gameSettings.zenWordGoal = value;
        zenWordGoal = value; // Update current game variable
        updateUIForGameMode(); // Update the UI to show the new goal
        break;
    }

    // If we're setting a specific mode, don't override it
    if (setting === "currentMode") {
      // Do nothing - mode is already set
    }
    // Otherwise check if the current settings match any preset
    else {
      // Set to custom if settings don't match any preset
      if (isCustomMode()) {
        gameSettings.currentMode = "custom";
      } else {
        // Otherwise try to find which preset mode it matches
        Object.entries(presetModes).forEach(([modeName, presetSettings]) => {
          if (
            JSON.stringify(presetSettings) ===
            JSON.stringify({
              timeLimit: gameSettings.timeLimit,
              bonusTime: gameSettings.bonusTime,
              initialTime: gameSettings.initialTime,
            })
          ) {
            gameSettings.currentMode = modeName;
          }
        });
      }
    }

    localStorage.setItem("gameSettings", JSON.stringify(gameSettings));

    // If zenWordGoal was changed, also update the UI
    if (setting === "zenWordGoal") {
      updateUIForGameMode();
    }
  });

  // Game-specific elements (only on game page)
  if (isGamePage) {
    // Reset button
    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        location.reload();
      });
    }

    // Start button - activate game and focus input field
    const startButton = domManager.get("startButton");
    if (startButton) {
      startButton.addEventListener("click", function () {
        activateGame();
      });
    }

    // User input field
    const userInput = domManager.get("userInput");
    if (userInput) {
      userInput.addEventListener("input", function (e) {
        checkInput(e);
      });
    }
  }

  // Setup username related items
  const changeUsernameBtn = document.getElementById("changeUsername");
  const confirmUsernameBtn = document.getElementById("confirmUsername");

  if (changeUsernameBtn) {
    changeUsernameBtn.addEventListener("click", showUsernameModal);
  }

  if (confirmUsernameBtn) {
    confirmUsernameBtn.addEventListener("click", handleUsernameConfirmation);
  }

  // Game-specific initialization
  if (isGamePage) {
    if (!localStorage.getItem("nerdtype_username")) {
      showUsernameModal();
    }

    // Handle scoreboard view
    const viewScoreboardBtn = document.getElementById("viewScoreboardBtn");
    if (viewScoreboardBtn) {
      viewScoreboardBtn.addEventListener("click", async function () {
        // Update the scoreboard contents before showing
        await displayPreviousResults();

        // Then show the modal
        const scoreboardModal = new bootstrap.Modal(
          document.getElementById("scoreboardModal"),
        );
        scoreboardModal.show();
      });
    }
  }
}

// Function to check if current settings create a custom mode
function isCustomMode() {
  // Get current settings
  const currentSettings = {
    timeLimit: gameSettings.timeLimit,
    bonusTime: gameSettings.bonusTime,
    initialTime: gameSettings.initialTime,
  };

  // Convert to string for comparison
  const currentSettingsString = JSON.stringify(currentSettings);

  // Check against preset modes
  const matchingMode = Object.entries(presetModes).find(
    ([_, modeSettings]) =>
      JSON.stringify(modeSettings) === currentSettingsString,
  );

  // If found a matching preset, return its name
  return !matchingMode;
}

function showUsernameModal() {
  const usernameModal = document.getElementById("usernameModal");
  if (usernameModal) {
    try {
      // Try to get existing modal instance first
      let modal = bootstrap.Modal.getInstance(usernameModal);

      // If no instance exists, create a new one
      if (!modal) {
        modal = new bootstrap.Modal(usernameModal, {
          backdrop: "static",
          keyboard: false,
        });
      }

      modal.show();
    } catch (error) {
      console.error("Error showing username modal:", error);
    }
  }
}

function handleUsernameConfirmation() {
  const usernameInput = document.getElementById("usernameInput");
  const username = usernameInput.value.trim();

  if (validateUsernameClassic(username)) {
    playerUsername = username;
    localStorage.setItem("nerdtype_username", username);
    document.getElementById("usernameDisplay").textContent = playerUsername;
    clearUsernameError();

    const modalInstance = bootstrap.Modal.getInstance(
      document.getElementById("usernameModal"),
    );
    if (modalInstance) {
      modalInstance.hide();
      isUsernameModalOpen = false;
      location.reload();
    }
  }
}

function setupUsernameValidation() {
  const usernameInput = document.getElementById("usernameInput");

  if (usernameInput) {
    // Real-time validation as user types
    usernameInput.addEventListener("input", (event) => {
      const username = event.target.value.trim();

      // Clear error when user starts typing
      if (username.length === 0) {
        clearUsernameError();
        return;
      }

      // Real-time validation for reserved usernames
      if (username.length >= 2) {
        if (!canUseUsername(username)) {
          if (isReservedUsername(username)) {
            showUsernameError(
              `"${username}" is a reserved codename and cannot be used`,
            );
          } else {
            showUsernameError("This codename is restricted");
          }
        } else {
          clearUsernameError();
          usernameInput.classList.add("is-valid");
        }
      }
    });

    // Clear error when user focuses on input
    usernameInput.addEventListener("focus", () => {
      clearUsernameError();
    });

    // Handle Enter key
    usernameInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleUsernameConfirmation();
      }
    });
  }
}

// Main game functionality
function startGame() {
  // Reset gradient flow classes
  const progressBar = document.getElementById("progressBar");
  if (progressBar) {
    progressBar.classList.remove(
      "flow-excellent",
      "flow-good",
      "flow-average",
      "flow-poor",
    );
  }

  keypressAudioPool.forEach((audio) => {
    audio.load(); // Force immediate loading
    // Attempt a silent play to prime the audio
    audio.volume = 0;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0.3; // Restore volume
      })
      .catch(() => {
        // Silent fail - some browsers block this
        audio.volume = 0.3;
      });
  });
  // Reset the next word element styles to default game styles
  const nextWordDiv = document.getElementById("nextWord");
  if (nextWordDiv) {
    // Remove the tip styling class when starting the game
    nextWordDiv.classList.remove("tip-style");
    // Clear any inline styles that might have been applied
    nextWordDiv.removeAttribute("style");
  }

  // Reset game state and shuffle words at start
  gameEnded = false;
  syncGameStateToWindow();
  currentWordIndex = 0;
  nextWordIndex = 1;

  // Reset precision multiplier system
  resetPrecisionSystem();

  // Shuffle the words array at game start for variety (unless it's a sequential word list)
  if (!availableWordLists[currentLanguage]?.sequential) {
    words = words.sort(() => Math.random() - 0.5);
  }

  // Clear punctuation cache for fresh capitalization logic
  clearPunctuationCache();

  // Update word display
  updateWordDisplay();

  // Initialize mode-specific elements
  if (isZenMode) {
    // Zen Mode - no timer until first keystroke
    document.getElementById("userInput").focus();
    gameStartTime = null;
    sessionStartTime = null;
    if (document.getElementById("totalTimeValue")) {
      if (isPracticeMistakesMode) {
        // In practice mode, set words counter
        document.getElementById("totalTimeValue").textContent = "0";
        const totalTimeContainer = document.getElementById("totalTime");
        if (totalTimeContainer) {
          totalTimeContainer.innerHTML = `Words typed: <span id="totalTimeValue">0</span>`;
        }
      } else {
        // Normal zen mode shows time
        document.getElementById("totalTimeValue").textContent = "0:00";
      }
    }

    // Clear any existing intervals
    if (countDownInterval) clearInterval(countDownInterval);
    if (totalTimeInterval) clearInterval(totalTimeInterval);
  } else {
    // Classic Mode - initialize timer with settings
    timeLeft = gameSettings.initialTime;
    bonusTime = gameSettings.bonusTime;
    updateTimer();

    // Clear previous intervals if they exist
    if (countDownInterval) clearInterval(countDownInterval);
    if (totalTimeInterval) clearInterval(totalTimeInterval);

    // Set up timer intervals
    countDownInterval = setInterval(countDown, TIMERS.COUNTDOWN_INTERVAL);
    totalTimeInterval = setInterval(totalTimeCount, TIMERS.TOTAL_TIME_INTERVAL);
  }

  // Reset game state variables
  domManager.setValue("userInput", "");
  domManager.focus("userInput");
  gameStartTime = null;
  hasStartedTyping = false;
  syncGameStateToWindow();
  wordsTyped = [];
  totalCharactersTyped = 0;
  totalKeystrokes = 0;
  correctKeystrokes = 0;
  totalTimeSpent = 0;

  // Reset progress bar
  updateProgressBar();
}

// Expose functions to global scope for tap-to-start functionality
window.startGame = startGame;
window.updateWordDisplay = updateWordDisplay;
window.activateGame = activateGame;
window.clearPunctuationCache = clearPunctuationCache;

// Cache for processed words to avoid recursion
let punctuationCache = new Map();

function addPunctuationToWord(word, wordIndex) {
  const punctuationEnabled =
    storageManager.getItem("punctuation_enabled", "false") === "true";

  if (!punctuationEnabled) {
    return word;
  }

  // Check cache first
  const cacheKey = `${wordIndex}-${word}`;
  if (punctuationCache.has(cacheKey)) {
    return punctuationCache.get(cacheKey);
  }

  // Check if previous word ended with sentence-ending punctuation
  const shouldCapitalize = checkIfPreviousWordEndsSentence(wordIndex);

  // Apply capitalization if needed
  let processedWord = shouldCapitalize ? capitalizeWord(word) : word;

  // Different punctuation marks with their weights
  const punctuationMarks = [
    { mark: ".", weight: 15 }, // Period - most common
    { mark: ",", weight: 12 }, // Comma
    { mark: "?", weight: 3 }, // Question mark
    { mark: "!", weight: 2 }, // Exclamation mark
    { mark: ";", weight: 2 }, // Semicolon
    { mark: ":", weight: 2 }, // Colon
    { mark: '"', weight: 4 }, // Quotes
    { mark: "'", weight: 3 }, // Apostrophe
  ];

  // Create a deterministic "random" value based on word index
  // This ensures same word always gets same punctuation
  let seed = wordIndex * 31 + word.length * 17 + word.charCodeAt(0);
  seed = seed ^ (seed >> 16);
  seed = seed * 0x85ebca6b;
  seed = seed ^ (seed >> 13);
  const pseudoRandom = Math.abs(seed % 1000) / 1000;

  let finalWord = processedWord;

  // Decide whether to add punctuation (about 25% chance)
  if (pseudoRandom <= 0.25) {
    // Select punctuation based on deterministic value
    const totalWeight = punctuationMarks.reduce((sum, p) => sum + p.weight, 0);
    let punctSeed = wordIndex * 37 + word.length * 23;
    const randomValue = ((punctSeed % 1000) / 1000) * totalWeight;

    let cumulativeWeight = 0;
    for (const punct of punctuationMarks) {
      cumulativeWeight += punct.weight;
      if (randomValue <= cumulativeWeight) {
        // Special handling for quotes - add to both sides occasionally
        if (punct.mark === '"' && punctSeed % 2 === 0) {
          finalWord = `"${processedWord}"`;
        } else if (
          punct.mark === "'" &&
          processedWord.length > 2 &&
          punctSeed % 3 === 0
        ) {
          // Sometimes add apostrophe in middle for contractions
          const insertPos = Math.floor(processedWord.length * 0.6);
          finalWord =
            processedWord.slice(0, insertPos) +
            "'" +
            processedWord.slice(insertPos);
        } else {
          finalWord = processedWord + punct.mark;
        }
        break;
      }
    }
  }

  // Cache the result
  punctuationCache.set(cacheKey, finalWord);
  return finalWord;
}

function checkIfPreviousWordEndsSentence(currentWordIndex) {
  if (currentWordIndex === 0) {
    return true; // First word should always be capitalized
  }

  const previousWordIndex = currentWordIndex - 1;
  const previousCacheKey = `${previousWordIndex}-${words[previousWordIndex]}`;

  // Check cache first to avoid recursion
  if (punctuationCache.has(previousCacheKey)) {
    const previousWord = punctuationCache.get(previousCacheKey);
    const sentenceEnders = [".", "!", "?"];
    return sentenceEnders.some((punct) => previousWord.endsWith(punct));
  }

  // If not in cache, calculate punctuation for previous word without capitalization
  const previousWord = getPunctuationForWord(
    words[previousWordIndex],
    previousWordIndex,
  );
  const sentenceEnders = [".", "!", "?"];
  return sentenceEnders.some((punct) => previousWord.endsWith(punct));
}

function getPunctuationForWord(word, wordIndex) {
  // This function calculates punctuation without capitalization logic to avoid recursion
  const seed = wordIndex * 1234567 + word.length * 7;
  const pseudoRandom = (seed % 1000) / 1000;

  if (pseudoRandom > 0.25) {
    return word; // No punctuation
  }

  const punctuationMarks = [
    { mark: ".", weight: 15 },
    { mark: ",", weight: 12 },
    { mark: "?", weight: 3 },
    { mark: "!", weight: 2 },
    { mark: ";", weight: 2 },
    { mark: ":", weight: 2 },
    { mark: '"', weight: 4 },
    { mark: "'", weight: 3 },
  ];

  const totalWeight = punctuationMarks.reduce((sum, p) => sum + p.weight, 0);
  const randomValue = (((seed * 31) % 1000) / 1000) * totalWeight;

  let cumulativeWeight = 0;
  for (const punct of punctuationMarks) {
    cumulativeWeight += punct.weight;
    if (randomValue <= cumulativeWeight) {
      if (punct.mark === '"' && seed % 2 === 0) {
        return `"${word}"`;
      } else if (punct.mark === "'" && word.length > 2 && seed % 3 === 0) {
        const insertPos = Math.floor(word.length * 0.6);
        return word.slice(0, insertPos) + "'" + word.slice(insertPos);
      } else {
        return word + punct.mark;
      }
    }
  }

  return word;
}

function capitalizeWord(word) {
  if (!word || word.length === 0) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Clear punctuation cache when game restarts or settings change
function clearPunctuationCache() {
  punctuationCache.clear();
}

/**
 * Calculate how many words can fit in the available display area
 */
function calculateOptimalWordCount() {
  const wordToTypeElement = domManager.get("wordToType");
  if (!wordToTypeElement) return GAME_DEFAULTS.WORDS_TO_SHOW;

  // Get the available width and height of the word display area
  const containerRect = wordToTypeElement.getBoundingClientRect();
  const availableWidth = containerRect.width || wordToTypeElement.offsetWidth;
  const availableHeight =
    containerRect.height || wordToTypeElement.offsetHeight;

  // If no dimensions available, fall back to default
  if (!availableWidth || !availableHeight) {
    return GAME_DEFAULTS.WORDS_TO_SHOW;
  }

  // Create a temporary container to measure word dimensions
  const tempContainer = document.createElement("div");
  tempContainer.style.position = "absolute";
  tempContainer.style.visibility = "hidden";
  tempContainer.style.whiteSpace = "nowrap";
  tempContainer.style.fontSize = getComputedStyle(wordToTypeElement).fontSize;
  tempContainer.style.fontFamily =
    getComputedStyle(wordToTypeElement).fontFamily;
  tempContainer.style.lineHeight =
    getComputedStyle(wordToTypeElement).lineHeight;
  document.body.appendChild(tempContainer);

  // Measure average word width by sampling some words
  let totalWidth = 0;
  const sampleSize = Math.min(10, words.length);
  let actualSamplesUsed = 0;

  for (let i = 0; i < sampleSize; i++) {
    const wordIndex = (currentWordIndex + i) % words.length;
    const baseWord = words[wordIndex];
    const word = addPunctuationToWord(baseWord, wordIndex);

    tempContainer.textContent = word + " "; // Include space
    totalWidth += tempContainer.offsetWidth;
  }

  const averageWordWidth = totalWidth / sampleSize;

  // Calculate line height
  tempContainer.textContent = "Tg"; // Characters with descenders and ascenders
  const lineHeight = tempContainer.offsetHeight;

  // Clean up
  document.body.removeChild(tempContainer);

  // Calculate how many words can fit
  const wordsPerLine = Math.floor(availableWidth / averageWordWidth);
  const maxLines = Math.floor(availableHeight / lineHeight);
  const maxWords = Math.max(
    wordsPerLine * maxLines,
    GAME_DEFAULTS.WORDS_TO_SHOW,
  );

  // Cap at a reasonable maximum to avoid performance issues
  return Math.min(maxWords, 100);
}

function updateWordDisplay() {
  const wordToTypeElement = domManager.get("wordToType");
  const nextWordElement = domManager.get("nextWord");
  const showSpace =
    storageManager.getItem("showSpacesAfterWords", "true") !== "false";

  if (!wordToTypeElement) return;

  // Clear existing content
  wordToTypeElement.innerHTML = "";

  // Create word container
  const wordContainer = document.createElement("div");
  wordContainer.classList.add("word-container");

  // Calculate optimal number of words to show based on available space
  const wordsToShow = calculateOptimalWordCount();

  // Generate word display - only show current and upcoming words for now
  const displayWords = [];

  // Add current and upcoming words - always start with currentWordIndex
  for (let i = 0; i < wordsToShow; i++) {
    const wordIndex = (currentWordIndex + i) % words.length;
    const baseWord = words[wordIndex];
    const word = addPunctuationToWord(baseWord, wordIndex);
    const isCurrentWord = i === 0;

    displayWords.push({
      index: wordIndex,
      word: word,
      isCurrentWord: isCurrentWord,
      isCompleted: false,
      displayPosition: i, // Track position in display
    });
  }

  for (let wordIdx = 0; wordIdx < displayWords.length; wordIdx++) {
    const { word, isCurrentWord, isCompleted } = displayWords[wordIdx];

    // Create word element
    const wordElement = document.createElement("div");
    wordElement.classList.add("word");
    wordElement.setAttribute("data-word-index", displayWords[wordIdx].index);

    // Add word state classes - ensure only one current word
    if (isCompleted) {
      wordElement.classList.add("completed");
    } else if (wordIdx === 0) {
      // First word in display should always be current
      wordElement.classList.add("current");
    } else {
      wordElement.classList.add("upcoming");
    }

    // Create letter elements
    for (let i = 0; i < word.length; i++) {
      const letterElement = document.createElement("span");
      letterElement.classList.add("letter");
      letterElement.textContent = word[i];
      letterElement.setAttribute("data-letter-index", i);

      // Set letter state based on word type
      if (isCompleted) {
        letterElement.classList.add("correct");
      } else if (wordIdx === 0) {
        // For current word (first in display), set first letter as current, rest as remaining
        if (i === 0) {
          letterElement.classList.add("current");
        } else {
          letterElement.classList.add("remaining");
        }
      } else {
        letterElement.classList.add("remaining");
      }

      wordElement.appendChild(letterElement);
    }

    // Add invisible space for word completion (no visual indicator)
    if (showSpace && wordIdx < displayWords.length - 1) {
      const spaceElement = document.createElement("span");
      spaceElement.classList.add("letter", "space");
      spaceElement.innerHTML = "&nbsp;"; // Invisible space
      spaceElement.setAttribute("data-letter-index", word.length);

      if (isCurrentWord) {
        spaceElement.classList.add("remaining");
      } else {
        spaceElement.classList.add("remaining");
      }

      wordElement.appendChild(spaceElement);
    }

    wordContainer.appendChild(wordElement);
  }

  wordToTypeElement.appendChild(wordContainer);

  // Add click handler to focus the hidden input when clicking on the word display
  wordToTypeElement.onclick = function () {
    const userInput = domManager.get("userInput");
    if (userInput) {
      userInput.focus();

      // Start game on mobile tap (regardless of minimal mode)
      const isMobile = window.innerWidth <= 768;

      if (isMobile && gameStartTime === null && !hasStartedTyping) {
        startGame();
      }
    }
  };

  // Clear the next word display since we show multiple words now
  if (nextWordElement) {
    nextWordElement.textContent = "";
  }

  // Re-initialize smooth caret system after word display update
  if (window.smoothCaret) {
    // Check if caret element still exists in DOM
    const existingCaret = document.getElementById("smooth-caret");
    if (!existingCaret) {
      // Caret was removed, reinitialize it
      window.smoothCaret.destroy();
      window.smoothCaret.init();
    }
    // Update position after ensuring caret exists
    setTimeout(() => {
      window.smoothCaret.updateCaretPosition(false); // Don't animate initially
    }, 0);
  }
}

// Helper function to get current word element
function getCurrentWordElement() {
  // Simply find the word with the 'current' class - should be the first word in display
  let currentWord = document.querySelector(".word.current");

  // If no current word found, make the first word current
  if (!currentWord) {
    const firstWord = document.querySelector(".word");
    if (firstWord) {
      // Remove current class from all words
      document
        .querySelectorAll(".word.current")
        .forEach((w) => w.classList.remove("current"));
      // Make first word current
      firstWord.classList.add("current");
      firstWord.classList.remove("upcoming", "completed");
      currentWord = firstWord;
    }
  }

  return currentWord;
}

// Helper function to get all letter elements in current word
function getCurrentWordLetters() {
  const currentWord = getCurrentWordElement();
  return currentWord ? currentWord.querySelectorAll(".letter") : [];
}

// Check if a word element is on the last visible row
function isWordOnLastRow(wordElement) {
  const wordContainer = document.querySelector(".word-container");
  if (!wordContainer || !wordElement) return false;

  const containerHeight = wordContainer.offsetHeight;
  const wordTop = wordElement.offsetTop;
  const wordHeight = wordElement.offsetHeight;
  const lineHeight = parseFloat(getComputedStyle(wordContainer).lineHeight);

  // Calculate which row this word is on (0-based)
  const rowNumber = Math.floor(wordTop / lineHeight);
  const maxRows = Math.floor(containerHeight / lineHeight);

  // Return true if this is the last row (row 2 for 3-row display)
  return rowNumber >= maxRows - 1;
}

// Scroll the word display up by removing first row and adding new words
function scrollWordsDisplay() {
  const wordContainer = document.querySelector(".word-container");
  if (!wordContainer) return;

  const allWords = Array.from(wordContainer.querySelectorAll(".word"));
  if (allWords.length === 0) return;

  // Find words on the first row to remove
  const lineHeight = parseFloat(getComputedStyle(wordContainer).lineHeight);
  const firstRowWords = allWords.filter((word) => {
    const wordTop = word.offsetTop;
    const rowNumber = Math.floor(wordTop / lineHeight);
    return rowNumber === 0;
  });

  // Remove first row words
  firstRowWords.forEach((word) => word.remove());

  // Add new words to fill the display
  addNewWordsToDisplay();

  // Find and mark the current word as current
  const currentWordElement = document.querySelector(
    `[data-word-index="${currentWordIndex}"]`,
  );
  if (currentWordElement) {
    // Remove current class from all words first
    document
      .querySelectorAll(".word.current")
      .forEach((w) => w.classList.remove("current"));
    currentWordElement.classList.remove("upcoming");
    currentWordElement.classList.add("current");
  }

  // Update smooth caret position after scrolling
  if (window.smoothCaret && window.smoothCaret.isInitialized) {
    setTimeout(() => {
      window.smoothCaret.updateCaretPosition();
    }, 0);
  }
}

// Function to add new words to display without clearing existing ones
function addNewWordsToDisplay() {
  const wordContainer = document.querySelector(".word-container");
  if (!wordContainer || !words || words.length === 0) {
    return;
  }

  const showSpace = localStorage.getItem("showSpacesAfterWords") !== "false";

  // Use dynamic word count calculation
  const optimalWordCount = calculateOptimalWordCount();
  const existingWords = wordContainer.querySelectorAll(".word").length;
  const wordsToAdd = Math.max(optimalWordCount - existingWords, 5); // Ensure we have enough words

  // Find the highest word index currently displayed
  const displayedWords = Array.from(wordContainer.querySelectorAll(".word"));
  let highestIndex = -1;
  displayedWords.forEach((word) => {
    const index = parseInt(word.getAttribute("data-word-index"));
    if (index > highestIndex) highestIndex = index;
  });

  // Add new words starting from the next index
  for (let i = 1; i <= wordsToAdd; i++) {
    const wordIndex = (highestIndex + i) % words.length;
    const baseWord = words[wordIndex];
    const word = addPunctuationToWord(baseWord, wordIndex);

    if (!word) continue;

    // Create word element
    const wordElement = document.createElement("div");
    wordElement.classList.add("word", "upcoming");
    wordElement.setAttribute("data-word-index", wordIndex);

    // Create letter elements
    for (let letterIdx = 0; letterIdx < word.length; letterIdx++) {
      const letterElement = document.createElement("span");
      letterElement.classList.add("letter", "remaining");
      letterElement.textContent = word[letterIdx];
      letterElement.setAttribute("data-letter-index", letterIdx);
      wordElement.appendChild(letterElement);
    }

    // Add invisible space for word completion (no visual indicator)
    if (showSpace) {
      const spaceElement = document.createElement("span");
      spaceElement.classList.add("letter", "space", "remaining");
      spaceElement.innerHTML = "&nbsp;";
      spaceElement.setAttribute("data-letter-index", word.length);
      wordElement.appendChild(spaceElement);
    }

    wordContainer.appendChild(wordElement);
  }
}

// Helper function to update letter states
function updateLetterStates(userInput) {
  const letters = getCurrentWordLetters();
  const currentWordElement = getCurrentWordElement();
  if (!currentWordElement) {
    return;
  }

  // Get the word text from the DOM element, not from the words array
  const currentWord = Array.from(
    currentWordElement.querySelectorAll(".letter:not(.space)"),
  )
    .map((letter) => letter.textContent)
    .join("");
  const showSpace = localStorage.getItem("showSpacesAfterWords") !== "false";

  letters.forEach((letter, index) => {
    // Remove all state classes (but keep animation classes)
    letter.classList.remove(
      "correct",
      "incorrect",
      "remaining",
      "current",
      "extra",
    );

    if (letter.classList.contains("space")) {
      // Handle space character (invisible)
      if (index < userInput.length) {
        if (userInput[index] === " ") {
          letter.classList.add("correct");
          // Only record keystroke for the most recent character typed
          if (index === userInput.length - 1) {
            recordKeystroke();
          }
        } else {
          letter.classList.add("incorrect");
        }
      } else if (index === userInput.length) {
        letter.classList.add("current");
      } else {
        letter.classList.add("remaining");
      }
      // Always keep space invisible
      letter.innerHTML = "&nbsp;";
    } else {
      // Handle regular characters
      if (index < userInput.length) {
        if (userInput[index] === currentWord[index]) {
          letter.classList.add("correct");
          // Only record keystroke for the most recent character typed
          if (index === userInput.length - 1) {
            recordKeystroke();
          }
        } else {
          letter.classList.add("incorrect");
        }
      } else if (index === userInput.length) {
        letter.classList.add("current");
      } else {
        letter.classList.add("remaining");
      }
      // Always show the expected letter, not what was typed
      letter.textContent = currentWord[index];
    }
  });

  // Update smooth caret position if available
  if (window.smoothCaret && window.smoothCaret.isInitialized) {
    window.smoothCaret.updateCaretPosition();
  }

  // No extra character handling needed since we prevent them from being typed
}

// No animation for progress bar when word is completed (clean minimal approach)
function flashProgress() {
  // Function kept for compatibility but no visual effect
}

// Update gradient flow animation based on performance
function updateGradientFlow(progressBar) {
  if (!progressBar || !hasStartedTyping) return;

  // Calculate current WPM
  const stats = calculateWPM();
  const currentWPM = stats.wpm;

  // Remove existing flow classes
  progressBar.classList.remove(
    "flow-excellent",
    "flow-good",
    "flow-average",
    "flow-poor",
  );

  // Determine performance level based on WPM only
  if (currentWPM >= 60) {
    // Excellent: 60+ WPM - Green/Cyan flowing gradient
    progressBar.classList.add("flow-excellent");
  } else if (currentWPM >= 40) {
    // Good: 40+ WPM - Blue/Purple flowing gradient
    progressBar.classList.add("flow-good");
  } else if (currentWPM >= 20) {
    // Average: 20+ WPM - Orange/Blue flowing gradient
    progressBar.classList.add("flow-average");
  } else if (currentWPM > 0) {
    // Poor: Below 20 WPM - Red/Orange flowing gradient
    progressBar.classList.add("flow-poor");
  }
  // If no conditions met (no typing yet), use default gradient
}

// Classic Mode: Countdown timer logic
function countDown() {
  // Skip timer countdown if in practice mistakes mode
  if (isPracticeMistakesMode) {
    return;
  }

  // Only countdown if the player has started typing and game is not paused
  if (hasStartedTyping && timeLeft > 0 && !isPaused) {
    timeLeft--;
    updateTimer();
  } else if (timeLeft <= 0) {
    clearInterval(countDownInterval);
    clearInterval(totalTimeInterval);
    showGameOverModal(
      "System breach <span style='color:#ff007c'>FAILED!</span>",
      false,
    );
  }
}

// Classic Mode: Update timer display
function updateTimer() {
  updateTimerDisplay();
}

// Universal timer display function that handles different modes
function updateTimerDisplay() {
  const timerElement = document.getElementById("timeLeft");
  const timerContainer = document.getElementById("timer");
  const totalTimeElement = document.getElementById("totalTimeValue");
  const totalTimeContainer = document.getElementById("totalTime");

  if (!timerElement || !timerContainer) return;

  if (isPracticeMistakesMode) {
    if (isZenMode) {
      // In zen practice mode, the updateZenTimer function handles the totalTimeElement
      // Just make sure the energy timer is hidden
      timerContainer.style.display = "none";
      if (totalTimeContainer) {
        totalTimeContainer.style.display = "";
      }
    } else {
      // In classic practice mode, show words typed in energy area
      timerContainer.innerHTML = `Words typed: <span id="timeLeft">${wordsTyped.length}</span>`;
      timerContainer.style.display = "";
      if (totalTimeContainer) {
        totalTimeContainer.style.display = "none";
      }
    }
  } else {
    // Show normal displays for regular modes
    if (isZenMode) {
      // Normal zen mode - energy hidden, time visible
      timerContainer.style.display = "none";
      if (totalTimeContainer) {
        totalTimeContainer.style.display = "";
      }
    } else {
      // Normal classic mode - energy visible, time hidden
      timerContainer.innerHTML = `Energy: <span id="timeLeft">${timeLeft}</span>`;
      timerContainer.style.display = "";
      if (totalTimeContainer) {
        totalTimeContainer.style.display = "none";
      }
    }
  }
}

// Classic Mode: Total time counter
function totalTimeCount() {
  if (isPaused) return; // Don't count time when paused

  // Skip time-based completion if in practice mistakes mode
  if (isPracticeMistakesMode) {
    return;
  }

  // Check time-based achievements during gameplay
  checkTimeBasedAchievements();

  const settings =
    JSON.parse(localStorage.getItem("gameSettings")) || gameSettings;
  const goalTime = (settings.timeLimit * settings.goalPercentage) / 100;
  if (totalTimeSpent >= goalTime) {
    clearInterval(countDownInterval);
    clearInterval(totalTimeInterval);
    showGameOverModal(getRandomSuccessMessage(), true);
  }
}

// Check time-based achievements during gameplay
function checkTimeBasedAchievements() {
  if (!window.achievementSystem || !gameStartTime || !hasStartedTyping) return;

  // Calculate current game duration in seconds
  const currentDurationSeconds = Math.floor(
    (Date.now() - gameStartTime) / 1000,
  );

  // Check for "Let him cook!" achievement (2+ minutes in non-zen mode)
  if (!isZenMode && currentDurationSeconds >= 120) {
    // Check if achievement is not already unlocked
    if (
      !window.achievementSystem.achievementsData.unlockedAchievements
        .let_him_cook
    ) {
      // Create fake game data for the achievement check
      const liveGameData = {
        mode: "Classic Mode", // Ensure it's not Zen Mode
        timeLeft: timeLeft > 0 ? timeLeft : 1, // Achievement requires game to be won, fake it as still active
        gameDurationSeconds: currentDurationSeconds,
      };

      // Manually unlock the achievement since we're checking during gameplay
      window.achievementSystem.achievementsData.unlockedAchievements.let_him_cook =
        {
          unlockedAt: new Date().toISOString(),
        };
      window.achievementSystem.saveData();
      window.achievementSystem.showNotification(
        window.achievementSystem.achievements.let_him_cook,
      );
    }
  }
}

// Get a random success message for Classic mode
function getRandomSuccessMessage() {
  const messages = [
    "Database <span style='color:#c3e88d'>CRACKED!</span> Mission accomplished.",
    "Access <span style='color:#c3e88d'>GRANTED!</span> Hack successful.",
    "Firewall <span style='color:#c3e88d'>BYPASSED!</span> Target compromised.",
    "System <span style='color:#c3e88d'>INFILTRATED!</span> Data secured.",
    "Security <span style='color:#c3e88d'>BREACHED!</span> Objective complete.",
    "Mainframe <span style='color:#c3e88d'>COMPROMISED!</span> Data secured.",
    "System core <span style='color:#c3e88d'>BREACHED!</span> Access granted.",
    "Firewall <span style='color:#c3e88d'>BYPASSED!</span> Systems accessed.",
    "Network <span style='color:#c3e88d'>HIJACKED!</span> Control established.",
  ];

  // Get a random index from the messages array
  const randomIndex = Math.floor(Math.random() * messages.length);

  // Return the randomly selected message
  return messages[randomIndex];
}

// Zen Mode: Calculate total time
function calculateTotalTime() {
  if (!sessionStartTime) return "0:00";
  const now = new Date();
  const totalSeconds = Math.floor((now - sessionStartTime) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Zen Mode: Update the timer display
function updateZenTimer() {
  if (gameEnded || isPaused) return;

  // Update the timer display
  const totalTimeElement = document.getElementById("totalTimeValue");
  const totalTimeContainer = document.getElementById("totalTime");

  if (totalTimeElement && totalTimeContainer) {
    if (isPracticeMistakesMode) {
      // In practice mode, change the entire container to show words typed
      totalTimeContainer.innerHTML = `Words typed: <span id="totalTimeValue">${wordsTyped.length}</span>`;
    } else {
      // Normal zen mode shows time with original label
      totalTimeContainer.innerHTML = `Time: <span id="totalTimeValue">${calculateTotalTime()}</span>`;
    }
  }

  // Update progress bar
  updateProgressBar();

  // Check time-based achievements during gameplay
  checkTimeBasedAchievements();

  if (
    isZenMode &&
    !isPracticeMistakesMode &&
    wordsTyped.length >= zenWordGoal
  ) {
    gameEnded = true;
    syncGameStateToWindow();
    clearInterval(totalTimeInterval);
    showGameOverModal(getRandomSuccessMessage(), true);
    return;
  }
}

// Throttle progress bar updates for performance
let lastProgressUpdate = 0;

// Update progress bar for both modes
function updateProgressBar() {
  // Throttle updates to avoid excessive DOM manipulation (max 60fps)
  const now = Date.now();
  if (now - lastProgressUpdate < 16) return;
  lastProgressUpdate = now;

  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressPercentage");

  if (isPracticeMistakesMode) {
    // In practice mistakes mode, hide the progress bar and precision multiplier entirely
    if (progressBar && progressBar.parentElement) {
      progressBar.parentElement.style.display = "none";
    }
    if (progressText) {
      progressText.style.display = "none";
    }
    const precisionMultiplier = document.getElementById("precisionMultiplier");
    if (precisionMultiplier) {
      precisionMultiplier.style.display = "none";
    }
    return;
  }

  // Show progress bar for normal modes (precision multiplier handles its own visibility)
  if (progressBar && progressBar.parentElement) {
    progressBar.parentElement.style.display = "";
  }
  if (progressText) {
    progressText.style.display = "";
  }

  let progressPercentage;

  if (isZenMode) {
    // In Zen mode, progress is based on words typed + partial progress of current word
    let baseProgress = wordsTyped.length;

    // Add fractional progress for the current word being typed
    const currentWord = words[currentWordIndex];
    const userInput = document.getElementById("userInput");
    if (currentWord && userInput && userInput.value.length > 0) {
      const currentProgress = Math.min(
        userInput.value.length / currentWord.length,
        1,
      );
      baseProgress += currentProgress * 0.8; // Add up to 80% of a word's progress while typing
    }

    progressPercentage = (baseProgress / zenWordGoal) * 100;
  } else {
    // In Classic mode, progress is based on words completed + partial progress of current word
    const settings =
      JSON.parse(localStorage.getItem("gameSettings")) || gameSettings;
    const wordsGoal = parseInt(settings.timeLimit || "30");

    let baseProgress = wordsTyped.length;

    // Add fractional progress for the current word being typed
    const currentWord = words[currentWordIndex];
    const userInput = document.getElementById("userInput");
    if (
      currentWord &&
      userInput &&
      userInput.value.length > 0 &&
      hasStartedTyping
    ) {
      const typingProgress = Math.min(
        userInput.value.length / currentWord.length,
        1,
      );
      baseProgress += typingProgress * 0.8; // Add up to 80% of a word's progress while typing
    }

    progressPercentage = (baseProgress / wordsGoal) * 100;
  }

  if (progressBar) {
    progressBar.style.width = `${progressPercentage}%`;
    progressBar.setAttribute("aria-valuenow", progressPercentage);
    progressBar.style.backgroundColor = "#1f2335";

    // Update gradient flow animation based on performance
    updateGradientFlow(progressBar);
  }

  if (progressText) {
    if (isZenMode) {
      progressText.textContent = `Progress ${Math.floor(progressPercentage)}%`;
    } else {
      progressText.textContent = `Progress ${Math.floor(progressPercentage)}%`;
    }
  }
}

// Input handling for both modes
// Helper function to handle command input
function handleCommandInput(e, userInput) {
  if (userInput.includes("/")) {
    showCommandPalette();
    e.target.value = userInput.replace("/", "");
    return true;
  }
  return false;
}

// Helper function to validate input length
function validateInputLength(e, userInput, currentWord, showSpace) {
  const maxAllowedLength = showSpace
    ? currentWord.length + 1
    : currentWord.length;
  if (userInput.length > maxAllowedLength) {
    e.target.value = userInput.substring(0, maxAllowedLength);
    return false;
  }
  return true;
}

// Helper function to start game timers
function startGameTimers() {
  if (!hasStartedTyping) {
    hasStartedTyping = true;
    syncGameStateToWindow();
    gameStartTime = Date.now();
    startWpmTracking();

    if (isZenMode) {
      sessionStartTime = new Date();
      totalTimeInterval = setInterval(
        updateZenTimer,
        TIMERS.ZEN_TIMER_INTERVAL,
      );
    }
  }
}

// Activate the game - remove inactive state and prepare for typing
function activateGame() {
  const gameElement = document.getElementById("game");
  if (gameElement) {
    gameElement.classList.remove("inactive");
  }

  // Focus the input field
  const userInput = domManager.get("userInput");
  if (userInput) {
    userInput.focus();
  }
}

// Initialize game state when user starts typing for the first time
function startGameOnFirstInput() {
  // Set game as started
  hasStartedTyping = true;
  syncGameStateToWindow();
  gameStartTime = Date.now();
  keystrokeTimestamps = [];
  mistakeTimestamps = [];

  // Reset mistake tracking for new game (unless in practice mistakes mode)
  if (!isPracticeMistakesMode) {
    gameMistakes = {
      words: [],
      totalMistakes: 0,
    };
  }

  startWpmTracking();

  // Initialize timers based on mode
  if (isZenMode) {
    // Zen Mode - start zen timer
    sessionStartTime = new Date();
    if (document.getElementById("totalTimeValue")) {
      if (isPracticeMistakesMode) {
        // In practice mode, keep words counter
        document.getElementById("totalTimeValue").textContent = "0";
        const totalTimeContainer = document.getElementById("totalTime");
        if (totalTimeContainer) {
          totalTimeContainer.innerHTML = `Words typed: <span id="totalTimeValue">0</span>`;
        }
      } else {
        // Normal zen mode shows time
        document.getElementById("totalTimeValue").textContent = "0:00";
      }
    }

    // Clear any existing intervals and start zen timer
    if (countDownInterval) clearInterval(countDownInterval);
    if (totalTimeInterval) clearInterval(totalTimeInterval);
    totalTimeInterval = setInterval(updateZenTimer, TIMERS.ZEN_TIMER_INTERVAL);
  } else {
    // Classic Mode - initialize timer with settings
    timeLeft = gameSettings.initialTime;
    bonusTime = gameSettings.bonusTime;
    updateTimer();

    // Clear previous intervals if they exist
    if (countDownInterval) clearInterval(countDownInterval);
    if (totalTimeInterval) clearInterval(totalTimeInterval);

    // Set up timer intervals
    countDownInterval = setInterval(countDown, TIMERS.COUNTDOWN_INTERVAL);
    totalTimeInterval = setInterval(totalTimeCount, TIMERS.TOTAL_TIME_INTERVAL);
  }

  // Reset game state variables (already set in setupUI but ensure they're reset)
  wordsTyped = [];
  totalCharactersTyped = 0;
  totalKeystrokes = 0;
  correctKeystrokes = 0;
  totalTimeSpent = 0;

  // Reset progress bar
  updateProgressBar();
}

// Helper function to handle keypress sound
function handleKeypressSound(e) {
  if (
    hasStartedTyping &&
    ((e.inputType === "insertText" && e.data) ||
      e.inputType === "deleteContentBackward" ||
      e.inputType === "deleteContentForward")
  ) {
    playKeypressSound();
  }
}

// Helper function to process character input
function processCharacterInput(e, userInput, currentWord, showSpace) {
  if (e.inputType === "insertText" && e.data) {
    totalKeystrokes++;

    // Check if user pressed space at the end of the word with incorrect letters present
    if (
      e.data === " " &&
      userInput.length - 1 === currentWord.length &&
      hasIncorrectLetters(userInput.slice(0, -1), currentWord)
    ) {
      // Trigger blink animation and prevent the space from being added
      triggerErrorBlink();
      // Remove the space from the input
      e.target.value = userInput.slice(0, -1);
      return false; // Indicate space was not allowed
    }

    const isCorrectChar = validateCharacterInput(
      userInput,
      currentWord,
      showSpace,
    );

    if (!isCorrectChar) {
      // Record mistake timestamp with word context for chart visualization
      if (gameStartTime && !gameEnded) {
        mistakeTimestamps.push({
          timestamp: Date.now(),
          word: currentWord,
          position: userInput.length - 1, // Position where mistake occurred
          attempted: userInput[userInput.length - 1] || "", // What was typed
          expected: currentWord[userInput.length - 1] || "", // What was expected
        });

        // Track words with mistakes for practice mode (skip if already in practice mistakes mode)
        if (!isPracticeMistakesMode) {
          // Get the base word without punctuation for practice
          const baseWord =
            words[currentWordIndex] || currentWord.replace(/[.,!?;:"']/g, "");
          if (!gameMistakes.words.includes(baseWord)) {
            gameMistakes.words.push(baseWord);
          }
        }
        gameMistakes.totalMistakes++;
      }
      currentWordHasMistakes = true;
      if (!isZenMode) {
        precisionStreak = 0;
        hidePrecisionMultiplier();
      }
    }
  }
  return true; // Normal processing
}

// Helper function to validate character input
function validateCharacterInput(userInput, currentWord, showSpace) {
  if (showSpace && userInput.length > currentWord.length) {
    if (userInput[userInput.length - 1] === " ") {
      correctKeystrokes++;
      return true;
    }
  } else if (userInput.length <= currentWord.length) {
    if (userInput[userInput.length - 1] === currentWord[userInput.length - 1]) {
      correctKeystrokes++;
      return true;
    }
  }
  return false;
}

// Helper function to check if current input has incorrect letters
function hasIncorrectLetters(userInput, currentWord) {
  for (let i = 0; i < Math.min(userInput.length, currentWord.length); i++) {
    if (userInput[i] !== currentWord[i]) {
      return true;
    }
  }
  return false;
}

// Helper function to trigger error blink animation
function triggerErrorBlink() {
  const currentWordElement = document.querySelector(".word.current");
  if (currentWordElement) {
    currentWordElement.classList.add("error-blink");
    // Remove the class after animation completes (0.3s single iteration)
    setTimeout(() => {
      currentWordElement.classList.remove("error-blink");
    }, 300);
  }
}

// Helper function to check if word is complete
function isWordComplete(userInput, currentWord, showSpace) {
  const isLastWord = isPracticeMistakesMode
    ? false // Never treat as last word in practice mode
    : isZenMode
      ? wordsTyped.length + 1 >= zenWordGoal
      : (() => {
          const settings = storageManager.getGameSettings();
          const wordsGoal = parseInt(
            storageManager.getItem("nerdtype_words_goal") ||
              settings.timeLimit ||
              "30",
          );
          return wordsTyped.length + 1 >= wordsGoal;
        })();

  const expectedInput =
    showSpace && !isLastWord ? currentWord + " " : currentWord;
  return userInput === expectedInput;
}

// Helper function to handle word completion
function handleWordCompletion(e, currentWord, showSpace) {
  updatePrecisionStreak();
  updateGameProgress(currentWord, showSpace);
  moveToNextWord();
  updateWordDisplayAfterCompletion();

  e.target.value = "";
  updateLetterStates("");
  updateProgressBar();

  // Update timer display for practice mode
  if (isPracticeMistakesMode) {
    updateTimerDisplay();
  }

  checkGameCompletion();
}

// Helper function to update precision streak
function updatePrecisionStreak() {
  if (!currentWordHasMistakes && !isZenMode) {
    precisionStreak++;

    if (precisionStreak > peakPrecisionStreak) {
      peakPrecisionStreak = precisionStreak;
    }

    if (precisionStreak >= 5) {
      showPrecisionMultiplier();
      animatePrecisionIncrement();
    }
  }
  currentWordHasMistakes = false;
}

// Helper function to update game progress
function updateGameProgress(currentWord, showSpace) {
  flashProgress();
  totalCharactersTyped += currentWord.length + (showSpace ? 1 : 0);
  totalTimeSpent += 1;
  if (!isZenMode) {
    timeLeft += bonusTime;
  }
  wordsTyped.push(currentWord);
}

// Helper function to move to next word
function moveToNextWord() {
  const currentWordElement = getCurrentWordElement();
  if (currentWordElement) {
    currentWordElement.classList.remove("current");
    currentWordElement.classList.add("completed");
  }

  currentWordIndex++;
  nextWordIndex = currentWordIndex + 1;

  if (currentWordIndex >= words.length) {
    // In practice mistakes mode, restart the practice session instead of regenerating
    if (isPracticeMistakesMode) {
      startPracticeMistakesMode();
      return;
    }

    currentWordIndex = 0;
    nextWordIndex = 1;

    if (!availableWordLists[currentLanguage]?.sequential) {
      // Only shuffle if not a sequential word list
      words = words.sort(() => Math.random() - 0.5);
    }
  }
}

// Helper function to update word display after completion
function updateWordDisplayAfterCompletion() {
  const nextWordElement = document.querySelector(
    `[data-word-index="${currentWordIndex}"]`,
  );
  if (!nextWordElement) {
    scrollWordsDisplay();
  } else {
    if (isWordOnLastRow(nextWordElement)) {
      scrollWordsDisplay();
    } else {
      nextWordElement.classList.remove("upcoming");
      nextWordElement.classList.add("current");
    }
  }

  // Update smooth caret position after word completion
  if (window.smoothCaret && window.smoothCaret.isInitialized) {
    setTimeout(() => {
      window.smoothCaret.updateCaretPosition();
    }, 0);
  }
}

// Helper function to check game completion
function checkGameCompletion() {
  // Skip game completion check if in practice mistakes mode
  if (isPracticeMistakesMode) {
    return;
  }

  if (isZenMode && wordsTyped.length >= zenWordGoal) {
    gameEnded = true;
    syncGameStateToWindow();
    clearInterval(totalTimeInterval);
    showGameOverModal(getRandomSuccessMessage(), true);
  } else if (!isZenMode) {
    const settings = storageManager.getGameSettings();
    const wordsGoal = parseInt(
      storageManager.getItem("nerdtype_words_goal") ||
        settings.timeLimit ||
        "30",
    );

    if (wordsTyped.length >= wordsGoal) {
      gameEnded = true;
      syncGameStateToWindow();
      clearInterval(countDownInterval);
      clearInterval(totalTimeInterval);
      showGameOverModal(getRandomSuccessMessage(), true);
    }
  }
}

// Main input handler - now much cleaner and focused
function checkInput(e) {
  const userInput = e.target.value;

  // Handle command input
  if (handleCommandInput(e, userInput)) return;

  const currentWord = addPunctuationToWord(
    words[currentWordIndex],
    currentWordIndex,
  );
  const wordDisplay = domManager.get("wordToType");
  const showSpace =
    storageManager.getItem("showSpacesAfterWords", "true") !== "false";

  if (!wordDisplay) return;

  // Validate input length
  if (!validateInputLength(e, userInput, currentWord, showSpace)) return;

  // Update progress bar as user types for smooth movement
  updateProgressBar();

  // Start game on first input
  if (e.target.value.length > 0 && !hasStartedTyping) {
    startGameOnFirstInput();
  }

  // Handle keypress sound
  handleKeypressSound(e);

  // Process character input
  const shouldContinue = processCharacterInput(
    e,
    userInput,
    currentWord,
    showSpace,
  );

  // If space was prevented due to incorrect letters, stop processing
  if (!shouldContinue) {
    return;
  }

  // Update letter states
  updateLetterStates(e.target.value);

  // Check if word is complete
  if (isWordComplete(e.target.value, currentWord, showSpace)) {
    handleWordCompletion(e, currentWord, showSpace);
  }
}

// Calculate WPM for both modes
function calculateWPM() {
  if (!gameStartTime) return { wpm: 0, accuracy: "0%" };

  const endTime = Date.now();
  let timeElapsed = (endTime - gameStartTime) / 60000;

  // Ensure minimum time to avoid division by zero
  timeElapsed = Math.max(0.08, timeElapsed);

  const CHARS_PER_WORD = GAME_DEFAULTS.CHARS_PER_WORD;

  const accuracy =
    totalKeystrokes > 0
      ? ((correctKeystrokes / totalKeystrokes) * 100).toFixed(1)
      : "0";

  const wpm = Math.round(totalCharactersTyped / CHARS_PER_WORD / timeElapsed);

  return {
    wpm,
    accuracy: `${accuracy}%`,
  };
}

// Record keystroke timestamp for WPM calculation
function recordKeystroke() {
  if (!gameStartTime || gameEnded) return;
  const timestamp = Date.now();

  // Prevent duplicate recordings for the same timestamp
  const lastTimestamp = keystrokeTimestamps[keystrokeTimestamps.length - 1];
  if (timestamp === lastTimestamp) {
    return; // Skip duplicate
  }

  keystrokeTimestamps.push(timestamp);
}

// Generate WPM graph from keystroke timestamps (Monkeytype style)
function generateWmpGraphFromTimestamps() {
  if (!gameStartTime || keystrokeTimestamps.length === 0) {
    perSecondWpmData = [];
    return;
  }

  const gameEndTime = Date.now();
  const actualDuration = (gameEndTime - gameStartTime) / 1000;
  const fullSeconds = Math.floor(actualDuration);
  const rawWmpData = [];

  // Calculate raw WPM for each FULL second only (exclude incomplete final second)
  for (let sec = 0; sec < fullSeconds; sec++) {
    const windowStart = gameStartTime + sec * 1000;
    const windowEnd = windowStart + 1000;

    const charsInWindow = keystrokeTimestamps.filter(
      (t) => t >= windowStart && t < windowEnd,
    ).length;

    const wordsInWindow = charsInWindow / GAME_DEFAULTS.CHARS_PER_WORD;
    const rawWmp = wordsInWindow * 60;
    rawWmpData.push(rawWmp);
  }

  // Apply smoothing to reduce noise (3-point moving average)
  const smoothedData = rawWmpData.map((wmp, i, arr) => {
    const prev = arr[i - 1] ?? wmp;
    const next = arr[i + 1] ?? wmp;
    return Math.round((prev + wmp + next) / 3);
  });

  // Ignore ultra-short pauses by interpolating 0 WPM values
  const cleanedWmpData = smoothedData.map((val, i, arr) => {
    if (val === 0) {
      const prev = arr[i - 1] ?? 0;
      const next = arr[i + 1] ?? 0;
      if (prev > 0 && next > 0) {
        return Math.round((prev + next) / 2); // Fill small pause
      }
    }
    return val;
  });

  perSecondWpmData = cleanedWmpData.map((val) => Math.max(0, val));
}

// Generate per-second mistake data for chart visualization
function generatePerSecondMistakeData() {
  if (!gameStartTime || mistakeTimestamps.length === 0) {
    return { counts: [], details: [] };
  }

  const gameEndTime = Date.now();
  const actualDuration = (gameEndTime - gameStartTime) / 1000;
  const fullSeconds = Math.floor(actualDuration);
  const perSecondMistakes = [];
  const perSecondDetails = [];

  // Calculate mistakes for each full second
  for (let sec = 0; sec < fullSeconds; sec++) {
    const windowStart = gameStartTime + sec * 1000;
    const windowEnd = windowStart + 1000;

    const mistakesInWindow = mistakeTimestamps.filter(
      (mistake) =>
        mistake.timestamp >= windowStart && mistake.timestamp < windowEnd,
    );

    perSecondMistakes.push(mistakesInWindow.length);
    perSecondDetails.push(mistakesInWindow); // Store detailed mistake info
  }

  return { counts: perSecondMistakes, details: perSecondDetails };
}

// Initialize keystroke recording
function startWpmTracking() {
  // Clear any existing tracking data
  perSecondWpmData = [];
}

// Stop WMP tracking (no cleanup needed for timestamp-based system)
function stopWpmTracking() {
  // No cleanup needed - keystroke timestamps are processed at game end
}

// Classic Mode specific score calculation
function calculateDifficultyMultiplier(settings) {
  try {
    // Reference values (classic mode settings)
    const refTimeLimit = 30;
    const refBonusTime = 3;
    const refInitialTime = 10;

    // Calculate individual difficulty factors
    // For timeLimit, MORE words (HIGHER limit) is HARDER
    const timeLimitFactor = Math.min(
      3,
      Math.max(1, settings.timeLimit) / refTimeLimit,
    );

    // For bonus and initial time, LOWER is HARDER
    const bonusTimeFactor = Math.min(
      3,
      refBonusTime / Math.max(0.5, settings.bonusTime),
    );
    const initialTimeFactor = Math.min(
      3,
      refInitialTime / Math.max(0.5, settings.initialTime),
    );

    // Weighted calculation (balances the three factors)
    const weightedMultiplier =
      (timeLimitFactor * 1.5 +
        bonusTimeFactor * 1.75 +
        initialTimeFactor * 1.75) /
      5;

    // Normalize to a range with Classic at 1.0
    return Math.max(0.5, Math.min(2.0, weightedMultiplier));
  } catch (error) {
    console.error("Error calculating difficulty multiplier:", error);
    return 1.0;
  }
}

// Classic Mode detailed score calculation with breakdown
function calculateScoreBreakdown() {
  try {
    // Get typing performance metrics
    const wpmResult = calculateWPM();
    const wpm = Math.max(1, wpmResult.wpm); // Minimum of 1 WPM to avoid division by zero
    const accuracy = parseFloat(wpmResult.accuracy.replace("%", "")) / 100;

    // Get game settings for difficulty multiplier
    const settings = JSON.parse(localStorage.getItem("gameSettings")) || {
      timeLimit: 30,
      bonusTime: 3,
      initialTime: 10,
      goalPercentage: 100,
      currentMode: "classic",
    };

    // Calculate difficulty multiplier based on game settings
    const difficultyMultiplier = calculateDifficultyMultiplier(settings);

    // Calculate precision multiplier bonus based on peak streak
    const precisionMultiplier = calculatePeakPrecisionMultiplier();

    const baseScore = Math.round(
      wpm * 10 * (accuracy * accuracy) * difficultyMultiplier,
    );

    // Apply precision bonus using the calculated multiplier
    const precisionBonusScore = Math.round(
      baseScore * (precisionMultiplier - 1.0),
    );

    const energyBonus = Math.round(Math.min(timeLeft * 5, baseScore * 0.2));

    const totalScore = Math.round(
      baseScore + precisionBonusScore + energyBonus,
    );

    return {
      baseScore,
      precisionBonusScore,
      energyBonus,
      totalScore,
      precisionMultiplier,
      difficultyMultiplier,
      wpm,
      accuracy: accuracy * 100,
    };
  } catch (error) {
    console.error("Error calculating score breakdown:", error);
    const fallbackScore = timeLeft * 256;
    return {
      baseScore: fallbackScore,
      precisionBonusScore: 0,
      energyBonus: 0,
      totalScore: fallbackScore,
      precisionMultiplier: 1.0,
      difficultyMultiplier: 1.0,
      wpm: 0,
      accuracy: 0,
    };
  }
}

// Classic Mode score calculation (wrapper for backward compatibility)
function calculateScore() {
  return calculateScoreBreakdown().totalScore;
}

// Get Tier/Rank for achievements - used in both modes
function getSpeedTier(wpm) {
  if (wpm >= 100) return "QUANTUM SPEED";
  if (wpm >= 80) return "NEURAL MASTER";
  if (wpm >= 60) return "CYBER ADEPT";
  if (wpm >= 40) return "DIGITAL RUNNER";
  return "INITIATING";
}

function getAccuracyRank(accuracy) {
  const numericAccuracy = parseFloat(accuracy);
  const roundedAccuracy = Math.round(numericAccuracy * 10) / 10;

  if (roundedAccuracy >= 98) return "PERFECT SYNC";
  if (roundedAccuracy >= 95) return "NEURAL MASTER";
  if (roundedAccuracy >= 90) return "CYBER EFFICIENT";
  if (roundedAccuracy >= 85) return "DIGITAL PRECISE";
  if (roundedAccuracy >= 75) return "SYSTEM UNSTABLE";
  if (roundedAccuracy >= 60) return "NEURAL INTERFERENCE";
  return "SYSTEM FAILURE";
}

// Precision Multiplier System Functions

function showPrecisionMultiplier() {
  // Don't show precision multiplier in zen mode
  if (isZenMode) {
    return;
  }

  // Check if precision multiplier UI is hidden by user setting
  const hidePrecisionUI =
    localStorage.getItem("hide_precision_multiplier_ui") === "true";
  if (hidePrecisionUI) {
    return;
  }

  // Check if minimal UI mode is enabled
  const minimalUIEnabled = localStorage.getItem("nerdtype_hide_ui") === "true";
  if (minimalUIEnabled) {
    return;
  }

  const multiplierElement = document.getElementById("precisionMultiplier");

  if (multiplierElement) {
    multiplierElement.textContent = `${precisionStreak}x`;
    multiplierElement.style.display = "inline-block";

    // Add appear animation for first show
    multiplierElement.classList.add("appear");
    setTimeout(() => {
      multiplierElement.classList.remove("appear");
    }, 400);
  }
}

function hidePrecisionMultiplier() {
  const multiplierElement = document.getElementById("precisionMultiplier");
  if (multiplierElement) {
    // Don't start new animation if already fading out
    if (multiplierElement.classList.contains("fade-out")) {
      return;
    }

    // Add fade-out animation
    multiplierElement.classList.add("fade-out");

    // Remove other animation classes that might interfere
    multiplierElement.classList.remove("appear", "increment");

    // Hide after animation completes
    setTimeout(() => {
      multiplierElement.style.display = "none";
      multiplierElement.classList.remove("fade-out");
    }, 300);
  }
}

function animatePrecisionIncrement() {
  const multiplierElement = document.getElementById("precisionMultiplier");
  if (multiplierElement) {
    // Update the text
    multiplierElement.textContent = `${precisionStreak}x`;

    // Add increment animation
    multiplierElement.classList.remove("increment");
    // Force reflow to reset animation
    multiplierElement.offsetHeight;
    multiplierElement.classList.add("increment");

    // Remove animation class after completion
    setTimeout(() => {
      multiplierElement.classList.remove("increment");
    }, 400);
  }
}

function calculatePrecisionMultiplier() {
  // No precision bonus in zen mode
  if (isZenMode) {
    return 1.0;
  }

  if (precisionStreak < 5) {
    return 1.0; // No bonus for less than 5 perfect words
  }

  // 2% bonus per perfect word after 5th
  const perfectWordsAboveFive = Math.max(0, precisionStreak - 5);
  const bonusPercentage = perfectWordsAboveFive * 0.02;

  // Return as multiplier for display (1.0 + bonus percentage)
  return 1.0 + bonusPercentage;
}

function calculatePeakPrecisionMultiplier() {
  // No precision bonus in zen mode
  if (isZenMode) {
    return 1.0;
  }

  if (peakPrecisionStreak < 5) {
    return 1.0; // No bonus for less than 5 perfect words
  }

  // 2% bonus per perfect word after 5th
  const perfectWordsAboveFive = Math.max(0, peakPrecisionStreak - 5);
  const bonusPercentage = perfectWordsAboveFive * 0.02;

  // Return as multiplier for display (1.0 + bonus percentage)
  return 1.0 + bonusPercentage;
}

function resetPrecisionSystem() {
  precisionStreak = 0;
  peakPrecisionStreak = 0;
  currentWordHasMistakes = false;
  hidePrecisionMultiplier();
}

// Game Over Modal for both modes
async function showGameOverModal(message, isSuccess = true) {
  stopWpmTracking();
  const stats = calculateWPM();
  const languageName =
    currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1);

  const dataCollectionEnabled = localStorage.getItem("data_collection_enabled");
  const isDataCollectionEnabled =
    dataCollectionEnabled === null || dataCollectionEnabled === "true";
  const leaderboardStatus = isDataCollectionEnabled ? "ENABLED" : "DISABLED";
  const leaderboardColor = isDataCollectionEnabled ? "#c3e88d" : "#ff007c";

  if (isZenMode) {
    // Zen Mode specific game over
    const totalTime = calculateTotalTime();

    displayModernGameOverContent({
      mode: "zen",
      username: playerUsername,
      status: message,
      isSuccess: true, // Zen mode is always successful
      stats: {
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        sessionTime: totalTime,
        wordGoal: zenWordGoal,
      },
      gameSettings: {
        mode: "Zen",
        wordGoal: zenWordGoal,
      },
    });
    saveZenResult(stats.wpm, totalTime, stats.accuracy);
  } else {
    // Classic Mode specific game over
    const scoreBreakdown = calculateScoreBreakdown();

    // Get the proper mode name (capitalize first letter)
    const modeName =
      gameSettings.currentMode.charAt(0).toUpperCase() +
      gameSettings.currentMode.slice(1);

    displayModernGameOverContent({
      mode: "classic",
      username: playerUsername,
      status: message,
      isSuccess: isSuccess,
      stats: {
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        energyRemaining: timeLeft,
        finalScore: scoreBreakdown.totalScore,
        precisionStreak: peakPrecisionStreak,
      },
      scoreBreakdown: {
        baseScore: scoreBreakdown.baseScore,
        precisionBonus: scoreBreakdown.precisionBonusScore,
        energyBonus: scoreBreakdown.energyBonus,
        totalScore: scoreBreakdown.totalScore,
      },
      gameSettings: {
        mode: modeName,
        wordGoal: gameSettings.timeLimit,
        bonusEnergy: gameSettings.bonusTime,
        initialEnergy: gameSettings.initialTime,
        difficultyMultiplier:
          scoreBreakdown.difficultyMultiplier.toFixed(2) + "x",
        precisionMultiplier:
          scoreBreakdown.precisionMultiplier.toFixed(2) + "x",
      },
    });
    saveClassicResult(
      isSuccess ? timeLeft : 0,
      stats.wpm,
      stats.accuracy,
      scoreBreakdown.totalScore,
      isSuccess,
    );
  }

  await displayPreviousResults();
}

// Modern game over display with card layout
function displayModernGameOverContent(data) {
  const gameOverModal = new bootstrap.Modal(
    document.getElementById("gameOverModal"),
  );
  const modalBody = document
    .getElementById("gameOverModal")
    .querySelector(".modal-body");

  // Determine if we should apply red styling for defeat (non-zen mode only)
  const isDefeat = data.mode !== "zen" && !data.isSuccess;
  const defeatClass = isDefeat ? "defeat" : "";

  // Create modern card layout
  let content = `
    <div class="game-stats-container ${defeatClass}">
      <div class="stat-card">
        <div class="stat-label">WPM</div>
        <div class="stat-value wpm">${data.stats.wpm}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Accuracy</div>
        <div class="stat-value accuracy">${data.stats.accuracy}</div>
      </div>
  `;

  // Add mode-specific stats
  if (data.mode === "zen") {
    content += `
      <div class="stat-card">
        <div class="stat-label">Time</div>
        <div class="stat-value">${data.stats.sessionTime}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Words</div>
        <div class="stat-value">${data.stats.wordGoal}</div>
      </div>
    `;
  } else {
    content += `
      <div class="stat-card">
        <div class="stat-label">Energy</div>
        <div class="stat-value energy">${data.stats.energyRemaining}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Score</div>
        <div class="stat-value score">${data.stats.finalScore}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Streak</div>
        <div class="stat-value precision">${data.stats.precisionStreak}</div>
      </div>
    `;
  }

  content += `</div>`;

  // Add WPM progression chart
  content += `
    <div class="wpm-chart-container">
      <div class="chart-header">
        <h5 class="chart-title">
          <i class="fa-solid fa-chart-line me-2"></i>
          Game WPM Progress
        </h5>
      </div>
      <div class="chart-wrapper">
        <canvas id="gameOverWpmChart" width="400" height="200"></canvas>
      </div>
    </div>
  `;

  // Add score breakdown for classic mode
  if (data.mode === "classic" && data.scoreBreakdown) {
    content += `
      <div class="game-stats-container score-breakdown ${defeatClass}">
        <div class="stat-card">
          <div class="stat-label">Base Score</div>
          <div class="stat-value">${data.scoreBreakdown.baseScore}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Precision Bonus</div>
          <div class="stat-value precision">${data.scoreBreakdown.precisionBonus}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Energy Bonus</div>
          <div class="stat-value energy">${data.scoreBreakdown.energyBonus}</div>
        </div>
      </div>
    `;
  }

  // Add game settings info
  if (data.gameSettings) {
    if (data.mode === "zen") {
      // Zen mode - only show relevant settings
      content += `
        <div class="game-settings-info">
          <div class="settings-row">
            <span>Mode: ${data.gameSettings.mode}</span>
            <span>Words Goal: ${data.gameSettings.wordGoal}</span>
          </div>
        </div>
      `;
    } else {
      // Classic mode - show all settings
      content += `
        <div class="game-settings-info">
          <div class="settings-row">
            <span>Mode: ${data.gameSettings.mode}</span>
            <span>Words Goal: ${data.gameSettings.wordGoal}</span>
            <span>Energy Bonus: ${data.gameSettings.bonusEnergy}</span>
          </div>
          <div class="settings-row">
            <span>Initial Energy: ${data.gameSettings.initialEnergy}</span>
            <span>Difficulty: ${data.gameSettings.difficultyMultiplier}</span>
            <span>Precision Multiplier: ${data.gameSettings.precisionMultiplier}</span>
          </div>
        </div>
      `;
    }
  }

  // Add mistakes section if there were any mistakes and not in practice mode
  if (!isPracticeMistakesMode && gameMistakes.words.length > 0) {
    content += `
      <div class="mistakes-section-simple" style="text-align: center;">
        <h5 class="mistakes-title-simple" style="justify-content: center;">
          <i class="fa-solid fa-exclamation-triangle me-2" style="color: #f7768e;"></i>
          Words with Mistakes (${gameMistakes.words.length})
        </h5>
        <div class="mistakes-words-simple">
          ${gameMistakes.words.map((word) => `<span class="mistake-word-simple">${word}</span>`).join(" ")}
        </div>
      </div>
    `;
  }

  modalBody.innerHTML = content;

  // Render WPM progression chart after modal content is set
  generateWmpGraphFromTimestamps();
  setTimeout(() => renderGameOverWpmChart(), 100);

  gameOverModal.show();

  // Add practice mistakes notice if there are mistakes to practice
  if (!isPracticeMistakesMode && gameMistakes.words.length > 0) {
    const modalFooter = document.querySelector("#gameOverModal .modal-footer");
    if (modalFooter) {
      // Create the practice mistakes notice
      const practiceNotice = document.createElement("span");
      practiceNotice.id = "practiceMistakesNotice";
      practiceNotice.className = "press-enter-text desktop-return-text";
      practiceNotice.innerHTML = "Press Ctrl + M to practice mistakes";
      practiceNotice.style.cssText = `
        background-color: #7aa2f7;
        color: #24283b;
        padding: 4px 8px;
        border-radius: 9999px;
        margin-left: 10px;
      `;

      // Insert the notice next to the existing text, keeping centered layout
      const restartText = modalFooter.querySelector(".restart-text");
      if (restartText) {
        restartText.appendChild(practiceNotice);
      }
    }
  }

  // Handle Enter key to restart and Ctrl+M for practice mistakes
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      location.reload();
    } else if (e.ctrlKey && e.key.toLowerCase() === "m") {
      if (!isPracticeMistakesMode && gameMistakes.words.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        startPracticeMistakesMode();
      }
    }
  };

  document
    .getElementById("gameOverModal")
    .addEventListener("shown.bs.modal", () => {
      document.addEventListener("keydown", handleKeyPress);
    });

  document
    .getElementById("gameOverModal")
    .addEventListener("hidden.bs.modal", () => {
      document.removeEventListener("keydown", handleKeyPress);

      // Clean up the practice mistakes notice
      const practiceNotice = document.getElementById("practiceMistakesNotice");
      if (practiceNotice) {
        practiceNotice.remove();
      }
    });
}

// Function to start practice mistakes mode
function startPracticeMistakesMode() {
  // Close the game over modal
  const gameOverModal = bootstrap.Modal.getInstance(
    document.getElementById("gameOverModal"),
  );
  if (gameOverModal) {
    gameOverModal.hide();
  }

  // Check if we have mistake words
  if (gameMistakes.words.length === 0) {
    console.warn("No mistake words found - cannot start practice mode");
    return;
  }

  // Set practice mode flags
  isPracticeMistakesMode = true;
  practiceMistakesWords = [...gameMistakes.words]; // Copy the mistake words

  // Create repeating word list from mistakes (repeat multiple times for practice)
  const repeatCount = Math.max(
    5,
    Math.ceil(100 / practiceMistakesWords.length),
  ); // At least 100 words total
  words = [];
  for (let i = 0; i < repeatCount; i++) {
    words.push(...practiceMistakesWords);
  }

  // Shuffle the practice words for variety
  words = words.sort(() => Math.random() - 0.5);

  // Update game mode display
  const gameModeElement = document.getElementById("currentGameMode");
  if (gameModeElement) {
    gameModeElement.innerHTML =
      "Practice Mistakes <span style='opacity: 0.8;'>[Ctrl + Enter to exit]</span>";
    gameModeElement.style.color = "#ff9e64"; // Orange color to indicate practice mode
  }

  // Reset and start the game
  setTimeout(() => {
    startGame();

    // Update timer display after game starts and variables are reset
    setTimeout(() => {
      updateTimerDisplay();

      // For zen mode, also immediately update the timer display
      if (isZenMode) {
        const totalTimeContainer = document.getElementById("totalTime");
        if (totalTimeContainer) {
          totalTimeContainer.innerHTML = `Words typed: <span id="totalTimeValue">0</span>`;
        }
      }
    }, 50);
  }, 100);
}

// Function to exit practice mistakes mode
function exitPracticeMistakesMode() {
  isPracticeMistakesMode = false;
  practiceMistakesWords = [];

  // Restore original game mode display
  const gameModeElement = document.getElementById("currentGameMode");
  if (gameModeElement) {
    const mode = isZenMode ? "Zen" : gameSettings.mode || "Classic";
    gameModeElement.textContent = `${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`;
    gameModeElement.style.color = ""; // Reset color
  }

  // Reload to restore normal word list
  location.reload();
}

function validateTimeFormat(timeStr) {
  const timeRegex = /^([0-9]{1,2}):([0-5][0-9])$/;
  if (!timeRegex.test(timeStr)) return false;
  const [minutes, seconds] = timeStr.split(":").map(Number);
  return minutes >= 0 && seconds >= 0 && seconds < 60;
}

// Save results for Classic Mode
function saveClassicResult(
  timeLeft,
  wpm,
  accuracy,
  finalScore,
  isSuccess = true,
) {
  // Skip saving if in practice mistakes mode
  if (isPracticeMistakesMode) {
    return;
  }

  // Only block if this is explicitly a failed game
  if (!isSuccess && !isZenMode) {
    return;
  }

  let results = JSON.parse(localStorage.getItem("gameResults")) || [];

  // Get current highest achievements
  let highestAchievements = JSON.parse(
    localStorage.getItem("highestAchievements"),
  ) || {
    speedTier: "INITIATING",
    accuracyRank: "SYSTEM FAILURE",
  };

  // Current achievements
  const currentSpeedTier = getSpeedTier(wpm);
  const currentAccuracyRank = getAccuracyRank(accuracy);

  // Update highest achievements if needed
  const speedTierOrder = [
    "INITIATING",
    "DIGITAL RUNNER",
    "CYBER ADEPT",
    "NEURAL MASTER",
    "QUANTUM SPEED",
  ];

  const accuracyRankOrder = [
    "SYSTEM FAILURE",
    "NEURAL INTERFERENCE",
    "SYSTEM UNSTABLE",
    "DIGITAL PRECISE",
    "CYBER EFFICIENT",
    "NEURAL MASTER",
    "PERFECT SYNC",
  ];

  if (
    speedTierOrder.indexOf(currentSpeedTier) >
    speedTierOrder.indexOf(highestAchievements.speedTier)
  ) {
    highestAchievements.speedTier = currentSpeedTier;
  }

  if (
    accuracyRankOrder.indexOf(currentAccuracyRank) >
    accuracyRankOrder.indexOf(highestAchievements.accuracyRank)
  ) {
    highestAchievements.accuracyRank = currentAccuracyRank;
  }

  const modeName =
    gameSettings.currentMode.charAt(0).toUpperCase() +
    gameSettings.currentMode.slice(1);

  const settingsForCalculation = {
    timeLimit: gameSettings.timeLimit,
    bonusTime: gameSettings.bonusTime,
    initialTime: gameSettings.initialTime,
    goalPercentage: gameSettings.goalPercentage || 100,
  };

  const difficultyMultiplier = calculateDifficultyMultiplier(
    settingsForCalculation,
  );

  // Calculate actual game duration in seconds
  const gameDurationSeconds = gameStartTime
    ? Math.floor((Date.now() - gameStartTime) / 1000)
    : 0;

  // Create game data object for local storage
  const gameData = {
    username: getDisplayUsername(),
    timeLeft,
    wpm,
    accuracy,
    date: new Date().toLocaleString("en-GB"),
    timestamp: Date.now(), // Add timestamp for sorting and deduplication
    mode: modeName + " Mode",
    score: finalScore,
    wordList: currentLanguage,
    difficultyMultiplier: difficultyMultiplier,
    totalTimeSpent: totalTimeSpent, // Keep original for compatibility
    gameDurationSeconds: gameDurationSeconds, // Real duration for achievements
    perSecondWpmData: perSecondWpmData,
  };

  // Save locally
  results.push(gameData);
  localStorage.setItem("gameResults", JSON.stringify(results));

  // Update total game count
  const currentTotal = localStorage.getItem("totalGameCount");
  const newTotal = currentTotal ? parseInt(currentTotal) + 1 : results.length;
  localStorage.setItem("totalGameCount", newTotal.toString());

  localStorage.setItem(
    "highestAchievements",
    JSON.stringify(highestAchievements),
  );

  // Sync to Firebase if user is logged in (async, don't block game flow)
  // Only user scores sync to cloud - guest scores stay local only
  if (
    window.canSyncScoreboardToFirebase &&
    window.canSyncScoreboardToFirebase()
  ) {
    window.syncScoreboardToFirebase(gameData).catch((error) => {
      console.error("❌ Failed to sync scoreboard to Firebase:", error);
    });
  }

  // Prepare Firebase data
  const firebaseGameData = {
    username: getDisplayUsername(),
    score: finalScore,
    wpm: wpm,
    accuracy: accuracy,
    date: new Date().toISOString(),
    mode: modeName + " Mode",
    wordList: currentLanguage,
    timestamp: Date.now(),
    difficultyMultiplier: difficultyMultiplier,
  };

  // Add authentication data if user is logged in
  const currentUser = window.getCurrentUser();
  if (currentUser) {
    firebaseGameData.userId = currentUser.uid;
    firebaseGameData.userEmail = currentUser.email;
    firebaseGameData.authenticatedScore = true;
    firebaseGameData.submittedAt = new Date().toISOString();
  } else {
    firebaseGameData.authenticatedScore = false;
    firebaseGameData.guestSubmission = true;
  }

  // Save to Firebase based on authentication status
  if (currentUser) {
    // Authenticated user - save to main scores
    saveScoreToFirebase(firebaseGameData)
      .then(() => {
        console.log("✅ Authenticated score saved to Firebase");
      })
      .catch((error) => {
        console.error("❌ Error saving authenticated score:", error);
      });
  } else {
    // Guest user - check if guest submissions are allowed
    const allowGuestSubmissions = localStorage.getItem(
      "allow_guest_submissions",
    );
    if (allowGuestSubmissions === "true") {
      // Save to separate guest scores collection (optional)
      saveGuestScoreToFirebase(firebaseGameData)
        .then(() => {
          console.log("📝 Guest score saved to Firebase");
        })
        .catch((error) => {
          console.error("❌ Error saving guest score:", error);
        });
    } else {
      console.log("🚫 Guest submissions disabled - score saved locally only");
    }
  }

  // Check for achievements (skip if in practice mistakes mode)
  if (!isPracticeMistakesMode) {
    achievementSystem.handleGameCompletion(gameData);
  }
}

// Save results for Zen Mode
function saveZenResult(wpm, totalTime, accuracy) {
  // Skip saving if in practice mistakes mode
  if (isPracticeMistakesMode) {
    return;
  }

  let results = JSON.parse(localStorage.getItem("gameResults")) || [];

  // Create game data object for local storage
  const gameData = {
    username: getDisplayUsername(),
    wpm: wpm,
    accuracy: accuracy,
    totalTime: totalTime,
    date: new Date().toLocaleString("en-GB"),
    mode: "Zen Mode",
    wordList: currentLanguage,
    wordGoal: zenWordGoal,
    wordsTyped: wordsTyped.length, // Track how many words were actually typed
    timestamp: Date.now(), // Add timestamp for Firebase compatibility
    perSecondWpmData: perSecondWpmData,
  };

  // Save locally
  results.push(gameData);
  localStorage.setItem("gameResults", JSON.stringify(results));

  // Update total game count
  const currentTotal = localStorage.getItem("totalGameCount");
  const newTotal = currentTotal ? parseInt(currentTotal) + 1 : results.length;
  localStorage.setItem("totalGameCount", newTotal.toString());

  // Save to Firebase user scoreboard for cross-device sync (but NOT global leaderboard)
  if (
    window.canSyncScoreboardToFirebase &&
    window.canSyncScoreboardToFirebase()
  ) {
    console.log("🔥 Attempting to sync Zen mode game to Firebase:", {
      mode: gameData.mode,
      wpm: gameData.wpm,
      totalTime: gameData.totalTime,
    });
    window
      .syncScoreboardToFirebase(gameData)
      .then(() => {
        console.log("✅ Zen mode game successfully synced to Firebase");
      })
      .catch((error) => {
        console.error(
          "❌ Error syncing zen mode scoreboard to Firebase:",
          error,
        );
      });
  } else {
    console.warn(
      "⚠️ Cannot sync Zen mode to Firebase - user not logged in or sync disabled",
    );
  }

  // Update achievements system (skip if in practice mistakes mode)
  if (!isPracticeMistakesMode) {
    achievementSystem.handleGameCompletion(gameData);
  }
}

// Helper function to get display username
function getDisplayUsername() {
  const currentUser = window.getCurrentUser();
  if (currentUser) {
    // Return authenticated username
    return localStorage.getItem("nerdtype_username") || "User";
  } else {
    // Return guest username
    return localStorage.getItem("nerdtype_username") || "runner";
  }
}

// Optional: Save guest scores to separate collection
window.saveGuestScoreToFirebase = async function (gameData) {
  if (!window.firebaseModules || !database) {
    console.error("❌ Firebase not initialized");
    return Promise.reject("Firebase not ready");
  }

  const { ref, push } = window.firebaseModules;

  try {
    console.log("📝 Saving guest score to Firebase:", gameData);

    const guestScoresRef = ref(database, "guestScores");
    const result = await push(guestScoresRef, gameData);

    console.log("✅ Guest score saved successfully! Key:", result.key);
    return result;
  } catch (error) {
    console.error("❌ Error saving guest score:", error);
    throw error;
  }
};

// Update the score retrieval functions to handle authentication
window.getTopScores = async function () {
  if (!isDataCollectionEnabled()) {
    console.log("📴 Data collection disabled - returning empty leaderboard");
    return [];
  }

  const firebaseModules = window.firebaseModules;
  if (!firebaseModules || !database) {
    console.error("Firebase not ready for getTopScores");
    return [];
  }

  const { ref, query, orderByChild, limitToLast, get } = firebaseModules;

  try {
    // Get authenticated scores only for main leaderboard
    const scoresRef = ref(database, "scores");
    const topScoresQuery = query(
      scoresRef,
      orderByChild("score"),
      limitToLast(20), // Increase limit for better ranking
    );
    const snapshot = await get(topScoresQuery);

    if (snapshot.exists()) {
      const scores = [];
      snapshot.forEach((childSnapshot) => {
        const score = childSnapshot.val();
        // Only include authenticated scores in main leaderboard
        if (score.authenticatedScore === true) {
          scores.push(score);
        }
      });
      return scores.reverse(); // Highest scores first
    }
    return [];
  } catch (error) {
    console.error("Error fetching authenticated scores:", error);
    return [];
  }
};

// Display previous results in scoreboard with pagination
let currentDisplayCount = 15; // Track how many results are currently displayed
let allAvailableScores = []; // Cache for all available scores
let totalScoreCount = 0; // Total count of scores available

async function displayPreviousResults(loadMore = false) {
  const resultsContainer = document.getElementById("previousResults");
  if (!resultsContainer) return;

  // If not loading more, reset the display count
  if (!loadMore) {
    currentDisplayCount = 15;
  }

  let displayResults = [];
  let sortedResults = [];

  // Check if user is logged in to determine data source
  const currentUser = window.getCurrentUser && window.getCurrentUser();

  if (currentUser && window.loadScoreboardFromFirebasePaginated) {
    // Logged-in user: Load from Firebase with pagination
    try {
      if (!loadMore) {
        // Initial load: get first batch and set up cache
        const firebaseData = await window.loadScoreboardFromFirebasePaginated(
          Math.max(currentDisplayCount, 50), // Load at least 50 to reduce future calls
          0,
        );

        allAvailableScores = firebaseData.scores || [];
        totalScoreCount = firebaseData.totalCount || 0;
      } else if (allAvailableScores.length < currentDisplayCount) {
        // Load more: we need more data than we have cached
        const needToLoad = Math.max(
          currentDisplayCount + 30,
          allAvailableScores.length + 50,
        ); // Load extra for future clicks
        const firebaseData = await window.loadScoreboardFromFirebasePaginated(
          needToLoad,
          0,
        );

        allAvailableScores = firebaseData.scores || [];
        totalScoreCount = firebaseData.totalCount || 0;
      } else {
        // We have enough cached data, no need to call Firebase
        // Using cached data - no console log needed
      }

      displayResults = allAvailableScores.slice(0, currentDisplayCount);
    } catch (error) {
      console.error(
        "❌ Failed to load scores from Firebase, falling back to localStorage:",
        error,
      );
      // Fallback to localStorage if Firebase fails
      let results = JSON.parse(localStorage.getItem("gameResults")) || [];
      sortedResults = results.sort(
        (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
      );
      displayResults = sortedResults.slice(0, currentDisplayCount);
      totalScoreCount = sortedResults.length;
    }
  } else {
    // Guest user: Use localStorage with reasonable limit for performance
    let results = JSON.parse(localStorage.getItem("gameResults")) || [];
    sortedResults = results.sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
    );

    // Limit guest users to 100 most recent games for performance
    const maxGuestGames = 100;
    if (sortedResults.length > maxGuestGames) {
      sortedResults = sortedResults.slice(0, maxGuestGames);
    }

    displayResults = sortedResults.slice(0, currentDisplayCount);
    totalScoreCount = sortedResults.length;
    allAvailableScores = sortedResults; // Cache all results
  }

  // Clear existing content
  resultsContainer.innerHTML = "";

  if (displayResults.length === 0) {
    resultsContainer.innerHTML = `
      <div class="text-center py-5 empty-state">
        <i class="fa-solid fa-chart-line empty-icon" style="font-size: 3rem; margin-bottom: 1rem;"></i>
        <p>404: Games not found</p>
      </div>
    `;
    return;
  }

  // Create table structure
  const tableHTML = `
    <div class="table-responsive">
      <table class="table table-dark table-hover mb-0">
        <thead>
          <tr>
            <th scope="col">Player</th>
            <th scope="col" class="text-center">Score/Time</th>
            <th scope="col" class="text-center">WPM</th>
            <th scope="col" class="text-center">Accuracy</th>
            <th scope="col" class="text-center d-none d-md-table-cell">Mode</th>
            <th scope="col" class="text-center d-none d-lg-table-cell">Language</th>
            <th scope="col" class="text-center d-none d-lg-table-cell">Date</th>
          </tr>
        </thead>
        <tbody id="scoresTableBody">
        </tbody>
      </table>
    </div>
  `;

  resultsContainer.innerHTML = tableHTML;
  const tableBody = document.getElementById("scoresTableBody");

  displayResults.forEach((result, index) => {
    const row = document.createElement("tr");

    // Apply special styling for top 3 results
    if (index === 0) {
      row.classList.add("champion");
    } else if (index <= 2) {
      row.classList.add("top-performer");
    }

    // Handle score/time display - different for Zen vs Classic mode
    let scoreOrTimeDisplay;
    let scoreOrTimeValue;

    if (result.mode === "Zen Mode") {
      // Zen mode shows session time
      scoreOrTimeValue = result.totalTime || "0:00";
      scoreOrTimeDisplay = `
        <span class="time-badge" style="background: linear-gradient(135deg, #c3e88d, #7dcfff); color: #1a1b26; font-weight: bold; font-size: 1rem; padding: 6px 12px; border-radius: 4px; text-shadow: none;">
          ${scoreOrTimeValue}
        </span>
      `;
    } else {
      // Classic mode shows score
      scoreOrTimeValue = result.score || result.timeLeft * 256 || 0;
      scoreOrTimeDisplay = `
        <span class="score-badge" style="background: linear-gradient(135deg, #7aa2f7, #bb9af7); color: #1a1b26; font-weight: bold; font-size: 1rem; padding: 6px 12px; border-radius: 4px; text-shadow: none;">
          ${scoreOrTimeValue}
        </span>
      `;
    }

    // Use the actual stored values directly - handle both string and number formats
    const wpm = result.wpm || 0;

    // Handle accuracy - it might be stored as "85%" string or as number 85
    let accuracy = 0;
    if (result.accuracy !== undefined && result.accuracy !== null) {
      if (typeof result.accuracy === "string") {
        // If it's a string like "85%", remove the % and parse
        accuracy = parseFloat(result.accuracy.replace("%", "")) || 0;
      } else {
        // If it's already a number
        accuracy = parseFloat(result.accuracy) || 0;
      }
    }

    // Format language display - use full names instead of flags
    const languageMap = {
      english: "English",
      finnish: "Finnish",
      swedish: "Swedish",
      programming: "Programming",
      nightmare: "Nightmare",
    };

    const languageDisplay = result.wordList
      ? languageMap[result.wordList] || result.wordList
      : "English";

    // Format mode display
    let modeDisplay = result.mode || "Classic Mode";
    if (result.mode === "Zen Mode" && result.wordGoal) {
      modeDisplay = `Zen [${result.wordGoal}]`;
    }

    // Format date
    const dateDisplay = result.date || "Unknown";

    // Get username - fallback to "runner" if not set
    const username = result.username || "runner";

    row.innerHTML = `
      <td class="username-cell" style="color: #c3e88d; font-weight: bold;">
        ${username}
      </td>
      <td class="text-center">
        ${scoreOrTimeDisplay}
      </td>
      <td class="text-center wpm-cell" style="color: #7dcfff; font-weight: bold;">
        ${Math.round(wpm)}
      </td>
      <td class="text-center accuracy-cell" style="color: #c3e88d; font-weight: bold;">
        ${accuracy.toFixed(1)}%
      </td>
      <td class="text-center mode-cell d-none d-md-table-cell" style="color: #bb9af7;">
        ${modeDisplay}
      </td>
      <td class="text-center d-none d-lg-table-cell" style="color: #c0caf5;">
        ${languageDisplay}
      </td>
      <td class="text-center meta-cell d-none d-lg-table-cell" style="color: #565f89; font-size: 0.85rem;">
        ${dateDisplay}
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Add info row and load more functionality if there are more results available
  if (totalScoreCount > currentDisplayCount) {
    const infoRow = document.createElement("tr");
    infoRow.innerHTML = `
      <td colspan="7" class="text-center py-3" style="color: #565f89; font-style: italic; border-top: 1px solid #3b4261;">
        Showing last ${currentDisplayCount} of ${totalScoreCount} total games
      </td>
    `;
    tableBody.appendChild(infoRow);

    // Add load more button
    const loadMoreRow = document.createElement("tr");
    loadMoreRow.innerHTML = `
      <td colspan="7" class="text-center p-0" style="border-top: none;">
        <div 
          id="loadMoreGamesBtn" 
          style="background: #1f2335; color: #7aa2f7; padding: 12px; cursor: pointer; font-size: 0.9rem; transition: background-color 0.2s ease; width: 100%;"
          onmouseover="this.style.backgroundColor='#2a2f47'"
          onmouseout="this.style.backgroundColor='#1f2335'"
        >
          <i class="fa-solid fa-chevron-down" style="margin-right: 8px;"></i>Load More
        </div>
      </td>
    `;
    tableBody.appendChild(loadMoreRow);

    // Add click handler for load more button
    const loadMoreBtn = document.getElementById("loadMoreGamesBtn");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", async function () {
        currentDisplayCount += 15;
        await displayPreviousResults(true);
      });
    }
  } else if (totalScoreCount > 15) {
    // Show info row without load more button when all results are displayed
    const infoRow = document.createElement("tr");
    infoRow.innerHTML = `
      <td colspan="7" class="text-center py-3" style="color: #565f89; font-style: italic; border-top: 1px solid #3b4261;">
        Showing all ${totalScoreCount} games
      </td>
    `;
    tableBody.appendChild(infoRow);
  }
}

function setupScoreboardModalEnterKey() {
  const scoreboardModal = document.getElementById("scoreboardModal");
  const scoreboardCloseBtn = document.getElementById("scoreboardCloseBtn");

  if (scoreboardModal && scoreboardCloseBtn) {
    // Remove previous event listeners if they exist
    scoreboardModal.removeEventListener("keydown", handleScoreboardKeyPress);

    // Add keydown event listener to the modal
    scoreboardModal.addEventListener("keydown", handleScoreboardKeyPress);
  }
}

// Handler for enter key in scoreboard modal
function handleScoreboardKeyPress(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation();

    // Close the modal using Bootstrap's modal instance
    const scoreboardModal = bootstrap.Modal.getInstance(
      document.getElementById("scoreboardModal"),
    );
    if (scoreboardModal) {
      scoreboardModal.hide();
    }
  }
}

// Initialize the game when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeGame);

// Export anything that might be needed by other modules
export {
  displayPreviousResults,
  setupScoreboardModalEnterKey,
  handleScoreboardKeyPress,
};

// Add global keybind for toggling scoreboard modal with Ctrl+I
function setupScoreboardKeybind() {
  document.addEventListener("keydown", function (event) {
    // Check for Ctrl+Enter to exit practice mistakes mode
    if (event.ctrlKey && event.key === "Enter" && isPracticeMistakesMode) {
      event.preventDefault();
      exitPracticeMistakesMode();
      return;
    }

    // Check for Ctrl+I (or Cmd+I on Mac)
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i") {
      event.preventDefault(); // Prevent browser default behavior

      // Check if we're in an input field to avoid interference
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.contentEditable === "true")
      ) {
        return; // Don't toggle if user is typing in an input field
      }

      // Check if scoreboard modal is currently open
      const scoreboardModal = document.getElementById("scoreboardModal");
      const isScoreboardOpen =
        scoreboardModal && scoreboardModal.classList.contains("show");

      if (isScoreboardOpen) {
        // Close the scoreboard modal
        closeScoreboardModal();
      } else {
        // Check if any other modal is currently open
        const otherOpenModals = document.querySelectorAll(
          ".modal.show:not(#scoreboardModal)",
        );
        if (otherOpenModals.length > 0) {
          return; // Don't open if another modal is already open
        }

        // Open the scoreboard modal
        openScoreboardModal().catch((error) => {
          console.error("❌ Error opening scoreboard modal:", error);
        });
      }
    }
  });
}

// Function to open scoreboard modal
async function openScoreboardModal() {
  // Update the scoreboard contents before showing
  if (typeof displayPreviousResults === "function") {
    await displayPreviousResults();
  }

  // Show the modal
  const scoreboardModal = new bootstrap.Modal(
    document.getElementById("scoreboardModal"),
  );
  scoreboardModal.show();

  // Setup Enter key handler for closing
  setupScoreboardModalEnterKey();

  // Clean up when modal is hidden
  document.getElementById("scoreboardModal").addEventListener(
    "hidden.bs.modal",
    function () {
      // Remove any leftover backdrops
      const backdrops = document.querySelectorAll(".modal-backdrop");
      backdrops.forEach((backdrop) => {
        backdrop.remove();
      });

      document.body.classList.remove("modal-open");
      document.body.removeAttribute("style");
    },
    { once: true },
  );
}

// Function to close scoreboard modal
function closeScoreboardModal() {
  const scoreboardModalElement = document.getElementById("scoreboardModal");
  const scoreboardModal = bootstrap.Modal.getInstance(scoreboardModalElement);

  if (scoreboardModal) {
    scoreboardModal.hide();
  }
}

// Initialize the keybind when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  setupScoreboardKeybind();

  // Also update existing button click handlers to use the new function
  const scoreboardBtn = document.getElementById("viewScoreboardBtn");
  if (scoreboardBtn) {
    // Remove existing event listeners and add new one
    scoreboardBtn.replaceWith(scoreboardBtn.cloneNode(true));
    document
      .getElementById("viewScoreboardBtn")
      .addEventListener("click", () => {
        openScoreboardModal().catch((error) => {
          console.error("❌ Error opening scoreboard modal:", error);
        });
      });
  }

  const scoreboardChartBtn = document.getElementById("viewScoreboardChartBtn");
  if (scoreboardChartBtn) {
    // Remove existing event listeners and add new one
    scoreboardChartBtn.replaceWith(scoreboardChartBtn.cloneNode(true));
    document
      .getElementById("viewScoreboardChartBtn")
      .addEventListener("click", () => {
        openScoreboardModal().catch((error) => {
          console.error("❌ Error opening scoreboard modal:", error);
        });
      });
  }
});

// Timer cleanup function
function cleanupAllTimers() {
  if (countDownInterval) {
    clearInterval(countDownInterval);
    countDownInterval = null;
  }
  if (totalTimeInterval) {
    clearInterval(totalTimeInterval);
    totalTimeInterval = null;
  }
  if (debugUpdateInterval) {
    clearInterval(debugUpdateInterval);
    debugUpdateInterval = null;
  }
}

// Game Pause/Resume Functions
function pauseGame() {
  if (isPaused) return;
  isPaused = true;

  // Clear intervals to pause timers
  if (countDownInterval) clearInterval(countDownInterval);
  if (totalTimeInterval) clearInterval(totalTimeInterval);
}

function resumeGame() {
  if (!isPaused) return;
  isPaused = false;

  // Restart timers if game is active
  if (!gameEnded && hasStartedTyping) {
    if (!isZenMode) {
      // Classic mode - restart countdown
      countDownInterval = setInterval(countDown, TIMERS.COUNTDOWN_INTERVAL);
      totalTimeInterval = setInterval(
        totalTimeCount,
        TIMERS.TOTAL_TIME_INTERVAL,
      );
    } else {
      // Zen mode - restart total time counter
      totalTimeInterval = setInterval(
        updateZenTimer,
        TIMERS.ZEN_TIMER_INTERVAL,
      );
    }
  }
}

// Command Palette Functions
function showCommandPalette() {
  const modal = new bootstrap.Modal(
    document.getElementById("commandPaletteModal"),
  );
  const input = document.getElementById("commandPaletteInput");

  // Pause the game when command palette opens
  pauseGame();

  // Pre-fill with "/" and position cursor after it
  input.value = "/";

  modal.show();

  // Focus the input after modal is shown and position cursor
  document
    .getElementById("commandPaletteModal")
    .addEventListener("shown.bs.modal", function () {
      input.focus();
      // Move cursor to end (after the "/")
      input.setSelectionRange(1, 1);
    });

  // Return focus to main input and resume game when modal is hidden
  document
    .getElementById("commandPaletteModal")
    .addEventListener("hidden.bs.modal", function () {
      const userInput = document.getElementById("userInput");
      if (userInput) {
        userInput.focus();
      }
      // Resume the game when command palette closes
      resumeGame();
    });
}

function hideCommandPalette() {
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("commandPaletteModal"),
  );
  if (modal) {
    modal.hide();
  }

  // Clear the input when hiding
  const input = document.getElementById("commandPaletteInput");
  if (input) {
    input.value = "";
  }
}

// Command palette input handling
document.addEventListener("DOMContentLoaded", function () {
  const commandInput = document.getElementById("commandPaletteInput");

  if (commandInput) {
    commandInput.addEventListener("keydown", function (e) {
      // Prevent deleting the "/"
      if (
        (e.key === "Backspace" || e.key === "Delete") &&
        e.target.selectionStart <= 1 &&
        e.target.selectionEnd <= 1
      ) {
        e.preventDefault();
        return;
      }

      if (e.key === "Enter") {
        const command = e.target.value.trim();
        if (command && command.length > 1) {
          // Must have more than just "/"
          // Execute the command through game-commands.js
          executeCommand(command);
          hideCommandPalette();
        }
      } else if (e.key === "Escape") {
        hideCommandPalette();
      }
    });

    // Prevent cursor from going before the "/"
    commandInput.addEventListener("click", function (e) {
      if (e.target.selectionStart < 1) {
        e.target.setSelectionRange(1, 1);
      }
    });

    // Ensure "/" stays at the beginning
    commandInput.addEventListener("input", function (e) {
      if (!e.target.value.startsWith("/")) {
        e.target.value = "/" + e.target.value.replace("/", "");
        e.target.setSelectionRange(
          e.target.value.length,
          e.target.value.length,
        );
      }
    });
  }
});

// Function to execute command (this will call the game-commands system)
function executeCommand(command) {
  // Command already has "/" from the input field
  // Import and use the game commands
  import("./game-commands.js").then((module) => {
    const gameCommands = module.default;
    gameCommands.handleCommand(command);
  });
}

// Add cleanup on page unload to prevent memory leaks
window.addEventListener("beforeunload", function () {
  cleanupAllTimers();
});

// Render WPM progression chart for game over modal
function renderGameOverWpmChart() {
  const canvas = document.getElementById("gameOverWpmChart");
  if (!canvas) return;

  // Destroy existing chart if it exists (Chart.js v3/v4 compatibility)
  const existingChart = Chart.getChart
    ? Chart.getChart(canvas)
    : canvas.chartInstance;
  if (existingChart) {
    existingChart.destroy();
  }

  // Use per-second WPM data from the current game
  if (!perSecondWpmData || perSecondWpmData.length === 0) {
    // Show empty state
    const ctx = canvas.getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "WPM",
            data: [],
            borderColor: "#ff9e64",
            backgroundColor: "rgba(255, 158, 100, 0.2)",
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "No WPM data available",
            color: "#7dcfff",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 14,
            },
          },
          legend: { display: false },
        },
        scales: {
          x: { display: false },
          y: { display: false },
        },
      },
    });
    return;
  }

  // Extract data for chart
  const labels = perSecondWpmData.map((_, index) => `${index + 1}s`);
  const wpmData = [...perSecondWpmData];

  // Generate per-second mistake data for markers
  const mistakeData = generatePerSecondMistakeData();
  const perSecondMistakes = mistakeData.counts;
  const perSecondMistakeDetails = mistakeData.details;

  // Ensure mistake data matches WPM data length
  const alignedMistakes = [];
  const alignedMistakeDetails = [];
  for (let i = 0; i < wpmData.length; i++) {
    alignedMistakes.push(perSecondMistakes[i] || 0);
    alignedMistakeDetails.push(perSecondMistakeDetails[i] || []);
  }
  const mistakeMarkers = alignedMistakes.map((mistakes, index) => {
    return mistakes > 0 ? mistakes : null; // Only show markers where mistakes occurred
  });

  // Debug logging

  // Calculate average
  const averageWpm =
    wpmData.reduce((sum, wpm) => sum + wpm, 0) / wpmData.length;

  // Get current game WPM (last data point)
  const currentWpm = wpmData[wpmData.length - 1];
  const isImprovement =
    wpmData.length > 1 && currentWpm > wpmData[wpmData.length - 2];

  const ctx = canvas.getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "WPM",
          data: wpmData,
          borderColor: "#7aa2f7",
          backgroundColor: "rgba(122, 162, 247, 0.2)",
          fill: true,
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: "#7aa2f7",
          pointBorderColor: "#7aa2f7",
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: "y",
          order: 1, // Higher order = rendered below
        },
        {
          label: "Mistakes",
          data: mistakeMarkers,
          borderColor: "#f7768e",
          backgroundColor: "#f7768e",
          fill: false,
          borderWidth: 0,
          tension: 0,
          pointBackgroundColor: "#f7768e",
          pointBorderColor: "#f7768e",
          pointBorderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointStyle: "crossRot",
          showLine: false,
          yAxisID: "y2",
          clip: false,
          order: 0, // Lower order = rendered on top
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          right: 10,
          bottom: 5,
          left: 5,
        },
      },
      plugins: {
        title: {
          display: false,
        },
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1f2335",
          titleColor: "#bb9af7",
          bodyColor: "#c0caf5",
          borderColor: "#3b4261",
          borderWidth: 2,
          cornerRadius: 4,
          displayColors: false,
          titleFont: {
            family: "'jetbrains-mono', monospace",
            size: 13,
          },
          bodyFont: {
            family: "'jetbrains-mono', monospace",
            size: 12,
          },
          callbacks: {
            title: function (context) {
              if (context && context.length > 0) {
                const dataIndex = context[0].dataIndex;
                return `Second ${dataIndex + 1}`;
              }
              return "";
            },
            beforeBody: function (context) {
              return [];
            },
            label: function (context) {
              const value = context.parsed.y;
              if (context.datasetIndex === 0) {
                return `${value.toFixed(1)} WPM`;
              } else {
                const secondIndex = context.dataIndex;
                const mistakesInSecond =
                  alignedMistakeDetails[secondIndex] || [];

                if (mistakesInSecond.length === 0) {
                  return `${value} mistake${value !== 1 ? "s" : ""}`;
                }

                // Show unique words where mistakes occurred
                const mistakeWords = [
                  ...new Set(mistakesInSecond.map((m) => m.word)),
                ];

                return [
                  `${value} mistake${value !== 1 ? "s" : ""} in:`,
                  mistakeWords.join(", "),
                ];
              }
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: { display: false },
          ticks: {
            color: "#3b4261",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 10,
            },
            callback: function (value, index) {
              return index + 1;
            },
          },
        },
        y: {
          display: true,
          position: "left",
          title: {
            display: true,
            text: "WPM",
            color: "#3b4261",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 12,
            },
          },
          grid: {
            color: "#292e42",
            display: false,
          },
          ticks: {
            stepSize: 10,
            color: "#3b4261",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 11,
            },
            callback: function (value) {
              return Math.round(value);
            },
          },
        },
        y2: {
          display: true,
          position: "right",
          title: {
            display: true,
            text: "Errors",
            color: "#3b4261",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 12,
            },
          },
          grid: {
            display: false,
          },
          ticks: {
            stepSize: 1,
            color: "#3b4261",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 11,
            },
            callback: function (value) {
              // Only show whole numbers, hide the +0.5 padding
              return Number.isInteger(value) ? Math.round(value) : "";
            },
          },
          min: 0,
          max: Math.max(1, Math.max(...alignedMistakes)) + 0.5,
        },
      },
    },
    plugins: [
      {
        beforeDraw: (chart) => {
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;

          // Draw average line
          if (wpmData.length > 1) {
            const yValue = chart.scales.y.getPixelForValue(averageWpm);
            ctx.save();
            ctx.strokeStyle = "#bb9af7";
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.moveTo(chartArea.left, yValue);
            ctx.lineTo(chartArea.right, yValue);
            ctx.stroke();
            ctx.restore();
          }
        },
      },
    ],
  });
}
