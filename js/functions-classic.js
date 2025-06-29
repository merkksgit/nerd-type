// Import common dependencies
import { tips } from "./tips.js";
import { loadWordList, currentLanguage } from "./word-list-manager.js";
import Terminal from "./terminal.js";
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
  localStorage.getItem("showSpacesAfterWords") === "true";

// Classic mode specific variables
let timeLeft = 10; // Default, will be updated from settings
let totalTimeSpent = 0;
let countDownInterval;
let totalTimeInterval;
let bonusTime = 3; // Default, will be updated from settings
let goalPercentage = 100;

// Zen mode specific variables
let sessionStartTime = null;
let zenWordGoal = 30;

// Command mode variables
let isCommandMode = false;
let wasPaused = false;
let commandStartTime = null; // Track when we entered command mode

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
if (keypressSoundEnabled === "false") {
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
  if (keypressSoundEnabled !== "false" && hasStartedTyping) {
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

// Initialize terminal
const terminal = new Terminal();

// Define word list display names for the UI
const wordListDisplayNames = {
  english: "🇬🇧 ",
  finnish: "🇫🇮 ",
  swedish: "🇸🇪 ",
  programming: "🖥️ ",
  nightmare: "💀 ",
};

// Load saved settings or use defaults for Classic Mode
let gameSettings = JSON.parse(localStorage.getItem("terminalSettings")) || {
  timeLimit: 30,
  bonusTime: 3,
  initialTime: 10,
  goalPercentage: 100,
  currentMode: "classic",
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
let tipsRotationInterval = null;

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
      gameIndicator.textContent = "Zen Mode";
    } else {
      // Check current mode from gameSettings
      const settings =
        JSON.parse(localStorage.getItem("terminalSettings")) || gameSettings;
      const currentMode = settings.currentMode || "classic";

      // Format the text based on mode
      if (currentMode === "classic") {
        gameIndicator.textContent = "Classic Mode";
      } else {
        const formattedMode =
          currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
        gameIndicator.textContent = `Classic Mode: ${formattedMode}`;
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
}

// Load words when the script initializes
async function initializeGame() {
  // Load the Zen Mode state
  isZenMode = localStorage.getItem("nerdtype_zen_mode") === "true";
  // Font selection
  const currentFont = localStorage.getItem("nerdtype_font") || "jetbrains-mono";
  applyFont(currentFont);

  // Load saved settings
  const settings = JSON.parse(localStorage.getItem("terminalSettings")) || {
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
  initializeRotatingTips();
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
      try {
        const { message, type } = JSON.parse(pendingNotification);
        showSettingsNotification(message, type);
        localStorage.removeItem("pending_settings_notification");
      } catch (e) {
        localStorage.removeItem("pending_settings_notification");
      }
    }
  }, 200);
}

function setupUI() {
  // Set the initial word if words are loaded
  if (words.length > 0) {
    const nextWordDiv = document.getElementById("nextWord");
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    nextWordDiv.textContent = randomTip;
  }

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

  // Calculate time properly, accounting for command mode
  let effectiveTime = gameStartTime ? Date.now() - gameStartTime : 0;
  if (isCommandMode && commandStartTime) {
    const commandDuration = Date.now() - commandStartTime;
    effectiveTime -= commandDuration;
  }

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
    isCommandMode,
    effectiveTime,
    timeLeft,
  });
}

// Set up your update interval
setInterval(updateDebugInfo, 100);

