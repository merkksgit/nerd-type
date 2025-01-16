let totalTimeSpent = 0;
let currentWordIndex = 0;
let nextWordIndex = 0;
let totalTimeInterval;
let gameStartTime = null;
let wordsTyped = [];
let totalCharactersTyped = 0;
let hasStartedTyping = false;
let sessionStartTime = null;
let totalKeystrokes = 0;
let correctKeystrokes = 0;
let gameEnded = false;
let playerUsername = localStorage.getItem("nerdtype_username") || "runner";
let isUsernameModalOpen = false;

import { words } from "./words-fin.js";

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

  if (changeUsernameBtn) {
    changeUsernameBtn.addEventListener("click", showUsernameModal);
  }

  if (confirmUsernameBtn) {
    confirmUsernameBtn.addEventListener("click", handleUsernameConfirmation);
  }

  if (!localStorage.getItem("nerdtype_username")) {
    showUsernameModal();
  }

  // Scoreboard initialization
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
    localStorage.setItem(
      "scoreboardHidden",
      container.classList.contains("hidden"),
    );
  });

function flashProgress() {
  const progressBar = document.querySelector(".progress.terminal");
  progressBar.classList.add("flash");
  setTimeout(() => {
    progressBar.classList.remove("flash");
  }, 400);
}

document.getElementById("resetBtn")?.addEventListener("click", () => {
  location.reload();
});

document.getElementById("startButton").addEventListener("click", startGame);

function startGame() {
  gameEnded = false;
  currentWordIndex = Math.floor(Math.random() * words.length);
  nextWordIndex = Math.floor(Math.random() * words.length);
  updateWordDisplay();
  totalTimeInterval = setInterval(totalTimeCount, 1000);
  document.getElementById("userInput").focus();
  gameStartTime = null;
  sessionStartTime = new Date();
  hasStartedTyping = false;
  wordsTyped = [];
  totalCharactersTyped = 0;
  totalKeystrokes = 0;
  correctKeystrokes = 0;
  totalTimeSpent = 0;
}

function updateWordDisplay() {
  const wordToTypeElement = document.getElementById("wordToType");
  const currentWord = words[currentWordIndex];
  wordToTypeElement.innerHTML = "";
  for (let i = 0; i < currentWord.length; i++) {
    const charSpan = document.createElement("span");
    charSpan.textContent = currentWord[i];
    charSpan.classList.add("remaining");
    wordToTypeElement.appendChild(charSpan);
  }
  document.getElementById("nextWord").textContent = words[nextWordIndex];
}

function calculateTotalTime() {
  if (!sessionStartTime) return "0:00";
  const now = new Date();
  const totalSeconds = Math.floor((now - sessionStartTime) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function totalTimeCount() {
  if (gameEnded) return;
  updateProgressBar();
  if (document.getElementById("totalTime")) {
    document.getElementById("totalTime").textContent = calculateTotalTime();
  }
  if (totalTimeSpent >= 30 && !gameEnded) {
    gameEnded = true;
    clearInterval(totalTimeInterval);
    showGameOverModal(
      "System core <span style='color:#c3e88d'>BREACHED!</span> Access granted.",
    );
  }
}

function updateProgressBar() {
  const progressPercentage = (totalTimeSpent / 30) * 100;
  const progressBar = document.getElementById("progressBar");
  progressBar.style.width = progressPercentage + "%";
  progressBar.setAttribute("aria-valuenow", progressPercentage);
  progressBar.style.backgroundColor = "#1f2335";
  document.getElementById("progressPercentage").textContent =
    "Progress " + Math.floor(progressPercentage) + "%";
}

document.getElementById("userInput").addEventListener("input", function (e) {
  if (!hasStartedTyping && e.target.value.length > 0) {
    hasStartedTyping = true;
    gameStartTime = Date.now();
  }
  checkInput(e);
});

function validateTimeFormat(timeStr) {
  const timeRegex = /^([0-9]{1,2}):([0-5][0-9])$/;
  if (!timeRegex.test(timeStr)) return false;
  const [minutes, seconds] = timeStr.split(":").map(Number);
  return minutes >= 0 && seconds >= 0 && seconds < 60;
}

function checkInput(e) {
  const userInput = e.target.value;
  const currentWord = words[currentWordIndex];
  const wordDisplay = document.getElementById("wordToType");
  const chars = wordDisplay.children;

  // Check for secret code word (wp you found it, nerd)
  if (userInput.toLowerCase() === "iddqd" && !gameEnded) {
    gameEnded = true;
    clearInterval(totalTimeInterval);
    document.getElementById("userInput").disabled = true;
    showCheatModal();
    return;
  }

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
    wordsTyped.push(currentWord);
    currentWordIndex = nextWordIndex;
    nextWordIndex = Math.floor(Math.random() * words.length);
    updateWordDisplay();
    document.getElementById("userInput").value = "";
  }
}

function showCheatModal() {
  document.getElementById("gameOverModalLabel").textContent =
    "[root@PENTAGON-CORE:/classified]$";

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
        saveResult(wpm, time, accuracy);
        displayPreviousResults();
        gameOverModal.hide();
        location.reload();
      }
    });
  }
}

