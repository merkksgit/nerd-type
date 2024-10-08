let timeLeft = 10; // Aloitusaika sekunteina
let totalTimeSpent = 0;
let currentWordIndex = 0;
let countDownInterval;
let totalTimeInterval;
import { words } from "./words-sve.js";
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
    showGameOverModal("Hack FAILED! You need a snack,"); // Näytä eri viesti
  }
}

function totalTimeCount() {
  totalTimeSpent++;
  // poistetaan näytöltä kokonaisaika kommentoimalla tämä
  // document.getElementById("totalTimeSpent").textContent =
  //   totalTimeSpent + " seconds";

  updateProgressBar(); // Päivitä progress bar

  if (totalTimeSpent >= 60) {
    // Peli päättyy, kun kokonaisaika on 90 sekuntia
    clearInterval(countDownInterval);
    clearInterval(totalTimeInterval);
    showGameOverModal("Pentagon HACKED! All that work and still"); // Näytä eri viesti
  }
}

function updateTimer() {
  document.getElementById("timeLeft").textContent = timeLeft;
}

function updateProgressBar() {
  // Laske edistyminen prosentteina
  const progressPercentage = (totalTimeSpent / 60) * 100;

  // Päivitä progress barin leveys
  const progressBar = document.getElementById("progressBar");
  progressBar.style.width = progressPercentage + "%";
  progressBar.setAttribute("aria-valuenow", progressPercentage);

  // Change color dynamically based on the progress
  if (progressPercentage < 80) {
    progressBar.style.backgroundColor = "#7aa2f7"; // Blue
  } else {
    progressBar.style.backgroundColor = "#ff007c"; // Red
  }

  // Päivitä prosenttiluku
  document.getElementById("progressPercentage").textContent =
    "Hacked " + Math.floor(progressPercentage) + "%";
}

document.getElementById("userInput").addEventListener("input", checkInput);

function checkInput() {
  const userInput = document.getElementById("userInput").value;
  if (userInput === words[currentWordIndex]) {
    timeLeft += 3; // Lisää 3 sekuntia aikaa
    currentWordIndex = Math.floor(Math.random() * words.length); // Valitse uusi satunnainen sana
    document.getElementById("wordToType").textContent = words[currentWordIndex];
    document.getElementById("userInput").value = ""; // Tyhjennä syötekenttä
  }
}

// Funktio, joka näyttää oikean viestin pelin päättyessä
document.getElementById("totalTimeSpentDisplay").textContent = totalTimeSpent;
function showGameOverModal(message) {
  document.getElementById("gameOverModalLabel").textContent = "Game Over";
  document.querySelector(".modal-body").innerHTML =
    message +
    "<br />you have " +
    timeLeft +
    " energy left.<br />Try another hack by pressing 'Return'.";

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
