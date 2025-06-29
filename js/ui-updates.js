// Updated button display logic with better logout and no separate logout button
// Add this to your main game JavaScript or create a new file: ui-updates.js

document.addEventListener("DOMContentLoaded", function () {
  // Update the change username button functionality
  updateUsernameButtonDisplay();

  // Listen for authentication state changes
  if (window.firebaseModules) {
    const { onAuthStateChanged } = window.firebaseModules;
    if (window.auth) {
      onAuthStateChanged(window.auth, (user) => {
        updateUsernameButtonDisplay();
        updateScoreboardDisplay();
      });
    }
  }
});

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

  if (currentUser) {
    // User is authenticated - show username with consistent user icon
    const emailUsername = currentUser.email.split("@")[0];

    // Keep the original button structure with consistent user icon
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

    changeUsernameBtn.title = "Click to logout";
  } else if (isGuest) {
    // Guest mode - show with consistent user icon
    changeUsernameBtn.innerHTML = `
      <i class="fa-solid fa-user"></i>
      <span id="usernameDisplay">Runner</span>
    `;

    // Add click handler to show login
    changeUsernameBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.showLoginModal();
    };

    changeUsernameBtn.title = "Click to login for global leaderboards";
  } else {
    // Not authenticated and not guest - show with consistent user icon
    changeUsernameBtn.innerHTML = `
      <i class="fa-solid fa-user"></i>
      <span id="usernameDisplay">LOGIN</span>
    `;

    // Add click handler to show login
    changeUsernameBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.showLoginModal();
    };

    changeUsernameBtn.title = "Click to login or register";
  }
}

// Remove the separate logout button functionality - no longer needed

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
