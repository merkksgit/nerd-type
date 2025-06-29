class SiteModal {
  constructor() {
    this.confirmModal = null;
    this.alertModal = null;
    this.init();
  }

  init() {
    document.addEventListener("DOMContentLoaded", () => {
      this.confirmModal = document.getElementById("customConfirmModal");
      this.alertModal = document.getElementById("customAlertModal");
      this.setupKeyboardHandlers();
    });
  }

  setupKeyboardHandlers() {
    document.addEventListener("keydown", (e) => {
      const confirmOpen = this.confirmModal?.classList.contains("show");
      const alertOpen = this.alertModal?.classList.contains("show");

      if (confirmOpen || alertOpen) {
        if (e.key === "Enter") {
          e.preventDefault();
          if (confirmOpen) {
            document.getElementById("confirmOkBtn")?.click();
          } else if (alertOpen) {
            document.getElementById("alertOkBtn")?.click();
          }
        } else if (e.key === "Escape" && confirmOpen) {
          e.preventDefault();
          document.getElementById("confirmCancelBtn")?.click();
        }
      }
    });
  }

  // Simple confirm dialog
  confirm(message, title = "Confirm Action") {
    return new Promise((resolve) => {
      const modal = new bootstrap.Modal(this.confirmModal);

      // Set title and message
      document.getElementById("confirmModalTitle").textContent = title;
      document.getElementById("confirmModalMessage").textContent = message;

      // Handle button clicks
      const handleConfirm = () => {
        modal.hide();
        resolve(true);
        cleanup();
      };

      const handleCancel = () => {
        modal.hide();
        resolve(false);
        cleanup();
      };

      const cleanup = () => {
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

  // Logout confirmation
  async confirmLogout(username) {
    return await this.confirm(
      `Logout from ${username}? This will end your current session.`,
      "Confirm Logout",
    );
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
