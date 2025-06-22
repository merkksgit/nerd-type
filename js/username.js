document.addEventListener("DOMContentLoaded", () => {
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

  function updateUsername(newUsername) {
    const trimmedUsername = newUsername.trim();

    if (validateUsername(trimmedUsername)) {
      localStorage.setItem("nerdtype_username", trimmedUsername);

      // Update global variable if it exists
      if (typeof playerUsername !== "undefined") {
        playerUsername = trimmedUsername;
      }

      // Update all username displays
      const usernameDisplays = document.querySelectorAll("#usernameDisplay");
      usernameDisplays.forEach((display) => {
        display.textContent = trimmedUsername;
      });

      // Close modal
      const usernameModal = bootstrap.Modal.getInstance(
        document.getElementById("usernameModal"),
      );
      if (usernameModal) {
        usernameModal.hide();
        location.reload();
      }
      return true;
    }
    return false;
  }

  // Real-time validation as user types
  const usernameInput = document.getElementById("usernameInput");
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

  // Handle confirmation button
  const confirmUsernameBtn = document.getElementById("confirmUsername");
  if (confirmUsernameBtn) {
    confirmUsernameBtn.addEventListener("click", () => {
      const usernameInput = document.getElementById("usernameInput");
      const newUsername = usernameInput.value;

      if (updateUsername(newUsername)) {
        usernameInput.value = "";
        clearUsernameError();
      }
    });
  }

  // Handle Enter key in username input
  if (usernameInput) {
    usernameInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const newUsername = usernameInput.value;

        if (updateUsername(newUsername)) {
          usernameInput.value = "";
          clearUsernameError();

          const usernameModal = bootstrap.Modal.getInstance(
            document.getElementById("usernameModal"),
          );
          if (usernameModal) {
            usernameModal.hide();
          }
        }
      }
    });
  }

  // Load and display saved username
  const savedUsername = localStorage.getItem("nerdtype_username") || "runner";
  const usernameDisplays = document.querySelectorAll("#usernameDisplay");
  usernameDisplays.forEach((display) => {
    display.textContent = savedUsername;
  });
});
