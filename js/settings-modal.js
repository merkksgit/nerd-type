document.addEventListener("DOMContentLoaded", function () {
  // Initialize the settings modal
  initSettingsModal();
  setupSettingsModalEvents();

  // Add event listener to the settings button
  const settingsButton = document.getElementById("openSettingsBtn");
  if (settingsButton) {
    settingsButton.addEventListener("click", openSettingsModal);
  }
  initFontSettings();
  // Initialize sound settings
  initSoundSettings();
});

function setupSettingsModalEvents() {
  const settingsModal = document.getElementById("settingsModal");

  if (settingsModal) {
    // Load settings when modal is actually shown (this fixes the reset issue)
    settingsModal.addEventListener("shown.bs.modal", function () {
      console.log("Settings modal shown, loading current settings...");
      loadSettings();
    });

    // Also load when modal is about to be shown for good measure
    settingsModal.addEventListener("show.bs.modal", function () {
      console.log("Settings modal about to show, pre-loading settings...");
      loadSettings();
    });

    // Stop webhook status checks when modal is hidden to save bandwidth
    settingsModal.addEventListener("hidden.bs.modal", function () {
      if (window.webhookStatusChecker) {
        window.webhookStatusChecker.stopPeriodicCheck();
      }
    });
  }
}

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
  setupRealTimeValidation();

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

    // Auto-set word goal when Alice is selected and lock it
    radio.addEventListener("change", function (event) {
      const zenWordGoalInput = document.getElementById("zenWordGoal");
      if (zenWordGoalInput) {
        if (event.target.value === "alice") {
          zenWordGoalInput.value = 254;
          zenWordGoalInput.disabled = true;
          zenWordGoalInput.readOnly = true;
          zenWordGoalInput.style.opacity = "0.6";
          zenWordGoalInput.style.cursor = "not-allowed";
          zenWordGoalInput.title =
            "Alice in Wonderland requires exactly 254 words";
        } else {
          zenWordGoalInput.disabled = false;
          zenWordGoalInput.readOnly = false;
          zenWordGoalInput.style.opacity = "";
          zenWordGoalInput.style.cursor = "";
          zenWordGoalInput.title = "";
          zenWordGoalInput.value = 30;
        }
      }
    });
  });
}

