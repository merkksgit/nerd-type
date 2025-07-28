document.addEventListener("DOMContentLoaded", function () {
  updateUsernameButtonDisplay();

  // Authentication state change handler with proper timing
  if (window.firebaseModules) {
    const { onAuthStateChanged } = window.firebaseModules;
    if (window.auth) {
      let isInitialLoad = true;
      let authProcessing = false;

      onAuthStateChanged(window.auth, (user) => {
        console.log(
          "🔄 Auth state changed:",
          user ? "logged in" : "logged out",
        );

        // Don't reload on initial page load
        if (isInitialLoad) {
          isInitialLoad = false;
          updateUsernameButtonDisplay();
          updateScoreboardDisplay();
          return;
        }

        // Don't trigger reload if we're already processing auth
        if (authProcessing) {
          console.log("⏳ Auth processing already in progress, skipping...");
          return;
        }

        // Handle login/logout with strategic reload
        if (user) {
          handleLoginWithDelayedReload(user);
        } else {
          handleLogout();
        }
      });
    }
  }
});

// Mark auth as processing and handle login with delayed reload
async function handleLoginWithDelayedReload(user) {
  try {
    window.authProcessing = true;

    // Try to get stored username from database, fallback to email username
    let username;
    try {
      const storedUsername = await window.getUserStoredUsername(user.uid);
      username = storedUsername || user.email.split("@")[0];
    } catch (error) {
      console.warn(
        "Failed to retrieve stored username, using email fallback:",
        error,
      );
      username = user.email.split("@")[0];
    }

    console.log("✅ Login successful for:", username);

    // Update localStorage immediately
    localStorage.setItem("nerdtype_username", username);

    // Quick UI update
    updateUsernameButtonDisplay();

    // Show success message WITHOUT OK button
    if (window.siteModal) {
      showLoginSuccessModal(username);
    } else {
      console.log(`Welcome back, ${username}!`);
    }

    // Wait longer to ensure Firebase auth is fully processed
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (error) {
    console.error("❌ Error in login handler:", error);
    window.authProcessing = false;
  }
}

// Login success modal without OK button
function showLoginSuccessModal(username) {
  const alertModal = document.getElementById("customAlertModal");
  if (!alertModal) return;

  const modal = new bootstrap.Modal(alertModal);

  // Set title and message
  document.getElementById("alertModalTitle").innerHTML =
    `<img src="../images/logo-text-no-keyboard.png" alt="Success" style="width: 300px; vertical-align: middle;">`;
  document.getElementById("alertModalMessage").innerHTML = `
        <div class="text-center">
          <p class="mb-3">Welcome to ${typeof APP_VERSION !== "undefined" ? APP_VERSION : "NerdType"}, <span style="color: #ff9e64"><strong>${username}</strong></span>!</p>
        </div>`;

  // Hide the OK button for this specific modal
  const okButton = document.getElementById("alertOkBtn");
  if (okButton) {
    okButton.style.display = "none";
  }

  // Hide the modal footer entirely to remove the button area
  const modalFooter = alertModal.querySelector(".modal-footer");
  if (modalFooter) {
    modalFooter.style.display = "none";
  }

  // Show the modal
  modal.show();

  setTimeout(() => {
    modal.hide();
    if (okButton) {
      okButton.style.display = "";
    }
    if (modalFooter) {
      modalFooter.style.display = "";
    }
  }, 2000); // Hide after 2 seconds
}

// Handle logout with goodbye message (no reload) - Fixed function name
async function handleLogout() {
  try {
    window.authProcessing = true;

    // Get username before clearing it
    const currentUser = window.getCurrentUser();
    const storedUsername = localStorage.getItem("nerdtype_username");

    // Clear username from localStorage
    localStorage.removeItem("nerdtype_username");
    localStorage.removeItem("nerdtype_guest_mode");

    // Quick UI update
    updateUsernameButtonDisplay();
    updateScoreboardDisplay();

    // Show goodbye message if we have a username and siteModal is available
    if (storedUsername && window.siteModal) {
      window.siteModal.showLogoutSuccessModal(storedUsername);
    }

    // Reset auth processing flag after showing goodbye message
    setTimeout(() => {
      window.authProcessing = false;
    }, 2000);
  } catch (error) {
    console.error("❌ Error in logout handler:", error);
    window.authProcessing = false;
  }
}

function updateUsernameButtonDisplay() {
  const changeUsernameBtn = document.getElementById("changeUsername");
  const usernameDisplay = document.getElementById("usernameDisplay");

  if (!changeUsernameBtn || !usernameDisplay) return;

  // Add no-movement class to prevent any transform effects
  changeUsernameBtn.classList.add("no-movement");

  // Reset any existing styles that might cause movement
  changeUsernameBtn.style.transform = "none";
  changeUsernameBtn.style.transition = "none";

  const currentUser = window.getCurrentUser();
  const isGuest = localStorage.getItem("nerdtype_guest_mode") === "true";

  // Dispose of existing tooltip if it exists
  if (changeUsernameBtn._tooltip) {
    changeUsernameBtn._tooltip.dispose();
  }

  if (currentUser) {
    // User is authenticated - show username with logout icon
    const storedUsername =
      localStorage.getItem("nerdtype_username") ||
      currentUser.email.split("@")[0];

    // Use logout icon when user is logged in
    changeUsernameBtn.innerHTML = `
      <i class="fa-solid fa-user"></i>
      <span id="usernameDisplay">${storedUsername}</span>
    `;

    // Add click handler for direct logout using custom modal
    changeUsernameBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (changeUsernameBtn._tooltip) {
        changeUsernameBtn._tooltip.hide();
      }

      // Use custom modal instead of browser confirm
      if (window.siteModal) {
        const confirmed = await window.siteModal.confirmLogout(storedUsername);
        if (confirmed) {
          window.logoutAndRedirect();
        }
      } else {
        // Fallback to browser confirm if custom modal not available
        if (confirm(`Logout from ${storedUsername}?`)) {
          window.logoutAndRedirect();
        }
      }
    };

    // Set tooltip for authenticated user
    changeUsernameBtn.setAttribute("data-bs-toggle", "tooltip");
    changeUsernameBtn.setAttribute("data-bs-placement", "top");
    changeUsernameBtn.setAttribute("data-bs-custom-class", "auth-tooltip");
    changeUsernameBtn.setAttribute("title", `Logout from ${storedUsername}`);
  } else if (isGuest) {
    // Guest mode - show with login icon to indicate they can login
    changeUsernameBtn.innerHTML = `
      <i class="fa-solid fa-sign-in-alt"></i>
      <span id="usernameDisplay">runner</span>
    `;

    // Add click handler to show login
    changeUsernameBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.showLoginModal();
    };

    if (changeUsernameBtn._tooltip) {
      changeUsernameBtn._tooltip.hide();
    }

    // Set tooltip for guest user
    changeUsernameBtn.setAttribute("data-bs-toggle", "tooltip");
    changeUsernameBtn.setAttribute("data-bs-placement", "top");
    changeUsernameBtn.setAttribute("data-bs-custom-class", "guest-tooltip");
    changeUsernameBtn.setAttribute("title", "Click to login or register");
  } else {
    // Not authenticated and not guest - show with login icon
    changeUsernameBtn.innerHTML = `
      <i class="fa-solid fa-sign-in-alt"></i>
      <span id="usernameDisplay">LOGIN</span>
    `;

    // Add click handler to show login
    changeUsernameBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.showLoginModal();
    };

    if (changeUsernameBtn._tooltip) {
      changeUsernameBtn._tooltip.hide();
    }

    // Set tooltip for non-authenticated user
    changeUsernameBtn.setAttribute("data-bs-toggle", "tooltip");
    changeUsernameBtn.setAttribute("data-bs-placement", "top");
    changeUsernameBtn.setAttribute("data-bs-custom-class", "login-tooltip");
    changeUsernameBtn.setAttribute("title", "Click to login or register");
  }

  // Initialize/reinitialize the tooltip with custom template
  const tooltipTemplate =
    '<div class="tooltip" role="tooltip"><div class="tooltip-inner"></div></div>';
  changeUsernameBtn.setAttribute("data-bs-template", tooltipTemplate);

  // Create new tooltip instance
  if (window.bootstrap && window.bootstrap.Tooltip) {
    changeUsernameBtn._tooltip = new window.bootstrap.Tooltip(
      changeUsernameBtn,
    );
  }
}

