let timeLeft = 10; // Aloitusaika sekunteina
let totalTimeSpent = 0;
let currentWordIndex = 0;
let nextWordIndex = 0;
let countDownInterval;
let totalTimeInterval;
import { words } from "./words-eng.js";
console.log(words);

const resetBtn = document.getElementById("resetBtn"); // Hae reset-painike

document.getElementById("startButton").addEventListener("click", startGame);

function startGame() {
  currentWordIndex = Math.floor(Math.random() * words.length); // Valitse satunnainen indeksi
  nextWordIndex = Math.floor(Math.random() * words.length);
  document.getElementById("wordToType").textContent = words[currentWordIndex];
  updateWordDisplay();
  updateTimer();
  countDownInterval = setInterval(countDown, 800);
  totalTimeInterval = setInterval(totalTimeCount, 1000);
  document.getElementById("userInput").focus();
}

function updateWordDisplay() {
  document.getElementById("wordToType").textContent = words[currentWordIndex];
  document.getElementById("nextWord").textContent = words[nextWordIndex];
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
    showGameOverModal(
      "Hack <span style='color:#ff007c'>FAILED!</span> You need a snack,",
    ); // Näytä eri viesti
  }
}

function totalTimeCount() {
  // totalTimeSpent++;
  // poistetaan näytöltä kokonaisaika kommentoimalla tämä
  // document.getElementById("totalTimeSpent").textContent =
  //   totalTimeSpent + " seconds";

  updateProgressBar(); // Päivitä progress bar

  if (totalTimeSpent >= 20) {
    // Peli päättyy, kun kokonaisaika on 90 sekuntia
    clearInterval(countDownInterval);
    clearInterval(totalTimeInterval);
    showGameOverModal(
      "Pentagon <span style='color:#c3e88d'>HACKED!</span> After all that hacking,",
    ); // Näytä eri viesti
  }
}

function updateTimer() {
  document.getElementById("timeLeft").textContent = timeLeft;
}

function updateProgressBar() {
  // Laske edistyminen prosentteina
  const progressPercentage = (totalTimeSpent / 20) * 100;

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
    totalTimeSpent += 1;
    timeLeft += 3; // Lisää 3 sekuntia aikaa
    currentWordIndex = nextWordIndex;
    nextWordIndex = Math.floor(Math.random() * words.length);
    updateWordDisplay();
    document.getElementById("userInput").value = "";
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
    " energy left.<br />Try again by pressing <span style='color:#ff9e64'>Return</span>" +
    ".";

  // tallenna tulos localStorageen
  saveResult(timeLeft);
  // näytä edelliset tulokset
  displayPreviousResults();

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

function saveResult(timeLeft) {
  if (timeLeft === 0) {
    return;
  }
  // Hae nykyiset tulokset localStoragesta
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];

  // Lisää uusi tulos
  results.push({ timeLeft, date: new Date().toLocaleString("en-GB") });

  // Tallenna takaisin localStorageen
  localStorage.setItem("gameResults", JSON.stringify(results));
}

function displayPreviousResults() {
  const resultsContainer = document.getElementById("previousResults");

  // Hae tulokset localStoragesta
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];

  results.reverse();

  // Tyhjennä aiemmat tulokset
  resultsContainer.innerHTML = "";

  // Lisää jokainen tulos näkyviin
  results.forEach((result) => {
    const resultItem = document.createElement("li");
    resultItem.textContent = `${result.date} Score: ${result.timeLeft * 256}`;
    resultsContainer.appendChild(resultItem);
  });
}

// Kutsutaan sivun latautuessa, jotta näytetään edelliset tulokset
document.addEventListener("DOMContentLoaded", displayPreviousResults);

document
  .getElementById("clearResultsBtn")
  .addEventListener("click", function () {
    // Clear results from localStorage
    localStorage.removeItem("gameResults");

    // Clear the displayed results from the page
    document.getElementById("previousResults").innerHTML = "";

    // Näytä mukautettu modaali
    const customAlertModal = new bootstrap.Modal(
      document.getElementById("customAlertModal"),
    );
    customAlertModal.show();
  });
