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

    // Setup Enter key handler
    setupScoreboardModalEnterKey();

    // Clean up when modal is hidden
    document.getElementById("scoreboardModal").addEventListener(
      "hidden.bs.modal",
      function () {
        const backdrops = document.querySelectorAll(".modal-backdrop");
        backdrops.forEach((backdrop) => {
          backdrop.remove();
        });

        document.body.classList.remove("modal-open");
        document.body.removeAttribute("style");
      },
      { once: true },
    );
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

// Calculate the size of localStorage data in KB
function calculateLocalStorageSize() {
  let totalSize = 0;

  // Get the game results data
  const gameResults = localStorage.getItem("gameResults");
  if (gameResults) {
    totalSize += gameResults.length * 2; // Each character is 2 bytes in JavaScript
  }

  // Get achievements data size
  const achievementsData = localStorage.getItem("nerdtype_achievements");
  if (achievementsData) {
    totalSize += achievementsData.length * 2;
  }

  // Convert to KB
  return (totalSize / 1024).toFixed(2);
}

function setupScoreboardModalEnterKey() {
  const scoreboardModal = document.getElementById("scoreboardModal");

  if (scoreboardModal) {
    // Remove any existing listener
    scoreboardModal.removeEventListener("keydown", handleScoreboardKeyPress);

    // Add the event listener directly to the scoreboard modal
    scoreboardModal.addEventListener("keydown", handleScoreboardKeyPress);
  }
}

// Handler for enter key in scoreboard modal
function handleScoreboardKeyPress(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation();

    const scoreboardModal = bootstrap.Modal.getInstance(
      document.getElementById("scoreboardModal"),
    );
    if (scoreboardModal) {
      scoreboardModal.hide();
    }
  }
}

function handleClearResults() {
  localStorage.removeItem("gameResults");
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

    // Create a single handler for both Enter key and close button
    const handleModalClose = () => {
      modal.hide();
      // Wait for modal to fully hide before reloading
      customAlertModal.addEventListener(
        "hidden.bs.modal",
        function () {
          location.reload();
        },
        { once: true },
      );
    };

    const clrResultsButton = document.getElementById("clrResults");
    if (clrResultsButton) {
      clrResultsButton.replaceWith(clrResultsButton.cloneNode(true));
      const newClrResultsButton = document.getElementById("clrResults");
      newClrResultsButton.addEventListener("click", handleModalClose);
    }

    // Set up Enter key handler for this specific modal
    const keydownHandler = (event) => {
      if (
        event.key === "Enter" &&
        customAlertModal.classList.contains("show")
      ) {
        event.preventDefault();
        event.stopPropagation();
        handleModalClose();
      }
    };

    modal.show();

    customAlertModal.addEventListener("shown.bs.modal", function onShown() {
      document.addEventListener("keydown", keydownHandler, { capture: true });

      customAlertModal.removeEventListener("shown.bs.modal", onShown);
    });

    // Start typing animation after modal is shown
    setTimeout(typeNextLine, 300);

    // Clean up event listener when modal is hidden
    customAlertModal.addEventListener(
      "hidden.bs.modal",
      function cleanupHandler() {
        document.removeEventListener("keydown", keydownHandler, {
          capture: true,
        });
        customAlertModal.removeEventListener("hidden.bs.modal", cleanupHandler);
      },
    );
  }
}

function displayPreviousResults() {
  const resultsContainer = document.getElementById("previousResults");
  if (!resultsContainer) return;

  let results = JSON.parse(localStorage.getItem("gameResults")) || [];

  // Keep all results in localStorage but only display the last 20
  const displayResults = results.slice(-15).reverse();
  resultsContainer.innerHTML = "";

  displayResults.forEach((result) => {
    const resultItem = document.createElement("li");
    const wordListName = result.wordList
      ? wordListDisplayNames[result.wordList] || result.wordList
      : "";
    const wordListInfo = wordListName ? `  ${wordListName}` : "";

    if (result.mode === "Zen Mode") {
      const wordGoalInfo = result.wordGoal ? ` [${result.wordGoal}]` : "";

      resultItem.textContent = `${result.date} | ${result.username || "runner"} | ${result.mode}${wordGoalInfo}${wordListInfo} | Time: ${result.totalTime}, WPM: ${result.wpm || "N/A"}, Accuracy: ${result.accuracy || "N/A"}`;
    } else {
      resultItem.textContent = `${result.date} | ${result.username || "runner"} | ${result.mode}${wordListInfo} | Score: ${result.score || result.timeLeft * 256}, WPM: ${result.wpm}, Accuracy: ${result.accuracy || "N/A"}`;
    }
    resultsContainer.appendChild(resultItem);
  });

  // Add storage info if there are more than 20 results
  if (results.length > 15) {
    const storageSize = calculateLocalStorageSize();
    const infoItem = document.createElement("li");
    infoItem.innerHTML = `... (Showing last 15 of ${results.length} total games | Storage used: ${storageSize} KB)`;
    infoItem.style.color = "#565f89";
    infoItem.style.fontStyle = "italic";
    resultsContainer.appendChild(infoItem);
  }
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
  handleClearResults,
  setupScoreboardModalEnterKey,
  handleScoreboardKeyPress,
};