function updateScoreboardDisplay() {
  // Update scoreboard messages based on auth status
  const currentUser = window.getCurrentUser();
  const isGuest = localStorage.getItem("nerdtype_guest_mode") === "true";

  // Dispatch auth state change event for stats card and other components to listen
  const authEvent = new CustomEvent("authStateChanged", {
    detail: {
      isLoggedIn: !!currentUser,
      isGuest: isGuest,
      user: currentUser,
    },
  });
  window.dispatchEvent(authEvent);

  // Force refresh stats card if we're on the chart page (clears cached data)
  if (window.statsCard && typeof window.statsCard.forceRefresh === "function") {
    window.statsCard.forceRefresh().catch((error) => {
      console.warn("Failed to force refresh stats card:", error);
    });
  }

  // Remove any existing logout buttons since we're not using them anymore
  const existingLogoutBtn = document.getElementById("logoutBtn");
  if (existingLogoutBtn) {
    existingLogoutBtn.remove();
  }

  // Update any scoreboard messages
  const scoreboardMessages = document.querySelectorAll(".auth-message");
  scoreboardMessages.forEach((message) => {
    if (currentUser) {
      const storedUsername =
        localStorage.getItem("nerdtype_username") ||
        currentUser.email.split("@")[0];
      message.innerHTML = `
        <i class="fa-solid fa-user-check me-2"></i>
        Logged in as <strong>${storedUsername}</strong> - scores will appear on global leaderboards
      `;
      message.className = "auth-message text-success small";
    } else if (isGuest) {
      message.innerHTML = `
        <i class="fa-solid fa-user-secret me-2"></i>
        Playing as guest - <button class="btn btn-link btn-sm p-0" onclick="window.showLoginModal()" style="color: #7aa2f7;">login</button> to submit to global leaderboards
      `;
      message.className = "auth-message text-warning small";
    } else {
      message.innerHTML = `
        <i class="fa-solid fa-user-plus me-2"></i>
        <button class="btn btn-link btn-sm p-0" onclick="window.showLoginModal()" style="color: #7aa2f7;">Login</button> to submit scores to global leaderboards
      `;
      message.className = "auth-message text-info small";
    }
  });
}

