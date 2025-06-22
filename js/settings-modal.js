document.addEventListener("DOMContentLoaded", function () {
  // Initialize the settings modal
  initSettingsModal();

  // Add event listener to the settings button
  const settingsButton = document.getElementById("openSettingsBtn");
  if (settingsButton) {
    settingsButton.addEventListener("click", openSettingsModal);
  }

  // Initialize sound settings
  initSoundSettings();
});

function initSettingsModal() {
  // Get the buttons
  const resetButton = document.getElementById("resetSettingsBtn");
  const applyButton = document.getElementById("applySettingsBtn");

  // Add event listeners
  if (resetButton) {
    resetButton.addEventListener("click", resetSettings);
  }

  if (applyButton) {
    applyButton.addEventListener("click", applySettings);
  }

  // Add Enter key support for the settings modal
  const settingsModal = document.getElementById("settingsModal");
  if (settingsModal) {
    // Add handler for modal-wide keydown events
    settingsModal.addEventListener("keydown", function (event) {
      // Check if Enter key is pressed
      if (event.key === "Enter") {
        // For the modal background and non-interactive elements
        const tagName = event.target.tagName.toLowerCase();
        const isInteractiveElement =
          tagName === "input" ||
          tagName === "textarea" ||
          tagName === "select" ||
          tagName === "button";

        if (!isInteractiveElement) {
          event.preventDefault();
          if (applyButton) {
            applyButton.click();
          }
        }
      }
    });

    // Add handlers for all number input fields
    const inputFields = settingsModal.querySelectorAll('input[type="number"]');
    inputFields.forEach((input) => {
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          if (applyButton) {
            applyButton.click();
          }
        }
      });
    });

    // Add handlers for all radio buttons
    const radioButtons = settingsModal.querySelectorAll('input[type="radio"]');
    radioButtons.forEach((radio) => {
      radio.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          if (applyButton) {
            applyButton.click();
          }
        }
      });
    });

    // Add handlers for all toggle switches (checkboxes)
    const toggleSwitches = settingsModal.querySelectorAll(
      'input[type="checkbox"]',
    );
    toggleSwitches.forEach((toggle) => {
      toggle.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          if (applyButton) {
            applyButton.click();
          }
        }
      });
    });
  }

  loadSettings();
  setupInputChangeListeners();
  setupRealTimeValidation(); // Add real-time validation
}

const zenModeToggle = document.getElementById("zenModeToggle");
if (zenModeToggle) {
  zenModeToggle.checked = localStorage.getItem("nerdtype_zen_mode") === "true";

  zenModeToggle.addEventListener("change", function () {
    localStorage.setItem("nerdtype_zen_mode", this.checked);

    // Update UI elements
    document.querySelectorAll(".classic-mode-setting").forEach((el) => {
      el.style.display = this.checked ? "none" : "block";
    });

    document.querySelectorAll(".zen-mode-element").forEach((el) => {
      el.style.display = this.checked ? "block" : "none";
    });
  });
}

function openSettingsModal() {
  // Load current settings before opening
  loadSettings();

  // Open the modal
  const settingsModal = new bootstrap.Modal(
    document.getElementById("settingsModal"),
  );
  settingsModal.show();
}

