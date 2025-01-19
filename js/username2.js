// Simple username management for non-game pages
document.addEventListener("DOMContentLoaded", function () {
  // Get DOM elements
  const changeUsernameBtn = document.getElementById("changeUsername");
  const usernameModal = document.getElementById("usernameModal");
  const usernameInput = document.getElementById("usernameInput");
  const confirmUsernameBtn = document.getElementById("confirmUsername");
  const usernameDisplay = document.getElementById("usernameDisplay");

  // Load saved username
  const savedUsername = localStorage.getItem("nerdtype_username") || "runner";
  usernameDisplay.textContent = savedUsername;

  // Create Bootstrap modal instance
  const modal = new bootstrap.Modal(usernameModal);

  // Handle username button click
  changeUsernameBtn.addEventListener("click", () => {
    const currentUsername =
      localStorage.getItem("nerdtype_username") || "runner";
    usernameInput.value = currentUsername !== "runner" ? currentUsername : "";
    modal.show();
    setTimeout(() => usernameInput.focus(), 500);
  });

  // Handle confirmation
  confirmUsernameBtn.addEventListener("click", () => {
    const newUsername = usernameInput.value.trim();
    if (newUsername) {
      localStorage.setItem("nerdtype_username", newUsername);
      usernameDisplay.textContent = newUsername;
      modal.hide();
    }
  });

  // Handle Enter key in input
  usernameInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      confirmUsernameBtn.click();
    }
  });
});
