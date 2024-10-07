let timeLeft = 6; // Aloitusaika sekunteina
let totalTimeSpent = 0;
let currentWordIndex = 0;
let countDownInterval;
let totalTimeInterval;
import { words } from "./words-nm.js";
console.log(words);

const resetBtn = document.getElementById("resetBtn"); // Hae reset-painike

document.getElementById("startButton").addEventListener("click", startGame);

function startGame() {
  currentWordIndex = Math.floor(Math.random() * words.length); // Valitse satunnainen indeksi
  document.getElementById("wordToType").textContent = words[currentWordIndex];
  updateTimer();
  countDownInterval = setInterval(countDown, 1000);
  totalTimeInterval = setInterval(totalTimeCount, 1000);
  document.getElementById("userInput").focus();
}

// aloittaa pelin painamalla "Enter"
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    startGame();
  }
});

resetBtn.addEventListener("click", () => {
  location.reload(); // Lataa sivu uudelleen
});

function countDown() {
  if (timeLeft > 0) {
    timeLeft--;
    updateTimer();
  } else {
    clearInterval(countDownInterval);
    clearInterval(totalTimeInterval);

    // Display the total time spent in the modal
    document.getElementById("totalTimeSpentDisplay").textContent =
      totalTimeSpent;

    // Show the Bootstrap modal
    let gameOverModal = new bootstrap.Modal(
      document.getElementById("gameOverModal"),
    );
    gameOverModal.show();

    document.getElementById("restartGameBtn").addEventListener("click", () => {
      location.reload(); // Pelin uudelleenkäynnistys
    });

    // Add event listener for pressing "Enter" to restart the game
    document.addEventListener("keydown", function handleEnterKey(event) {
      if (event.key === "Enter") {
        location.reload(); // Restart the game by reloading the page
      }
    });
  }
}

function totalTimeCount() {
  totalTimeSpent++;
  document.getElementById("totalTimeSpent").textContent =
    totalTimeSpent + " seconds";
}

function updateTimer() {
  document.getElementById("timeLeft").textContent = timeLeft + " seconds";
}

document.getElementById("userInput").addEventListener("input", checkInput);

function checkInput() {
  const userInput = document.getElementById("userInput").value;
  if (userInput === words[currentWordIndex]) {
    timeLeft += 2; // Lisää x sekuntia aikaa
    currentWordIndex = Math.floor(Math.random() * words.length); // Valitse uusi satunnainen sana
    document.getElementById("wordToType").textContent = words[currentWordIndex];
    document.getElementById("userInput").value = ""; // Tyhjennä syötekenttä
  }
}
