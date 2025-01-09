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

// Add flash progress function
function flashProgress() {
  const progressBar = document.querySelector(".progress.terminal");
  progressBar.classList.add("flash");

  // Remove the class after animation completes to allow it to trigger again
  setTimeout(() => {
    progressBar.classList.remove("flash");
  }, 400);
}

const resetBtn = document.getElementById("resetBtn");

document.getElementById("startButton").addEventListener("click", startGame);

function startGame() {
  currentWordIndex = Math.floor(Math.random() * words.length);
  nextWordIndex = Math.floor(Math.random() * words.length);
  document.getElementById("wordToType").textContent = words[currentWordIndex];
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
  document.getElementById("wordToType").textContent = words[currentWordIndex];
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
    progressBar.style.backgroundColor = "#1f2335"; // Blue
  } else {
    progressBar.style.backgroundColor = "#1f2335"; // Red
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

  // Only track actual character inputs (not backspace/delete)
  if (e.inputType === "insertText" && e.data) {
    totalKeystrokes++;
    // Check if the newly typed character matches the target word at the current position
    if (userInput[userInput.length - 1] === currentWord[userInput.length - 1]) {
      correctKeystrokes++;
    }
  }

  if (userInput === currentWord) {
    flashProgress(); // Add flash effect for correct word
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

  // Calculate accuracy based on all keystrokes
  const accuracy =
    totalKeystrokes > 0
      ? ((correctKeystrokes / totalKeystrokes) * 100).toFixed(1)
      : "0";

  const wpm = Math.round(totalCharactersTyped / CHARS_PER_WORD / timeElapsed);

  console.log("Total characters typed:", totalCharactersTyped);
  console.log("Characters per word:", CHARS_PER_WORD);
  console.log("Time elapsed(min):", timeElapsed);
  console.log("WPM:", wpm);
  console.log("Accuracy:", accuracy + "%");

  return {
    wpm,
    accuracy: accuracy + "%",
  };
}

function showGameOverModal(message) {
  const stats = calculateWPM();
  document.getElementById("gameOverModalLabel").textContent =
    ">> TERMINAL_OUTPUT <<";
  document.querySelector(".modal-body").innerHTML =
    message +
    "<br />You have " +
    timeLeft +
    " energy left.<br />Your WPM: " +
    stats.wpm +
    "<br />Accuracy: " +
    stats.accuracy +
    "<br>Score: " +
    `${timeLeft * 256}` +
    "<br />Try again by pressing <span style='color:#ff9e64'>Return</span>" +
    ".";

  saveResult(timeLeft, stats.wpm, stats.accuracy);
  displayPreviousResults();

  let gameOverModal = new bootstrap.Modal(
    document.getElementById("gameOverModal"),
  );
  gameOverModal.show();

  document.getElementById("restartGameBtn").addEventListener("click", () => {
    location.reload();
  });

  document.addEventListener("keydown", function handleEnterKey(event) {
    if (event.key === "Enter") {
      location.reload();
    }
  });
}

function saveResult(timeLeft, wpm, accuracy) {
  if (timeLeft === 0) {
    return;
  }
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];

  // For Classic mode
  if (timeLeft) {
    results.push({
      timeLeft,
      wpm,
      accuracy,
      date: new Date().toLocaleString("en-GB"),
      mode: "Classic Mode",
      score: timeLeft * 256,
    });
  }
  // For Zen mode
  else {
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

document.addEventListener("DOMContentLoaded", displayPreviousResults);

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
