// Save this as js/keyboard-nav.js
document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("keydown", (event) => {
    // Only trigger if:
    // 1. A number key is pressed (1-9)
    // 2. No input or textarea is focused
    // 3. Modal is not open (preventing navigation when username modal is active)
    if (
      event.key >= "1" &&
      event.key <= "9" &&
      document.activeElement.tagName !== "INPUT" &&
      document.activeElement.tagName !== "TEXTAREA" &&
      !document.querySelector(".modal.show")
    ) {
      // Get all navbar links using your specific navbar structure
      const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

      // Convert key to array index (1 becomes 0, 2 becomes 1, etc.)
      const index = parseInt(event.key) - 1;

      // Check if there's a link at this index
      if (navLinks[index]) {
        event.preventDefault();
        window.location.href = navLinks[index].href;
      }
    }
  });
});
