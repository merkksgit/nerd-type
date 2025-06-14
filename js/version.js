// Set the application version in one place
const APP_VERSION = "NerdType v1.4.8"; // Muista muuttaa versio myös README tiedostoon

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
