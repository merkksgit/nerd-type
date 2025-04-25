// Modified version of functions-zen.js
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
let words = [];

const achievementSound = new Audio("../sounds/achievement.mp3");
window.achievementSound = achievementSound;

const wordListDisplayNames = {
  english: "🇬🇧 ",
  finnish: "🇫🇮 ",
  swedish: "🇸🇪 ",
  programming: "🖥️ ",
  nightmare: "💀 ",
};

// Import the tips and word list manager
import { tips } from "./tips.js";
import {
  loadWordList,
  createWordListSelector,
  currentLanguage,
} from "./word-list-manager.js";
import achievementSystem from "./achievements.js";

// Load words when the script initializes
async function initializeGame() {
  // Load the selected word list
  words = await loadWordList(currentLanguage);

  // After words are loaded, set up the UI
  setupUI();

  // Initialize event listeners and other game elements
  initializeEventListeners();
  initializeRotatingTips();
  displayPreviousResults();
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
}

// Tips rotation
let tipsRotationInterval = null;

function initializeRotatingTips() {
  const nextWordDiv = document.getElementById("nextWord");
  let tipIndex = Math.floor(Math.random() * tips.length);

  // Display initial tip
  nextWordDiv.textContent = tips[tipIndex];

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
      nextWordDiv.textContent = tips[tipIndex];
      nextWordDiv.classList.remove("fade-out");
    }, 300); // Match this with CSS transition time
  }, 5000); // Change tip every x seconds
}

// Initialize event listeners
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
    clearResultsBtn.addEventListener("click", function () {
      localStorage.removeItem("gameResults");
      // localStorage.removeItem("highestAchievements");
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
            modalBody.querySelector(".terminal-output").innerHTML =
              modalContent;
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

  // Initialize scoreboard visibility state
  const scoreboardContainer = document.getElementById("scoreboardContainer");
  const scoreboardToggleBtn = document.getElementById("toggleScoreboard");
  const isHidden = localStorage.getItem("scoreboardHidden") === "true";

  if (isHidden && scoreboardContainer && scoreboardToggleBtn) {
    scoreboardContainer.classList.add("hidden");
    scoreboardToggleBtn.innerHTML =
      '<i class="fa-solid fa-trophy"></i> Show Scoreboard';
  }
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

function flashProgress() {
  const progressBar = document.querySelector(".progress.terminal");
  progressBar.classList.add("flash");
  setTimeout(() => {
    progressBar.classList.remove("flash");
  }, 400);
}

function startGame() {
  if (tipsRotationInterval) {
    clearInterval(tipsRotationInterval);
    tipsRotationInterval = null;
  }

  gameEnded = false;
  currentWordIndex = Math.floor(Math.random() * words.length);
  nextWordIndex = Math.floor(Math.random() * words.length);
  updateWordDisplay();
  // Timer will start when typing begins
  document.getElementById("userInput").focus();
  gameStartTime = null;
  sessionStartTime = null;
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

  // Start the timer on first input
  if (!hasStartedTyping && e.target.value.length > 0) {
    hasStartedTyping = true;
    gameStartTime = Date.now();
    sessionStartTime = new Date();
    // Only now start the timer interval
    totalTimeInterval = setInterval(totalTimeCount, 1000);
  }

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
        saveResult(wpm, time, accuracy);
        displayPreviousResults();

        // Close the modal
        gameOverModal.hide();

        // Redirect to animation page
        window.location.href = "./animation.html";
      }
    });
  }
}

function showGameOverModal(message) {
  const wpm = calculateWPM();
  const accuracy = calculateAccuracy();
  const totalTime = calculateTotalTime();

  const languageName =
    currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1);

  document.getElementById("gameOverModalLabel").textContent =
    `[${playerUsername}@PENTAGON-CORE:~]$`;

  const terminalLines = [
    "> INITIALIZING TERMINAL OUTPUT...",
    "> ANALYZING PERFORMANCE DATA...",
    `> MODE: ZEN [${languageName}]`,
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

  // Create a game data object
  const gameData = {
    username: playerUsername,
    wpm,
    totalTime,
    accuracy,
    date: new Date().toLocaleString("en-GB"),
    mode: "Zen Mode",
    wordList: currentLanguage,
  };

  results.push(gameData);
  localStorage.setItem("gameResults", JSON.stringify(results));

  achievementSystem.handleGameCompletion(gameData);
}

function displayPreviousResults() {
  const resultsContainer = document.getElementById("previousResults");
  if (!resultsContainer) return;

  let results = JSON.parse(localStorage.getItem("gameResults")) || [];
  results.reverse();
  resultsContainer.innerHTML = "";

  results.forEach((result) => {
    const resultItem = document.createElement("li");

    // Use the mapping to get a friendly display name for the word list
    const wordListName = result.wordList
      ? wordListDisplayNames[result.wordList] || result.wordList
      : "";
    const wordListInfo = wordListName ? ` ${wordListName}` : "";

    if (result.mode === "Zen Mode") {
      resultItem.textContent = `${result.date} | ${result.username || "runner"} | ${result.mode}${wordListInfo} | Time: ${result.totalTime}, WPM: ${result.wpm || "N/A"}, Accuracy: ${result.accuracy || "N/A"}%`;
    } else {
      resultItem.textContent = `${result.date} | ${result.username || "runner"} | ${result.mode}${wordListInfo} | Score: ${result.score || result.timeLeft * 256}, WPM: ${result.wpm}, Accuracy: ${result.accuracy || "N/A"}`;
    }
    resultsContainer.appendChild(resultItem);
  });
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

// Initialize the game when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeGame);

// Export anything that might be needed by other modules
export { words, startGame, displayPreviousResults };
