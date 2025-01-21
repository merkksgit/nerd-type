// Load saved settings or use defaults
let gameSettings = JSON.parse(localStorage.getItem("terminalSettings")) || {
  timeLimit: 30,
  bonusTime: 3,
  initialTime: 10,
  goalPercentage: 100,
  currentMode: "classic",
};

let timeLeft = gameSettings.initialTime;
let totalTimeSpent = 0;
let currentWordIndex = 0;
let nextWordIndex = 0;
let countDownInterval;
let totalTimeInterval;
let gameStartTime = null;
let wordsTyped = [];
let totalCharactersTyped = 0;
let hasStartedTyping = false;
let totalKeystrokes = 0;
let correctKeystrokes = 0;
let bonusTime = gameSettings.bonusTime;
let goalPercentage = gameSettings.goalPercentage;

import { words } from "./words-nm.js";
import Terminal from "./terminal.js";
import { tips } from "./tips.js";

// Initialize terminal
const terminal = new Terminal();

let playerUsername = localStorage.getItem("nerdtype_username") || "runner";
let isUsernameModalOpen = false;

// Track modal state
document.addEventListener("DOMContentLoaded", function () {
  const usernameModal = document.getElementById("usernameModal");

  if (usernameModal) {
    usernameModal.addEventListener("show.bs.modal", () => {
      isUsernameModalOpen = true;
    });

    usernameModal.addEventListener("hide.bs.modal", () => {
      isUsernameModalOpen = false;
    });
  }
});

// Listen for terminal settings changes
window.addEventListener("gameSettingsChanged", function (e) {
  const { setting, value } = e.detail;
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
      updateProgressBar();
      break;
    case "currentMode":
      gameSettings.currentMode = value;
      break;
  }
  localStorage.setItem("terminalSettings", JSON.stringify(gameSettings));
});

// Handle all keydown events
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && isUsernameModalOpen) {
    event.preventDefault();
    event.stopPropagation();
    handleUsernameConfirmation();
    return;
  }

  if (event.key === "Enter" && !event.ctrlKey && !isUsernameModalOpen) {
    startGame();
  }
  if (event.key === "Enter" && event.ctrlKey) {
    location.reload();
  }
});

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
    }
  } else {
    usernameInput.classList.add("is-invalid");
  }
}

// Initialize event listeners
document.addEventListener("DOMContentLoaded", function () {
  const changeUsernameBtn = document.getElementById("changeUsername");
  const confirmUsernameBtn = document.getElementById("confirmUsername");

  const nextWordDiv = document.getElementById("nextWord");
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  nextWordDiv.textContent = randomTip;

  if (changeUsernameBtn) {
    changeUsernameBtn.addEventListener("click", showUsernameModal);
  }

  if (confirmUsernameBtn) {
    confirmUsernameBtn.addEventListener("click", handleUsernameConfirmation);
  }

  if (!localStorage.getItem("nerdtype_username")) {
    showUsernameModal();
  }

  // Add these lines for scoreboard functionality
  const container = document.getElementById("scoreboardContainer");
  const button = document.getElementById("toggleScoreboard");
  const isHidden = localStorage.getItem("scoreboardHidden") === "true";

  if (isHidden && container && button) {
    container.classList.add("hidden");
    button.innerHTML = '<i class="fa-solid fa-trophy"></i> Show Scoreboard';
  }

  displayPreviousResults();
});

// Scoreboard toggle functionality
const toggleScoreboardBtn = document.getElementById("toggleScoreboard");
if (toggleScoreboardBtn) {
  toggleScoreboardBtn.addEventListener("click", function () {
    const container = document.getElementById("scoreboardContainer");
    const button = this;

    container.classList.toggle("hidden");

    if (container.classList.contains("hidden")) {
      button.innerHTML = '<i class="fa-solid fa-trophy"></i> Show Scoreboard';
    } else {
      button.innerHTML = '<i class="fa-solid fa-trophy"></i> Hide Scoreboard';
    }

    localStorage.setItem(
      "scoreboardHidden",
      container.classList.contains("hidden"),
    );
  });
}

function flashProgress() {
  const progressBar = document.querySelector(".progress.terminal");
  if (progressBar) {
    progressBar.classList.add("flash");
    setTimeout(() => {
      progressBar.classList.remove("flash");
    }, 400);
  }
}

const resetBtn = document.getElementById("resetBtn");
const startBtn = document.getElementById("startButton");

if (startBtn) {
  startBtn.addEventListener("click", startGame);
}