const zenModeToggle = document.getElementById("zenModeToggle");
if (zenModeToggle) {
  zenModeToggle.checked = localStorage.getItem("nerdtype_zen_mode") === "true";

  zenModeToggle.addEventListener("change", function () {
    localStorage.setItem("nerdtype_zen_mode", this.checked);

    // If switching zen mode off and alice wordset is selected, fallback to english
    if (!this.checked) {
      const currentWordlist = localStorage.getItem("nerdtype_wordlist");
      if (currentWordlist === "alice") {
        localStorage.setItem("nerdtype_wordlist", "english");
        // Update the selected radio button in the UI
        const englishRadio = document.getElementById("langEnglish");
        if (englishRadio) {
          englishRadio.checked = true;
        }
      }
    }

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
  // Open the modal first
  const settingsModal = new bootstrap.Modal(
    document.getElementById("settingsModal"),
  );
  settingsModal.show();

  // Load settings with a small delay to ensure modal is ready
  // This is a backup in case the Bootstrap events don't fire
  setTimeout(() => {
    loadSettings();
  }, 100);
}

function loadSettings() {
  // Loading settings into modal

  // Set show spaces toggle
  const showSpacesToggle = document.getElementById("showSpacesToggle");
  if (showSpacesToggle) {
    const spacesAfterWords = localStorage.getItem("showSpacesAfterWords");
    showSpacesToggle.checked =
      spacesAfterWords === null || spacesAfterWords === "true";
  }

  // Set punctuation toggle
  const punctuationToggle = document.getElementById("punctuationToggle");
  if (punctuationToggle) {
    const punctuationEnabled = localStorage.getItem("punctuation_enabled");
    punctuationToggle.checked = punctuationEnabled === "true";
  }

  // Get saved settings or use defaults
  const gameSettings = JSON.parse(localStorage.getItem("gameSettings")) || {
    timeLimit: 30,
    bonusTime: 3,
    initialTime: 10,
    goalPercentage: 100,
    currentMode: "classic",
    zenWordGoal: 30,
  };

  // Current game settings loaded

  // Load data collection setting (default is enabled)
  const dataCollectionEnabled = localStorage.getItem("data_collection_enabled");
  const dataCollectionToggle = document.getElementById("dataCollectionToggle");

  if (dataCollectionToggle) {
    dataCollectionToggle.checked =
      dataCollectionEnabled === null || dataCollectionEnabled === "true";
  }

  // Load Discord webhook setting (default is enabled)
  const discordWebhookEnabled = localStorage.getItem("discord_webhook_enabled");
  const discordWebhookToggle = document.getElementById("discordWebhookToggle");

  if (discordWebhookToggle) {
    discordWebhookToggle.checked =
      discordWebhookEnabled === null || discordWebhookEnabled === "true";
  }

  // Initialize webhook status checker if available
  if (window.webhookStatusChecker) {
    initWebhookStatusUI();
    // Start periodic checks only when settings modal is opened
    window.webhookStatusChecker.startPeriodicCheck(60000); // Check every minute
  }

  // Update data collection visibility based on auth status
  updateDataCollectionSettingVisibility();

  // Load language setting
  const currentLanguage =
    localStorage.getItem("nerdtype_wordlist") || "english";
  const languageRadio = document.querySelector(
    `input[name="languageMode"][value="${currentLanguage}"]`,
  );
  if (languageRadio) {
    languageRadio.checked = true;
  }

  // If Alice is selected, lock the zen word goal
  const zenWordGoalInput = document.getElementById("zenWordGoal");
  if (currentLanguage === "alice" && zenWordGoalInput) {
    zenWordGoalInput.value = 254;
    zenWordGoalInput.disabled = true;
    zenWordGoalInput.readOnly = true;
    zenWordGoalInput.style.opacity = "0.6";
    zenWordGoalInput.style.cursor = "not-allowed";
    zenWordGoalInput.title = "Alice in Wonderland requires exactly 254 words";
  } else if (zenWordGoalInput) {
    zenWordGoalInput.disabled = false;
    zenWordGoalInput.readOnly = false;
    zenWordGoalInput.style.opacity = "";
    zenWordGoalInput.style.cursor = "";
    zenWordGoalInput.title = "";
  }

  // Set form values
  const wordsGoalInput = document.getElementById("wordsGoal");
  const bonusEnergyInput = document.getElementById("bonusEnergy");
  const initialEnergyInput = document.getElementById("initialEnergy");

  if (wordsGoalInput) wordsGoalInput.value = gameSettings.timeLimit;
  if (bonusEnergyInput) bonusEnergyInput.value = gameSettings.bonusTime;
  if (initialEnergyInput) initialEnergyInput.value = gameSettings.initialTime;

  // Set Zen Mode toggle
  const zenModeToggle = document.getElementById("zenModeToggle");
  if (zenModeToggle) {
    zenModeToggle.checked =
      localStorage.getItem("nerdtype_zen_mode") === "true";

    // Update visibility of classic-mode settings based on zen mode state
    const isZenMode = zenModeToggle.checked;
    document.querySelectorAll(".classic-mode-setting").forEach((el) => {
      el.style.display = isZenMode ? "none" : "block";
    });
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
    // Set mode radio for current mode
  }

  // Load master sound toggle (controls all sounds)
  const masterSoundEnabled = localStorage.getItem("master_sound_enabled");
  const masterSoundToggle = document.getElementById("masterSoundToggle");

  // Default to enabled if not set
  if (masterSoundToggle) {
    masterSoundToggle.checked = masterSoundEnabled !== "false";
  }

  // Load keypress volume setting
  const keypressVolume = localStorage.getItem("keypress_sound_volume") || "50";
  const keypressVolumeSlider = document.getElementById("keypressVolumeSlider");
  const volumeValueDisplay = document.getElementById("volumeValueDisplay");

  if (keypressVolumeSlider) {
    keypressVolumeSlider.value = keypressVolume;
  }
  if (volumeValueDisplay) {
    volumeValueDisplay.textContent = `${keypressVolume}%`;
  }

  // Volume slider event listener
  if (keypressVolumeSlider) {
    keypressVolumeSlider.addEventListener("input", function () {
      const volume = this.value;
      if (volumeValueDisplay) {
        volumeValueDisplay.textContent = `${volume}%`;
      }
      if (window.updateKeypressVolume) {
        window.updateKeypressVolume(volume / 100);
      }
    });
  }

  // Load keypress sound selection setting
  const keypressSoundFile =
    localStorage.getItem("keypress_sound_file") || "typewriter.wav";
  const keypressSoundRadio = document.querySelector(
    `input[name="keypressSound"][value="${keypressSoundFile}"]`,
  );
  if (keypressSoundRadio) {
    keypressSoundRadio.checked = true;
  }

  // Show/hide volume slider and sound selection based on keypress sound toggle
  const keypressVolumeContainer = document.getElementById(
    "keypressVolumeContainer",
  );
  const keypressSoundSelectionContainer = document.getElementById(
    "keypressSoundSelectionContainer",
  );

  function updateVolumeSliderVisibility() {
    if (keypressVolumeContainer && keypressSoundSelectionContainer) {
      const isMasterSoundEnabled = masterSoundToggle
        ? masterSoundToggle.checked
        : true;
      keypressVolumeContainer.style.display = isMasterSoundEnabled
        ? "block"
        : "none";
      keypressSoundSelectionContainer.style.display = isMasterSoundEnabled
        ? "block"
        : "none";
    }
  }

  // Set initial visibility
  updateVolumeSliderVisibility();

  // Update visibility when toggle changes
  if (masterSoundToggle) {
    masterSoundToggle.addEventListener("change", updateVolumeSliderVisibility);
  }

  // font selection
  const currentFont =
    localStorage.getItem("nerdtype_font") || "jetbrains-light";
  const fontRadio = document.querySelector(
    `input[name="fontFamily"][value="${currentFont}"]`,
  );
  if (fontRadio) {
    fontRadio.checked = true;
  }
  applyFont(currentFont);
  updateFontPreview(currentFont);

  // Load minimal UI setting
  const minimalUIEnabled = localStorage.getItem("nerdtype_hide_ui") === "true";
  const minimalUIToggle = document.getElementById("minimalUIToggle");
  if (minimalUIToggle) {
    minimalUIToggle.checked = minimalUIEnabled;
  }

  // Toggle custom settings based on mode
  toggleCustomSettings(gameSettings.currentMode === "custom");

  // Update difficulty multiplier
  updateDifficultyMultiplier();

  // Clear any validation states when loading settings
  clearAllValidationStates();

  // Settings loaded successfully
}

function toggleCustomSettings(isCustom) {
  const customInputs = document.querySelectorAll(
    "#wordsGoal, #bonusEnergy, #initialEnergy",
  );

  // If custom mode is selected, enable inputs, otherwise disable them
  customInputs.forEach((input) => {
    input.disabled = !isCustom;
    input.parentElement.classList.toggle("opacity-50", !isCustom);
  });
}

function updateDataCollectionSettingVisibility() {
  const dataCollectionContainer = document
    .querySelector("#dataCollectionToggle")
    .closest(".form-check");
  const dataCollectionToggle = document.getElementById("dataCollectionToggle");
  const dataCollectionLabel = dataCollectionContainer?.querySelector("label");

  if (!dataCollectionContainer || !dataCollectionToggle) return;

  // Check if user is authenticated
  const currentUser = window.getCurrentUser && window.getCurrentUser();
  const isAuthenticated = currentUser != null;

  // Always show the setting as enabled and clickable
  dataCollectionContainer.style.display = "block";
  dataCollectionToggle.disabled = false;
  dataCollectionContainer.style.opacity = "1";

  if (dataCollectionLabel) {
    if (isAuthenticated) {
      dataCollectionLabel.innerHTML = `
        Share scores to global leaderboards
      `;
    } else {
      dataCollectionLabel.innerHTML = `
        Share scores to global leaderboards
<small class="d-block text-muted">Login required</small>
      `;
    }
  }
}

// Also update when auth state changes
function onAuthStateChange() {
  // Call this whenever user logs in/out
  if (document.getElementById("settingsModal")?.classList.contains("show")) {
    // If settings modal is currently open, update the visibility
    updateDataCollectionSettingVisibility();
  }
}

// Add CSS to style the disabled state
if (!document.querySelector("#disabled-settings-style")) {
  const styleElement = document.createElement("style");
  styleElement.id = "disabled-settings-style";
  styleElement.textContent = `
    .form-check:has(input:disabled) {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .form-check:has(input:disabled) label {
      cursor: not-allowed;
    }
    
    .form-check:has(input:disabled) .text-warning {
      color: #ffc107 !important;
      font-size: 0.85rem;
    }
  `;
  document.head.appendChild(styleElement);
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
    "#wordsGoal, #bonusEnergy, #initialEnergy",
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
    hardcore: {
      timeLimit: 30,
      bonusTime: 2,
      initialTime: 4,
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

function updateDifficultyMultiplier() {
  const wordsGoal = parseInt(document.getElementById("wordsGoal").value) || 30;
  const bonusEnergy =
    parseInt(document.getElementById("bonusEnergy").value) || 3;
  const initialEnergy =
    parseInt(document.getElementById("initialEnergy").value) || 10;

  const settings = {
    timeLimit: wordsGoal, // wordsGoal maps to timeLimit
    bonusTime: bonusEnergy, // bonusEnergy maps to bonusTime
    initialTime: initialEnergy, // initialEnergy maps to initialTime
  };

  const difficultyMultiplier = calculateDifficultyMultiplierCorrect(settings);

  // Fix the element ID AND add the "x" suffix
  const difficultyElement = document.getElementById("difficultyValue");
  if (difficultyElement) {
    difficultyElement.textContent = difficultyMultiplier.toFixed(2) + "x";
  }

  // Also update the progress bar
  const difficultyBar = document.getElementById("difficultyBar");
  if (difficultyBar) {
    // Normalize to 0-100% based on the actual range (0.5 to 2.0)
    const minDifficulty = 0.5;
    const maxDifficulty = 2.0;
    const normalizedScore = Math.min(
      100,
      Math.max(
        0,
        ((difficultyMultiplier - minDifficulty) /
          (maxDifficulty - minDifficulty)) *
          100,
      ),
    );

    difficultyBar.style.width = normalizedScore + "%";
    difficultyBar.setAttribute("aria-valuenow", normalizedScore);
  }
}

function calculateDifficultyMultiplierCorrect(settings) {
  try {
    const refTimeLimit = 30;
    const refBonusTime = 3;
    const refInitialTime = 10;

    // For timeLimit, MORE words (HIGHER limit) is HARDER
    const timeLimitFactor = Math.min(
      3,
      Math.max(1, settings.timeLimit) / refTimeLimit,
    );

    // For bonus and initial time, LOWER is HARDER
    const bonusTimeFactor = Math.min(
      3,
      refBonusTime / Math.max(0.5, settings.bonusTime),
    );
    const initialTimeFactor = Math.min(
      3,
      refInitialTime / Math.max(0.5, settings.initialTime),
    );

    const weightedMultiplier =
      (timeLimitFactor * 1.5 +
        bonusTimeFactor * 1.75 +
        initialTimeFactor * 1.75) /
      5;

    return Math.max(0.5, Math.min(2.0, weightedMultiplier));
  } catch (error) {
    console.error("Error calculating difficulty multiplier:", error);
    return 1.0;
  }
}

function clearAllValidationStates() {
  const inputs = document.querySelectorAll("#settingsModal input");
  inputs.forEach((input) => {
    input.classList.remove("is-invalid", "is-valid");
  });

  const errorElements = document.querySelectorAll("[id$='Error']");
  errorElements.forEach((error) => {
    error.style.display = "none";
  });
}

function setupRealTimeValidation() {
  const validationRules = {
    wordsGoal: { min: 10, max: 500, name: "Words Goal" },
    bonusEnergy: { min: 1, max: 10, name: "Bonus Energy" },
    initialEnergy: { min: 4, max: 20, name: "Initial Energy" },
    zenWordGoal: { min: 10, max: 500, name: "Zen Word Goal" },
  };

  const applyButton = document.getElementById("applySettingsBtn");

  Object.entries(validationRules).forEach(([inputId, rules]) => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener("input", () => {
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
}

function validateInput(inputId, min, max, fieldName) {
  const input = document.getElementById(inputId);
  if (!input) return true; // If input doesn't exist, consider it valid

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

  // Reset show spaces to default (on)
  const showSpacesToggle = document.getElementById("showSpacesToggle");
  if (showSpacesToggle) {
    showSpacesToggle.checked = true;
  }

  // Reset punctuation to default (off)
  const punctuationToggle = document.getElementById("punctuationToggle");
  if (punctuationToggle) {
    punctuationToggle.checked = false;
  }

  // Reset sound settings to default (enabled)
  const masterSoundToggle = document.getElementById("masterSoundToggle");
  if (masterSoundToggle) {
    masterSoundToggle.checked = true;
  }

  // Reset minimal UI toggle to default (off)
  const minimalUIToggle = document.getElementById("minimalUIToggle");
  if (minimalUIToggle) {
    minimalUIToggle.checked = false;
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

async function applySettings() {
  // Clear any previous validation states
  clearAllValidationStates();

  // Get the selected mode
  const selectedModeElement = document.querySelector(
    'input[name="gameMode"]:checked',
  );
  if (!selectedModeElement) {
    console.error("No game mode selected");
    showSettingsNotification("Please select a game mode", "error");
    return;
  }
  const selectedMode = selectedModeElement.value;

  // Get selected language
  const selectedLanguage =
    document.querySelector('input[name="languageMode"]:checked')?.value ||
    "english";

  const dataCollectionToggle = document.getElementById("dataCollectionToggle");
  if (dataCollectionToggle) {
    localStorage.setItem(
      "data_collection_enabled",
      dataCollectionToggle.checked,
    );
  }

  const discordWebhookToggle = document.getElementById("discordWebhookToggle");
  if (discordWebhookToggle) {
    localStorage.setItem(
      "discord_webhook_enabled",
      discordWebhookToggle.checked,
    );
  }

  // Get form values
  const wordsGoal = parseInt(document.getElementById("wordsGoal").value);
  const bonusEnergy = parseInt(document.getElementById("bonusEnergy").value);
  const initialEnergy = parseInt(
    document.getElementById("initialEnergy").value,
  );
  const zenWordGoal =
    parseInt(document.getElementById("zenWordGoal").value) || 30;

  // Validate all inputs with correct ranges
  let isValid = true;

  if (!validateInput("wordsGoal", 10, 500, "Words Goal")) {
    isValid = false;
  }
  if (!validateInput("bonusEnergy", 0, 50, "Bonus Energy")) {
    isValid = false;
  }
  if (!validateInput("initialEnergy", 1, 100, "Initial Energy")) {
    isValid = false;
  }
  if (!validateInput("zenWordGoal", 10, 500, "Zen Word Goal")) {
    isValid = false;
  }

  if (!isValid) {
    showSettingsNotification("Please fix validation errors", "error");
    return;
  }

  // Create settings object
  const gameSettings = {
    timeLimit: wordsGoal,
    bonusTime: bonusEnergy,
    initialTime: initialEnergy,
    goalPercentage: 100,
    currentMode: selectedMode,
    zenWordGoal: zenWordGoal,
  };

  // Save settings
  localStorage.setItem("gameSettings", JSON.stringify(gameSettings));

  // Save language setting
  localStorage.setItem("nerdtype_wordlist", selectedLanguage);

  // If Alice in Wonderland is selected, automatically set word goal to 249 and lock it
  if (selectedLanguage === "alice") {
    const zenWordGoalInput = document.getElementById("zenWordGoal");
    if (zenWordGoalInput) {
      zenWordGoalInput.value = 254;
      zenWordGoalInput.disabled = true;
      zenWordGoalInput.readOnly = true;
      zenWordGoalInput.style.opacity = "0.6";
      zenWordGoalInput.style.cursor = "not-allowed";
      zenWordGoalInput.title = "Alice in Wonderland requires exactly 254 words";
    }
  }

  // Get zen mode toggle state
  const zenModeEnabled = document.getElementById("zenModeToggle").checked;
  localStorage.setItem("nerdtype_zen_mode", zenModeEnabled);

  // Get font setting
  const selectedFont =
    document.querySelector('input[name="fontFamily"]:checked')?.value ||
    "jetbrains-light";
  saveFontSetting(selectedFont);

  // Get master sound setting
  const masterSoundToggle = document.getElementById("masterSoundToggle");
  const masterSoundEnabled = masterSoundToggle
    ? masterSoundToggle.checked
    : true;

  // Save master sound setting
  localStorage.setItem("master_sound_enabled", masterSoundEnabled);

  // Sync to old keys for backward compatibility
  localStorage.setItem(
    "achievement_sound_enabled",
    masterSoundEnabled.toString(),
  );
  localStorage.setItem("keypress_sound_enabled", masterSoundEnabled.toString());

  // Save keypress volume setting
  const keypressVolumeSlider = document.getElementById("keypressVolumeSlider");
  if (keypressVolumeSlider) {
    localStorage.setItem("keypress_sound_volume", keypressVolumeSlider.value);
  }

  // Save keypress sound selection
  const selectedKeypressSound =
    document.querySelector('input[name="keypressSound"]:checked')?.value ||
    "typewriter.wav";
  localStorage.setItem("keypress_sound_file", selectedKeypressSound);

  // Get minimal UI toggle state
  const minimalUIToggle = document.getElementById("minimalUIToggle");
  if (minimalUIToggle) {
    const minimalUIEnabled = minimalUIToggle.checked;
    localStorage.setItem("nerdtype_hide_ui", minimalUIEnabled);

    // Apply the UI changes immediately
    if (typeof window.applyUIHideSettings === "function") {
      window.applyUIHideSettings(minimalUIEnabled);
    }
  }

  // Get show spaces toggle state
  const showSpacesEnabled = document.getElementById("showSpacesToggle").checked;
  localStorage.setItem("showSpacesAfterWords", showSpacesEnabled);

  // Get punctuation toggle state
  const punctuationEnabled =
    document.getElementById("punctuationToggle").checked;
  localStorage.setItem("punctuation_enabled", punctuationEnabled);

  // Dispatch events to update game settings in the correct order
  // First update zen mode if needed
  window.dispatchEvent(
    new CustomEvent("gameSettingsChanged", {
      detail: { setting: "zenMode", value: zenModeEnabled },
    }),
  );

  // Then update the game mode
  window.dispatchEvent(
    new CustomEvent("gameSettingsChanged", {
      detail: { setting: "currentMode", value: selectedMode },
    }),
  );

  // Update individual settings
  window.dispatchEvent(
    new CustomEvent("gameSettingsChanged", {
      detail: { setting: "timeLimit", value: wordsGoal },
    }),
  );

  window.dispatchEvent(
    new CustomEvent("gameSettingsChanged", {
      detail: { setting: "bonusTime", value: bonusEnergy },
    }),
  );

  window.dispatchEvent(
    new CustomEvent("gameSettingsChanged", {
      detail: { setting: "initialTime", value: initialEnergy },
    }),
  );

  window.dispatchEvent(
    new CustomEvent("gameSettingsChanged", {
      detail: { setting: "zenWordGoal", value: zenWordGoal },
    }),
  );

  // Dispatch event for achievement sound setting (using master toggle)
  window.dispatchEvent(
    new CustomEvent("achievementSoundChanged", {
      detail: { enabled: masterSoundEnabled },
    }),
  );

  // Dispatch event for keypress sound setting (using master toggle)
  window.dispatchEvent(
    new CustomEvent("keypressSoundChanged", {
      detail: {
        enabled: masterSoundEnabled,
        soundFile: selectedKeypressSound,
      },
    }),
  );

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

  // Sync settings to Firebase if user is logged in
  if (window.canSyncSettingsToFirebase && window.canSyncSettingsToFirebase()) {
    try {
      await window.syncSettingsToFirebase();
      console.log("✅ Settings synced to Firebase after applying");
    } catch (error) {
      console.error("❌ Failed to sync settings to Firebase:", error);
    }
  }

  // Store pending notification for after reload
  localStorage.setItem(
    "pending_settings_notification",
    JSON.stringify({
      message: "Settings applied successfully",
      type: "success",
    }),
  );

  // Show immediate notification, then reload
  showSettingsNotification("Applying settings...", "info");

  // Reload the page to ensure all settings are properly applied
  setTimeout(() => {
    location.reload();
  }, 500);
}

function initSoundSettings() {
  // Check if achievement sound should be enabled or disabled
  const achievementSoundEnabled = localStorage.getItem(
    "achievement_sound_enabled",
  );

  const keypressSoundEnabled = localStorage.getItem("keypress_sound_enabled");

  // Default is disabled if setting doesn't exist
  const soundEnabled = achievementSoundEnabled === "true";
  const keypressSoundEnabledBool = keypressSoundEnabled === "true";

  // If the achievement sound exists, update its muted state
  if (typeof window.achievementSound !== "undefined") {
    window.achievementSound.muted = !soundEnabled;
  }

  if (typeof window.keypressSound !== "undefined") {
    window.keypressSound.muted = !keypressSoundEnabledBool;
  }

  // Setup global event listener to handle achievement sound initialization
  // This helps when the achievement sound is loaded after this script runs
  window.addEventListener("achievement_sound_loaded", function () {
    if (typeof window.achievementSound !== "undefined") {
      window.achievementSound.muted = !soundEnabled;
    }
  });

  window.addEventListener("keypress_sound_loaded", function () {
    if (typeof window.keypressSound !== "undefined") {
      window.keypressSound.muted = !keypressSoundEnabledBool;
    }
  });
}

function showSettingsNotification(message, type = "success") {
  // Prevent duplicate notifications with the same message within 1 second
  const currentTime = Date.now();
  const lastNotificationKey = `last_notification_${message.replace(/\s+/g, "_")}`;
  const lastNotificationTime = localStorage.getItem(lastNotificationKey);

  if (
    lastNotificationTime &&
    currentTime - parseInt(lastNotificationTime) < 1000
  ) {
    return; // Skip duplicate notification
  }

  localStorage.setItem(lastNotificationKey, currentTime.toString());

  // Use the same notification system as the game commands
  let notificationContainer = document.getElementById(
    "game-command-notifications",
  );

  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.id = "game-command-notifications";
    notificationContainer.style.position = "fixed";
    notificationContainer.style.bottom = "10px";
    notificationContainer.style.right = "10px";
    notificationContainer.style.zIndex = "9999";
    document.body.appendChild(notificationContainer);

    if (!document.querySelector("#game-command-notification-styles")) {
      const style = document.createElement("style");
      style.id = "game-command-notification-styles";
      style.textContent = `
        .game-command-notification {
          padding: 10px 15px;
          margin-bottom: 10px;
          color: white;
          max-width: 350px;
          animation: fadeInOut 3s forwards;
          box-shadow: 0 0 10px rgba(31, 35, 53, 1);
        }
        .game-command-notification.success {
          background-color: rgba(31, 35, 53, 1);
          border-left: 4px solid #c3e88d;
        }
        .game-command-notification.error {
          background-color: rgba(31, 35, 53, 1);
          border-left: 4px solid #ff007c;
        }
        .game-command-notification.info {
          background-color: rgba(31, 35, 53, 1);
          border-left: 4px solid #7aa2f7;
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(20px); }
          10% { opacity: 1; transform: translateX(0); }
          90% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(20px); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Create and append the notification
  const notification = document.createElement("div");
  notification.className = `game-command-notification ${type}`;
  notification.innerHTML = message;
  notificationContainer.appendChild(notification);

  // Remove after animation completes
  setTimeout(() => {
    if (notification && notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

// Font management functions
function initFontSettings() {
  const currentFont =
    localStorage.getItem("nerdtype_font") || "jetbrains-light";
  applyFont(currentFont);

  const fontRadio = document.querySelector(
    `input[name="fontFamily"][value="${currentFont}"]`,
  );
  if (fontRadio) {
    fontRadio.checked = true;
  }

  // Add event listeners for font preview
  const fontRadios = document.querySelectorAll('input[name="fontFamily"]');
  fontRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.checked) {
        updateFontPreview(this.value);
      }
    });
  });

  updateFontPreview(currentFont);
}

function updateFontPreview(fontFamily) {
  const preview = document.getElementById("fontPreview");
  if (preview) {
    preview.style.fontFamily = fontFamily;
  }
}

function applyFont(fontFamily) {
  document.documentElement.style.setProperty("--game-font", fontFamily);

  const gameElements = document.querySelectorAll(`
    #userInput, 
    #nextWord, 
    #wordToType,
    #wordToType span,
    #currentGameMode,
    #timer,
    #progressPercentage,
    #precisionMultiplier,
    .game-interface,
    .typing-area
  `);

  gameElements.forEach((element) => {
    element.style.fontFamily = fontFamily;
  });
}

function saveFontSetting(fontFamily) {
  localStorage.setItem("nerdtype_font", fontFamily);
  applyFont(fontFamily);

  window.dispatchEvent(
    new CustomEvent("fontChanged", {
      detail: { fontFamily: fontFamily },
    }),
  );
}

// Webhook status UI management
function initWebhookStatusUI() {
  const statusIcon = document.getElementById("webhookStatusIcon");
  const statusText = document.getElementById("webhookStatusText");

  if (!statusIcon || !statusText || !window.webhookStatusChecker) {
    return;
  }

  // Update UI when status changes
  window.webhookStatusChecker.addStatusListener((status, timestamp) => {
    updateWebhookStatusDisplay(status);
  });

  // Initial status check
  window.webhookStatusChecker.checkStatus().then((status) => {
    updateWebhookStatusDisplay(status);
  });
}

function updateWebhookStatusDisplay(status) {
  const statusIcon = document.getElementById("webhookStatusIcon");
  const statusText = document.getElementById("webhookStatusText");

  if (!statusIcon || !statusText || !window.webhookStatusChecker) {
    return;
  }

  const display = window.webhookStatusChecker.getStatusDisplay();

  statusIcon.textContent = display.icon;
  statusText.textContent = display.text;
  statusText.style.color = display.color;
  statusText.title = display.description;
}
