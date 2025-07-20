// Set the application version and season info
const APP_VERSION = "NerdType v2.2.5";

// When the document is loaded, update all version elements
document.addEventListener("DOMContentLoaded", function () {
  const versionElement = document.getElementById("versionInfo");
  if (versionElement) {
    versionElement.textContent = APP_VERSION;
  }
});

// tooltips for footer
document.addEventListener("DOMContentLoaded", function () {
  // Initialize all tooltips on the page
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]'),
  );
  const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
});
