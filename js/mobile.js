let totalTimeSpent = 0;
let currentWordIndex = 0;
let nextWordIndex = 0;
let totalTimeInterval;
let gameStartTime = null;
let wordsTyped = [];
let totalCharactersTyped = 0;
let hasStartedTyping = false;
let sessionStartTime = null;
import { words } from "./words-fin.js";
console.log(words);

const resetBtn = document.getElementById("resetBtn");

document.getElementById("startButton").addEventListener("click", startGame);

function startGame() {
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
}

function updateWordDisplay() {
  document.getElementById("wordToType").textContent = words[currentWordIndex];
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

function totalTimeCount() {
  updateProgressBar();
  if (document.getElementById("totalTime")) {
    document.getElementById("totalTime").textContent = calculateTotalTime();
  }

  if (totalTimeSpent >= 30) {
    clearInterval(totalTimeInterval);
    showGameOverModal("<span style='color:#c3e88d'>Results:</span>");
  }
}

function updateProgressBar() {
  const progressPercentage = (totalTimeSpent / 30) * 100;

  const progressBar = document.getElementById("progressBar");
  progressBar.style.width = progressPercentage + "%";
  progressBar.setAttribute("aria-valuenow", progressPercentage);

  if (progressPercentage < 80) {
    progressBar.style.backgroundColor = "#7aa2f7"; // Blue
  } else {
    progressBar.style.backgroundColor = "#ff007c"; // Red
  }

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

function checkInput(e) {
  const userInput = e.target.value;
  if (userInput === words[currentWordIndex]) {
    totalCharactersTyped += words[currentWordIndex].length;
    totalTimeSpent += 1;
    wordsTyped.push(words[currentWordIndex]);
    currentWordIndex = nextWordIndex;
    nextWordIndex = Math.floor(Math.random() * words.length);
    updateWordDisplay();
    document.getElementById("userInput").value = "";
  }
}

function calculateWPM() {
  if (!gameStartTime) return 0;
  const endTime = Date.now();
  const timeElapsed = Math.max(0.08, (endTime - gameStartTime) / 60000);
  const CHARS_PER_WORD = 5;
  const wpm = Math.round(totalCharactersTyped / CHARS_PER_WORD / timeElapsed);
  return wpm;
}

function showGameOverModal(message) {
  const wpm = calculateWPM();
  const totalTime = calculateTotalTime();
  document.getElementById("gameOverModalLabel").textContent = "  ZenMode";
  document.querySelector(".modal-body").innerHTML =
    message + "<br />Time: " + totalTime + "<br />WPM: " + wpm;

  saveResult(wpm, totalTime);
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

function saveResult(wpm, totalTime) {
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];
  results.push({
    wpm,
    totalTime,
    date: new Date().toLocaleString("en-GB"),
    mode: "Zen Mode",
  });
  localStorage.setItem("gameResults", JSON.stringify(results));
}

function displayPreviousResults() {
  const resultsContainer = document.getElementById("previousResults");
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];
  results.reverse();
  resultsContainer.innerHTML = "";

  results.forEach((result) => {
    const resultItem = document.createElement("li");
    if (result.mode === "Zen Mode") {
      resultItem.textContent = `${result.date} | ${result.mode} | Time: ${result.totalTime}, WPM: ${result.wpm || "N/A"}`;
    } else {
      resultItem.textContent = `${result.date} | ${result.mode} | Score: ${result.score || result.timeLeft * 256}, WPM: ${result.wpm}`;
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
