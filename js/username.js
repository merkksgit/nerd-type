document.addEventListener("DOMContentLoaded", () => {
  function updateUsername(newUsername) {
    const trimmedUsername = newUsername.trim();

    if (trimmedUsername) {
      localStorage.setItem("nerdtype_username", trimmedUsername);

      playerUsername = trimmedUsername;

      const usernameDisplays = document.querySelectorAll("#usernameDisplay");
      usernameDisplays.forEach((display) => {
        display.textContent = trimmedUsername;
      });

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

  const confirmUsernameBtn = document.getElementById("confirmUsername");
  if (confirmUsernameBtn) {
    confirmUsernameBtn.addEventListener("click", () => {
      const usernameInput = document.getElementById("usernameInput");
      const newUsername = usernameInput.value;

      if (updateUsername(newUsername)) {
        usernameInput.value = "";
        usernameInput.classList.remove("is-invalid");
      } else {
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

  const savedUsername = localStorage.getItem("nerdtype_username") || "runner";
  const usernameDisplays = document.querySelectorAll("#usernameDisplay");
  usernameDisplays.forEach((display) => {
    display.textContent = savedUsername;
  });
});