function showGameOverModal(message) {
  const wpm = calculateWPM();
  const accuracy = calculateAccuracy();
  const totalTime = calculateTotalTime();

  document.getElementById("gameOverModalLabel").textContent =
    `[${playerUsername}@PENTAGON-CORE:/classified]$`;

  const terminalLines = [
    "> INITIALIZING TERMINAL OUTPUT...",
    "> ANALYZING PERFORMANCE DATA...",
    "> MODE: ZEN",
    `> USER: ${playerUsername}`,
    `> STATUS: ${message}`,
    "> ================================",
    "> PERFORMANCE METRICS:",
    `  └─ SESSION TIME: <span style='color:#c3e88d'>${totalTime}</span>`,
    `  └─ TYPING SPEED: <span style='color:#ff9e64'>${wpm}</span> WPM`,
    `  └─ ACCURACY: <span style='color:#bb9af7'>${accuracy}%</span>`,
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

  saveResult(wpm, totalTime, accuracy);
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

function calculateWPM() {
  if (!gameStartTime) return 0;
  const endTime = Date.now();
  const timeElapsed = Math.max(0.08, (endTime - gameStartTime) / 60000);
  const CHARS_PER_WORD = 5;
  const wpm = Math.round(totalCharactersTyped / CHARS_PER_WORD / timeElapsed);
  return wpm;
}

function calculateAccuracy() {
  if (totalKeystrokes === 0) return "0.0";
  return ((correctKeystrokes / totalKeystrokes) * 100).toFixed(1);
}

function saveResult(wpm, totalTime, accuracy) {
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];
  results.push({
    username: playerUsername,
    wpm,
    totalTime,
    accuracy,
    date: new Date().toLocaleString("en-GB"),
    mode: "Zen Mode",
  });
  localStorage.setItem("gameResults", JSON.stringify(results));
}

function displayPreviousResults() {
  const resultsContainer = document.getElementById("previousResults");
  if (!resultsContainer) return;

  let results = JSON.parse(localStorage.getItem("gameResults")) || [];
  results.reverse();
  resultsContainer.innerHTML = "";

  results.forEach((result) => {
    const resultItem = document.createElement("li");
    if (result.mode === "Zen Mode") {
      resultItem.textContent = `${result.date} | ${result.username || "runner"} | ${result.mode} | Time: ${result.totalTime}, WPM: ${result.wpm || "N/A"}, Accuracy: ${result.accuracy || "N/A"}%`;
    } else {
      resultItem.textContent = `${result.date} | ${result.username || "runner"} | ${result.mode} | Score: ${result.score || result.timeLeft * 256}, WPM: ${result.wpm}, Accuracy: ${result.accuracy || "N/A"}`;
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
      modalHeader.textContent = `[${playerUsername}@PENTAGON-CORE:/scoreboard]$`;

      const terminalLines = [
        "> INITIALIZING DELETION SEQUENCE...",
        "> ACCESSING SCOREBOARD DATABASE...",
        "> PREPARING DATA PURGE...",
        "> ================================",
        "> EXECUTING COMMANDS:",
        "  └─ rm -rf scoreboard.data",
        "  └─ rm -rf achievements.data",
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
