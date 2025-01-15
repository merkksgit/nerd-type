// Universal Username Handler
document.addEventListener("DOMContentLoaded", () => {
  // Key function to update username everywhere
  function updateUsername(newUsername) {
    // Trim and validate username
    const trimmedUsername = newUsername.trim();

    // Check if username is valid (not empty)
    if (trimmedUsername) {
      // Update in localStorage
      localStorage.setItem("nerdtype_username", trimmedUsername);

      // Update player username variable
      playerUsername = trimmedUsername;

      // Update display in multiple places
      const usernameDisplays = document.querySelectorAll("#usernameDisplay");
      usernameDisplays.forEach((display) => {
        display.textContent = trimmedUsername;
      });

      // Close modal if open
      const usernameModal = bootstrap.Modal.getInstance(
        document.getElementById("usernameModal"),
      );
      if (usernameModal) {
        usernameModal.hide();
      }

      // Optional: Provide user feedback
      console.log(`Username successfully changed to: ${trimmedUsername}`);

      return true;
    }

    return false;
  }

  // Attach to confirmation button
  const confirmUsernameBtn = document.getElementById("confirmUsername");
  if (confirmUsernameBtn) {
    confirmUsernameBtn.addEventListener("click", () => {
      const usernameInput = document.getElementById("usernameInput");
      const newUsername = usernameInput.value;

      if (updateUsername(newUsername)) {
        // Clear input and remove any error states
        usernameInput.value = "";
        usernameInput.classList.remove("is-invalid");
      } else {
        // Show error if username is invalid
        usernameInput.classList.add("is-invalid");
      }
    });
  }

  // Handle Enter key in username input
  const usernameInput = document.getElementById("usernameInput");
  if (usernameInput) {
    usernameInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const newUsername = usernameInput.value;

        if (updateUsername(newUsername)) {
          usernameInput.value = "";
          usernameInput.classList.remove("is-invalid");

          // Close modal programmatically
          const usernameModal = bootstrap.Modal.getInstance(
            document.getElementById("usernameModal"),
          );
          if (usernameModal) {
            usernameModal.hide();
          }
        } else {
          usernameInput.classList.add("is-invalid");
        }
      }
    });
  }

  // Initialize display on page load
  const savedUsername = localStorage.getItem("nerdtype_username") || "runner";
  const usernameDisplays = document.querySelectorAll("#usernameDisplay");
  usernameDisplays.forEach((display) => {
    display.textContent = savedUsername;
  });
});
