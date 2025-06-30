// Complete js/ui-updates.js with proper authentication timing
// This fixes the issue where reload happens too early

document.addEventListener("DOMContentLoaded", function () {
  // Update the change username button functionality
  updateUsernameButtonDisplay();

  // Enhanced authentication state change handler with proper timing
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
          handleLogoutWithDelayedReload();
        }
      });
    }
  }
});

// Mark auth as processing and handle login with delayed reload
async function handleLoginWithDelayedReload(user) {
  try {
    window.authProcessing = true;
    const emailUsername = user.email.split("@")[0];

    console.log("✅ Login successful for:", emailUsername);

    // Update localStorage immediately
    localStorage.setItem("nerdtype_username", emailUsername);

    // Quick UI update
    updateUsernameButtonDisplay();

    // Show success message using available alert method
    if (window.siteModal) {
      window.siteModal.alert(`Welcome, ${emailUsername}!`, "[LOGIN SUCCESFUL]");
    } else {
      console.log(`Welcome back, ${emailUsername}!`);
    }

    // Wait longer to ensure Firebase auth is fully processed
    setTimeout(() => {
      console.log("🔄 Reloading page to refresh all game state...");
      window.location.reload();
    }, 3000); // Increased delay to 3 seconds
  } catch (error) {
    console.error("❌ Error in login handler:", error);
    window.authProcessing = false;
  }
}

// Handle logout with delayed reload
async function handleLogoutWithDelayedReload() {
  try {
    window.authProcessing = true;

    // Clear username from localStorage
    localStorage.removeItem("nerdtype_username");
    localStorage.removeItem("nerdtype_guest_mode");

    // Quick UI update
    updateUsernameButtonDisplay();
    updateScoreboardDisplay();

    console.log("✅ Logged out successfully");

    // Show logout message
    if (window.siteModal) {
      window.siteModal.info(
        "Logged out successfully. Refreshing...",
        "Goodbye!",
        2000,
      );
    }

    // Reload after delay
    setTimeout(() => {
      console.log("🔄 Reloading page to reset game state...");
      window.location.reload();
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
    const emailUsername = currentUser.email.split("@")[0];

    // Use logout icon when user is logged in
    changeUsernameBtn.innerHTML = `
      <i class="fa-solid fa-user"></i>
      <span id="usernameDisplay">${emailUsername}</span>
    `;

    // Add click handler for direct logout using custom modal
    changeUsernameBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Use custom modal instead of browser confirm
      if (window.siteModal) {
        const confirmed = await window.siteModal.confirmLogout(emailUsername);
        if (confirmed) {
          window.logoutAndRedirect();
        }
      } else {
        // Fallback to browser confirm if custom modal not available
        if (confirm(`Logout from ${emailUsername}?`)) {
          window.logoutAndRedirect();
        }
      }
    };

    // Set tooltip for authenticated user
    changeUsernameBtn.setAttribute("data-bs-toggle", "tooltip");
    changeUsernameBtn.setAttribute("data-bs-placement", "top");
    changeUsernameBtn.setAttribute("data-bs-custom-class", "auth-tooltip");
    changeUsernameBtn.setAttribute("title", `Logout from ${emailUsername}`);
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

  // Remove any existing logout buttons since we're not using them anymore
  const existingLogoutBtn = document.getElementById("logoutBtn");
  if (existingLogoutBtn) {
    existingLogoutBtn.remove();
  }

  // Update any scoreboard messages
  const scoreboardMessages = document.querySelectorAll(".auth-message");
  scoreboardMessages.forEach((message) => {
    if (currentUser) {
      const emailUsername = currentUser.email.split("@")[0];
      message.innerHTML = `
        <i class="fa-solid fa-user-check me-2"></i>
        Logged in as <strong>${emailUsername}</strong> - scores will appear on global leaderboards
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

// Fixed logout function with no loading text - clean and simple
window.logoutAndRedirect = async function () {
  const currentUser = window.getCurrentUser();
  if (!currentUser) return;

  const emailUsername = currentUser.email.split("@")[0];

  try {
    console.log("🚪 Logging out user:", emailUsername);

    // Perform logout immediately without loading state
    await window.logoutUser();

    console.log("✅ Successfully logged out");

    // Update displays immediately (but DON'T update data collection setting)
    updateUsernameButtonDisplay();
    updateScoreboardDisplay();

    console.log("User logged out - login available on demand");
  } catch (error) {
    console.error("❌ Logout error:", error);

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

// Account settings placeholder (you can expand this later)
window.showAccountSettings = async function () {
  const currentUser = window.getCurrentUser();
  if (!currentUser) return;

  const emailUsername = currentUser.email.split("@")[0];
  const message = `Account: ${emailUsername}\nEmail: ${currentUser.email}\n\nAccount management features coming soon!`;

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
