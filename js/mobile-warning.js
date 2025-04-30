// mobile-warning.js - Shows a warning on first visit on mobile devices
document.addEventListener("DOMContentLoaded", function () {
  // Only run this check if we're on the front page (index.html)
  if (
    !window.location.pathname.includes("index.html") &&
    window.location.pathname !== "/" &&
    !window.location.pathname.endsWith("/")
  ) {
    return;
  }

  // Check if the user has seen the warning before
  const hasSeenWarning = localStorage.getItem("nerdtype_mobile_warning_seen");

  // Check if the device is a small mobile (screen width less than 576px)
  const isMobileDevice = window.innerWidth < 576;

  // Only show the warning if it's a mobile device and they haven't seen it before
  if (isMobileDevice && !hasSeenWarning) {
    // Create the modal if it doesn't exist
    let modalContainer = document.getElementById("mobileWarningModal");

    if (!modalContainer) {
      // Create the modal
      modalContainer = document.createElement("div");
      modalContainer.className = "modal fade";
      modalContainer.id = "mobileWarningModal";
      modalContainer.tabIndex = "-1";
      modalContainer.setAttribute("aria-labelledby", "mobileWarningModalLabel");
      modalContainer.setAttribute("aria-hidden", "true");

      // Create the modal content
      modalContainer.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header border-bottom-0 text-center">
                            <div class="w-100 text-center mb-2">
                                <img src="./images/logo-text-link.png" alt="NerdType Logo" style="width: 300px; margin: 0 auto;">
                            </div>
                        </div>
                        <div class="modal-body border-top-0 border-bottom-0">
                            <pre class="terminal-output" style="margin-bottom: 20px;">
<span style="color:#ff9e64;">NOTICE:</span> NerdType is developed and designed to be played on desktop devices. Mobile gameplay is possible but limited. The site itself is responsive and fully accessible on mobile devices. For the optimal typing experience, a physical keyboard is recommended. Happy typing!
</pre>
      </div>
      <div class="modal-footer border-top-0 d-flex justify-content-center" style="background-color: #24283b">
          <button id="confirmMobileWarning" type="button" class="btn btn-primary">
              Continue
          </button>
      </div>
  </div>
</div>`;

      // Add to the document
      document.body.appendChild(modalContainer);

      // Add event listener for the confirmation button
      document
        .getElementById("confirmMobileWarning")
        .addEventListener("click", function () {
          // Mark as seen so we don't show it again
          localStorage.setItem("nerdtype_mobile_warning_seen", "true");

          // Hide the modal
          const modal = bootstrap.Modal.getInstance(
            document.getElementById("mobileWarningModal"),
          );
          if (modal) {
            modal.hide();
          }
        });

      // Create and show the Bootstrap modal
      const modal = new bootstrap.Modal(modalContainer);
      modal.show();

      // Also mark as seen when the modal is hidden by any means
      modalContainer.addEventListener("hidden.bs.modal", function () {
        localStorage.setItem("nerdtype_mobile_warning_seen", "true");
      });
    }
  }
});
