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
  countDownInterval = setInterval(countDown, 800);
  totalTimeInterval = setInterval(totalTimeCount, 1000);
  document.getElementById("userInput").focus();
}

// Aloita peli painamalla "Enter"
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
    // Peli päättyy, kun timeLeft menee nollaan
    clearInterval(countDownInterval);
    clearInterval(totalTimeInterval);
    showGameOverModal("You need a snack,"); // Näytä eri viesti
  }
}

function totalTimeCount() {
  totalTimeSpent++;
  document.getElementById("totalTimeSpent").textContent =
    totalTimeSpent + " seconds";

  if (totalTimeSpent >= 90) {
    // Peli päättyy, kun kokonaisaika on x sekuntia
    clearInterval(countDownInterval);
    clearInterval(totalTimeInterval);
    showGameOverModal("Wau! You just hacked the Pentagon!"); // Näytä eri viesti
  }
}

function updateTimer() {
  document.getElementById("timeLeft").textContent = timeLeft;
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

// Funktio, joka näyttää oikean viestin pelin päättyessä
function showGameOverModal(message) {
  // Päivitä modalissa näytettävä viesti pelin syystä
  document.getElementById("totalTimeSpentDisplay").textContent = totalTimeSpent;

  document.getElementById("gameOverModalLabel").textContent = "Game Over";
  document.querySelector(".modal-body").innerHTML =
    message +
    "<br />You have " +
    timeLeft +
    " energy left.<br />Well played nerd!";

  // Näytä Bootstrap-modaali
  let gameOverModal = new bootstrap.Modal(
    document.getElementById("gameOverModal"),
  );
  gameOverModal.show();

  document.getElementById("restartGameBtn").addEventListener("click", () => {
    location.reload(); // Pelin uudelleenkäynnistys
  });

  // Lisää event listener Enterin painamiselle
  document.addEventListener("keydown", function handleEnterKey(event) {
    if (event.key === "Enter") {
      location.reload(); // Käynnistä peli uudelleen lataamalla sivu
    }
  });
}