// Enhanced logout function with goodbye modal (no reload)
window.logoutAndRedirect = async function () {
  const currentUser = window.getCurrentUser();
  if (!currentUser) return;

  const storedUsername =
    localStorage.getItem("nerdtype_username") ||
    currentUser.email.split("@")[0];

  try {
    // Perform logout immediately without loading state
    await window.logoutUser();

    // Update displays immediately
    updateUsernameButtonDisplay();
    updateScoreboardDisplay();

    // Show goodbye message
    if (window.siteModal) {
      window.siteModal.showLogoutSuccessModal(storedUsername);
    }
  } catch (error) {
    console.error("Logout error:", error);

    // Update displays even on error to reset state
    updateUsernameButtonDisplay();
    updateScoreboardDisplay();

    // Use custom modal for error message if available
    if (window.siteModal) {
      await window.siteModal.showError("Error logging out. Please try again.");
    } else {
      alert("Error logging out. Please try again.");
    }
  }
};

// Account settings placeholder
window.showAccountSettings = async function () {
  const currentUser = window.getCurrentUser();
  if (!currentUser) return;

  const storedUsername =
    localStorage.getItem("nerdtype_username") ||
    currentUser.email.split("@")[0];
  const message = `Account: ${storedUsername}\nEmail: ${currentUser.email}\n\nAccount management features coming soon!`;

  // Use custom modal if available
  if (window.siteModal) {
    await window.siteModal.alert(message, "Account Settings");
  } else {
    alert(message);
  }
};

