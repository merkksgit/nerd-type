// auth-handler.js - Simplified approach to prevent game start on Enter
// This should be loaded after Firebase is initialized

document.addEventListener("DOMContentLoaded", function () {
  console.log("🔐 Auth handler initializing...");

  // Safety check - wait for elements to be available
  function initializeAuthHandler() {
    // Modal elements
    const loginModal = document.getElementById("loginModal");

    // If modals don't exist, wait and try again
    if (!loginModal) {
      console.log("⏳ Login modal not found, retrying in 500ms...");
      setTimeout(initializeAuthHandler, 500);
      return;
    }

    console.log("✅ Elements found, setting up auth handler");

    // Form elements
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const authSubmitBtn = document.getElementById("authSubmitBtn");
    const skipAuthBtn = document.getElementById("skipAuthBtn");

    // Toggle between login and register
    const loginModeRadio = document.getElementById("loginMode");
    const registerModeRadio = document.getElementById("registerMode");

    // Initialize modals
    let loginModalInstance;

    if (loginModal) {
      loginModalInstance = new bootstrap.Modal(loginModal);
    }

    // Toggle between login and register forms
    function toggleAuthMode() {
      if (loginModeRadio && loginModeRadio.checked) {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
        authSubmitBtn.textContent = "LOGIN";
      } else {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
        authSubmitBtn.textContent = "REGISTER";
      }
      clearErrors();
    }

    // Event listeners for mode toggle
    if (loginModeRadio) {
      loginModeRadio.addEventListener("change", toggleAuthMode);
    }
    if (registerModeRadio) {
      registerModeRadio.addEventListener("change", toggleAuthMode);
    }

    // Form validation
    function validateLoginForm() {
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      if (!email || !password) {
        showError("loginError", "Please fill in all fields");
        return false;
      }

      if (!isValidEmail(email)) {
        showError("loginError", "Please enter a valid email address");
        return false;
      }

      return true;
    }

    function validateRegisterForm() {
      const email = document.getElementById("registerEmail").value.trim();
      const password = document.getElementById("registerPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (!email || !password || !confirmPassword) {
        showError("registerError", "Please fill in all fields");
        return false;
      }

      if (!isValidEmail(email)) {
        showError("registerError", "Please enter a valid email address");
        return false;
      }

      if (password.length < 6) {
        showError("registerError", "Password must be at least 6 characters");
        return false;
      }

      if (password !== confirmPassword) {
        showError("registerError", "Passwords do not match");
        return false;
      }

      return true;
    }

    function isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    function showError(elementId, message) {
      const errorElement = document.getElementById(elementId);
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = "block";
      }
    }

    function clearErrors() {
      const errorElements = document.querySelectorAll(".error-message");
      errorElements.forEach((element) => {
        element.style.display = "none";
        element.textContent = "";
      });
    }

    function showLoading(show) {
      const loadingElement = document.getElementById("authLoading");
      const submitBtn = document.getElementById("authSubmitBtn");

      if (loadingElement) {
        loadingElement.style.display = show ? "block" : "none";
      }

      if (submitBtn) {
        submitBtn.disabled = show;
      }
    }

    // Handle form submission
    if (authSubmitBtn) {
      authSubmitBtn.addEventListener("click", async () => {
        clearErrors();

        if (loginModeRadio && loginModeRadio.checked) {
          // Handle login
          if (!validateLoginForm()) return;

          showLoading(true);
          const email = document.getElementById("loginEmail").value.trim();
          const password = document.getElementById("loginPassword").value;

          try {
            const result = await window.loginUser(email, password);
            if (result.success) {
              console.log("Login successful, closing modal");
              loginModalInstance.hide();
            } else {
              showError("loginError", result.error || "Login failed");
            }
          } catch (error) {
            console.error("Login error:", error);
            showError("loginError", "Login failed. Please try again.");
          }

          showLoading(false);
        } else {
          // Handle registration
          if (!validateRegisterForm()) return;

          showLoading(true);
          const email = document.getElementById("registerEmail").value.trim();
          const password = document.getElementById("registerPassword").value;

          try {
            const result = await window.registerUser(email, password);
            if (result.success) {
              console.log("Registration successful, closing modal");
              loginModalInstance.hide();
            } else {
              showError("registerError", result.error || "Registration failed");
            }
          } catch (error) {
            console.error("Registration error:", error);
            showError(
              "registerError",
              "Registration failed. Please try again.",
            );
          }

          showLoading(false);
        }
      });
    }

    // Handle skip authentication (guest mode)
    if (skipAuthBtn) {
      skipAuthBtn.addEventListener("click", () => {
        localStorage.setItem("nerdtype_guest_mode", "true");
        localStorage.setItem("nerdtype_username", "runner");

        const usernameDisplay = document.getElementById("usernameDisplay");
        if (usernameDisplay) {
          usernameDisplay.textContent = "runner";
        }

        // Update global playerUsername if it exists
        if (typeof window.playerUsername !== "undefined") {
          window.playerUsername = "runner";
        }

        loginModalInstance.hide();
        console.log("User chose guest mode as runner");
      });
    }

    // Simple Enter key handling - only for modal inputs
    const loginInputs = [
      document.getElementById("loginEmail"),
      document.getElementById("loginPassword"),
      document.getElementById("registerEmail"),
      document.getElementById("registerPassword"),
      document.getElementById("confirmPassword"),
    ];

    loginInputs.forEach((input) => {
      if (input) {
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();

            // Double check we're still in the modal
            if (loginModal.classList.contains("show")) {
              authSubmitBtn.click();
            }
          }
        });
      }
    });

    // Temporarily disable game start function when modal is open
    let originalStartGame = null;

    if (loginModal) {
      loginModal.addEventListener("shown.bs.modal", () => {
        // Focus on first input
        const firstInput = loginModal.querySelector("input[type='email']");
        if (firstInput) {
          setTimeout(() => firstInput.focus(), 100);
        }

        // Temporarily disable game start function
        if (window.startGame && typeof window.startGame === "function") {
          originalStartGame = window.startGame;
          window.startGame = function () {
            console.log("Game start blocked - modal is open");
          };
        }

        // Also disable any global Enter handlers by setting a flag
        window.modalIsOpen = true;
      });

      loginModal.addEventListener("hidden.bs.modal", () => {
        // Clear all form inputs
        const inputs = loginModal.querySelectorAll("input");
        inputs.forEach((input) => {
          input.value = "";
          input.classList.remove("is-valid", "is-invalid");
        });

        // Clear errors
        clearErrors();

        // Reset to login mode
        if (loginModeRadio) {
          loginModeRadio.checked = true;
          toggleAuthMode();
        }

        // Restore game start function
        if (originalStartGame) {
          window.startGame = originalStartGame;
          originalStartGame = null;
        }

        // Remove modal flag
        window.modalIsOpen = false;
      });
    }

    console.log("🔐 Auth handler setup complete - login available on demand");
  }

  // Start initialization
  initializeAuthHandler();
});

