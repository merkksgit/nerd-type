// Scoreboard (ScoreChart page)
function displayPreviousResults() {
  const resultsContainer = document.getElementById("previousResults");
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];
  results.reverse();
  resultsContainer.innerHTML = "";

  results.forEach((result) => {
    const resultItem = document.createElement("li");
    if (result.mode === "Zen Mode") {
      resultItem.textContent = `${result.date} | Zen Mode | Time: ${result.totalTime}, WPM: ${result.wpm || "N/A"}`;
    } else {
      const score = result.timeLeft ? result.timeLeft * 256 : "N/A";
      resultItem.textContent = `${result.date} | Classic Mode | Score: ${score}, WPM: ${result.wpm}`;
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