function startGame() {
  // Load latest settings
  const settings =
    JSON.parse(localStorage.getItem("terminalSettings")) || gameSettings;
  timeLeft = settings.initialTime;
  bonusTime = settings.bonusTime;
  goalPercentage = settings.goalPercentage;
  totalTimeSpent = 0;

  currentWordIndex = Math.floor(Math.random() * words.length);
  nextWordIndex = Math.floor(Math.random() * words.length);
  updateWordDisplay();
  updateTimer();

  if (countDownInterval) clearInterval(countDownInterval);
  if (totalTimeInterval) clearInterval(totalTimeInterval);

  countDownInterval = setInterval(countDown, 800);
  totalTimeInterval = setInterval(totalTimeCount, 1000);

  const userInput = document.getElementById("userInput");
  if (userInput) {
    userInput.focus();
    userInput.value = "";
  }

  gameStartTime = null;
  hasStartedTyping = false;
  wordsTyped = [];
  totalCharactersTyped = 0;
  totalKeystrokes = 0;
  correctKeystrokes = 0;

  updateProgressBar();
}

function updateWordDisplay() {
  const wordToTypeElement = document.getElementById("wordToType");
  const nextWordElement = document.getElementById("nextWord");
  const currentWord = words[currentWordIndex];

  if (wordToTypeElement) {
    wordToTypeElement.innerHTML = "";

    for (let i = 0; i < currentWord.length; i++) {
      const charSpan = document.createElement("span");
      charSpan.textContent = currentWord[i];
      charSpan.classList.add("remaining");
      wordToTypeElement.appendChild(charSpan);
    }
  }

  if (nextWordElement) {
    nextWordElement.textContent = words[nextWordIndex];
  }
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    location.reload();
  });
}

function countDown() {
  if (timeLeft > 0) {
    timeLeft--;
    updateTimer();
  } else {
    clearInterval(countDownInterval);
    clearInterval(totalTimeInterval);
    showGameOverModal(
      "Intrusion <span style='color:#ff007c'>DETECTED!</span> Emergency shutdown.",
    );
  }
}

function totalTimeCount() {
  const settings =
    JSON.parse(localStorage.getItem("terminalSettings")) || gameSettings;
  const goalTime = (settings.timeLimit * settings.goalPercentage) / 100;

  if (totalTimeSpent >= goalTime) {
    clearInterval(countDownInterval);
    clearInterval(totalTimeInterval);
    showGameOverModal(
      "System core <span style='color:#c3e88d'>BREACHED!</span> Access granted.",
    );
  }
}

function updateTimer() {
  const timerElement = document.getElementById("timeLeft");
  if (timerElement) {
    timerElement.textContent = timeLeft;
  }
}

function updateProgressBar() {
  const settings =
    JSON.parse(localStorage.getItem("terminalSettings")) || gameSettings;
  const goalTime = (settings.timeLimit * settings.goalPercentage) / 100;
  const progressPercentage = (totalTimeSpent / goalTime) * 100;
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressPercentage");

  if (progressBar) {
    progressBar.style.width = `${progressPercentage}%`;
    progressBar.setAttribute("aria-valuenow", progressPercentage);
    progressBar.style.backgroundColor = "#1f2335";
  }

  if (progressText) {
    progressText.textContent = `Hacked ${Math.floor(progressPercentage)}%`;
  }
}

const userInput = document.getElementById("userInput");
if (userInput) {
  userInput.addEventListener("input", function (e) {
    if (!hasStartedTyping && e.target.value.length > 0) {
      hasStartedTyping = true;
      gameStartTime = Date.now();
    }
    checkInput(e);
  });
}

function checkInput(e) {
  const userInput = e.target.value;
  const currentWord = words[currentWordIndex];
  const wordDisplay = document.getElementById("wordToType");

  if (!wordDisplay) return;

  // Check for terminal command
  if (userInput.toLowerCase() === "terminal") {
    e.target.value = "";
    terminal.open();
    return;
  }

  const chars = wordDisplay.children;

  if (e.inputType === "insertText" && e.data) {
    totalKeystrokes++;
    if (userInput[userInput.length - 1] === currentWord[userInput.length - 1]) {
      correctKeystrokes++;
    }
  }

  for (let i = 0; i < currentWord.length; i++) {
    if (i < userInput.length) {
      if (userInput[i] === currentWord[i]) {
        chars[i].className = "correct";
      } else {
        chars[i].className = "incorrect";
      }
    } else {
      chars[i].className = "remaining";
    }
  }

  if (userInput === currentWord) {
    flashProgress();
    totalCharactersTyped += currentWord.length;
    totalTimeSpent += 1;
    timeLeft += bonusTime;
    wordsTyped.push(currentWord);
    currentWordIndex = nextWordIndex;
    nextWordIndex = Math.floor(Math.random() * words.length);
    updateWordDisplay();
    e.target.value = "";
    updateProgressBar();
  }
}