// Global functions for user management
window.showLoginModal = function () {
  const loginModal = document.getElementById("loginModal");
  if (loginModal) {
    const modal =
      bootstrap.Modal.getInstance(loginModal) ||
      new bootstrap.Modal(loginModal);
    modal.show();
  }
};

// Enhanced logout with better UX
window.logoutAndRedirect = async function () {
  const currentUser = window.getCurrentUser();
  if (!currentUser) return;

  const emailUsername = currentUser.email.split("@")[0];

  try {
    console.log("🚪 Logging out user:", emailUsername);

    await window.logoutUser();

    console.log("✅ Successfully logged out");

    // Update displays immediately - these functions should be defined elsewhere
    if (window.updateUsernameButtonDisplay) {
      window.updateUsernameButtonDisplay();
    }
    if (window.updateScoreboardDisplay) {
      window.updateScoreboardDisplay();
    }

    console.log("User logged out - login available on demand");
  } catch (error) {
    console.error("❌ Logout error:", error);

    // Update displays even on error to reset state
    if (window.updateUsernameButtonDisplay) {
      window.updateUsernameButtonDisplay();
    }
    if (window.updateScoreboardDisplay) {
      window.updateScoreboardDisplay();
    }

    alert("Error logging out. Please try again.");
  }
};

console.log("🔐 Authentication handler loaded successfully");
