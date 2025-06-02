// Import common dependencies
import { tips } from "./tips.js";
import {
  loadWordList,
  createWordListSelector,
  currentLanguage,
} from "./word-list-manager.js";
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

const keypressSound = new Audio("../sounds/keypress.wav");
keypressSound.volume = 0.3; // Set volume
window.keypressSound = keypressSound;

// Check the keypress sound setting on initialization
const keypressSoundEnabled = localStorage.getItem("keypress_sound_enabled");
if (keypressSoundEnabled === "false") {
  keypressSound.muted = true;
}

// Dispatch an event to notify that the keypress sound is loaded
window.dispatchEvent(
  new CustomEvent("keypress_sound_loaded", {
    detail: { sound: keypressSound },
  }),
);

function playKeypressSound() {
  if (window.keypressSound && !window.keypressSound.muted && hasStartedTyping) {
    // Reset sound to beginning and play
    window.keypressSound.currentTime = 0;
    window.keypressSound
      .play()
      .catch((e) => console.log("Keypress sound play prevented:", e));
  }
}

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
    goalPercentage: 100,
  },
  hard: {
    timeLimit: 20,
    bonusTime: 2,
    initialTime: 8,
    goalPercentage: 100,
  },
  practice: {
    timeLimit: 60,
    bonusTime: 5,
    initialTime: 15,
    goalPercentage: 100,
  },
  speedrunner: {
    timeLimit: 10,
    bonusTime: 2,
    initialTime: 8,
    goalPercentage: 100,
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

  // Set initial time from settings
  timeLeft = gameSettings.initialTime;
  bonusTime = gameSettings.bonusTime;
}

