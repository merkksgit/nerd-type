let timeLeft = 10; // Aloitusaika sekunteina
let totalTimeSpent = 0;
let currentWordIndex = 0;
let countDownInterval;
let totalTimeInterval;
import { words } from "./words-fin.js";
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
    alert("Game Over");
    location.reload(); // Pelin uudelleenkäynnistys
  }
}

function totalTimeCount() {
  totalTimeSpent++;
  document.getElementById("totalTimeSpent").textContent =
    totalTimeSpent + " seconds";
}

function updateTimer() {
  document.getElementById("timeLeft").textContent = timeLeft + " sekuntia";
}

document.getElementById("userInput").addEventListener("input", checkInput);

function checkInput() {
  const userInput = document.getElementById("userInput").value;
  if (userInput === words[currentWordIndex]) {
    timeLeft += 3; // Lisää x sekuntia aikaa
    currentWordIndex = Math.floor(Math.random() * words.length); // Valitse uusi satunnainen sana
    document.getElementById("wordToType").textContent = words[currentWordIndex];
    document.getElementById("userInput").value = ""; // Tyhjennä syötekenttä
  }
}
