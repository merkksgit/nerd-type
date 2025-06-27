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

  updateDataCollectionIndicator();
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

// Display previous results in scoreboard (only show last 20)
function displayPreviousResults() {
  const resultsContainer = document.getElementById("previousResults");
  if (!resultsContainer) return;

  let results = JSON.parse(localStorage.getItem("gameResults")) || [];

  // Keep all results in localStorage but only display the last 15
  const displayResults = results.slice(-15).reverse();

  // Clear existing content
  resultsContainer.innerHTML = "";

  if (displayResults.length === 0) {
    resultsContainer.innerHTML = `
      <div class="text-center py-5 empty-state">
        <i class="fa-solid fa-chart-line empty-icon" style="font-size: 3rem; margin-bottom: 1rem;"></i>
        <p>Play some games nerd.</p>
      </div>
    `;
    return;
  }

  // Create table structure
  const tableHTML = `
    <div class="table-responsive">
      <table class="table table-dark table-hover mb-0">
        <thead>
          <tr>
            <th scope="col">Player</th>
            <th scope="col" class="text-center">Score/Time</th>
            <th scope="col" class="text-center">WPM</th>
            <th scope="col" class="text-center">Accuracy</th>
            <th scope="col" class="text-center d-none d-md-table-cell">Mode</th>
            <th scope="col" class="text-center d-none d-lg-table-cell">Language</th>
            <th scope="col" class="text-center d-none d-lg-table-cell">Date</th>
          </tr>
        </thead>
        <tbody id="scoresTableBody">
        </tbody>
      </table>
    </div>
  `;

  resultsContainer.innerHTML = tableHTML;
  const tableBody = document.getElementById("scoresTableBody");

  displayResults.forEach((result, index) => {
    const row = document.createElement("tr");

    // Apply special styling for top 3 results
    if (index === 0) {
      row.classList.add("champion");
    } else if (index <= 2) {
      row.classList.add("top-performer");
    }

    // Handle score/time display - different for Zen vs Classic mode
    let scoreOrTimeDisplay;
    let scoreOrTimeValue;

    if (result.mode === "Zen Mode") {
      // Zen mode shows session time
      scoreOrTimeValue = result.totalTime || "0:00";
      scoreOrTimeDisplay = `
        <span class="time-badge" style="background: linear-gradient(135deg, #c3e88d, #7dcfff); color: #1a1b26; font-weight: bold; font-size: 1rem; padding: 6px 12px; border-radius: 4px; text-shadow: none;">
          ${scoreOrTimeValue}
        </span>
      `;
    } else {
      // Classic mode shows score
      scoreOrTimeValue = result.score || result.timeLeft * 256 || 0;
      scoreOrTimeDisplay = `
        <span class="score-badge" style="background: linear-gradient(135deg, #7aa2f7, #bb9af7); color: #1a1b26; font-weight: bold; font-size: 1rem; padding: 6px 12px; border-radius: 4px; text-shadow: none;">
          ${scoreOrTimeValue}
        </span>
      `;
    }

    // Use the actual stored values directly - handle both string and number formats
    const wpm = result.wpm || 0;

    // Handle accuracy - it might be stored as "85%" string or as number 85
    let accuracy = 0;
    if (result.accuracy !== undefined && result.accuracy !== null) {
      if (typeof result.accuracy === "string") {
        // If it's a string like "85%", remove the % and parse
        accuracy = parseFloat(result.accuracy.replace("%", "")) || 0;
      } else {
        // If it's already a number
        accuracy = parseFloat(result.accuracy) || 0;
      }
    }

    // Format language display - use full names instead of flags
    const languageMap = {
      english: "English",
      finnish: "Finnish",
      swedish: "Swedish",
      programming: "Programming",
      nightmare: "Nightmare",
    };

    const languageDisplay = result.wordList
      ? languageMap[result.wordList] || result.wordList
      : "English";

    // Format mode display
    let modeDisplay = result.mode || "Classic Mode";
    if (result.mode === "Zen Mode" && result.wordGoal) {
      modeDisplay = `Zen [${result.wordGoal}]`;
    }

    // Format date
    const dateDisplay = result.date || "Unknown";

    // Get username - fallback to "runner" if not set
    const username = result.username || "runner";

    row.innerHTML = `
      <td class="username-cell" style="color: #c3e88d; font-weight: bold;">
        ${username}
      </td>
      <td class="text-center">
        ${scoreOrTimeDisplay}
      </td>
      <td class="text-center wpm-cell" style="color: #7dcfff; font-weight: bold;">
        ${Math.round(wpm)}
      </td>
      <td class="text-center accuracy-cell" style="color: #c3e88d; font-weight: bold;">
        ${accuracy.toFixed(1)}%
      </td>
      <td class="text-center mode-cell d-none d-md-table-cell" style="color: #bb9af7;">
        ${modeDisplay}
      </td>
      <td class="text-center d-none d-lg-table-cell" style="color: #c0caf5;">
        ${languageDisplay}
      </td>
      <td class="text-center meta-cell d-none d-lg-table-cell" style="color: #565f89; font-size: 0.85rem;">
        ${dateDisplay}
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Add storage info if there are more than 15 results (matching original logic)
  if (results.length > 15) {
    const storageSize = calculateLocalStorageSize();
    const infoRow = document.createElement("tr");
    infoRow.innerHTML = `
      <td colspan="7" class="text-center py-3" style="color: #565f89; font-style: italic; border-top: 2px solid #3b4261;">
        Showing last 15 of ${results.length} total games | Storage used: ${storageSize} KB
      </td>
    `;
    tableBody.appendChild(infoRow);
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

// Add global keybind for toggling scoreboard modal with Ctrl+I
function setupScoreboardKeybind() {
  document.addEventListener("keydown", function (event) {
    // Check for Ctrl+I (or Cmd+I on Mac)
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i") {
      event.preventDefault(); // Prevent browser default behavior

      // Check if we're in an input field to avoid interference
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.contentEditable === "true")
      ) {
        return; // Don't toggle if user is typing in an input field
      }

      // Check if scoreboard modal is currently open
      const scoreboardModal = document.getElementById("scoreboardModal");
      const isScoreboardOpen =
        scoreboardModal && scoreboardModal.classList.contains("show");

      if (isScoreboardOpen) {
        // Close the scoreboard modal
        closeScoreboardModal();
      } else {
        // Check if any other modal is currently open
        const otherOpenModals = document.querySelectorAll(
          ".modal.show:not(#scoreboardModal)",
        );
        if (otherOpenModals.length > 0) {
          return; // Don't open if another modal is already open
        }

        // Open the scoreboard modal
        openScoreboardModal();
      }
    }
  });
}

// Function to open scoreboard modal
function openScoreboardModal() {
  // Update the scoreboard contents before showing
  if (typeof displayPreviousResults === "function") {
    displayPreviousResults();
  }

  // Show the modal
  const scoreboardModal = new bootstrap.Modal(
    document.getElementById("scoreboardModal"),
  );
  scoreboardModal.show();

  // Setup Enter key handler for closing
  setupScoreboardModalEnterKey();

  // Clean up when modal is hidden
  document.getElementById("scoreboardModal").addEventListener(
    "hidden.bs.modal",
    function () {
      // Remove any leftover backdrops
      const backdrops = document.querySelectorAll(".modal-backdrop");
      backdrops.forEach((backdrop) => {
        backdrop.remove();
      });

      document.body.classList.remove("modal-open");
      document.body.removeAttribute("style");
    },
    { once: true },
  );
}

// Function to close scoreboard modal
function closeScoreboardModal() {
  const scoreboardModalElement = document.getElementById("scoreboardModal");
  const scoreboardModal = bootstrap.Modal.getInstance(scoreboardModalElement);

  if (scoreboardModal) {
    scoreboardModal.hide();
  }
}

// Initialize the keybind when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  setupScoreboardKeybind();

  // Also update existing button click handlers to use the new function
  const scoreboardBtn = document.getElementById("viewScoreboardBtn");
  if (scoreboardBtn) {
    // Remove existing event listeners and add new one
    scoreboardBtn.replaceWith(scoreboardBtn.cloneNode(true));
    document
      .getElementById("viewScoreboardBtn")
      .addEventListener("click", openScoreboardModal);
  }

  const scoreboardChartBtn = document.getElementById("viewScoreboardChartBtn");
  if (scoreboardChartBtn) {
    // Remove existing event listeners and add new one
    scoreboardChartBtn.replaceWith(scoreboardChartBtn.cloneNode(true));
    document
      .getElementById("viewScoreboardChartBtn")
      .addEventListener("click", openScoreboardModal);
  }
});
