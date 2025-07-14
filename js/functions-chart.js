// Import storage manager
import storageManager from './storage-manager.js';

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
    storageManager.setItem(storageKey, isHidden.toString());
  });

  // Restore state on page load
  const isHidden = storageManager.getItem(storageKey, "false") === "true";
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

});

// Calculate the size of localStorage data in KB
function calculateLocalStorageSize() {
  let totalSize = 0;

  // Get the game results data
  const gameResults = storageManager.getItem("gameResults");
  if (gameResults) {
    totalSize += gameResults.length * 2; // Each character is 2 bytes in JavaScript
  }

  // Get achievements data size
  const achievementsData = storageManager.getItem("nerdtype_achievements");
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


// Display previous results in scoreboard (only show last 20)
function displayPreviousResults() {
  const resultsContainer = document.getElementById("previousResults");
  if (!resultsContainer) return;

  let results = JSON.parse(localStorage.getItem("gameResults")) || [];

  // Sort by timestamp (newest first) and take the first 15
  results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const displayResults = results.slice(0, 15);

  // Clear existing content
  resultsContainer.innerHTML = "";

  if (displayResults.length === 0) {
    resultsContainer.innerHTML = `
      <div class="text-center py-5 empty-state">
        <i class="fa-solid fa-chart-line empty-icon" style="font-size: 3rem; margin-bottom: 1rem;"></i>
        <p>Scoreboard's emptier than your social calendar</p>
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
    // Get actual total count from localStorage, fallback to results.length
    const totalGameCount = localStorage.getItem("totalGameCount");
    const actualTotal = totalGameCount ? parseInt(totalGameCount) : results.length;
    
    infoRow.innerHTML = `
      <td colspan="7" class="text-center py-3" style="color: #565f89; font-style: italic; border-top: 1px solid #3b4261;">
        Showing last 15 of ${actualTotal} total games | Storage used: ${storageSize} KB
      </td>
    `;
    tableBody.appendChild(infoRow);
  }
}
function displayHighestAchievements() {
  // Speed tier and accuracy rank sections have been removed
  // This function is kept for compatibility but does nothing
}

function getAchievementColor(achievement) {
  // Speed tier and accuracy rank color mapping removed
  // Function kept for compatibility
  return "text-secondary";
}

// Export the functions so they can be imported in other files
export {
  displayPreviousResults,
  displayHighestAchievements,
  getAchievementColor,
  setupToggle,
  setupScoreboardModalEnterKey,
  handleScoreboardKeyPress,
};

// Chart page initialization - let functions-classic.js handle scoreboard functionality
document.addEventListener("DOMContentLoaded", function () {
  // Chart-specific initialization code can go here if needed
  console.log("Chart page loaded - scoreboard handled by functions-classic.js");
});
