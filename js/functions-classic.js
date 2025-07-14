// Import common dependencies
import { loadWordList, currentLanguage } from "./word-list-manager.js";
import { DebugDisplay } from "./debug.js";
import achievementSystem from "./achievements.js";
import "./game-commands.js";

// Global variables for game state
let words = [];
let playerUsername = localStorage.getItem("nerdtype_username") || "runner";
let isUsernameModalOpen = false;
let isZenMode = localStorage.getItem("nerdtype_zen_mode") === "true";

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
let showSpacesAfterWords =
  localStorage.getItem("showSpacesAfterWords") !== "false";

// Classic mode specific variables
let timeLeft = 10; // Default, will be updated from settings
let totalTimeSpent = 0;
let countDownInterval;
let totalTimeInterval;
let bonusTime = 3; // Default, will be updated from settings
let goalPercentage = 100;
let isPaused = false; // Game pause state

// Zen mode specific variables
let sessionStartTime = null;
let zenWordGoal = 30;

// Precision multiplier system variables
let precisionStreak = 0;
let peakPrecisionStreak = 0;
let currentWordHasMistakes = false;

const reservedUsernames = ["admin", "moderator", "nerdtype"];

function isReservedUsername(username) {
  return reservedUsernames.some(
    (reserved) => username.toLowerCase() === reserved.toLowerCase(),
  );
}