// Set up the UI elements, including the word list selector
function setupUI() {
  // Add the word list selector to the game area
  const gameContainer = document.getElementById("game");
  const buttonsContainer = document.getElementById("buttons");

  // Create a container for the word list selector and position it above the buttons
  const selectorContainer = document.createElement("div");
  selectorContainer.style.marginTop = "20px"; // Add margin to move it down
  selectorContainer.style.marginBottom = "10px"; // Add some space below it too
  gameContainer.insertBefore(selectorContainer, buttonsContainer);
  createWordListSelector(selectorContainer);

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

// Add this to your functions-classic.js file
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
  // Your existing initialization code

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
      case "goalPercentage":
        gameSettings.goalPercentage = value;
        goalPercentage = value; // Update current game
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
              goalPercentage: gameSettings.goalPercentage,
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

  // Clear results button
  const clearResultsBtn = document.getElementById("clearResultsBtn");
  if (clearResultsBtn) {
    clearResultsBtn.addEventListener("click", clearResults);
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
    goalPercentage: gameSettings.goalPercentage,
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
  const modal = new bootstrap.Modal(document.getElementById("usernameModal"));
  document.getElementById("usernameInput").value =
    playerUsername !== "runner" ? playerUsername : "";
  isUsernameModalOpen = true;

  document.getElementById("usernameModal").addEventListener(
    "shown.bs.modal",
    function () {
      document.getElementById("usernameInput").focus();
    },
    { once: true },
  );

  modal.show();
}

function handleUsernameConfirmation() {
  const usernameInput = document.getElementById("usernameInput");
  const username = usernameInput.value.trim();

  if (username) {
    playerUsername = username;
    localStorage.setItem("nerdtype_username", username);
    document.getElementById("usernameDisplay").textContent = playerUsername;
    const modalInstance = bootstrap.Modal.getInstance(
      document.getElementById("usernameModal"),
    );
    if (modalInstance) {
      modalInstance.hide();
      isUsernameModalOpen = false;
      location.reload();
    }
  } else {
    usernameInput.classList.add("is-invalid");
  }
}

// Main game functionality
function startGame() {
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

  // Play keypress sound for actual typing (not backspace)
  if (
    e.inputType === "insertText" &&
    e.data &&
    hasStartedTyping &&
    !isCommandMode
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

  if (isZenMode) {
    // Zen Mode specific game over
    const totalTime = calculateTotalTime();

    const terminalLines = [
      "> INITIALIZING TERMINAL OUTPUT...",
      "> ANALYZING PERFORMANCE DATA...",
      `> MODE: ZEN [${languageName}]`,
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
      `> MODE: ${modeName} [${languageName}]`,
      `> USER: ${playerUsername}`,
      `> STATUS: ${message}`,
      "> ================================",
      "> PERFORMANCE METRICS:",
      `  └─ ENERGY REMAINING: <span style='color:#c3e88d'>${timeLeft}</span> units`,
      `  └─ TYPING SPEED: <span style='color:#ff9e64'>${stats.wpm}</span> WPM`,
      `  └─ ACCURACY: <span style='color:#bb9af7'>${stats.accuracy}</span>`,
      `  └─ FINAL SCORE: <span style='color:#c3e88d'>${finalScore}</span>`,
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

  function typeNextLine() {
    if (currentLine < terminalLines.length) {
      modalContent += terminalLines[currentLine] + "\n";
      modalBody.querySelector(".terminal-output").innerHTML = modalContent;
      currentLine++;
      setTimeout(typeNextLine, 150);
    }
  }

  gameOverModal.show();
  typeNextLine();

  const restartBtn = document.getElementById("restartGameBtn");
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
function saveClassicResult(timeLeft, wpm, accuracy, finalScore) {
  if (timeLeft === 0 && !isZenMode) {
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

  // Use proper mode name (capitalize first letter)
  const modeName =
    gameSettings.currentMode.charAt(0).toUpperCase() +
    gameSettings.currentMode.slice(1);

  // Calculate the difficulty multiplier
  const settingsForCalculation = {
    timeLimit: gameSettings.timeLimit,
    bonusTime: gameSettings.bonusTime,
    initialTime: gameSettings.initialTime,
    goalPercentage: gameSettings.goalPercentage || 100,
  };

  const difficultyMultiplier = calculateDifficultyMultiplier(
    settingsForCalculation,
  );

  // Create game data object
  const gameData = {
    username: playerUsername,
    timeLeft,
    wpm,
    accuracy,
    date: new Date().toLocaleString("en-GB"),
    mode: modeName + " Mode",
    score: finalScore,
    wordList: currentLanguage,
    // Store the calculated multiplier
    difficultyMultiplier: difficultyMultiplier,
  };

  // Save results and highest achievements
  results.push(gameData);
  localStorage.setItem("gameResults", JSON.stringify(results));
  localStorage.setItem(
    "highestAchievements",
    JSON.stringify(highestAchievements),
  );

  // Check for achievements
  achievementSystem.handleGameCompletion(gameData);
}

// Save results for Zen Mode
function saveZenResult(wpm, totalTime, accuracy) {
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];

  // Create a game data object
  const gameData = {
    username: playerUsername,
    wpm: wpm,
    totalTime,
    accuracy,
    date: new Date().toLocaleString("en-GB"),
    mode: "Zen Mode",
    wordList: currentLanguage,
    wordGoal: zenWordGoal,
    wordsTyped: wordsTyped.length,
  };

  results.push(gameData);
  localStorage.setItem("gameResults", JSON.stringify(results));

  achievementSystem.handleGameCompletion(gameData);
}

// Display previous results in scoreboard (only show last 20)
function displayPreviousResults() {
  const resultsContainer = document.getElementById("previousResults");
  if (!resultsContainer) return;

  let results = JSON.parse(localStorage.getItem("gameResults")) || [];

  // Keep all results in localStorage but only display the last 20
  const displayResults = results.slice(-15).reverse();
  resultsContainer.innerHTML = "";

  displayResults.forEach((result) => {
    const resultItem = document.createElement("li");
    const wordListName = result.wordList
      ? wordListDisplayNames[result.wordList] || result.wordList
      : "";
    const wordListInfo = wordListName ? `  ${wordListName}` : "";

    if (result.mode === "Zen Mode") {
      const wordGoalInfo = result.wordGoal ? ` [${result.wordGoal}]` : "";

      resultItem.textContent = `${result.date} | ${result.username || "runner"} | ${result.mode}${wordGoalInfo}${wordListInfo} | Time: ${result.totalTime}, WPM: ${result.wpm || "N/A"}, Accuracy: ${result.accuracy || "N/A"}`;
    } else {
      resultItem.textContent = `${result.date} | ${result.username || "runner"} | ${result.mode}${wordListInfo} | Score: ${result.score || result.timeLeft * 256}, WPM: ${result.wpm}, Accuracy: ${result.accuracy || "N/A"}`;
    }
    resultsContainer.appendChild(resultItem);
  });

  // Add storage info if there are more than 20 results
  if (results.length > 15) {
    const storageSize = calculateLocalStorageSize();
    const infoItem = document.createElement("li");
    infoItem.innerHTML = `... (Showing last 15 of ${results.length} total games | Storage used: ${storageSize} KB)`;
    infoItem.style.color = "#565f89";
    infoItem.style.fontStyle = "italic";
    resultsContainer.appendChild(infoItem);
  }
}

// Clear results and set up modal
function clearResults() {
  localStorage.removeItem("gameResults");

  const resultsContainer = document.getElementById("previousResults");
  if (resultsContainer) {
    resultsContainer.innerHTML = "";
  }

  const customAlertModal = document.getElementById("customAlertModal");
  if (customAlertModal) {
    const modal = new bootstrap.Modal(customAlertModal);
    const modalBody = customAlertModal.querySelector(".modal-body");
    const modalHeader = customAlertModal.querySelector(".modal-title");

    // Set up terminal-style header
    modalHeader.textContent = `[${playerUsername}@PENTAGON-CORE:/user.data/]$`;

    const terminalLines = [
      "> INITIALIZING DELETION SEQUENCE...",
      "> ACCESSING SCOREBOARD DATABASE...",
      "> PREPARING DATA PURGE...",
      "> ================================",
      "> EXECUTING COMMANDS:",
      "  └─ rm scoreboard.data",
      `  └─ PURGE STATUS: <span style='color:#c3e88d'>SUCCESSFUL</span>`,
      "> ================================",
      "> LOCAL STORAGE CLEARED_",
      "> PRESS [ENTER] OR [CLOSE] TO CONFIRM",
      "> END OF TRANSMISSION_",
    ];

    let currentLine = 0;
    let modalContent = "";
    modalBody.innerHTML = '<pre class="terminal-output"></pre>';

    function typeNextLine() {
      if (currentLine < terminalLines.length) {
        modalContent += terminalLines[currentLine] + "\n";
        modalBody.querySelector(".terminal-output").innerHTML = modalContent;
        currentLine++;
        setTimeout(typeNextLine, 150);
      }
    }

    modal.show();
    typeNextLine();

    // Set up the event listeners for the modal
    setupClearResultsModal();
    document
      .getElementById("clrResults")
      .addEventListener("click", function () {
        location.reload();
      });
  }
}

// For the clear results modal, add enter key support
function setupClearResultsModal() {
  const customAlertModal = document.getElementById("customAlertModal");
  const clearResultsButton = document.getElementById("clrResults");

  if (customAlertModal && clearResultsButton) {
    // Remove previous event listeners if they exist
    customAlertModal.removeEventListener("keydown", handleClearResultsKeyPress);

    // Add keydown event listener to the modal
    customAlertModal.addEventListener("keydown", handleClearResultsKeyPress);
  }
}

// Handler for enter key in clear results modal
function handleClearResultsKeyPress(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation();

    // Trigger the clear results button
    const clearResultsButton = document.getElementById("clrResults");
    if (clearResultsButton) {
      clearResultsButton.click();
    }
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
