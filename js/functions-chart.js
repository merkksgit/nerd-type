const wordListDisplayNames = {
  english: "🇬🇧 ",
  finnish: "🇫🇮 ",
  swedish: "🇸🇪 ",
  programming: "🖥️ ",
  nightmare: "💀 ",
};

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

  if (!button || !container) return;

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

document
  .getElementById("viewScoreboardChartBtn")
  .addEventListener("click", function () {
    // Update the scoreboard contents before showing
    displayPreviousResults();

    // Then show the modal
    const scoreboardModal = new bootstrap.Modal(
      document.getElementById("scoreboardModal"),
    );
    scoreboardModal.show();
  });

// Initialize all functionality when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Setup toggles for each section with different icons
  setupToggle(
    "toggleScoreboard",
    "scoreboardContainer",
    "scoreboardHidden",
    "Show Scoreboard",
    "Hide Scoreboard",
    "fa-solid fa-trophy",
    "fa-solid fa-trophy",
  );

  setupToggle(
    "toggleAchievements",
    "achievementsContainer",
    "achievementsHidden",
    "Show Achievements",
    "Hide Achievements",
    "fa-solid fa-medal",
    "fa-solid fa-medal",
  );

  setupToggle(
    "toggleGraph",
    "graphContainer",
    "graphHidden",
    "Show Graph",
    "Hide Graph",
    "fa-solid fa-chart-simple",
    "fa-solid fa-chart-simple",
  );

  // Display initial data
  displayPreviousResults();
  displayHighestAchievements();

  // Setup clear results button with new animation
  const clearResultsBtn = document.getElementById("clearResultsBtn");
  if (clearResultsBtn) {
    clearResultsBtn.addEventListener("click", handleClearResults);
  }
});

// For the clear results modal, add enter key support
function setupClearResultsModal() {
  const customAlertModal = document.getElementById("customAlertModal");
  const clearResultsButton = document.getElementById("clrResults");

  if (customAlertModal && clearResultsButton) {
    // Remove previous event listeners if they exist
    customAlertModal.removeEventListener("keydown", handleClearResultsKeyPress);

    // Add keydown event listener to the modal
    customAlertModal.addEventListener("keydown", handleClearResultsKeyPress);
  }
}

// Handler for enter key in clear results modal
function handleClearResultsKeyPress(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation();

    // Trigger the clear results button
    const clearResultsButton = document.getElementById("clrResults");
    if (clearResultsButton) {
      clearResultsButton.click();
    }
  }
}

function handleClearResults() {
  localStorage.removeItem("gameResults");
  // localStorage.removeItem("highestAchievements");
  document.getElementById("previousResults").innerHTML = "";
  displayHighestAchievements();

  const customAlertModal = document.getElementById("customAlertModal");
  if (customAlertModal) {
    const modal = new bootstrap.Modal(customAlertModal);
    const modalBody = customAlertModal.querySelector(".modal-body");
    const modalHeader = customAlertModal.querySelector(".modal-title");

    // Get username from localStorage or use default
    const playerUsername =
      localStorage.getItem("nerdtype_username") || "runner";

    // Set up terminal-style header
    modalHeader.textContent = `[${playerUsername}@PENTAGON-CORE:/user.data/]$`;

    const terminalLines = [
      "> INITIALIZING DELETION SEQUENCE...",
      "> ACCESSING SCOREBOARD DATABASE...",
      "> PREPARING DATA PURGE...",
      "> ================================",
      "> EXECUTING COMMANDS:",
      "  └─ rm scoreboard.data",
      `  └─ PURGE STATUS: <span style='color:#c3e88d'>SUCCESSFUL</span>`,
      "> ================================",
      "> LOCAL STORAGE CLEARED_",
      "> PRESS [ENTER] OR [CLOSE] TO CONFIRM",
      "> END OF TRANSMISSION_",
    ];

    let currentLine = 0;
    let modalContent = "";

    modalBody.innerHTML = '<pre class="terminal-output"></pre>';

    function typeNextLine() {
      if (currentLine < terminalLines.length) {
        modalContent += terminalLines[currentLine] + "\n";
        modalBody.querySelector(".terminal-output").innerHTML = modalContent;
        currentLine++;
        setTimeout(typeNextLine, 150);
      }
    }

    modal.show();
    typeNextLine();

    // Set up the event listeners for the modal
    setupClearResultsModal();

    document
      .getElementById("clrResults")
      .addEventListener("click", function () {
        location.reload();
      });
  }
}

function displayPreviousResults() {
  const resultsContainer = document.getElementById("previousResults");
  if (!resultsContainer) return;

  let results = JSON.parse(localStorage.getItem("gameResults")) || [];
  results.reverse();
  resultsContainer.innerHTML = "";

  results.forEach((result) => {
    const resultItem = document.createElement("li");

    const wordListName = result.wordList
      ? wordListDisplayNames[result.wordList] || result.wordList
      : "";
    const wordListInfo = wordListName ? `  ${wordListName}` : "";

    if (result.mode === "Zen Mode") {
      resultItem.textContent = `${result.date} | ${result.username || "runner"} | ${result.mode}${wordListInfo} | Time: ${result.totalTime}, WPM: ${result.wpm || "N/A"}, Accuracy: ${result.accuracy || "N/A"}%`;
    } else {
      resultItem.textContent = `${result.date} | ${result.username || "runner"} | ${result.mode}${wordListInfo} | Score: ${result.score || result.timeLeft * 256}, WPM: ${result.wpm}, Accuracy: ${result.accuracy || "N/A"}`;
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

// Export the functions so they can be imported in other files
export {
  displayPreviousResults,
  displayHighestAchievements,
  getAchievementColor,
  setupToggle,
  setupClearResultsModal,
  handleClearResults,
  handleClearResultsKeyPress,
};
