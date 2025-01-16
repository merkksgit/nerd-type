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
      resultItem.textContent = `${result.date} | ${result.username || "runner"} | Zen Mode | Time: ${result.totalTime}, WPM: ${result.wpm || "N/A"}, Accuracy: ${result.accuracy || "N/A"}%`;
    } else {
      const score = result.timeLeft ? result.timeLeft * 256 : "N/A";
      resultItem.textContent = `${result.date} | ${result.username || "runner"} | Classic Mode | Score: ${score}, WPM: ${result.wpm}, Accuracy: ${result.accuracy || "N/A"}`;
    }
    resultsContainer.appendChild(resultItem);
  });
}

document.addEventListener("DOMContentLoaded", displayPreviousResults);

document
  .getElementById("clearResultsBtn")
  .addEventListener("click", function () {
    localStorage.removeItem("gameResults");
    localStorage.removeItem("highestAchievements");
    document.getElementById("previousResults").innerHTML = "";
    displayHighestAchievements(); // Reset achievements display
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

function displayHighestAchievements() {
  const highestAchievements = JSON.parse(
    localStorage.getItem("highestAchievements"),
  ) || {
    speedTier: "",
    accuracyRank: "",
  };

  const speedTierElement = document.getElementById("highestSpeedTier");
  const accuracyRankElement = document.getElementById("highestAccuracyRank");

  if (speedTierElement) {
    speedTierElement.textContent = highestAchievements.speedTier || "-";
    speedTierElement.className = ""; // Remove any previous color classes
    if (highestAchievements.speedTier) {
      speedTierElement.classList.add(
        getAchievementColor(highestAchievements.speedTier),
      );
    }
  }

  if (accuracyRankElement) {
    accuracyRankElement.textContent = highestAchievements.accuracyRank || "-";
    accuracyRankElement.className = ""; // Remove any previous color classes
    if (highestAchievements.accuracyRank) {
      accuracyRankElement.classList.add(
        getAchievementColor(highestAchievements.accuracyRank),
      );
    }
  }
}

function getAchievementColor(achievement) {
  const colorMap = {
    "QUANTUM SPEED": "achievement-quantum-speed",
    "NEURAL MASTER": "achievement-neural-master",
    "CYBER ADEPT": "achievement-cyber-adept",
    "DIGITAL RUNNER": "achievement-digital-runner",
    INITIATING: "achievement-initiating",
    "PERFECT SYNC": "achievement-perfect-sync",
    "CYBER EFFICIENT": "achievement-cyber-efficient",
    "DIGITAL PRECISE": "achievement-digital-precise",
    "SYSTEM UNSTABLE": "achievement-system-unstable",
    "NEURAL INTERFERENCE": "achievement-neural-interference",
    "SYSTEM FAILURE": "achievement-system-failure",
  };
  return colorMap[achievement] || "text-secondary";
}

// Call this function when the page loads
document.addEventListener("DOMContentLoaded", displayHighestAchievements);
