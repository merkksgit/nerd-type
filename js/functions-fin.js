let timeLeft = 10;
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
import { words } from "./words-fin.js";
console.log(words);

// Scoreboard toggle functionality
document
  .getElementById("toggleScoreboard")
  .addEventListener("click", function () {
    const container = document.getElementById("scoreboardContainer");
    const button = this;

    container.classList.toggle("hidden");

    if (container.classList.contains("hidden")) {
      button.innerHTML = '<i class="fa-solid fa-trophy"></i> Show Scoreboard';
    } else {
      button.innerHTML = '<i class="fa-solid fa-trophy"></i> Hide Scoreboard';
    }

    // Save the state to localStorage
    localStorage.setItem(
      "scoreboardHidden",
      container.classList.contains("hidden"),
    );
  });

// Maintain scoreboard state after page refresh
document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("scoreboardContainer");
  const button = document.getElementById("toggleScoreboard");
  const isHidden = localStorage.getItem("scoreboardHidden") === "true";

  if (isHidden) {
    container.classList.add("hidden");
    button.innerHTML = '<i class="fa-solid fa-trophy"></i> Show Scoreboard';
  }
  displayPreviousResults();
});

function flashProgress() {
  const progressBar = document.querySelector(".progress.terminal");
  progressBar.classList.add("flash");

  setTimeout(() => {
    progressBar.classList.remove("flash");
  }, 400);
}

const resetBtn = document.getElementById("resetBtn");

document.getElementById("startButton").addEventListener("click", startGame);

function startGame() {
  currentWordIndex = Math.floor(Math.random() * words.length);
  nextWordIndex = Math.floor(Math.random() * words.length);
  updateWordDisplay();
  updateTimer();
  countDownInterval = setInterval(countDown, 800);
  totalTimeInterval = setInterval(totalTimeCount, 1000);
  document.getElementById("userInput").focus();
  gameStartTime = null;
  hasStartedTyping = false;
  wordsTyped = [];
  totalCharactersTyped = 0;
  totalKeystrokes = 0;
  correctKeystrokes = 0;
}

function updateWordDisplay() {
  const wordToTypeElement = document.getElementById("wordToType");
  const currentWord = words[currentWordIndex];

  // Clear previous content
  wordToTypeElement.innerHTML = "";

  // Create a span for each character
  for (let i = 0; i < currentWord.length; i++) {
    const charSpan = document.createElement("span");
    charSpan.textContent = currentWord[i];
    charSpan.classList.add("remaining");
    wordToTypeElement.appendChild(charSpan);
  }

  document.getElementById("nextWord").textContent = words[nextWordIndex];
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    startGame();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.ctrlKey) {
    location.reload();
  }
});

resetBtn.addEventListener("click", () => {
  location.reload();
});

function countDown() {
  if (timeLeft > 0) {
    timeLeft--;
    updateTimer();
  } else {
    clearInterval(countDownInterval);
    clearInterval(totalTimeInterval);
    showGameOverModal(
      "System breach <span style='color:#ff007c'>FAILED!</span>",
    );
  }
}

function totalTimeCount() {
  updateProgressBar();

  if (totalTimeSpent >= 30) {
    clearInterval(countDownInterval);
    clearInterval(totalTimeInterval);
    showGameOverModal(
      "Database <span style='color:#c3e88d'>CRACKED!</span> Mission accomplished.",
    );
  }
}

function updateTimer() {
  document.getElementById("timeLeft").textContent = timeLeft;
}

function updateProgressBar() {
  const progressPercentage = (totalTimeSpent / 30) * 100;

  const progressBar = document.getElementById("progressBar");
  progressBar.style.width = progressPercentage + "%";
  progressBar.setAttribute("aria-valuenow", progressPercentage);

  if (progressPercentage < 80) {
    progressBar.style.backgroundColor = "#1f2335";
  } else {
    progressBar.style.backgroundColor = "#1f2335";
  }

  document.getElementById("progressPercentage").textContent =
    "Hacked " + Math.floor(progressPercentage) + "%";
}

