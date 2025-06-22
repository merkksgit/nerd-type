// Enhanced username2.js with reserved username validation for non-game pages

document.addEventListener("DOMContentLoaded", function () {
  // Reserved usernames list (same as in firebase-config.js)
  const reservedUsernames = ["merkks", "admin", "moderator", "nerdtype"];

  function isReservedUsername(username) {
    return reservedUsernames.some(
      (reserved) => username.toLowerCase() === reserved.toLowerCase(),
    );
  }

  function canUseUsername(username) {
    // Check admin mode for "merkks"
    const isAdminMode = localStorage.getItem("nerdtype_admin") === "true";

    if (username.toLowerCase() === "merkks") {
      return isAdminMode;
    }
    // Block other reserved usernames
    return !isReservedUsername(username);
  }

  function showUsernameError(message) {
    const usernameInput = document.getElementById("usernameInput");

    // Add error styling
    usernameInput.classList.add("is-invalid");

    // Get or create error element
    let errorElement = document.getElementById("usernameInputError");
    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.id = "usernameInputError";
      errorElement.className = "invalid-feedback";
      errorElement.style.marginTop = "5px";
      errorElement.style.fontSize = "0.875rem";
      errorElement.style.color = "#f7768e";

      // Insert after the input
      usernameInput.parentNode.insertBefore(
        errorElement,
        usernameInput.nextSibling,
      );
    }

    errorElement.textContent = message;
    errorElement.style.display = "block";
  }

  function clearUsernameError() {
    const usernameInput = document.getElementById("usernameInput");
    const errorElement = document.getElementById("usernameInputError");

    usernameInput.classList.remove("is-invalid");
    usernameInput.classList.remove("is-valid");

    if (errorElement) {
      errorElement.style.display = "none";
    }
  }

  function validateUsername(username) {
    const trimmedUsername = username.trim();

    // Check if empty
    if (!trimmedUsername) {
      showUsernameError("Username cannot be empty");
      return false;
    }

    // Check length (2-20 characters as per terms)
    if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
      showUsernameError("Username must be between 2-20 characters");
      return false;
    }

    // Check for reserved usernames
    if (!canUseUsername(trimmedUsername)) {
      if (isReservedUsername(trimmedUsername)) {
        showUsernameError(
          `"${trimmedUsername}" is a reserved codename and cannot be used`,
        );
      } else {
        showUsernameError("This codename is restricted");
      }
      return false;
    }

    // Check for invalid characters (only letters, numbers, spaces, underscores, hyphens)
    const validPattern = /^[a-zA-Z0-9 _-]+$/;
    if (!validPattern.test(trimmedUsername)) {
      showUsernameError(
        "Username can only contain letters, numbers, spaces, underscores, and hyphens",
      );
      return false;
    }

    return true;
  }

  // Get DOM elements
  const changeUsernameBtn = document.getElementById("changeUsername");
  const usernameModal = document.getElementById("usernameModal");
  const usernameInput = document.getElementById("usernameInput");
  const confirmUsernameBtn = document.getElementById("confirmUsername");
  const usernameDisplay = document.getElementById("usernameDisplay");

  // Load saved username
  const savedUsername = localStorage.getItem("nerdtype_username") || "runner";
  if (usernameDisplay) {
    usernameDisplay.textContent = savedUsername;
  }

  // Create Bootstrap modal instance
  let modal;
  if (usernameModal) {
    modal = new bootstrap.Modal(usernameModal);
  }

  // Handle username button click
  if (changeUsernameBtn) {
    changeUsernameBtn.addEventListener("click", () => {
      const currentUsername =
        localStorage.getItem("nerdtype_username") || "runner";
      if (usernameInput) {
        usernameInput.value =
          currentUsername !== "runner" ? currentUsername : "";
        clearUsernameError(); // Clear any previous errors
      }
      if (modal) {
        modal.show();
        setTimeout(() => {
          if (usernameInput) usernameInput.focus();
        }, 500);
      }
    });
  }

  // Real-time validation as user types
  if (usernameInput) {
    usernameInput.addEventListener("input", (event) => {
      const username = event.target.value.trim();

      // Clear error when user starts typing
      if (username.length === 0) {
        clearUsernameError();
        return;
      }

      // Real-time validation for reserved usernames
      if (username.length >= 2) {
        if (!canUseUsername(username)) {
          if (isReservedUsername(username)) {
            showUsernameError(
              `"${username}" is a reserved codename and cannot be used`,
            );
          } else {
            showUsernameError("This codename is restricted");
          }
        } else {
          clearUsernameError();
          usernameInput.classList.add("is-valid");
        }
      }
    });

    // Clear error when user focuses on input
    usernameInput.addEventListener("focus", () => {
      clearUsernameError();
    });
  }

  // Handle confirmation
  if (confirmUsernameBtn) {
    confirmUsernameBtn.addEventListener("click", () => {
      const newUsername = usernameInput.value.trim();

      if (validateUsername(newUsername)) {
        localStorage.setItem("nerdtype_username", newUsername);
        if (usernameDisplay) {
          usernameDisplay.textContent = newUsername;
        }
        clearUsernameError();
        if (modal) {
          modal.hide();
        }
      }
    });
  }

  // Handle Enter key in input
  if (usernameInput) {
    usernameInput.addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
        if (confirmUsernameBtn) {
          confirmUsernameBtn.click();
        }
      }
    });
  }
});