function loadSettings() {
  // Set show spaces toggle
  const showSpacesToggle = document.getElementById("showSpacesToggle");
  if (showSpacesToggle) {
    showSpacesToggle.checked =
      localStorage.getItem("showSpacesAfterWords") === "true";
  }
  // Get saved settings or use defaults
  const gameSettings = JSON.parse(localStorage.getItem("terminalSettings")) || {
    timeLimit: 30,
    bonusTime: 3,
    initialTime: 10,
    goalPercentage: 100,
    currentMode: "classic",
    zenWordGoal: 30, // Default zen mode word goal
  };

  // Load data collection setting (default is enabled)
  const dataCollectionEnabled = localStorage.getItem("data_collection_enabled");
  const dataCollectionToggle = document.getElementById("dataCollectionToggle");

  if (dataCollectionToggle) {
    dataCollectionToggle.checked =
      dataCollectionEnabled === null || dataCollectionEnabled === "true";
  }

  // Load language setting
  const currentLanguage =
    localStorage.getItem("nerdtype_wordlist") || "english";
  const languageRadio = document.querySelector(
    `input[name="languageMode"][value="${currentLanguage}"]`,
  );
  if (languageRadio) {
    languageRadio.checked = true;
  }

  // Set form values
  document.getElementById("wordsGoal").value = gameSettings.timeLimit;
  document.getElementById("bonusEnergy").value = gameSettings.bonusTime;
  document.getElementById("initialEnergy").value = gameSettings.initialTime;

  // Set Zen Mode toggle
  const zenModeToggle = document.getElementById("zenModeToggle");
  if (zenModeToggle) {
    zenModeToggle.checked =
      localStorage.getItem("nerdtype_zen_mode") === "true";
  }

  // Set zen word goal
  const zenWordGoal = document.getElementById("zenWordGoal");
  if (zenWordGoal) {
    zenWordGoal.value = gameSettings.zenWordGoal || 30;
  }

  // Set radio button for mode
  const modeRadio = document.querySelector(
    `input[name="gameMode"][value="${gameSettings.currentMode}"]`,
  );
  if (modeRadio) {
    modeRadio.checked = true;
  }

  // Load achievement sound setting
  const achievementSoundEnabled = localStorage.getItem(
    "achievement_sound_enabled",
  );
  const soundToggle = document.getElementById("achievementSoundToggle");

  // If setting exists, use it (default is enabled/checked if not set)
  if (soundToggle) {
    soundToggle.checked =
      achievementSoundEnabled === null || achievementSoundEnabled === "true";
  }

  const keypressSoundEnabled = localStorage.getItem("keypress_sound_enabled");
  const keypressSoundToggle = document.getElementById("keypressSoundToggle");

  // If setting exists, use it (default is enabled/checked if not set)
  if (keypressSoundToggle) {
    keypressSoundToggle.checked =
      keypressSoundEnabled === null || keypressSoundEnabled === "true";
  }

  // Toggle custom settings based on mode
  toggleCustomSettings(gameSettings.currentMode === "custom");

  // Update difficulty multiplier
  updateDifficultyMultiplier();

  // Clear any validation states when loading settings
  clearAllValidationStates();
}

function toggleCustomSettings(isCustom) {
  const customInputs = document.querySelectorAll(
    "#wordsGoal, #bonusEnergy, #initialEnergy, #goalPercentage",
  );

  // If custom mode is selected, enable inputs, otherwise disable them
  customInputs.forEach((input) => {
    input.disabled = !isCustom;
    input.parentElement.classList.toggle("opacity-50", !isCustom);
  });
}

function setupInputChangeListeners() {
  // Listen for game mode changes
  const modeRadios = document.querySelectorAll('input[name="gameMode"]');
  modeRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      const isCustomMode = this.value === "custom";
      toggleCustomSettings(isCustomMode);

      // If switching to a preset mode, load those values
      if (!isCustomMode && this.value !== "custom") {
        loadPresetValues(this.value);
      }

      // Update difficulty multiplier
      updateDifficultyMultiplier();
    });
  });

  // Listen for custom setting changes
  const customInputs = document.querySelectorAll(
    "#wordsGoal, #bonusEnergy, #initialEnergy, #goalPercentage",
  );
  customInputs.forEach((input) => {
    input.addEventListener("input", updateDifficultyMultiplier);
  });
}

function loadPresetValues(mode) {
  // Define preset modes
  const presetModes = {
    classic: {
      timeLimit: 30,
      bonusTime: 3,
      initialTime: 10,
    },
    hard: {
      timeLimit: 20,
      bonusTime: 2,
      initialTime: 8,
    },
    practice: {
      timeLimit: 60,
      bonusTime: 5,
      initialTime: 15,
    },
    speedrunner: {
      timeLimit: 10,
      bonusTime: 2,
      initialTime: 8,
    },
  };

  // Get preset values
  const preset = presetModes[mode] || presetModes.classic;

  // Set form values but don't enable them
  document.getElementById("wordsGoal").value = preset.timeLimit;
  document.getElementById("bonusEnergy").value = preset.bonusTime;
  document.getElementById("initialEnergy").value = preset.initialTime;
}

function calculateDifficultyMultiplier() {
  try {
    // Reference values (classic mode settings)
    const refTimeLimit = 30;
    const refBonusTime = 3;
    const refInitialTime = 10;

    // Get current values
    const timeLimit = parseFloat(document.getElementById("wordsGoal").value);
    const bonusTime = parseFloat(document.getElementById("bonusEnergy").value);
    const initialTime = parseFloat(
      document.getElementById("initialEnergy").value,
    );

    // Calculate individual difficulty factors
    // For timeLimit, MORE words (HIGHER limit) is HARDER
    const timeLimitFactor = Math.min(3, Math.max(1, timeLimit) / refTimeLimit);

    // For bonus and initial time, LOWER is HARDER
    const bonusTimeFactor = Math.min(
      3,
      refBonusTime / Math.max(0.5, bonusTime),
    );
    const initialTimeFactor = Math.min(
      3,
      refInitialTime / Math.max(0.5, initialTime),
    );

    // Weighted calculation (balances the three factors)
    const weightedMultiplier =
      (timeLimitFactor * 1.5 +
        bonusTimeFactor * 1.75 +
        initialTimeFactor * 1.75) /
      5;

    // Normalize to a range with Classic at 1.0
    return Math.max(0.5, Math.min(2.0, weightedMultiplier));
  } catch (error) {
    console.error("Error calculating difficulty multiplier:", error);
    return 1.0;
  }
}