function initializeRotatingTips() {
  const nextWordDiv = document.getElementById("nextWord");
  let tipIndex = Math.floor(Math.random() * tips.length);

  // Apply tip class instead of inline styles
  function applyTipStyling() {
    nextWordDiv.classList.add("tip-style");
  }

  // Initially set up the tip
  nextWordDiv.textContent = "Tip: " + tips[tipIndex];
  applyTipStyling();

  // Clear any existing interval
  if (tipsRotationInterval) {
    clearInterval(tipsRotationInterval);
  }

  // Set up interval to change tips every few seconds
  tipsRotationInterval = setInterval(() => {
    // Fade out
    nextWordDiv.classList.add("fade-out");

    // After fade out completes, change tip and fade in
    setTimeout(() => {
      // Get next tip (avoid repeating the same tip)
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * tips.length);
      } while (newIndex === tipIndex && tips.length > 1);

      tipIndex = newIndex;
      nextWordDiv.textContent = "Tip: " + tips[tipIndex];
      applyTipStyling(); // Ensure class is applied
      nextWordDiv.classList.remove("fade-out");
    }, 300); // Match this with CSS transition time
  }, 5000); // Change tip every x seconds
}

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

  // Listen for terminal settings changes
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

    localStorage.setItem("terminalSettings", JSON.stringify(gameSettings));

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

  // Handle terminal close event
  window.addEventListener("terminalClosed", function () {
    // Don't restart intervals if we're in command mode
    if (!isCommandMode && !isZenMode) {
      countDownInterval = setInterval(countDown, 800);
      totalTimeInterval = setInterval(totalTimeCount, 1000);
    }
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
  if (tipsRotationInterval) {
    clearInterval(tipsRotationInterval);
    tipsRotationInterval = null;

    // Reset the next word element styles to default game styles
    const nextWordDiv = document.getElementById("nextWord");
    if (nextWordDiv) {
      // Remove the tip styling class when starting the game
      nextWordDiv.classList.remove("tip-style");
      // Clear any inline styles that might have been applied
      nextWordDiv.removeAttribute("style");
    }
  }

  // Reset command mode
  isCommandMode = false;
  wasPaused = false;

  // Reset game state
  gameEnded = false;
  currentWordIndex = Math.floor(Math.random() * words.length);
  nextWordIndex = Math.floor(Math.random() * words.length);

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
  const currentWord = words[currentWordIndex];
  const showSpace = localStorage.getItem("showSpacesAfterWords") === "true";

  if (wordToTypeElement) {
    wordToTypeElement.innerHTML = "";

    // Display the word characters
    for (let i = 0; i < currentWord.length; i++) {
      const charSpan = document.createElement("span");
      charSpan.textContent = currentWord[i];
      charSpan.classList.add("remaining");
      wordToTypeElement.appendChild(charSpan);
    }

    // Add space character if enabled
    if (showSpace) {
      const spaceSpan = document.createElement("span");
      spaceSpan.textContent = "␣"; // Using a visible space character
      spaceSpan.classList.add("remaining");
      spaceSpan.classList.add("space-character"); // Add special class for styling
      wordToTypeElement.appendChild(spaceSpan);
    }
  }

  if (nextWordElement) {
    nextWordElement.textContent = words[nextWordIndex];
  }
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
  // Only countdown if the player has started typing
  if (hasStartedTyping && timeLeft > 0) {
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
  const settings =
    JSON.parse(localStorage.getItem("terminalSettings")) || gameSettings;
  const goalTime = (settings.timeLimit * settings.goalPercentage) / 100;
  if (totalTimeSpent >= goalTime) {
    clearInterval(countDownInterval);
    clearInterval(totalTimeInterval);
    showGameOverModal(getRandomSuccessMessage(), true);
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
  if (gameEnded) return;

  // Update the timer display
  const totalTimeElement = document.getElementById("totalTimeValue");
  if (totalTimeElement) {
    totalTimeElement.textContent = calculateTotalTime();
  }

  // Update progress bar
  updateProgressBar();

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
      JSON.parse(localStorage.getItem("terminalSettings")) || gameSettings;
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
      progressText.textContent = `Hacked ${Math.floor(progressPercentage)}%`;
    }
  }
}

// Input handling for both modes
function checkInput(e) {
  const userInput = e.target.value;
  const currentWord = words[currentWordIndex];
  const wordDisplay = document.getElementById("wordToType");
  const showSpace = localStorage.getItem("showSpacesAfterWords") === "true";

  if (!wordDisplay) return;

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

  // Check if entering command mode (starts with /)
  if (userInput.startsWith("/") && !isCommandMode) {
    isCommandMode = true;
    commandStartTime = Date.now(); // Track when command mode started

    // Pause all game timers when entering command mode
    if (!isZenMode) {
      if (countDownInterval) {
        clearInterval(countDownInterval);
        countDownInterval = null;
        if (totalTimeInterval) {
          clearInterval(totalTimeInterval);
          totalTimeInterval = null;
        }
        wasPaused = true;
      }
    } else {
      // For Zen mode, pause the time display
      if (totalTimeInterval) {
        clearInterval(totalTimeInterval);
        totalTimeInterval = null;
        wasPaused = true;
      }
    }
    return; // Exit early to prevent normal word checking
  }

  // Check if exiting command mode (no longer starts with /)
  else if (!userInput.startsWith("/") && isCommandMode) {
    isCommandMode = false;

    // If we tracked command start time, adjust gameStartTime to compensate
    if (commandStartTime && gameStartTime) {
      const commandDuration = Date.now() - commandStartTime;
      gameStartTime += commandDuration; // Adjust game start time by command duration
    }
    commandStartTime = null;

    // Resume timers if they were previously running
    if (wasPaused && hasStartedTyping) {
      if (!isZenMode) {
        countDownInterval = setInterval(countDown, 800);
        totalTimeInterval = setInterval(totalTimeCount, 1000);
      } else {
        totalTimeInterval = setInterval(updateZenTimer, 1000);
      }
      wasPaused = false;
    }
  }

  // Skip normal processing while in command mode
  if (isCommandMode) {
    return;
  }

  // Check for debug command
  if (userInput.toLowerCase() === "debug") {
    e.target.value = "";
    debugDisplay.toggle();
    location.reload();
    return;
  }

  // Check for terminal command (classic mode only)
  if (userInput.toLowerCase() === "terminal" && !isZenMode) {
    e.target.value = "";
    terminal.open();
    return;
  }

  // Check for "iddqd" secret code in Zen mode
  if (isZenMode && userInput.toLowerCase() === "iddqd" && !gameEnded) {
    gameEnded = true;
    clearInterval(totalTimeInterval);
    document.getElementById("userInput").disabled = true;
    showCheatModal();
    return;
  }

  // Play keypress sound for actual typing AND backspace
  if (
    hasStartedTyping &&
    !isCommandMode &&
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
    if (showSpace && userInput.length > currentWord.length) {
      // We're typing the space
      if (userInput[userInput.length - 1] === " ") {
        correctKeystrokes++;
      }
    } else if (userInput.length <= currentWord.length) {
      // We're typing the word
      if (
        userInput[userInput.length - 1] === currentWord[userInput.length - 1]
      ) {
        correctKeystrokes++;
      }
    }
  }

  // Style each character in the displayed word
  for (let i = 0; i < chars.length; i++) {
    if (i < userInput.length) {
      if (showSpace && i === currentWord.length) {
        // This is the space character
        if (userInput[i] === " ") {
          chars[i].className = "correct space-character";
        } else {
          chars[i].className = "incorrect space-character";
        }
      } else {
        // This is a regular character
        if (userInput[i] === currentWord[i]) {
          chars[i].className = "correct";
        } else {
          chars[i].className = "incorrect";
        }
      }
    } else {
      // Characters not yet typed
      if (showSpace && i === currentWord.length) {
        chars[i].className = "remaining space-character";
      } else {
        chars[i].className = "remaining";
      }
    }
  }

  // Check if word is complete
  const expectedInput = showSpace ? currentWord + " " : currentWord;

  if (userInput === expectedInput) {
    flashProgress();
    totalCharactersTyped += currentWord.length + (showSpace ? 1 : 0);
    totalTimeSpent += 1;
    if (!isZenMode) {
      timeLeft += bonusTime;
    }
    wordsTyped.push(currentWord);
    currentWordIndex = nextWordIndex;
    nextWordIndex = Math.floor(Math.random() * words.length);
    updateWordDisplay();
    e.target.value = "";
    updateProgressBar();

    if (isZenMode && wordsTyped.length >= zenWordGoal) {
      gameEnded = true;
      clearInterval(totalTimeInterval);
      showGameOverModal(getRandomSuccessMessage(), true);
    }
  }
}

// Calculate WPM for both modes
function calculateWPM() {
  if (!gameStartTime) return { wpm: 0, accuracy: "0%" };

  const endTime = Date.now();
  let timeElapsed = (endTime - gameStartTime) / 60000;

  // Adjust for time spent in command mode
  if (isCommandMode && commandStartTime) {
    const commandDuration = (endTime - commandStartTime) / 60000;
    timeElapsed -= commandDuration; // Remove command time from calculation
  }

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

// Classic Mode score calculation
function calculateScore() {
  try {
    // Get typing performance metrics
    const wpmResult = calculateWPM();
    const wpm = Math.max(1, wpmResult.wpm); // Minimum of 1 WPM to avoid division by zero
    const accuracy = parseFloat(wpmResult.accuracy.replace("%", "")) / 100;

    // Get game settings for difficulty multiplier
    const settings = JSON.parse(localStorage.getItem("terminalSettings")) || {
      timeLimit: 30,
      bonusTime: 3,
      initialTime: 10,
      goalPercentage: 100,
      currentMode: "classic",
    };

    // Calculate difficulty multiplier based on game settings
    const difficultyMultiplier = calculateDifficultyMultiplier(settings);

    const baseScore = Math.round(
      wpm * 10 * (accuracy * accuracy) * difficultyMultiplier,
    );

    const energyBonus = Math.min(timeLeft * 5, baseScore * 0.2);

    return Math.round(baseScore + energyBonus);
  } catch (error) {
    console.error("Error calculating score:", error);
    return timeLeft * 256;
  }
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

// Game Over Modal for both modes
function showGameOverModal(message, isSuccess = true) {
  const stats = calculateWPM();
  const languageName =
    currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1);
  const modalLabel = document.getElementById("gameOverModalLabel");

  if (modalLabel) {
    modalLabel.textContent = `[${playerUsername}@PENTAGON-CORE:~]$`;
  }

  const dataCollectionEnabled = localStorage.getItem("data_collection_enabled");
  const isDataCollectionEnabled =
    dataCollectionEnabled === null || dataCollectionEnabled === "true";
  const leaderboardStatus = isDataCollectionEnabled ? "ENABLED" : "DISABLED";
  const leaderboardColor = isDataCollectionEnabled ? "#c3e88d" : "#ff007c";

  if (isZenMode) {
    // Zen Mode specific game over
    const totalTime = calculateTotalTime();

    const terminalLines = [
      "> INITIALIZING TERMINAL OUTPUT...",
      "> ANALYZING PERFORMANCE DATA...",
      `> MODE: ZEN`,
      `> WORD SET: ${languageName}`,
      `> USER: ${playerUsername}`,
      `> STATUS: ${message}`,
      "> ================================",
      "> PERFORMANCE METRICS:",
      `  └─ WORD GOAL: <span style='color:#c3e88d'>${zenWordGoal}</span> words`,
      `  └─ SESSION TIME: <span style='color:#c3e88d'>${totalTime}</span>`,
      `  └─ TYPING SPEED: <span style='color:#ff9e64'>${stats.wpm}</span> WPM`,
      `  └─ ACCURACY: <span style='color:#bb9af7'>${stats.accuracy}</span>`,
      "> ================================",
      "> PRESS [ENTER] TO RETRY",
      "> END OF TRANSMISSION_",
    ];

    displayGameOverContent(terminalLines);
    saveZenResult(stats.wpm, totalTime, stats.accuracy);
  } else {
    // Classic Mode specific game over
    const finalScore = calculateScore();

    // Get the proper mode name (capitalize first letter)
    const modeName =
      gameSettings.currentMode.charAt(0).toUpperCase() +
      gameSettings.currentMode.slice(1);

    const terminalLines = [
      "> INITIALIZING TERMINAL OUTPUT...",
      "> ANALYZING PERFORMANCE DATA...",
      `> MODE: ${modeName}`,
      `> WORD SET: ${languageName}`,
      `> USER: ${playerUsername}`,
      `> STATUS: ${message}`,
      "> ================================",
      "> PERFORMANCE METRICS:",
      `  └─ ENERGY REMAINING: <span style='color:#c3e88d'>${timeLeft}</span> units`,
      `  └─ TYPING SPEED: <span style='color:#ff9e64'>${stats.wpm}</span> WPM`,
      `  └─ ACCURACY: <span style='color:#bb9af7'>${stats.accuracy}</span>`,
      `  └─ FINAL SCORE: <span style='color:#c3e88d'>${finalScore}</span>`,
      "> ================================",
      `> GLOBAL SCOREBOARD: <span style='color:${leaderboardColor}'>${leaderboardStatus}</span>`,
      "> ================================",
      `> SPEED TIER: <span style='color:#4fd6be'>${getSpeedTier(stats.wpm)}</span>`,
      `> PRECISION RANK: <span style='color:#4fd6be'>${getAccuracyRank(stats.accuracy)}</span>`,
    ];

    displayGameOverContent(terminalLines);
    saveClassicResult(
      isSuccess ? timeLeft : 0,
      stats.wpm,
      stats.accuracy,
      finalScore,
      isSuccess,
    );
  }

  displayPreviousResults();
}

// Helper function to display game over content
function displayGameOverContent(terminalLines) {
  let currentLine = 0;
  let modalContent = "";
  const gameOverModal = new bootstrap.Modal(
    document.getElementById("gameOverModal"),
  );
  const modalBody = document
    .getElementById("gameOverModal")
    .querySelector(".modal-body");

  modalBody.innerHTML = '<pre class="terminal-output"></pre>';

  // Initially hide the return button by adding a class
  const restartBtn = document.getElementById("restartGameBtn");
  if (restartBtn) {
    restartBtn.style.visibility = "hidden";
    restartBtn.style.opacity = "0";
  }

  function typeNextLine() {
    if (currentLine < terminalLines.length) {
      modalContent += terminalLines[currentLine] + "\n";
      modalBody.querySelector(".terminal-output").innerHTML = modalContent;
      currentLine++;
      setTimeout(typeNextLine, 150);
    } else {
      // Show the return button immediately after text animation completes
      if (restartBtn) {
        restartBtn.style.visibility = "visible";
        restartBtn.style.opacity = "1";
        restartBtn.focus();
      }
    }
  }

  gameOverModal.show();

  // Start typing animation after modal is fully shown
  document.getElementById("gameOverModal").addEventListener(
    "shown.bs.modal",
    function onShown() {
      typeNextLine();
      document
        .getElementById("gameOverModal")
        .removeEventListener("shown.bs.modal", onShown);
    },
    { once: true },
  );

  if (restartBtn) {
    restartBtn.onclick = () => location.reload();
  }

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
      // Reset button visibility for next time
      if (restartBtn) {
        restartBtn.style.visibility = "hidden";
        restartBtn.style.opacity = "0";
      }
    });
}

