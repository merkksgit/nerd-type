// Set the application version in one place
const APP_VERSION = "NerdType v1.1.7";

// When the document is loaded, update all version elements
document.addEventListener("DOMContentLoaded", function () {
  const versionElement = document.getElementById("versionInfo");
  if (versionElement) {
    versionElement.textContent = APP_VERSION;
  }
});
