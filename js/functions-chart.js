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

// Maintain scoreboard state after page refresh
document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("scoreboardContainer");
  const button = document.getElementById("toggleScoreboard");
  const isHidden = localStorage.getItem("scoreboardHidden") === "true";
  if (isHidden) {
    container.classList.add("hidden");
    button.innerHTML = '<i class="fa-solid fa-trophy"></i> Show Scoreboard';
  }
  displayPreviousResults();
});

// Scoreboard (ScoreChart page)
function displayPreviousResults() {
  const resultsContainer = document.getElementById("previousResults");
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];
  results.reverse();
  resultsContainer.innerHTML = "";
  results.forEach((result) => {
    const resultItem = document.createElement("li");
    if (result.mode === "Zen Mode") {
      resultItem.textContent = `${result.date} | Zen Mode | Time: ${result.totalTime}, WPM: ${result.wpm || "N/A"}, Accuracy: ${result.accuracy || "N/A"}%`;
    } else {
      const score = result.timeLeft ? result.timeLeft * 256 : "N/A";
      resultItem.textContent = `${result.date} | Classic Mode | Score: ${score}, WPM: ${result.wpm}, Accuracy: ${result.accuracy || "N/A"}`;
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
    document
      .getElementById("clrResults")
      .addEventListener("click", function () {
        location.reload();
      });
  });