document.getElementById("userInput").addEventListener("input", function (e) {
  if (!hasStartedTyping && e.target.value.length > 0) {
    hasStartedTyping = true;
    gameStartTime = Date.now();
  }
  checkInput(e);
});

function checkInput(e) {
  const userInput = e.target.value;
  const currentWord = words[currentWordIndex];
  const wordDisplay = document.getElementById("wordToType");
  const chars = wordDisplay.children;

  // Track keystrokes
  if (e.inputType === "insertText" && e.data) {
    totalKeystrokes++;
    if (userInput[userInput.length - 1] === currentWord[userInput.length - 1]) {
      correctKeystrokes++;
    }
  }

  // Update character styling
  for (let i = 0; i < currentWord.length; i++) {
    if (i < userInput.length) {
      // Character has been typed
      if (userInput[i] === currentWord[i]) {
        chars[i].className = "correct";
      } else {
        chars[i].className = "incorrect";
      }
    } else {
      // Character hasn't been typed yet
      chars[i].className = "remaining";
    }
  }

  // Check if word is complete
  if (userInput === currentWord) {
    flashProgress();
    totalCharactersTyped += currentWord.length;
    totalTimeSpent += 1;
    timeLeft += 3;
    wordsTyped.push(currentWord);
    currentWordIndex = nextWordIndex;
    nextWordIndex = Math.floor(Math.random() * words.length);
    updateWordDisplay();
    document.getElementById("userInput").value = "";
  }
}

document.getElementById("totalTimeSpentDisplay").textContent = totalTimeSpent;

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
    accuracy: accuracy + "%",
  };
}