// Add auth status indicator to scoreboard
function addAuthStatusToScoreboard() {
  const scoreboardModal = document.getElementById("scoreboardModal");
  if (!scoreboardModal) return;

  const modalBody = scoreboardModal.querySelector(".modal-body");
  if (!modalBody) return;

  // Add auth status message if it doesn't exist
  let authMessage = modalBody.querySelector(".auth-message");
  if (!authMessage) {
    authMessage = document.createElement("div");
    authMessage.className = "auth-message text-center mb-3";
    modalBody.insertBefore(authMessage, modalBody.firstChild);
  }

  updateScoreboardDisplay();
}

// UI Toggle functionality
class UIToggle {
  constructor() {
    this.isHidden = false;
    this.toggleBtn = null;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.toggleBtn = document.getElementById("uiToggleBtn");
    if (!this.toggleBtn) {
      console.warn("UI Toggle button not found");
      return;
    }

    // Add click handler
    this.toggleBtn.addEventListener("click", () => this.toggle());

    // Add keyboard shortcut (Ctrl+U)
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        this.toggle();
      }
    });

    // Load saved state
    this.loadState();
  }

  toggle() {
    this.isHidden = !this.isHidden;
    this.updateUI();
    this.saveState();
  }

  updateUI() {
    const body = document.body;
    const toggleIcon = this.toggleBtn?.querySelector("i");

    if (this.isHidden) {
      body.classList.add("floating-buttons-hidden");
      this.toggleBtn?.classList.add("collapsed");
      if (toggleIcon) {
        toggleIcon.className = "fa-solid fa-chevron-right";
      }
    } else {
      body.classList.remove("floating-buttons-hidden");
      this.toggleBtn?.classList.remove("collapsed");
      if (toggleIcon) {
        toggleIcon.className = "fa-solid fa-chevron-left";
      }
    }
  }

  saveState() {
    localStorage.setItem(
      "nerdtype_settingsBtn_hidden",
      this.isHidden.toString(),
    );
  }

  loadState() {
    const saved = localStorage.getItem("nerdtype_settingsBtn_hidden");
    if (saved === "true") {
      this.isHidden = true;
      this.updateUI();
    }
  }

  // Public method to show UI
  show() {
    if (this.isHidden) {
      this.toggle();
    }
  }

  // Public method to hide UI
  hide() {
    if (!this.isHidden) {
      this.toggle();
    }
  }
}

// Initialize UI Toggle when script loads
const uiToggle = new UIToggle();

// Make it globally accessible if needed
window.uiToggle = uiToggle;

// Check if we're on the game page
function isGamePage() {
  return (
    window.location.pathname.includes("game.html") ||
    window.location.pathname.endsWith("/game")
  );
}

// Function to toggle UI visibility
function toggleUIVisibility() {
  if (!isGamePage()) return;

  const currentState = localStorage.getItem("nerdtype_hide_ui") === "true";
  const newState = !currentState;
  localStorage.setItem("nerdtype_hide_ui", newState.toString());

  // Apply the changes immediately
  applyUIHideSettings(newState);

  // Update settings panel toggle if it exists
  updateSettingsPanelToggle(newState);
}

// Function to update settings panel toggle to match current UI state
function updateSettingsPanelToggle(hideUI) {
  const minimalUIToggle = document.getElementById("minimalUIToggle");
  if (minimalUIToggle) {
    minimalUIToggle.checked = hideUI;
  }
}