function updateDifficultyMultiplier() {
  // Calculate multiplier
  const multiplier = calculateDifficultyMultiplier();

  // Update display
  const difficultyValueElement = document.getElementById("difficultyValue");
  const difficultyBarElement = document.getElementById("difficultyBar");

  if (difficultyValueElement) {
    difficultyValueElement.textContent = multiplier.toFixed(2) + "x";
  }

  if (difficultyBarElement) {
    // Convert multiplier (0.5 to 2.0) to a percentage (0 to 100)
    const percentage = ((multiplier - 0.5) / 1.5) * 100;
    difficultyBarElement.style.width = `${percentage}%`;
    difficultyBarElement.setAttribute("aria-valuenow", percentage);
  }
}

// Validation helper functions
function validateInput(inputId, min, max, fieldName) {
  const input = document.getElementById(inputId);
  const value = parseInt(input.value);
  const errorElement =
    document.getElementById(`${inputId}Error`) || createErrorElement(inputId);

  // Clear previous validation state
  input.classList.remove("is-invalid", "is-valid");
  errorElement.textContent = "";
  errorElement.style.display = "none";

  if (isNaN(value) || value < min || value > max) {
    // Show error state
    input.classList.add("is-invalid");
    errorElement.textContent = `${fieldName} must be between ${min} and ${max}`;
    errorElement.style.display = "block";
    return false;
  } else {
    // Show valid state
    input.classList.add("is-valid");
    return true;
  }
}

function createErrorElement(inputId) {
  const input = document.getElementById(inputId);
  const errorElement = document.createElement("div");
  errorElement.id = `${inputId}Error`;
  errorElement.className = "invalid-feedback";
  errorElement.style.display = "none";

  // Insert after the input group or input element
  const inputGroup = input.closest(".input-group");
  if (inputGroup) {
    inputGroup.parentNode.insertBefore(errorElement, inputGroup.nextSibling);
  } else {
    input.parentNode.insertBefore(errorElement, input.nextSibling);
  }

  return errorElement;
}

function clearAllValidationStates() {
  const inputs = ["wordsGoal", "bonusEnergy", "initialEnergy", "zenWordGoal"];
  inputs.forEach((inputId) => {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(`${inputId}Error`);

    if (input) {
      input.classList.remove("is-invalid", "is-valid");
    }
    if (errorElement) {
      errorElement.style.display = "none";
    }
  });
}

function setupRealTimeValidation() {
  // Add real-time validation listeners
  const validationRules = {
    wordsGoal: { min: 1, max: 100, name: "Words Goal" },
    bonusEnergy: { min: 1, max: 10, name: "Bonus Energy" },
    initialEnergy: { min: 5, max: 30, name: "Initial Energy" },
    zenWordGoal: { min: 5, max: 100, name: "Zen Word Goal" },
  };

  Object.entries(validationRules).forEach(([inputId, rules]) => {
    const input = document.getElementById(inputId);
    if (input) {
      // Validate on blur (when user leaves the field)
      input.addEventListener("blur", () => {
        validateInput(inputId, rules.min, rules.max, rules.name);
      });

      // Clear validation state on focus (when user starts typing again)
      input.addEventListener("focus", () => {
        input.classList.remove("is-invalid", "is-valid");
        const errorElement = document.getElementById(`${inputId}Error`);
        if (errorElement) {
          errorElement.style.display = "none";
        }
      });
    }
  });

  // Add handlers for language radio buttons
  const languageRadios = document.querySelectorAll(
    'input[name="languageMode"]',
  );
  languageRadios.forEach((radio) => {
    radio.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (applyButton) {
          applyButton.click();
        }
      }
    });
  });
}

