document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("keydown", (event) => {
    if (
      event.key >= "1" &&
      event.key <= "9" &&
      document.activeElement.tagName !== "INPUT" &&
      document.activeElement.tagName !== "TEXTAREA" &&
      !document.querySelector(".modal.show")
    ) {
      const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
      const index = parseInt(event.key) - 1;
      if (navLinks[index]) {
        event.preventDefault();
        window.location.href = navLinks[index].href;
      }
    }
  });
});