// Function to apply UI hiding/showing
window.applyUIHideSettings = function applyUIHideSettings(hideUI) {
  if (!isGamePage()) return;

  // Define UI elements that can be hidden
  const hidableElements = [
    "#currentGameMode",
    "#accuracy",
    "#wpm",
    "#currentWordList",
    "#versionInfo",
    ".stats-container",
    ".game-info",
    ".footer",
    ".progress.terminal",
    "#buttons",
  ];

  // Apply hide/show to each element with !important to override other styles
  hidableElements.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      if (hideUI) {
        element.style.setProperty("display", "none", "important");
        element.classList.add("ui-hidden");
      } else {
        element.style.removeProperty("display");
        element.classList.remove("ui-hidden");
      }
    });
  });

  // Special handling for tips (hide tips but keep next word during game)
  const nextWordElement = document.getElementById("nextWord");
  if (nextWordElement) {
    if (hideUI) {
      // Only hide if it's showing a tip (contains "Tip:" or has tip-style class)
      if (
        nextWordElement.classList.contains("tip-style") ||
        nextWordElement.textContent.includes("Tip:")
      ) {
        nextWordElement.style.setProperty("display", "none", "important");
        nextWordElement.classList.add("ui-hidden-tip");
      }
    } else {
      // Always show when unhiding
      nextWordElement.style.removeProperty("display");
      nextWordElement.classList.remove("ui-hidden-tip");
    }
  }

  // Special handling for the main game area
  const gameArea =
    document.querySelector("#gameArea") ||
    document.querySelector("main") ||
    document.querySelector(".container");
  if (gameArea) {
    if (hideUI) {
      gameArea.classList.add("ui-minimal");
    } else {
      gameArea.classList.remove("ui-minimal");
    }
  }

  // Store the state in a data attribute for CSS targeting
  document.body.setAttribute("data-ui-hidden", hideUI.toString());
};

// Function to restore UI state on page load
function restoreUIHideState() {
  if (!isGamePage()) return; // Only work on game page

  const hideUIState = localStorage.getItem("nerdtype_hide_ui") === "true";

  // Remove the preload CSS since we're taking over now
  const preloadStyle = document.getElementById("preload-ui-hide");
  if (preloadStyle) {
    preloadStyle.remove();
  }

  if (hideUIState) {
    applyUIHideSettings(true);

    // Also set up an observer to handle dynamic changes to nextWord
    setupNextWordObserver();
  } else {
    // Make sure everything is visible if not hiding
    document.body.setAttribute("data-ui-hidden", "false");
  }
}

// Set up an observer to watch for changes to the nextWord element
function setupNextWordObserver() {
  if (!isGamePage()) return; // Only work on game page

  const nextWordElement = document.getElementById("nextWord");
  if (!nextWordElement) return;

  // Create a mutation observer to watch for content changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" || mutation.type === "characterData") {
        const hideUIState = localStorage.getItem("nerdtype_hide_ui") === "true";
        if (hideUIState) {
          // Check if it's now showing a tip
          if (
            nextWordElement.classList.contains("tip-style") ||
            nextWordElement.textContent.includes("Tip:")
          ) {
            nextWordElement.style.setProperty("display", "none", "important");
            nextWordElement.classList.add("ui-hidden-tip");
          } else {
            // It's showing the next word during game, so show it
            nextWordElement.style.removeProperty("display");
            nextWordElement.classList.remove("ui-hidden-tip");
          }
        }
      }
    });
  });

  // Start observing
  observer.observe(nextWordElement, {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });
}

// Setup the keybind
function setupUIHideKeybind() {
  document.addEventListener("keydown", function (event) {
    // Only work on game page
    if (!isGamePage()) return;

    // Ctrl+Z to toggle UI (Cmd+Z on Mac)
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      // Don't interfere if user is in a text input (except the game input)
      const activeElement = document.activeElement;
      const isGameInput = activeElement && activeElement.id === "userInput";
      const isTextInput =
        activeElement &&
        (activeElement.tagName === "TEXTAREA" ||
          (activeElement.tagName === "INPUT" &&
            activeElement.type === "text") ||
          activeElement.contentEditable === "true");

      // Only prevent default browser undo if we're not in a text input, or if we're in the game input
      if (!isTextInput || isGameInput) {
        event.preventDefault();
        toggleUIVisibility();
      }
    }
  });
}

// Initialize everything - ONLY on game page
document.addEventListener("DOMContentLoaded", function () {
  if (!isGamePage()) return; // Exit early if not game page

  setupUIHideKeybind();

  // Restore UI state after a short delay to ensure DOM is ready
  setTimeout(() => {
    restoreUIHideState();
  }, 300);
});