function resetSettings() {
  // Reset to classic mode
  document.getElementById("modeClassic").checked = true;

  // Load classic values
  loadPresetValues("classic");

  // Reset zen word goal to default (30)
  const zenWordGoal = document.getElementById("zenWordGoal");
  if (zenWordGoal) {
    zenWordGoal.value = 30;
  }

  // Reset show spaces to default (off)
  const showSpacesToggle = document.getElementById("showSpacesToggle");
  if (showSpacesToggle) {
    showSpacesToggle.checked = false;
  }

  // Reset language to English
  const englishRadio = document.getElementById("langEnglish");
  if (englishRadio) {
    englishRadio.checked = true;
  }
  localStorage.setItem("nerdtype_wordlist", "english");

  // Disable custom inputs
  toggleCustomSettings(false);

  // Update difficulty display
  updateDifficultyMultiplier();

  // Clear validation states
  clearAllValidationStates();

  // Show notification
  showSettingsNotification("Settings reset to defaults");
}

function applySettings() {
  // Clear any previous validation states
  clearAllValidationStates();

  // Get the selected mode
  const selectedMode = document.querySelector(
    'input[name="gameMode"]:checked',
  ).value;

  // Get selected language
  const selectedLanguage =
    document.querySelector('input[name="languageMode"]:checked')?.value ||
    "english";

  const dataCollectionToggle = document.getElementById("dataCollectionToggle");
  if (dataCollectionToggle) {
    localStorage.setItem(
      "data_collection_enabled",
      dataCollectionToggle.checked.toString(),
    );
  }

  // Validate all inputs
  let isValid = true;

  // Validate Words Goal
  if (!validateInput("wordsGoal", 1, 100, "Words Goal")) {
    isValid = false;
  }

  // Validate Bonus Energy
  if (!validateInput("bonusEnergy", 1, 10, "Bonus Energy")) {
    isValid = false;
  }

  // Validate Initial Energy
  if (!validateInput("initialEnergy", 5, 30, "Initial Energy")) {
    isValid = false;
  }

  // Validate Zen Word Goal if visible
  const zenWordGoalElement = document.getElementById("zenWordGoal");
  const zenModeSettings = document.getElementById("zenModeSettings");
  if (
    zenWordGoalElement &&
    zenModeSettings &&
    zenModeSettings.style.display !== "none"
  ) {
    if (!validateInput("zenWordGoal", 5, 100, "Zen Word Goal")) {
      isValid = false;
    }
  }

  // If validation fails, show error notification and return early
  if (!isValid) {
    showSettingsNotification(
      "Please correct the highlighted errors before applying settings",
      "error",
    );

    // Focus on the first invalid input
    const firstInvalidInput = document.querySelector(".is-invalid");
    if (firstInvalidInput) {
      firstInvalidInput.focus();
    }

    return;
  }

  // Save language setting
  const currentLanguage =
    localStorage.getItem("nerdtype_wordlist") || "english";
  if (selectedLanguage !== currentLanguage) {
    localStorage.setItem("nerdtype_wordlist", selectedLanguage);

    // Dispatch event for language change
    window.dispatchEvent(
      new CustomEvent("gameSettingsChanged", {
        detail: { setting: "language", value: selectedLanguage },
      }),
    );
  }

  // Get values from inputs (now we know they're valid)
  const timeLimit = parseInt(document.getElementById("wordsGoal").value);
  const bonusTime = parseInt(document.getElementById("bonusEnergy").value);
  const initialTime = parseInt(document.getElementById("initialEnergy").value);

  // Get Zen Mode word goal
  const zenWordGoal = document.getElementById("zenWordGoal");
  const zenWordGoalValue = zenWordGoal ? parseInt(zenWordGoal.value) : 30;

  // Get achievement sound toggle state
  const achievementSoundEnabled = document.getElementById(
    "achievementSoundToggle",
  ).checked;

  const keypressSoundEnabled = document.getElementById(
    "keypressSoundToggle",
  ).checked;

  // Get zen mode toggle state
  const zenModeEnabled = document.getElementById("zenModeToggle").checked;

  // Create settings object
  const settings = {
    timeLimit: timeLimit,
    bonusTime: bonusTime,
    initialTime: initialTime,
    goalPercentage: 100, // Keep this for compatibility with existing code
    currentMode: selectedMode,
    zenWordGoal: zenWordGoalValue, // Add zen word goal to settings
  };

  // Save game settings
  localStorage.setItem("terminalSettings", JSON.stringify(settings));

  // Save zen mode toggle state
  localStorage.setItem("nerdtype_zen_mode", zenModeEnabled);

  // Save achievement sound setting
  localStorage.setItem("achievement_sound_enabled", achievementSoundEnabled);

  // Save keypress sound setting
  localStorage.setItem("keypress_sound_enabled", keypressSoundEnabled);

  // Update achievement sound globally if possible
  if (typeof window.achievementSound !== "undefined") {
    window.achievementSound.muted = !achievementSoundEnabled;
  }

  // Update keypress sound globally if possible
  if (typeof window.keypressSound !== "undefined") {
    window.keypressSound.muted = !keypressSoundEnabled;
  }

  // Dispatch events to update game settings
  window.dispatchEvent(
    new CustomEvent("gameSettingsChanged", {
      detail: { setting: "currentMode", value: selectedMode },
    }),
  );

  window.dispatchEvent(
    new CustomEvent("gameSettingsChanged", {
      detail: { setting: "timeLimit", value: timeLimit },
    }),
  );

  window.dispatchEvent(
    new CustomEvent("gameSettingsChanged", {
      detail: { setting: "bonusTime", value: bonusTime },
    }),
  );

  window.dispatchEvent(
    new CustomEvent("gameSettingsChanged", {
      detail: { setting: "initialTime", value: initialTime },
    }),
  );

  window.dispatchEvent(
    new CustomEvent("gameSettingsChanged", {
      detail: { setting: "zenWordGoal", value: zenWordGoalValue },
    }),
  );

  // Dispatch event for achievement sound setting
  window.dispatchEvent(
    new CustomEvent("achievementSoundChanged", {
      detail: { enabled: achievementSoundEnabled },
    }),
  );

  // Dispatch event for keypress sound setting
  window.dispatchEvent(
    new CustomEvent("keypressSoundChanged", {
      detail: { enabled: keypressSoundEnabled },
    }),
  );

  // Get show spaces toggle state
  const showSpacesEnabled = document.getElementById("showSpacesToggle").checked;

  // Save show spaces setting
  localStorage.setItem("showSpacesAfterWords", showSpacesEnabled);

  // Dispatch event for show spaces setting
  window.dispatchEvent(
    new CustomEvent("gameSettingsChanged", {
      detail: { setting: "showSpacesAfterWords", value: showSpacesEnabled },
    }),
  );

  // Close the modal
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("settingsModal"),
  );
  if (modal) {
    modal.hide();
  }

  // Show success notification
  showSettingsNotification("Settings applied successfully");

  // Reload the page to apply settings
  location.reload();
}