// Zen Mode: Show special cheat modal for "iddqd" code
function showCheatModal() {
  document.getElementById("gameOverModalLabel").textContent =
    "[root@PENTAGON-CORE:~/godmode.txt]$";

  const terminalLines = [
    "> INIT BREACH SEQUENCE",
    "> ESTABLISHING CONNECTION ... 100%",
    "> BYPASSING FIREWALL ... 100%",
    "> CRACKING ENCRYPTION ... 100%",
    "> SUDO PRIVILEGES ESCALATED",
    "> ROOT ACCESS OBTAINED",
    "> SECURITY PROTOCOLS BYPASSED",
    "> SYSTEM COMPROMISED",
    "> GOD MODE ACTIVATED",
    "> ENTER CUSTOM SCORE DATA:",
  ];

  let currentLine = 0;
  let modalContent = "";

  const gameOverModal = new bootstrap.Modal(
    document.getElementById("gameOverModal"),
  );
  const modalBody = document
    .getElementById("gameOverModal")
    .querySelector(".modal-body");

  modalBody.innerHTML = '<pre class="terminal-output"></pre>';

  function typeNextLine() {
    if (currentLine < terminalLines.length) {
      modalContent += `<span style='color:#c3e88d'>${terminalLines[currentLine]}</span>\n`;
      modalBody.querySelector(".terminal-output").innerHTML = `${modalContent}`;

      if (currentLine === terminalLines.length - 1) {
        modalBody.innerHTML = `
          <pre class="terminal-output">${modalContent}</pre>
          <div class="mt-2">
            <div class="mb-2">
              <label>WPM (0-300):</label>
              <input type="number" id="customWpm" class="form-control bg-dark text-light" min="0" max="300">
              <div id="wpmError" class="invalid-feedback"></div>
            </div>
            <div class="mb-2">
              <label>Accuracy (0-100%):</label>
              <input type="number" id="customAccuracy" class="form-control bg-dark text-light" min="0" max="100" step="0.1">
              <div id="accuracyError" class="invalid-feedback"></div>
            </div>
            <div class="mb-2">
              <label>Time (mm:ss):</label>
              <input type="text" id="customTime" class="form-control bg-dark text-light">
              <div id="timeError" class="invalid-feedback"></div>
            </div>
            <button id="submitCustomScore" class="btn btn-success pt-2">Submit</button>
          </div>
        `;
        setupFormEventListeners(gameOverModal);
        const wpmInput = document.getElementById("customWpm");
        if (wpmInput) {
          wpmInput.focus();
        }
      }

      currentLine++;
      const isLoadingLine = terminalLines[currentLine - 1]?.includes("100%");
      setTimeout(typeNextLine, isLoadingLine ? 900 : 200);
    }
  }

  gameOverModal.show();
  typeNextLine();

  // Unlock "The Admin" achievement
  try {
    if (typeof achievementSystem !== "undefined") {
      const adminGameData = {
        adminAccess: true,
        date: new Date().toLocaleString("en-GB"),
        mode: "Zen Mode",
        wordList: currentLanguage,
        username: playerUsername,
      };

      achievementSystem.handleGameCompletion(adminGameData);
    }
  } catch (error) {
    console.error("Error unlocking achievement:", error);
  }
}