function showGameOverModal(message) {
  const stats = calculateWPM();
  document.getElementById("gameOverModalLabel").textContent =
    ">> TERMINAL_OUTPUT <<";
  // Create terminal-style content with typing animation
  const terminalLines = [
    "> INITIALIZING TERMINAL OUTPUT...",
    "> ANALYZING PERFORMANCE DATA...",
    `> STATUS: ${message}`,
    "> ================================",
    "> PERFORMANCE METRICS:",
    `  └─ ENERGY REMAINING: ${timeLeft} units`,
    `  └─ TYPING SPEED: ${stats.wpm} WPM`,
    `  └─ ACCURACY: ${stats.accuracy}`,
    `  └─ FINAL SCORE: ${timeLeft * 256}`,
    "> ================================",
    "> DETECTED ACHIEVEMENTS:",
    `  └─ SPEED TIER: ${getSpeedTier(stats.wpm)}`,
    `  └─ PRECISION RANK: ${getAccuracyRank(stats.accuracy)}`,
    `  └─ ENERGY EFFICIENCY: ${getEfficiencyRating(timeLeft)}`,
    "> ================================",
    "> SYSTEM DIAGNOSTICS:",
    "  └─ NEURAL BUFFER: STABLE",
    "  └─ QUANTUM CORE: OPERATIONAL",
    `  └─ SYSTEM LOAD: ${Math.min(99, stats.wpm)}%`,
    "> ================================",
    "> PRESS [ENTER] TO RETRY",
    "> END OF TRANSMISSION_",
  ];

  // Helper functions for achievement tiers
  function getSpeedTier(wpm) {
    if (wpm >= 100) return "QUANTUM SPEED";
    if (wpm >= 80) return "NEURAL MASTER";
    if (wpm >= 60) return "CYBER ADEPT";
    if (wpm >= 40) return "DIGITAL RUNNER";
    return "INITIATING";
  }

  function getAccuracyRank(accuracy) {
    const numericAccuracy = parseFloat(accuracy);

    // Round to one decimal
    const roundedAccuracy = Math.round(numericAccuracy * 10) / 10;

    if (roundedAccuracy >= 98) return "PERFECT SYNC";
    if (roundedAccuracy >= 95) return "NEURAL MASTER";
    if (roundedAccuracy >= 90) return "CYBER EFFICIENT";
    if (roundedAccuracy >= 85) return "DIGITAL PRECISE";
    if (roundedAccuracy >= 75) return "SYSTEM UNSTABLE";
    if (roundedAccuracy >= 60) return "NEURAL INTERFERENCE";
    return "SYSTEM FAILURE";
  }

  function getEfficiencyRating(timeLeft) {
    if (timeLeft >= 50) return "QUANTUM EFFICIENT";
    if (timeLeft >= 30) return "NEURAL OPTIMIZED";
    if (timeLeft >= 20) return "CYBER BALANCED";
    if (timeLeft >= 10) return "DIGITAL STABLE";
    return "POWER SAVING";
  }

  let currentLine = 0;
  let modalContent = "";

  function typeNextLine() {
    if (currentLine < terminalLines.length) {
      modalContent += terminalLines[currentLine] + "\n";
      document.querySelector(".modal-body").innerHTML = `
        <pre class="terminal-output">${modalContent}</pre>
      `;
      currentLine++;
      setTimeout(typeNextLine, 150);
    }
  }

  document.querySelector(".modal-body").innerHTML =
    `<pre class="terminal-output"></pre>`;
  typeNextLine();

  saveResult(timeLeft, stats.wpm, stats.accuracy);
  displayPreviousResults();

  const modal = new bootstrap.Modal(document.getElementById("gameOverModal"));
  modal.show();

  // Handle restart button click
  const restartBtn = document.getElementById("restartGameBtn");
  if (restartBtn) {
    restartBtn.onclick = () => location.reload();
  }

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      location.reload();
    }
  };

  // Add keypress listener when modal is shown
  document
    .getElementById("gameOverModal")
    .addEventListener("shown.bs.modal", () => {
      document.addEventListener("keydown", handleKeyPress);
    });

  // Remove keypress listener when modal is hidden
  document
    .getElementById("gameOverModal")
    .addEventListener("hidden.bs.modal", () => {
      document.removeEventListener("keydown", handleKeyPress);
    });
}

function saveResult(timeLeft, wpm, accuracy) {
  if (timeLeft === 0) {
    return;
  }
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];

  if (timeLeft) {
    results.push({
      timeLeft,
      wpm,
      accuracy,
      date: new Date().toLocaleString("en-GB"),
      mode: "Classic Mode",
      score: timeLeft * 256,
    });
  } else {
    results.push({
      wpm,
      accuracy,
      date: new Date().toLocaleString("en-GB"),
      mode: "Zen Mode",
      score: totalCharactersTyped * 10,
    });
  }

  localStorage.setItem("gameResults", JSON.stringify(results));
}

function displayPreviousResults() {
  const resultsContainer = document.getElementById("previousResults");
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];
  results.reverse();
  resultsContainer.innerHTML = "";

  results.forEach((result) => {
    const resultItem = document.createElement("li");
    if (result.mode === "Classic Mode") {
      resultItem.textContent = `${result.date} | ${result.mode} | Score: ${result.score || result.timeLeft * 256}, WPM: ${result.wpm}, Accuracy: ${result.accuracy || "N/A"}`;
    } else {
      resultItem.textContent = `${result.date} | ${result.mode} | Time: ${result.totalTime}, WPM: ${result.wpm || "N/A"}, Accuracy: ${result.accuracy || "N/A"}%`;
    }
    resultsContainer.appendChild(resultItem);
  });
}

document
  .getElementById("clearResultsBtn")
  .addEventListener("click", function () {
    localStorage.removeItem("gameResults");
    document.getElementById("previousResults").innerHTML = "";

    const customAlertModal = new bootstrap.Modal(
      document.getElementById("customAlertModal"),
    );
    customAlertModal.show();
  });
