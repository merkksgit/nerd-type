// Cursor Settings JavaScript Functions

// Initialize cursor settings on DOM load
document.addEventListener("DOMContentLoaded", function () {
  initCursorSettings();
});

function initCursorSettings() {
  // Load saved cursor preference
  const savedCursor = localStorage.getItem("nerdtype_cursor_color") || "orange";
  const cursorRadio = document.querySelector(
    `input[name="cursorTheme"][value="${savedCursor}"]`,
  );
  if (cursorRadio) {
    cursorRadio.checked = true;
  }

  // Apply current cursor
  applyCursorTheme(savedCursor);

  // Add event listeners to cursor radio buttons
  const cursorRadios = document.querySelectorAll('input[name="cursorTheme"]');
  cursorRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.checked) {
        const theme = this.value;
        applyCursorTheme(theme);
        // Save preference
        localStorage.setItem("nerdtype_cursor_color", theme);
      }
    });
  });
}

function applyCursorTheme(color) {
  // Remove existing cursor styles
  const existingStyle = document.getElementById("custom-cursor-style");
  if (existingStyle) {
    existingStyle.remove();
  }

  // Apply new cursor theme
  if (color !== "default") {
    const style = document.createElement("style");
    style.id = "custom-cursor-style";

    const cursorPaths = {
      orange: {
        default: "../images/nt-arrow-orange.png",
        pointer: "../images/nt-pointer-orange.png",
        text: "../images/nt-text-orange.png",
      },
      blue: {
        default: "../images/nt-arrow-blue.png",
        pointer: "../images/nt-pointer-blue.png",
        text: "../images/nt-text-blue.png",
      },
      green: {
        default: "../images/nt-arrow-green.png",
        pointer: "../images/nt-pointer-green.png",
        text: "../images/nt-text-green.png",
      },
      purple: {
        default: "../images/nt-arrow-purple.png",
        pointer: "../images/nt-pointer-purple.png",
        text: "../images/nt-text-purple.png",
      },
    };

    const cursors = cursorPaths[color];
    if (cursors) {
      style.textContent = `
        /* Default cursor (arrow) for the entire site */
        body {
          cursor: url("${cursors.default}") 0 0, auto !important;
        }
        
        /* Hand pointer cursor for all clickable elements */
        a, button, input[type="submit"], input[type="button"], .btn, .btn-primary,
        .btn-outline-primary, .btn-success, .btn-contact, .nav-link, .clickable,
        [role="button"], #returnToGameBtn, #restartGameBtn, #openTerminalBtn,
        #startButton, #clrResults, #confirmUsername, #game-command-modal-close,
        #confirmMobileWarning, #submitCustomScore, #resetBtn, #clearResultsBtn,
        #scoreboardCloseBtn, #toggleGraph, #toggleAchievements, #toggleScoreboard,
        #downloadDataBtn, #refreshScoresBtn, #modeFilter, .floating-settings-btn,
        .floating-scoreboard-btn, .floating-scoreboard-chart-btn, .floating-user-btn,
        .dropdown-item, .dropdown-toggle, #backToTop, #rating1, #rating2, #rating3, #rating4, #rating5,
        /* Settings Modal specific buttons and elements */
        #openSettingsBtn, #resetSettingsBtn, #applySettingsBtn, #closeSettingsBtn,
        #changeUsername, #viewScoreboardBtn, .settings-card, .cursor-theme-label,
        .form-check-label, .cursor-mini-img, .modal-header, .btn-secondary,
        /* Radio buttons and checkboxes */
        input[type="radio"] + label, input[type="checkbox"] + label,
        .form-check, .form-check-input, .zen-mode-element, .classic-mode-element {
          cursor: url("${cursors.pointer}") 6 0, pointer !important;
        }
        
        /* Text cursor for input fields */
        input[type="text"], input[type="email"], input[type="number"], textarea,
        #userInput, #customTime, #customAccuracy, #customWPM, .form-control,
        /* Settings Modal inputs */
        #settingsModal input[type="text"], #settingsModal input[type="number"],
        #settingsModal .form-control, #wordsGoal, #bonusEnergy, #initialEnergy,
        #zenWordGoal, #usernameInput {
          cursor: url("${cursors.text}") 0 0, text !important;
        }
      `;
    }

    document.head.appendChild(style);
  }
}

// Add to your existing applySettings function
function applyCursorSettings() {
  const selectedCursor = document.querySelector(
    'input[name="cursorTheme"]:checked',
  );
  if (selectedCursor) {
    const theme = selectedCursor.value;
    applyCursorTheme(theme);
    localStorage.setItem("nerdtype_cursor_color", theme);
  }
}