function validateTimeFormat(timeStr) {
  const timeRegex = /^([0-9]{1,2}):([0-5][0-9])$/;
  if (!timeRegex.test(timeStr)) return false;
  const [minutes, seconds] = timeStr.split(":").map(Number);
  return minutes >= 0 && seconds >= 0 && seconds < 60;
}

function setupFormEventListeners(gameOverModal) {
  const restartGameBtn = document.getElementById("restartGameBtn");
  if (restartGameBtn) {
    restartGameBtn.addEventListener("click", () => {
      gameOverModal.hide();
      location.reload();
    });
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const submitBtn = document.getElementById("submitCustomScore");
      if (submitBtn) {
        submitBtn.click();
      }
    }
  };

  document.removeEventListener("keydown", handleKeyPress);
  document.addEventListener("keydown", handleKeyPress);

  const submitBtn = document.getElementById("submitCustomScore");
  if (submitBtn) {
    submitBtn.addEventListener("click", function () {
      let isValid = true;

      const wpmInput = document.getElementById("customWpm");
      const wpm = parseInt(wpmInput.value);
      if (isNaN(wpm) || wpm < 0 || wpm > 300) {
        document.getElementById("wpmError").textContent =
          "WPM must be between 0 and 300";
        wpmInput.classList.add("is-invalid");
        isValid = false;
      } else {
        wpmInput.classList.remove("is-invalid");
      }

      const accuracyInput = document.getElementById("customAccuracy");
      const accuracy = parseFloat(accuracyInput.value);
      if (isNaN(accuracy) || accuracy < 0 || accuracy > 100) {
        document.getElementById("accuracyError").textContent =
          "Accuracy must be between 0 and 100";
        accuracyInput.classList.add("is-invalid");
        isValid = false;
      } else {
        accuracyInput.classList.remove("is-invalid");
      }

      const timeInput = document.getElementById("customTime");
      const time = timeInput.value;
      if (!validateTimeFormat(time)) {
        document.getElementById("timeError").textContent =
          "Invalid time format. Use mm:ss (e.g. 1:30)";
        timeInput.classList.add("is-invalid");
        isValid = false;
      } else {
        timeInput.classList.remove("is-invalid");
      }

      if (isValid) {
        // Save the custom result to localStorage
        saveZenResult(wpm, time, accuracy);
        displayPreviousResults();

        // Close the modal
        gameOverModal.hide();

        // Redirect to animation page
        window.location.href = "./animation.html";
      }
    });
  }
}

