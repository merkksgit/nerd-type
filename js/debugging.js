let timeLeft = 100;
let totalTimeSpent = 0;
let currentWordIndex = 0;
let nextWordIndex = 0;
let countDownInterval;
let totalTimeInterval;
let gameStartTime = null;
let wordsTyped = [];
let totalCharactersTyped = 0;
let hasStartedTyping = false; // New flag to track if typing has started
import { words } from "./words-fin.js";
console.log(words);

// Create debug display with draggable functionality
const debugDiv = document.createElement("div");
debugDiv.style.position = "fixed";
debugDiv.style.bottom = "10px";
debugDiv.style.left = "10px";
debugDiv.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
debugDiv.style.color = "#00ff00";
debugDiv.style.fontFamily = "monospace";
debugDiv.style.fontSize = "18px";
debugDiv.style.zIndex = "1000";
debugDiv.style.cursor = "move"; // Change cursor to indicate draggable
debugDiv.style.userSelect = "none"; // Prevent text selection while dragging

// Add a handle bar to make it clear it's draggable
const handleBar = document.createElement("div");
handleBar.style.backgroundColor = "#292e42";
handleBar.style.padding = "2px";
handleBar.style.textAlign = "center";
handleBar.textContent = "="; // Add visual handle
debugDiv.appendChild(handleBar);

// Create content container
const debugContent = document.createElement("div");
debugDiv.appendChild(debugContent);

document.body.appendChild(debugDiv);

// Add dragging functionality
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

function dragStart(e) {
  if (e.type === "touchstart") {
    initialX = e.touches[0].clientX - xOffset;
    initialY = e.touches[0].clientY - yOffset;
  } else {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
  }

  if (e.target === debugDiv || debugDiv.contains(e.target)) {
    isDragging = true;
  }
}

function dragEnd() {
  initialX = currentX;
  initialY = currentY;
  isDragging = false;
}

function drag(e) {
  if (isDragging) {
    e.preventDefault();

    if (e.type === "touchmove") {
      currentX = e.touches[0].clientX - initialX;
      currentY = e.touches[0].clientY - initialY;
    } else {
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
    }

    xOffset = currentX;
    yOffset = currentY;

    setTranslate(currentX, currentY, debugDiv);
  }
}

function setTranslate(xPos, yPos, el) {
  el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}

// Add event listeners for both mouse and touch events
debugDiv.addEventListener("mousedown", dragStart, false);
document.addEventListener("mousemove", drag, false);
document.addEventListener("mouseup", dragEnd, false);

debugDiv.addEventListener("touchstart", dragStart, false);
document.addEventListener("touchmove", drag, false);
document.addEventListener("touchend", dragEnd, false);

// Modify the updateDebugInfo function to use the content container
function updateDebugInfo() {
  const currentTime = gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0;
  const timeInMinutes = currentTime / 60;
  const currentWPM = gameStartTime
    ? Math.round(totalCharactersTyped / 5 / timeInMinutes)
    : 0;

  debugContent.innerHTML = `
        Current Word: ${words[currentWordIndex]} (${words[currentWordIndex]?.length || 0} chars)<br>
        Total Characters: ${totalCharactersTyped}<br>
        Standard Words (chars/5): ${(totalCharactersTyped / 5).toFixed(2)}<br>
        Time Elapsed: ${currentTime.toFixed(2)}s<br>
        Current WPM: ${currentWPM}<br>
        Words Typed: ${wordsTyped.length}<br>
        Timer Started: ${gameStartTime ? "Yes" : "No"}<br>
        Typing Started: ${hasStartedTyping ? "Yes" : "No"}
    `;
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
  updateDebugInfo();
}

// Listen for any input in the text field
document.getElementById("userInput").addEventListener("input", function (e) {
  // Start timer on first keystroke
  if (!hasStartedTyping && e.target.value.length > 0) {
    hasStartedTyping = true;
    gameStartTime = Date.now();
    console.log("Timer started on first keystroke");
  }
  checkInput(e);
});

function updateWordDisplay() {
  document.getElementById("wordToType").textContent = words[currentWordIndex];
  document.getElementById("nextWord").textContent = words[nextWordIndex];
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    startGame();
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
      "Hack <span style='color:#ff007c'>FAILED!</span> You need a snack,",
    );
  }
}

function totalTimeCount() {
  updateProgressBar();

  if (totalTimeSpent >= 30) {
    clearInterval(countDownInterval);
    clearInterval(totalTimeInterval);
    showGameOverModal(
      "Pentagon <span style='color:#c3e88d'>HACKED!</span> After all that hacking,",
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
    progressBar.style.backgroundColor = "#7aa2f7"; // Blue
  } else {
    progressBar.style.backgroundColor = "#ff007c"; // Red
  }

  document.getElementById("progressPercentage").textContent =
    "Hacked " + Math.floor(progressPercentage) + "%";
}

function checkInput(e) {
  const userInput = e.target.value;
  if (userInput === words[currentWordIndex]) {
    const charsAdded = words[currentWordIndex].length;
    console.log(
      `Word typed: "${words[currentWordIndex]}" - ${charsAdded} characters`,
    );

    totalCharactersTyped += charsAdded;
    totalTimeSpent += 1;
    timeLeft += 3;
    wordsTyped.push(words[currentWordIndex]);
    currentWordIndex = nextWordIndex;
    nextWordIndex = Math.floor(Math.random() * words.length);
    updateWordDisplay();
    document.getElementById("userInput").value = "";
    updateDebugInfo();
  }
}

// Update debug info every 100ms
setInterval(updateDebugInfo, 100);

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
  document.getElementById("gameOverModalLabel").textContent = "Game Over";
  document.querySelector(".modal-body").innerHTML =
    message +
    "<br />you have " +
    timeLeft +
    " energy left.<br />Your WPM: " +
    wpm +
    "<br>Score: " +
    `${timeLeft * 256}` +
    "<br />Try again by pressing <span style='color:#ff9e64'>Return</span>" +
    ".";

  saveResult(timeLeft, wpm);
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

function saveResult(timeLeft, wpm) {
  if (timeLeft === 0) {
    return;
  }
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];
  results.push({ timeLeft, wpm, date: new Date().toLocaleString("en-GB") });
  localStorage.setItem("gameResults", JSON.stringify(results));
}

function displayPreviousResults() {
  const resultsContainer = document.getElementById("previousResults");
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];
  results.reverse();
  resultsContainer.innerHTML = "";

  results.forEach((result) => {
    const resultItem = document.createElement("li");
    resultItem.textContent = `${result.date} Score: ${result.timeLeft * 256}, WPM: ${result.wpm}`;
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
