class SiteModal {
  constructor() {
    this.confirmModal = document.getElementById("customConfirmModal");
    this.alertModal = document.getElementById("customAlertModal");
  }

  // Time-based greeting helper method
  getTimeBasedGreeting() {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 5 && hour < 12) {
      return "Have a great morning";
    } else if (hour >= 12 && hour < 17) {
      return "Enjoy your afternoon";
    } else if (hour >= 17 && hour < 21) {
      return "Have a great evening";
    } else {
      return "Good night";
    }
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
          <p class="mb-3">Are you sure you want to logout, <span style="color: #ff9e64"><strong>${username}</strong></span>?</p>
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
    const modal = new bootstrap.Modal(this.alertModal);

    document.getElementById("alertModalTitle").innerHTML = `
      <img src="../images/logo-text-no-keyboard.png" alt="NerdType Logo" style="width: 300px; vertical-align: middle;">
    `;

    // Time-based greeting
    const greeting = this.getTimeBasedGreeting();

    document.getElementById("alertModalMessage").innerHTML = `
      <div class="text-center">
        <p class="mb-3">${greeting}, <span style="color: #ff9e64"><strong>${username}</strong></span>!</p>
        <p class="mb-2">Thanks for playing NerdType!</p>
      </div>
    `;

    // Hide the OK button for this specific modal
    const okButton = document.getElementById("alertOkBtn");
    if (okButton) {
      okButton.style.display = "none";
    }

    // Hide the modal footer entirely to remove the button area
    const modalFooter = this.alertModal.querySelector(".modal-footer");
    if (modalFooter) {
      modalFooter.style.display = "none";
    }

    // Show the modal
    modal.show();

    setTimeout(() => {
      modal.hide();
      if (okButton) {
        okButton.style.display = "";
      }
      if (modalFooter) {
        modalFooter.style.display = "";
      }
    }, 3000); // Hide after 3 seconds
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