function calculateWPM() {
  if (!gameStartTime) return { wpm: 0, accuracy: "0%" };
  const endTime = Date.now();
  const timeElapsed = Math.max(0.08, (endTime - gameStartTime) / 60000);
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

function showGameOverModal(message) {
  const stats = calculateWPM();
  const modalLabel = document.getElementById("gameOverModalLabel");

  if (modalLabel) {
    modalLabel.textContent = `[${playerUsername}@PENTAGON-CORE:~]$`;
  }

  const terminalLines = [
    "> INITIALIZING TERMINAL OUTPUT...",
    "> ANALYZING PERFORMANCE DATA...",
    "> MODE: NIGHTMARE",
    `> USER: ${playerUsername}`,
    `> STATUS: ${message}`,
    "> ================================",
    "> PERFORMANCE METRICS:",
    `  └─ ENERGY REMAINING: <span style='color:#c3e88d'>${timeLeft}</span> units`,
    `  └─ TYPING SPEED: <span style='color:#ff9e64'>${stats.wpm}</span> WPM`,
    `  └─ ACCURACY: <span style='color:#bb9af7'>${stats.accuracy}</span>`,
    `  └─ FINAL SCORE: <span style='color:#c3e88d'>${timeLeft * 256}</span>`,
    "> ================================",
    "> DETECTED ACHIEVEMENTS:",
    `  └─ SPEED TIER: <span style='color:#4fd6be'>${getSpeedTier(stats.wpm)}</span>`,
    `  └─ PRECISION RANK: <span style='color:#4fd6be'>${getAccuracyRank(stats.accuracy)}</span>`,
    "> ================================",
    "> PRESS [ENTER] TO RETRY",
    "> END OF TRANSMISSION_",
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
      modalContent += terminalLines[currentLine] + "\n";
      modalBody.querySelector(".terminal-output").innerHTML = modalContent;
      currentLine++;
      setTimeout(typeNextLine, 150);
    }
  }

  gameOverModal.show();
  typeNextLine();

  saveResult(timeLeft, stats.wpm, stats.accuracy);
  displayPreviousResults();

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

window.addEventListener("terminalClosed", function () {
  // Restart intervals
  countDownInterval = setInterval(countDown, 800);
  totalTimeInterval = setInterval(totalTimeCount, 1000);
});

function saveResult(timeLeft, wpm, accuracy) {
  if (timeLeft === 0) {
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

  // Save results and highest achievements
  if (timeLeft) {
    results.push({
      username: playerUsername,
      timeLeft,
      wpm,
      accuracy,
      date: new Date().toLocaleString("en-GB"),
      mode: "Classic Mode",
      score: timeLeft * 256,
    });
  } else {
    results.push({
      username: playerUsername,
      wpm,
      accuracy,
      date: new Date().toLocaleString("en-GB"),
      mode: "Zen Mode",
      score: totalCharactersTyped * 10,
    });
  }

  localStorage.setItem("gameResults", JSON.stringify(results));
  localStorage.setItem(
    "highestAchievements",
    JSON.stringify(highestAchievements),
  );
}

function displayPreviousResults() {
  const resultsContainer = document.getElementById("previousResults");
  if (!resultsContainer) return;

  let results = JSON.parse(localStorage.getItem("gameResults")) || [];
  results.reverse();
  resultsContainer.innerHTML = "";

  results.forEach((result) => {
    const resultItem = document.createElement("li");
    if (result.mode === "Classic Mode") {
      resultItem.textContent = `${result.date} | ${result.username || "runner"} | ${result.mode} | Score: ${result.score || result.timeLeft * 256}, WPM: ${result.wpm}, Accuracy: ${result.accuracy || "N/A"}`;
    } else {
      resultItem.textContent = `${result.date} | ${result.username || "runner"} | ${result.mode} | Time: ${result.totalTime}, WPM: ${result.wpm || "N/A"}, Accuracy: ${result.accuracy || "N/A"}%`;
    }
    resultsContainer.appendChild(resultItem);
  });
}

const clearResultsBtn = document.getElementById("clearResultsBtn");
if (clearResultsBtn) {
  clearResultsBtn.addEventListener("click", function () {
    localStorage.removeItem("gameResults");
    localStorage.removeItem("highestAchievements");
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
        "  └─ rm achievements.data",
        `  └─ PURGE STATUS: <span style='color:#c3e88d'>SUCCESSFUL</span>`,
        "> ================================",
        "> LOCAL STORAGE CLEARED_",
        "> PRESS [CLOSE] TO CONFIRM",
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

      // Prevent Enter key from starting game in this modal
      customAlertModal.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();
        }
      });

      document
        .getElementById("clrResults")
        .addEventListener("click", function () {
          location.reload();
        });
    }
  });
}