function initSoundSettings() {
  // Check if achievement sound should be enabled or disabled
  const achievementSoundEnabled = localStorage.getItem(
    "achievement_sound_enabled",
  );

  const keypressSoundEnabled = localStorage.getItem("keypress_sound_enabled");

  // Default is enabled if setting doesn't exist
  const soundEnabled =
    achievementSoundEnabled === null || achievementSoundEnabled === "true";
  const keypressSoundEnabledBool =
    keypressSoundEnabled === null || keypressSoundEnabled === "true";

  // If the achievement sound exists, update its muted state
  if (typeof window.achievementSound !== "undefined") {
    window.achievementSound.muted = !soundEnabled;
  }

  if (typeof window.keypressSound !== "undefined") {
    window.keypressSound.muted = !keypressSoundEnabledBool;
  }

  // Setup global event listener to handle achievement sound initialization
  // This helps when the achievement sound is loaded after this script runs
  window.addEventListener("achievement_sound_loaded", function (e) {
    const soundEnabled = localStorage.getItem("achievement_sound_enabled");
    if (e.detail && e.detail.sound && soundEnabled === "false") {
      e.detail.sound.muted = true;
    }
  });

  window.addEventListener("keypress_sound_loaded", function (e) {
    const soundEnabled = localStorage.getItem("keypress_sound_enabled");
    if (e.detail && e.detail.sound && soundEnabled === "false") {
      e.detail.sound.muted = true;
    }
  });

  // Also handle the achievement system if it's available
  if (
    typeof window.achievementSystem !== "undefined" &&
    typeof window.achievementSystem.setAchievementSoundEnabled === "function"
  ) {
    window.achievementSystem.setAchievementSoundEnabled(soundEnabled);
  }
}

function showSettingsNotification(message, type = "success") {
  // Create notification container if it doesn't exist
  let notificationContainer = document.getElementById("settings-notifications");

  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.id = "settings-notifications";
    notificationContainer.style.position = "fixed";
    notificationContainer.style.bottom = "10px";
    notificationContainer.style.right = "10px";
    notificationContainer.style.zIndex = "9999";
    document.body.appendChild(notificationContainer);
  }

  // Create notification
  const notification = document.createElement("div");
  notification.className = `game-command-notification ${type}`;
  notification.textContent = message;
  notificationContainer.appendChild(notification);

  // Remove after animation completes
  setTimeout(() => {
    notification.remove();
  }, 3000);
}