function canUseUsername(username) {
  // Check admin mode for "merkks"
  const isAdminMode = localStorage.getItem("nerdtype_admin") === "true";

  if (username.toLowerCase() === "merkks") {
    return isAdminMode;
  }
  // Block other reserved usernames
  return !isReservedUsername(username);
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
const achievementSoundEnabled = localStorage.getItem(
  "achievement_sound_enabled",
);
if (achievementSoundEnabled === "false") {
  achievementSound.muted = true;
}

// Create keypress audio pool for better performance
const keypressAudioPool = [];
const poolSize = 2; // Create multiple instances
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
const keypressSoundEnabled = localStorage.getItem("keypress_sound_enabled");
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
  const keypressSoundEnabled = localStorage.getItem("keypress_sound_enabled");
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

// Define word list display names for the UI
const wordListDisplayNames = {
  english: "🇬🇧 ",
  finnish: "🇫🇮 ",
  swedish: "🇸🇪 ",
  programming: "🖥️ ",
  nightmare: "💀 ",
};

// Load saved settings or use defaults for Classic Mode
let gameSettings = JSON.parse(localStorage.getItem("gameSettings")) || {
  timeLimit: 30,
  bonusTime: 3,
  initialTime: 10,
  goalPercentage: 100,
  currentMode: "classic",
};

// Function to reload game settings from localStorage (used by settings sync)
window.reloadGameSettings = function () {
  const newSettings = JSON.parse(localStorage.getItem("gameSettings")) || {
    timeLimit: 30,
    bonusTime: 3,
    initialTime: 10,
    goalPercentage: 100,
    currentMode: "classic",
  };

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
      const settings =
        JSON.parse(localStorage.getItem("gameSettings")) || gameSettings;
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
  // Load the Zen Mode state
  isZenMode = localStorage.getItem("nerdtype_zen_mode") === "true";
  // Font selection
  const currentFont =
    localStorage.getItem("nerdtype_font") || "jetbrains-light";
  applyFont(currentFont);

  // Load saved settings
  const settings = JSON.parse(localStorage.getItem("gameSettings")) || {
    timeLimit: 30,
    bonusTime: 3,
    initialTime: 10,
    goalPercentage: 100,
    currentMode: "classic",
    zenWordGoal: 30, // Default zen word goal
  };

  // Set Zen Mode word goal
  zenWordGoal = settings.zenWordGoal || 30;

  // Update UI based on mode
  updateUIForGameMode();

  // Load the selected word list
  words = await loadWordList(currentLanguage);

  // After words are loaded, set up the UI
  setupUI();

  // Initialize event listeners and other game elements
  initializeEventListeners();
  displayPreviousResults();
  setupUsernameValidation();

  // Set initial time from settings
  timeLeft = gameSettings.initialTime;
  bonusTime = gameSettings.bonusTime;

  // Check for pending settings notification at the end
  setTimeout(() => {
    const pendingNotification = localStorage.getItem(
      "pending_settings_notification",
    );
    if (pendingNotification) {
      // Remove the notification FIRST to prevent duplicate processing
      localStorage.removeItem("pending_settings_notification");
      try {
        const { message, type } = JSON.parse(pendingNotification);
        showSettingsNotification(message, type);
      } catch (e) {}
    }
  }, 200);

  setTimeout(() => {
    restoreUIHideState();
  }, 350);
}

function setupUI() {
  // Update the UI based on current game mode
  updateUIForGameMode();
}

// Calculate the size of localStorage data in KB
function calculateLocalStorageSize() {
  let totalSize = 0;

  // Get the game results data
  const gameResults = localStorage.getItem("gameResults");
  if (gameResults) {
    totalSize += gameResults.length * 2; // Each character is 2 bytes in JavaScript
  }

  // Get achievements data size
  const achievementsData = localStorage.getItem("nerdtype_achievements");
  if (achievementsData) {
    totalSize += achievementsData.length * 2;
  }

  // Convert to KB
  return (totalSize / 1024).toFixed(2);
}

function updateDebugInfo() {
  const accuracy =
    totalKeystrokes > 0
      ? ((correctKeystrokes / totalKeystrokes) * 100).toFixed(1)
      : "0.0";
  const wrongKeystrokes = totalKeystrokes - correctKeystrokes;

  // Calculate time properly
  let effectiveTime = gameStartTime ? Date.now() - gameStartTime : 0;

  debugDisplay.updateInfo({
    currentWord: hasStartedTyping ? words[currentWordIndex] : "",
    wordLength: hasStartedTyping ? words[currentWordIndex]?.length || 0 : 0,
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

// Set up your update interval
setInterval(updateDebugInfo, 100);

function optimizeForMobile() {
  // Check if we're on a small screen
  const isMobile = window.innerWidth < 576;

  if (isMobile) {
    // Smaller font for game elements
    document.getElementById("wordToType").style.fontSize = "20px";
    document.getElementById("nextWord").style.fontSize = "18px";

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

// Call this during initialization
document.addEventListener("DOMContentLoaded", function () {
  // Add mobile optimization
  optimizeForMobile();

  // Re-optimize when window is resized
  window.addEventListener("resize", optimizeForMobile);
});

function initializeEventListeners() {
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

    // Handle game controls
    if (event.key === "Enter" && !event.ctrlKey && !isUsernameModalOpen) {
      startGame();
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

  // Reset button
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      location.reload();
    });
  }

  // Start button
  const startButton = document.getElementById("startButton");
  if (startButton) {
    startButton.addEventListener("click", startGame);
  }

  // User input field
  const userInput = document.getElementById("userInput");
  if (userInput) {
    userInput.addEventListener("input", function (e) {
      checkInput(e);
    });
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

  if (!localStorage.getItem("nerdtype_username")) {
    showUsernameModal();
  }

  // Handle scoreboard view
  document
    .getElementById("viewScoreboardBtn")
    .addEventListener("click", function () {
      // Update the scoreboard contents before showing
      displayPreviousResults();

      // Then show the modal
      const scoreboardModal = new bootstrap.Modal(
        document.getElementById("scoreboardModal"),
      );
      scoreboardModal.show();
    });
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
  currentWordIndex = 0;
  nextWordIndex = 1;

  // Reset precision multiplier system
  resetPrecisionSystem();

  // Shuffle the words array at game start for variety
  words = words.sort(() => Math.random() - 0.5);

  // Update word display
  updateWordDisplay();

  // Initialize mode-specific elements
  if (isZenMode) {
    // Zen Mode - no timer until first keystroke
    document.getElementById("userInput").focus();
    gameStartTime = null;
    sessionStartTime = null;
    if (document.getElementById("totalTimeValue")) {
      document.getElementById("totalTimeValue").textContent = "0:00";
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
    countDownInterval = setInterval(countDown, 800);
    totalTimeInterval = setInterval(totalTimeCount, 1000);
  }

  // Reset game state variables
  document.getElementById("userInput").value = "";
  document.getElementById("userInput").focus();
  gameStartTime = null;
  hasStartedTyping = false;
  wordsTyped = [];
  totalCharactersTyped = 0;
  totalKeystrokes = 0;
  correctKeystrokes = 0;
  totalTimeSpent = 0;

  // Reset progress bar
  updateProgressBar();
}

function updateWordDisplay() {
  const wordToTypeElement = document.getElementById("wordToType");
  const nextWordElement = document.getElementById("nextWord");
  const showSpace = localStorage.getItem("showSpacesAfterWords") !== "false";

  if (!wordToTypeElement) return;

  // Clear existing content
  wordToTypeElement.innerHTML = "";

  // Create word container
  const wordContainer = document.createElement("div");
  wordContainer.classList.add("word-container");

  // Always show 30 words in the display regardless of word goal
  const wordsToShow = 30;

  // Generate word display - only show current and upcoming words for now
  const displayWords = [];

  // Add current and upcoming words - always start with currentWordIndex
  for (let i = 0; i < wordsToShow; i++) {
    const wordIndex = (currentWordIndex + i) % words.length;
    const word = words[wordIndex];
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
    const userInput = document.getElementById("userInput");
    if (userInput) {
      userInput.focus();
    }
  };

  // Clear the next word display since we show multiple words now
  if (nextWordElement) {
    nextWordElement.textContent = "";
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
}

// Function to add new words to display without clearing existing ones
function addNewWordsToDisplay() {
  const wordContainer = document.querySelector(".word-container");
  if (!wordContainer || !words || words.length === 0) {
    return;
  }

  const showSpace = localStorage.getItem("showSpacesAfterWords") !== "false";

  // Calculate how many words to add to maintain 3 rows
  const existingWords = wordContainer.querySelectorAll(".word").length;
  const wordsToAdd = Math.max(20 - existingWords, 10); // Ensure we have enough words

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
    const word = words[wordIndex];

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

  // No extra character handling needed since we prevent them from being typed
}

// Flash animation for progress bar when word is completed
function flashProgress() {
  const progressBar = document.querySelector(".progress.terminal");
  if (progressBar) {
    progressBar.classList.add("flash");
    setTimeout(() => {
      progressBar.classList.remove("flash");
    }, 400);
  }
}

// Classic Mode: Countdown timer logic
function countDown() {
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
  const timerElement = document.getElementById("timeLeft");
  if (timerElement) {
    timerElement.textContent = timeLeft;
  }
}

// Classic Mode: Total time counter
function totalTimeCount() {
  if (isPaused) return; // Don't count time when paused

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
  if (totalTimeElement) {
    totalTimeElement.textContent = calculateTotalTime();
  }

  // Update progress bar
  updateProgressBar();

  // Check time-based achievements during gameplay
  checkTimeBasedAchievements();

  if (isZenMode && wordsTyped.length >= zenWordGoal) {
    gameEnded = true;
    clearInterval(totalTimeInterval);
    showGameOverModal(getRandomSuccessMessage(), true);
    return;
  }
}

// Update progress bar for both modes
function updateProgressBar() {
  let progressPercentage;

  if (isZenMode) {
    // In Zen mode, progress is based on words typed compared to word goal
    progressPercentage = (wordsTyped.length / zenWordGoal) * 100;
  } else {
    // In Classic mode, progress is based on percentage of goal
    const settings =
      JSON.parse(localStorage.getItem("gameSettings")) || gameSettings;
    const goalTime = (settings.timeLimit * settings.goalPercentage) / 100;
    progressPercentage = (totalTimeSpent / goalTime) * 100;
  }

  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressPercentage");

  if (progressBar) {
    progressBar.style.width = `${progressPercentage}%`;
    progressBar.setAttribute("aria-valuenow", progressPercentage);
    progressBar.style.backgroundColor = "#1f2335";
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
function checkInput(e) {
  const userInput = e.target.value;

  // Check if input contains "/" for commands
  if (userInput.includes("/")) {
    // Open command palette and remove the "/" character from input
    showCommandPalette();
    e.target.value = userInput.replace("/", "");
    return;
  }

  const currentWord = words[currentWordIndex];
  const wordDisplay = document.getElementById("wordToType");
  const showSpace = localStorage.getItem("showSpacesAfterWords") !== "false";

  if (!wordDisplay) return;

  // Prevent typing extra characters (except space if enabled)
  const maxAllowedLength = showSpace
    ? currentWord.length + 1
    : currentWord.length;
  if (userInput.length > maxAllowedLength) {
    // Block extra characters by resetting to the maximum allowed length
    e.target.value = userInput.substring(0, maxAllowedLength);
    return;
  }

  // Start timers on first input for both modes
  if (!hasStartedTyping && e.target.value.length > 0) {
    hasStartedTyping = true;
    gameStartTime = Date.now();

    if (isZenMode) {
      // For Zen mode, start the session timer
      sessionStartTime = new Date();
      totalTimeInterval = setInterval(updateZenTimer, 1000);
    }
  }

  // Play keypress sound for actual typing AND backspace
  if (
    hasStartedTyping &&
    ((e.inputType === "insertText" && e.data) ||
      e.inputType === "deleteContentBackward" ||
      e.inputType === "deleteContentForward")
  ) {
    playKeypressSound();
  }

  // Update character styling and count keystrokes
  const chars = wordDisplay.children;
  if (e.inputType === "insertText" && e.data) {
    totalKeystrokes++;

    // Check if the last character typed is correct
    let isCorrectChar = false;
    if (showSpace && userInput.length > currentWord.length) {
      // We're typing the space
      if (userInput[userInput.length - 1] === " ") {
        correctKeystrokes++;
        isCorrectChar = true;
      }
    } else if (userInput.length <= currentWord.length) {
      // We're typing the word
      if (
        userInput[userInput.length - 1] === currentWord[userInput.length - 1]
      ) {
        correctKeystrokes++;
        isCorrectChar = true;
      }
    }

    // Update precision streak based on character accuracy
    if (!isCorrectChar) {
      // Mark current word as having mistakes and reset precision streak (except in zen mode)
      currentWordHasMistakes = true;
      if (!isZenMode) {
        precisionStreak = 0;
        hidePrecisionMultiplier();
      }
    }
  }

  updateLetterStates(userInput);

  // Check if word is complete
  const expectedInput = showSpace ? currentWord + " " : currentWord;

  if (userInput === expectedInput) {
    // Only increment precision streak if this word had no mistakes and not in zen mode
    if (!currentWordHasMistakes && !isZenMode) {
      precisionStreak++;

      // Update peak streak if current streak is higher
      if (precisionStreak > peakPrecisionStreak) {
        peakPrecisionStreak = precisionStreak;
      }

      // Show multiplier starting from 5 perfect words
      if (precisionStreak >= 5) {
        showPrecisionMultiplier();
        animatePrecisionIncrement();
      }
    }

    // Reset the word mistake flag for next word
    currentWordHasMistakes = false;
    flashProgress();
    totalCharactersTyped += currentWord.length + (showSpace ? 1 : 0);
    totalTimeSpent += 1;
    if (!isZenMode) {
      timeLeft += bonusTime;
    }
    wordsTyped.push(currentWord);

    // Mark current word as completed
    const currentWordElement = getCurrentWordElement();
    if (currentWordElement) {
      currentWordElement.classList.remove("current");
      currentWordElement.classList.add("completed");
    }

    // Move to next word sequentially (words are shuffled at start)
    currentWordIndex++;
    nextWordIndex = currentWordIndex + 1;

    // Handle word wrapping around the list
    if (currentWordIndex >= words.length) {
      currentWordIndex = 0;
      nextWordIndex = 1;
      // Shuffle the words array for variety
      words = words.sort(() => Math.random() - 0.5);
    }

    // Check if we need to scroll the display
    const nextWordElement = document.querySelector(
      `[data-word-index="${currentWordIndex}"]`,
    );
    if (!nextWordElement) {
      // Next word not visible - we need to scroll or regenerate
      scrollWordsDisplay();
    } else {
      // Check if the next word is on the last row - if so, scroll
      if (isWordOnLastRow(nextWordElement)) {
        scrollWordsDisplay();
      } else {
        // Normal progression - just move cursor to next word
        nextWordElement.classList.remove("upcoming");
        nextWordElement.classList.add("current");
      }
    }

    // Clear input
    e.target.value = "";

    // Update letter states for the new current word
    updateLetterStates("");

    updateProgressBar();

    // Check game completion for both modes
    if (isZenMode && wordsTyped.length >= zenWordGoal) {
      gameEnded = true;
      clearInterval(totalTimeInterval);
      showGameOverModal(getRandomSuccessMessage(), true);
    } else if (!isZenMode) {
      // For classic mode, also check word goal completion
      const settings =
        JSON.parse(localStorage.getItem("gameSettings")) || gameSettings;
      const wordsGoal = parseInt(
        localStorage.getItem("nerdtype_words_goal") ||
          settings.timeLimit ||
          "30",
      );

      if (wordsTyped.length >= wordsGoal) {
        gameEnded = true;
        clearInterval(countDownInterval);
        clearInterval(totalTimeInterval);
        showGameOverModal(getRandomSuccessMessage(), true);
      }
    }
  }
}

// Calculate WPM for both modes
function calculateWPM() {
  if (!gameStartTime) return { wpm: 0, accuracy: "0%" };

  const endTime = Date.now();
  let timeElapsed = (endTime - gameStartTime) / 60000;

  // Ensure minimum time to avoid division by zero
  timeElapsed = Math.max(0.08, timeElapsed);

  const CHARS_PER_WORD = 5;

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
  const minimalUIEnabled =
    localStorage.getItem("nerdtype_hide_ui") === "true";
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
    // Add fade-out animation
    multiplierElement.classList.add("fade-out");

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

  // Simple system: 1% bonus per perfect word after 5th
  const perfectWordsAboveFive = Math.max(0, precisionStreak - 5);
  const bonusPercentage = perfectWordsAboveFive * 0.01;

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

  // Simple system: 1% bonus per perfect word after 5th
  const perfectWordsAboveFive = Math.max(0, peakPrecisionStreak - 5);
  const bonusPercentage = perfectWordsAboveFive * 0.01;

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
function showGameOverModal(message, isSuccess = true) {
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

  displayPreviousResults();
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
            <span>Bonus Energy: ${data.gameSettings.bonusEnergy}</span>
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

  modalBody.innerHTML = content;

  gameOverModal.show();

  // Handle Enter key to restart
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      location.reload();
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
    });
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
  };

  // Save locally
  results.push(gameData);
  localStorage.setItem("gameResults", JSON.stringify(results));
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

  // Check for achievements
  achievementSystem.handleGameCompletion(gameData);
}

// Save results for Zen Mode
function saveZenResult(wpm, totalTime, accuracy) {
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
  };

  // Save locally
  results.push(gameData);
  localStorage.setItem("gameResults", JSON.stringify(results));

  // Save to Firebase user scoreboard for cross-device sync (but NOT global leaderboard)
  if (
    window.canSyncScoreboardToFirebase &&
    window.canSyncScoreboardToFirebase()
  ) {
    window.syncScoreboardToFirebase(gameData).catch((error) => {
      console.error("❌ Error syncing zen mode scoreboard to Firebase:", error);
    });
  }

  // Update achievements system
  achievementSystem.handleGameCompletion(gameData);

  console.log("Zen result saved:", gameData);
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

// Display previous results in scoreboard (only show last 20)
function displayPreviousResults() {
  const resultsContainer = document.getElementById("previousResults");
  if (!resultsContainer) return;

  let results = JSON.parse(localStorage.getItem("gameResults")) || [];

  // Sort results by timestamp (most recent first) and limit to 15
  // This works for both local storage (chronological) and Firebase data (pre-sorted)
  const sortedResults = results.sort(
    (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
  );
  const displayResults = sortedResults.slice(0, 15);

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

  // Add storage info if there are more than 15 results (matching original logic)
  if (results.length > 15) {
    const storageSize = calculateLocalStorageSize();
    const infoRow = document.createElement("tr");
    infoRow.innerHTML = `
      <td colspan="7" class="text-center py-3" style="color: #565f89; font-style: italic; border-top: 1px solid #3b4261;">
        Showing last 15 of ${results.length} total games | Storage used: ${storageSize} KB
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
        openScoreboardModal();
      }
    }
  });
}

// Function to open scoreboard modal
function openScoreboardModal() {
  // Update the scoreboard contents before showing
  if (typeof displayPreviousResults === "function") {
    displayPreviousResults();
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
      .addEventListener("click", openScoreboardModal);
  }

  const scoreboardChartBtn = document.getElementById("viewScoreboardChartBtn");
  if (scoreboardChartBtn) {
    // Remove existing event listeners and add new one
    scoreboardChartBtn.replaceWith(scoreboardChartBtn.cloneNode(true));
    document
      .getElementById("viewScoreboardChartBtn")
      .addEventListener("click", openScoreboardModal);
  }
});

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
      countDownInterval = setInterval(countDown, 800);
      totalTimeInterval = setInterval(totalTimeCount, 1000);
    } else {
      // Zen mode - restart total time counter
      totalTimeInterval = setInterval(updateZenTimer, 1000);
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
