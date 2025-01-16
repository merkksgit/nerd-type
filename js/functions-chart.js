// Toggle functionality for all sections
function setupToggle(
  buttonId,
  containerId,
  storageKey,
  showText,
  hideText,
  showIcon,
  hideIcon,
) {
  const button = document.getElementById(buttonId);
  const container = document.getElementById(containerId);

  button.addEventListener("click", function () {
    container.classList.toggle("hidden");
    const isHidden = container.classList.contains("hidden");
    button.innerHTML = isHidden
      ? `<i class="${showIcon}"></i> ${showText}`
      : `<i class="${hideIcon}"></i> ${hideText}`;
    localStorage.setItem(storageKey, isHidden);
  });

  // Restore state on page load
  const isHidden = localStorage.getItem(storageKey) === "true";
  if (isHidden) {
    container.classList.add("hidden");
    button.innerHTML = `<i class="${showIcon}"></i> ${showText}`;
  }
}

// Initialize all functionality when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Setup toggles for each section with different icons
  setupToggle(
    "toggleScoreboard",
    "scoreboardContainer",
    "scoreboardHidden",
    "Show Scoreboard",
    "Hide Scoreboard",
    "fa-solid fa-trophy", // Show icon for scoreboard
    "fa-solid fa-trophy", // Hide icon for scoreboard
  );

  setupToggle(
    "toggleAchievements",
    "achievementsContainer",
    "achievementsHidden",
    "Show Achievements",
    "Hide Achievements",
    "fa-solid fa-medal", // Show icon for achievements
    "fa-solid fa-medal", // Hide icon for achievements
  );

  setupToggle(
    "toggleGraph",
    "graphContainer",
    "graphHidden",
    "Show Graph",
    "Hide Graph",
    "fa-solid fa-chart-simple", // Show icon for graph
    "fa-solid fa-chart-simple", // Hide icon for graph
  );

  // Display initial data
  displayPreviousResults();
  displayHighestAchievements();

  // Setup clear results button
  document
    .getElementById("clearResultsBtn")
    .addEventListener("click", function () {
      localStorage.removeItem("gameResults");
      localStorage.removeItem("highestAchievements");
      document.getElementById("previousResults").innerHTML = "";
      displayHighestAchievements();
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
});

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
    speedTierElement.className = "";
    if (highestAchievements.speedTier) {
      speedTierElement.classList.add(
        getAchievementColor(highestAchievements.speedTier),
      );
    }
  }

  if (accuracyRankElement) {
    accuracyRankElement.textContent = highestAchievements.accuracyRank || "-";
    accuracyRankElement.className = "";
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
