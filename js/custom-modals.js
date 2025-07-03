class SiteModal {
  constructor() {
    this.confirmModal = document.getElementById("customConfirmModal");
    this.alertModal = document.getElementById("customAlertModal");
  }

  // Logout confirmation with image and goodbye text
  async confirmLogout(username) {
    return new Promise((resolve) => {
      const modal = new bootstrap.Modal(this.confirmModal);

      document.getElementById("confirmModalTitle").innerHTML = `
        <img src="../images/logo-text-no-keyboard.png" alt="NerdType Logo" style="width: 300px; vertical-align: middle;">
      `;

      // Set goodbye message with user context
      document.getElementById("confirmModalMessage").innerHTML = `
        <div class="text-center">
          <p class="mb-3">Are you sure you want to logout, <span style="color: #ff9e64"<strong>${username}</strong></span>?</p>
        </div>
      `;

      // Handle confirm button
      const handleConfirm = () => {
        modal.hide();
        resolve(true);
        document
          .getElementById("confirmOkBtn")
          .removeEventListener("click", handleConfirm);
        document
          .getElementById("confirmCancelBtn")
          .removeEventListener("click", handleCancel);
      };

      // Handle cancel button
      const handleCancel = () => {
        modal.hide();
        resolve(false);
        document
          .getElementById("confirmOkBtn")
          .removeEventListener("click", handleConfirm);
        document
          .getElementById("confirmCancelBtn")
          .removeEventListener("click", handleCancel);
      };

      // Add event listeners
      document
        .getElementById("confirmOkBtn")
        .addEventListener("click", handleConfirm);
      document
        .getElementById("confirmCancelBtn")
        .addEventListener("click", handleCancel);

      // Show modal
      modal.show();
    });
  }

  // Show logout success message after logout
  showLogoutSuccessModal(username) {
    const alertModal = document.getElementById("customAlertModal");
    if (!alertModal) return;

    const modal = new bootstrap.Modal(alertModal);

    // Set title with image
    document.getElementById("alertModalTitle").innerHTML = `
      <img src="../images/logo-text-no-keyboard.png" alt="Goodbye" style="width: 300px; vertical-align: middle;">
    `;

    // Set goodbye message
    document.getElementById("alertModalMessage").innerHTML = `
      <div class="text-center">
        <p class="mb-2">Goodbye, <span style="color: #ff9e64"<strong>${username}</strong></span>!</p>
        <p class="mb-0">Thanks for playing NerdType!</p>
      </div>
    `;

    // Hide the OK button for this specific modal
    const okButton = document.getElementById("alertOkBtn");
    const modalFooter = alertModal.querySelector(".modal-footer");

    if (okButton) {
      okButton.style.display = "none";
    }
    if (modalFooter) {
      modalFooter.style.display = "none";
    }

    // Show the modal
    modal.show();

    // Auto-hide after 2 seconds
    setTimeout(() => {
      modal.hide();
      if (okButton) {
        okButton.style.display = "";
      }
      if (modalFooter) {
        modalFooter.style.display = "";
      }
    }, 2000);
  }

  // Keep your existing methods...
  confirm(message, title = "Confirm") {
    return new Promise((resolve) => {
      const modal = new bootstrap.Modal(this.confirmModal);

      // Set title and message (regular confirm - no image)
      document.getElementById("confirmModalTitle").textContent = title;
      document.getElementById("confirmModalMessage").textContent = message;

      // Handle button clicks
      const handleConfirm = () => {
        modal.hide();
        resolve(true);
        document
          .getElementById("confirmOkBtn")
          .removeEventListener("click", handleConfirm);
        document
          .getElementById("confirmCancelBtn")
          .removeEventListener("click", handleCancel);
      };

      const handleCancel = () => {
        modal.hide();
        resolve(false);
        document
          .getElementById("confirmOkBtn")
          .removeEventListener("click", handleConfirm);
        document
          .getElementById("confirmCancelBtn")
          .removeEventListener("click", handleCancel);
      };

      // Add event listeners
      document
        .getElementById("confirmOkBtn")
        .addEventListener("click", handleConfirm);
      document
        .getElementById("confirmCancelBtn")
        .addEventListener("click", handleCancel);

      // Show modal
      modal.show();
    });
  }

  // Simple alert dialog
  alert(message, title = "Notice") {
    return new Promise((resolve) => {
      const modal = new bootstrap.Modal(this.alertModal);

      // Set title and message
      document.getElementById("alertModalTitle").textContent = title;
      document.getElementById("alertModalMessage").textContent = message;

      // Handle button click
      const handleOk = () => {
        modal.hide();
        resolve();
        document
          .getElementById("alertOkBtn")
          .removeEventListener("click", handleOk);
      };

      // Add event listener
      document.getElementById("alertOkBtn").addEventListener("click", handleOk);

      // Show modal
      modal.show();
    });
  }

  // Error message
  async showError(message) {
    return await this.alert(message, "Error");
  }

  // Warning message
  async showWarning(message) {
    return await this.alert(message, "Warning");
  }
}

// Initialize the modal system
const siteModal = new SiteModal();

// Make it globally available
window.siteModal = siteModal;

// Convenience functions
window.customConfirm = (message, title) => siteModal.confirm(message, title);
window.customAlert = (message, title) => siteModal.alert(message, title);