// Save results for Classic Mode
// Updated score submission logic in functions-classic.js
// Replace the saveClassicResult function with this enhanced version

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

  // Create game data object for local storage
  const gameData = {
    username: getDisplayUsername(),
    timeLeft,
    wpm,
    accuracy,
    date: new Date().toLocaleString("en-GB"),
    mode: modeName + " Mode",
    score: finalScore,
    wordList: currentLanguage,
    difficultyMultiplier: difficultyMultiplier,
  };

  // Save locally
  results.push(gameData);
  localStorage.setItem("gameResults", JSON.stringify(results));
  localStorage.setItem(
    "highestAchievements",
    JSON.stringify(highestAchievements),
  );

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

  // Keep all results in localStorage but only display the last 15
  const displayResults = results.slice(-15).reverse();

  // Clear existing content
  resultsContainer.innerHTML = "";

  if (displayResults.length === 0) {
    resultsContainer.innerHTML = `
      <div class="text-center py-5 empty-state">
        <i class="fa-solid fa-chart-line empty-icon" style="font-size: 3rem; margin-bottom: 1rem;"></i>
        <p>Play some games nerd.</p>
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
      <td colspan="7" class="text-center py-3" style="color: #565f89; font-style: italic; border-top: 2px solid #3b4261;">
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
