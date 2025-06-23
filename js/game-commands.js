// game-commands.js - Handles direct game commands input from the user input field
// These allow players to use terminal commands directly in the game
// This module allows using terminal commands directly in the game input field
// All commands need to start with a slash (/)
import {
  currentLanguage,
  loadWordList,
  availableWordLists,
} from "./word-list-manager.js";

class GameCommands {
  constructor() {
    // Load saved settings from localStorage or use defaults
    this.gameSettings = JSON.parse(
      localStorage.getItem("terminalSettings"),
    ) || {
      timeLimit: 30,
      bonusTime: 3,
      initialTime: 10,
      goalPercentage: 100,
      currentMode: "classic",
    };

    // Define available game modes
    this.gameModes = {
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

    // Available commands
    this.commands = {
      "/setwords": this.setWords.bind(this),
      "/setbonus": this.setBonus.bind(this),
      "/setinitial": this.setInitial.bind(this),
      "/mode": this.setMode.bind(this),
      "/zen": this.setZenMode.bind(this),
      "/lang": this.setLanguage.bind(this),
      "/language": this.setLanguage.bind(this), // Alias for /lang
      "/space": this.toggleSpaceAfterWords.bind(this),
      "/spaces": this.toggleSpaceAfterWords.bind(this), // Alias for /space
      "/sound": this.toggleKeypressSound.bind(this),
      "/help": this.showHelp.bind(this),
      "/status": this.showStatus.bind(this),
      "/reset": this.resetGame.bind(this),
      "/data": this.toggleDataCollection.bind(this),
    };

    // Commands that need reload after execution
    this.reloadCommands = [
      "/setwords",
      "/setbonus",
      "/setinitial",
      "/mode",
      "/zen",
      "/lang",
      "/language",
      "/space",
      "/spaces",
      "/reset",
      "/sound",
      "/data",
    ];
  }

  // Initialize by attaching to the user input field
  init() {
    const userInput = document.getElementById("userInput");
    if (!userInput) return;

    // Add input event listener for command detection
    userInput.addEventListener("input", (e) => {
      const inputValue = e.target.value;

      // Check if the input starts with a slash
      if (inputValue.startsWith("/")) {
        // Prevent event propagation to avoid triggering the game's input handling
        e.stopPropagation();

        // Check if Enter was pressed
        if (
          e.inputType === "insertLineBreak" ||
          e.inputType === "insertParagraph"
        ) {
          this.handleCommand(inputValue);
          e.target.value = "";
        }
      }
    });

    // Listen for Enter key specifically
    userInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && userInput.value.startsWith("/")) {
        e.preventDefault();
        this.handleCommand(userInput.value);
        userInput.value = "";
      }
    });
  }

  // Helper method to check if current settings create a custom mode
  checkIfCustomMode() {
    // Get current settings
    const currentSettings = {
      timeLimit: this.gameSettings.timeLimit,
      bonusTime: this.gameSettings.bonusTime,
      initialTime: this.gameSettings.initialTime,
    };

    // Convert to string for comparison
    const currentSettingsString = JSON.stringify(currentSettings);

    // Check against preset modes
    const matchingMode = Object.entries(this.gameModes).find(
      ([_, modeSettings]) =>
        JSON.stringify(modeSettings) === currentSettingsString,
    );

    // If found a matching preset, return its name
    if (matchingMode) {
      return matchingMode[0];
    }

    // Otherwise it's custom
    return "custom";
  }

  // Handle commands entered in the game input
  handleCommand(input) {
    // Extract command and arguments
    const parts = input.trim().split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Reset command mode state
    if (typeof window.isCommandMode !== "undefined") {
      window.isCommandMode = false;

      // If we were tracking command start time, adjust game start time
      if (
        typeof window.commandStartTime !== "undefined" &&
        window.commandStartTime &&
        typeof window.gameStartTime !== "undefined" &&
        window.gameStartTime
      ) {
        const commandDuration = Date.now() - window.commandStartTime;
        window.gameStartTime += commandDuration; // Adjust for command mode duration
      }

      // Reset command start time
      if (typeof window.commandStartTime !== "undefined") {
        window.commandStartTime = null;
      }
    }

    // Resume all timers if they were paused and game is active
    if (
      typeof window.wasPaused !== "undefined" &&
      typeof window.hasStartedTyping !== "undefined"
    ) {
      if (window.wasPaused && window.hasStartedTyping) {
        window.countDownInterval = setInterval(window.countDown, 800);
        window.totalTimeInterval = setInterval(window.totalTimeCount, 1000);
        window.wasPaused = false;
      }
    }

    // Check if the command exists
    if (this.commands[command]) {
      this.commands[command](args);

      // Check if we should reload after this command
      if (this.reloadCommands.includes(command)) {
        this.showNotification("Reloading game...", "info");
        setTimeout(() => {
          location.reload();
        }, 2000); // Wait x seconds before reload to allow notification to be seen
      }
    } else {
      this.showNotification(
        `Unknown command: ${command}. Type /help for available commands.`,
        "error",
      );
    }
  }

  toggleDataCollection(args) {
    // Get current state
    const currentState = localStorage.getItem("data_collection_enabled");
    const isCurrentlyEnabled = currentState === null || currentState === "true";

    // Determine new state
    let newState;
    if (args.length === 0) {
      // Toggle current state
      newState = !isCurrentlyEnabled;
    } else {
      // Set based on argument (on/off, true/false, 1/0)
      const arg = args[0].toLowerCase();
      newState =
        arg === "on" ||
        arg === "true" ||
        arg === "1" ||
        arg === "enable" ||
        arg === "enabled";
    }

    // Update localStorage
    localStorage.setItem("data_collection_enabled", newState.toString());

    // Show notification
    this.showNotification(
      `Data collection ${newState ? "enabled" : "disabled"}. ${newState ? "Scores will be saved to global leaderboards." : "All data stays local on your device."}`,
      "success",
    );
  }

  toggleKeypressSound(args) {
    // Get current state
    const currentState =
      localStorage.getItem("keypress_sound_enabled") === "false" ? false : true; // Default is true

    // Determine new state
    let newState;
    if (args.length === 0) {
      // Toggle current state
      newState = !currentState;
    } else {
      // Set based on argument (on/off, true/false, 1/0)
      const arg = args[0].toLowerCase();
      newState =
        arg === "on" ||
        arg === "true" ||
        arg === "1" ||
        arg === "enable" ||
        arg === "enabled";
    }

    // Update localStorage
    localStorage.setItem("keypress_sound_enabled", newState.toString());

    // Update the keypress sound if it exists
    if (typeof window.keypressSound !== "undefined") {
      window.keypressSound.muted = !newState;
    }

    // Dispatch event to update the setting
    window.dispatchEvent(
      new CustomEvent("keypressSoundChanged", {
        detail: { enabled: newState },
      }),
    );

    // Show notification
    this.showNotification(
      `Keypress sound ${newState ? "enabled" : "disabled"}`,
      "success",
    );
  }

  // Toggle space after words command
  toggleSpaceAfterWords(args) {
    // Get current state
    const currentState =
      localStorage.getItem("showSpacesAfterWords") === "true";

    // Determine new state
    let newState;
    if (args.length === 0) {
      // Toggle current state
      newState = !currentState;
    } else {
      // Set based on argument (on/off, true/false, 1/0)
      const arg = args[0].toLowerCase();
      newState =
        arg === "on" ||
        arg === "true" ||
        arg === "1" ||
        arg === "enable" ||
        arg === "enabled";
    }

    // Update localStorage
    localStorage.setItem("showSpacesAfterWords", newState.toString());

    // Dispatch event to update the game setting
    window.dispatchEvent(
      new CustomEvent("gameSettingsChanged", {
        detail: { setting: "showSpacesAfterWords", value: newState },
      }),
    );

    // Show notification
    this.showNotification(
      `Space after words ${newState ? "enabled" : "disabled"}`,
      "success",
    );
  }

  // Set language command
  async setLanguage(args) {
    const language = args[0];

    // If no argument provided, show available languages
    if (!language) {
      const availableLanguages = Object.keys(availableWordLists);
      const languageList = availableLanguages
        .map((lang) => {
          const langInfo = availableWordLists[lang];
          return `${lang} (${langInfo.name})`;
        })
        .join(", ");

      this.showNotification(
        `Available languages: ${languageList}. Usage: /lang <language>. Tip: Use Settings panel for easier selection with radio buttons.`,
        "info",
      );
      return;
    }

    // Check if the language exists
    if (!availableWordLists[language]) {
      const availableLanguages = Object.keys(availableWordLists).join(", ");
      this.showNotification(
        `Error: Language '${language}' not found. Available: ${availableLanguages}. Tip: Use Settings panel for easier selection.`,
        "error",
      );
      return;
    }

    try {
      // Save the selected language to localStorage
      localStorage.setItem("nerdtype_wordlist", language);

      // Get the language display name
      const languageDisplayName = availableWordLists[language].name;

      this.showNotification(
        `Language switched to ${languageDisplayName} (${language})`,
        "success",
      );

      // The page will reload automatically due to being in reloadCommands
    } catch (error) {
      console.error("Error switching language:", error);
      this.showNotification("Error: Failed to switch language", "error");
    }
  }

  // Reset the game
  resetGame() {
    // Check if we're currently in Zen mode
    const isCurrentlyZenMode =
      localStorage.getItem("nerdtype_zen_mode") === "true";

    if (isCurrentlyZenMode) {
      // Reset Zen Mode settings
      this.gameSettings.zenWordGoal = 30; // Reset to default zen word goal
      localStorage.setItem(
        "terminalSettings",
        JSON.stringify(this.gameSettings),
      );

      // Reset other Zen-related settings to defaults
      localStorage.setItem("nerdtype_zen_mode", "true"); // Keep in Zen mode but reset settings
      localStorage.setItem("showSpacesAfterWords", "false"); // Reset to default
      localStorage.setItem("achievement_sound_enabled", "true"); // Reset to default
      localStorage.setItem("keypress_sound_enabled", "true"); // Reset to default

      this.showNotification(
        "Resetting Zen Mode to default settings...",
        "info",
      );

      // Dispatch events to update Zen settings
      window.dispatchEvent(
        new CustomEvent("gameSettingsChanged", {
          detail: { setting: "zenWordGoal", value: 30 },
        }),
      );

      window.dispatchEvent(
        new CustomEvent("gameSettingsChanged", {
          detail: { setting: "showSpacesAfterWords", value: false },
        }),
      );

      window.dispatchEvent(
        new CustomEvent("achievementSoundChanged", {
          detail: { enabled: true },
        }),
      );

      window.dispatchEvent(
        new CustomEvent("keypressSoundChanged", {
          detail: { enabled: true },
        }),
      );
    } else {
      // Reset to classic mode settings
      const classicSettings = this.gameModes.classic;
      this.gameSettings = { ...classicSettings, currentMode: "classic" };

      // Save to localStorage
      localStorage.setItem(
        "terminalSettings",
        JSON.stringify(this.gameSettings),
      );

      // Reset other Classic-related settings
      localStorage.setItem("nerdtype_zen_mode", "false"); // Ensure Zen mode is off
      localStorage.setItem("showSpacesAfterWords", "false"); // Reset to default
      localStorage.setItem("achievement_sound_enabled", "true"); // Reset to default
      localStorage.setItem("keypress_sound_enabled", "true"); // Reset to default

      this.showNotification("Resetting game to default settings...", "info");

      // First dispatch the mode change to ensure it's not overridden
      window.dispatchEvent(
        new CustomEvent("gameSettingsChanged", {
          detail: { setting: "currentMode", value: "classic" },
        }),
      );

      // Ensure Zen mode is turned off
      window.dispatchEvent(
        new CustomEvent("gameSettingsChanged", {
          detail: { setting: "zenMode", value: false },
        }),
      );

      // Then dispatch each setting individually
      Object.entries(classicSettings).forEach(([setting, value]) => {
        window.dispatchEvent(
          new CustomEvent("gameSettingsChanged", {
            detail: { setting, value },
          }),
        );
      });

      // Reset other settings
      window.dispatchEvent(
        new CustomEvent("gameSettingsChanged", {
          detail: { setting: "showSpacesAfterWords", value: false },
        }),
      );

      window.dispatchEvent(
        new CustomEvent("achievementSoundChanged", {
          detail: { enabled: true },
        }),
      );
    }

    window.dispatchEvent(
      new CustomEvent("keypressSoundChanged", {
        detail: { enabled: true },
      }),
    );

    // Note: The page will reload automatically after this due to being in reloadCommands
  }

  // Display a notification to the user
  showNotification(message, type = "success") {
    // Create the notification container if it doesn't exist
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

      // Add notification styles
      const style = document.createElement("style");
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

    // Create and append the notification
    const notification = document.createElement("div");
    notification.className = `game-command-notification ${type}`;
    notification.innerHTML = message;
    notificationContainer.appendChild(notification);

    // Remove after animation completes
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Command implementations
  setWords(args) {
    const wordCount = parseInt(args[0]);

    if (isNaN(wordCount) || wordCount < 1) {
      this.showNotification(
        "Error: Please provide a valid number of words",
        "error",
      );
      return;
    }

    // Check if we're currently in Zen mode
    const isCurrentlyZenMode =
      localStorage.getItem("nerdtype_zen_mode") === "true";

    if (isCurrentlyZenMode) {
      // Zen Mode: Update zenWordGoal
      this.gameSettings.zenWordGoal = wordCount;
      localStorage.setItem(
        "terminalSettings",
        JSON.stringify(this.gameSettings),
      );

      this.showNotification(
        `Zen Mode word goal set to ${wordCount} words`,
        "success",
      );

      // Dispatch event to update the zen word goal
      window.dispatchEvent(
        new CustomEvent("gameSettingsChanged", {
          detail: { setting: "zenWordGoal", value: wordCount },
        }),
      );
    } else {
      // Classic Mode: Update timeLimit and check for custom mode
      this.gameSettings.timeLimit = wordCount;

      // Check if this creates a custom mode
      const currentMode = this.checkIfCustomMode();
      this.gameSettings.currentMode = currentMode;

      localStorage.setItem(
        "terminalSettings",
        JSON.stringify(this.gameSettings),
      );

      // Show mode in notification only if it's custom
      const modeText = currentMode === "custom" ? " (CUSTOM MODE)" : "";
      this.showNotification(
        `Classic Mode word goal set to ${wordCount} words${modeText}`,
        "success",
      );

      // First dispatch the setting change
      window.dispatchEvent(
        new CustomEvent("gameSettingsChanged", {
          detail: { setting: "timeLimit", value: wordCount },
        }),
      );

      // If it's a custom mode, then update the mode
      if (currentMode === "custom") {
        window.dispatchEvent(
          new CustomEvent("gameSettingsChanged", {
            detail: { setting: "currentMode", value: "custom" },
          }),
        );
      }
    }
  }

  setBonus(args) {
    const bonus = parseInt(args[0]);

    if (isNaN(bonus) || bonus < 0) {
      this.showNotification(
        "Error: Please provide a valid bonus time",
        "error",
      );
      return;
    }

    this.gameSettings.bonusTime = bonus;

    // Check if this creates a custom mode
    const currentMode = this.checkIfCustomMode();
    this.gameSettings.currentMode = currentMode;

    localStorage.setItem("terminalSettings", JSON.stringify(this.gameSettings));

    // Show mode in notification only if it's custom
    const modeText = currentMode === "custom" ? " (CUSTOM MODE)" : "";
    this.showNotification(
      `Bonus energy set to ${bonus} units${modeText}`,
      "success",
    );

    // First dispatch the setting change
    window.dispatchEvent(
      new CustomEvent("gameSettingsChanged", {
        detail: { setting: "bonusTime", value: bonus },
      }),
    );

    // If it's a custom mode, then update the mode
    if (currentMode === "custom") {
      window.dispatchEvent(
        new CustomEvent("gameSettingsChanged", {
          detail: { setting: "currentMode", value: "custom" },
        }),
      );
    }
  }

  setInitial(args) {
    const initial = parseInt(args[0]);

    if (isNaN(initial) || initial < 1) {
      this.showNotification(
        "Error: Please provide a valid initial time",
        "error",
      );
      return;
    }

    this.gameSettings.initialTime = initial;

    // Check if this creates a custom mode
    const currentMode = this.checkIfCustomMode();
    this.gameSettings.currentMode = currentMode;

    localStorage.setItem("terminalSettings", JSON.stringify(this.gameSettings));

    // Show mode in notification only if it's custom
    const modeText = currentMode === "custom" ? " (CUSTOM MODE)" : "";
    this.showNotification(
      `Initial energy set to ${initial} units${modeText}`,
      "success",
    );

    // First dispatch the setting change
    window.dispatchEvent(
      new CustomEvent("gameSettingsChanged", {
        detail: { setting: "initialTime", value: initial },
      }),
    );

    // If it's a custom mode, then update the mode
    if (currentMode === "custom") {
      window.dispatchEvent(
        new CustomEvent("gameSettingsChanged", {
          detail: { setting: "currentMode", value: "custom" },
        }),
      );
    }
  }

  setMode(args) {
    const mode = args[0];

    if (!this.gameModes[mode]) {
      this.showNotification(
        "Error: Invalid mode. Available modes: classic, hard, practice, speedrunner",
        "error",
      );
      return;
    }

    // If we're currently in Zen mode, we need to switch out of it first
    const isCurrentlyZenMode =
      localStorage.getItem("nerdtype_zen_mode") === "true";
    if (isCurrentlyZenMode) {
      // Switch off Zen mode
      localStorage.setItem("nerdtype_zen_mode", "false");

      // Dispatch event to update UI
      window.dispatchEvent(
        new CustomEvent("gameSettingsChanged", {
          detail: { setting: "zenMode", value: false },
        }),
      );
    }

    const settings = this.gameModes[mode];
    this.gameSettings = { ...settings, currentMode: mode };
    localStorage.setItem("terminalSettings", JSON.stringify(this.gameSettings));

    this.showNotification(`Switched to ${mode} mode`, "success");

    // First dispatch the mode change
    window.dispatchEvent(
      new CustomEvent("gameSettingsChanged", {
        detail: { setting: "currentMode", value: mode },
      }),
    );

    // Then dispatch all the settings for this mode
    Object.entries(settings).forEach(([setting, value]) => {
      window.dispatchEvent(
        new CustomEvent("gameSettingsChanged", {
          detail: { setting, value },
        }),
      );
    });
  }

  setZenMode(args) {
    // Toggle Zen mode if no argument provided, or set based on argument
    let enableZen;
    if (args.length === 0) {
      // Toggle current state
      enableZen = localStorage.getItem("nerdtype_zen_mode") !== "true";
    } else {
      // Set based on argument (on/off, true/false, 1/0)
      const arg = args[0].toLowerCase();
      enableZen = arg === "on" || arg === "true" || arg === "1";
    }

    // Update localStorage
    localStorage.setItem("nerdtype_zen_mode", enableZen.toString());

    // Dispatch event to update UI
    window.dispatchEvent(
      new CustomEvent("gameSettingsChanged", {
        detail: { setting: "zenMode", value: enableZen },
      }),
    );

    // Show notification
    this.showNotification(
      `Zen Mode ${enableZen ? "enabled" : "disabled"}`,
      "success",
    );
  }

  showHelp() {
    const helpText = `
Available commands:
=============================================
/setwords       - Set number of words for win
/setbonus       - Set bonus energy per word
/setinitial     - Set starting energy
/mode           - Set game mode
<span style= "color: #ff9e64">[classic, hard, practice, speedrunner]</span>
/zen            - Toggle Zen Mode on/off
/lang           - Switch language
<span style= "color: #ff9e64">[finnish, english, swedish, programming, nightmare]</span>
/space          - Toggle space after words
/sound          - Toggle keypress sound
/data           - Toggle data collection
/status         - Show current game settings
/reset          - Reset to default settings
/help           - Show this help message
=============================================
`;
    this.showInfoModal("Game Commands Help", helpText);
  }

  showStatus() {
    const settings = this.gameSettings;

    if (!settings) {
      this.showNotification("Error: Could not load game settings", "error");
      return;
    }

    // Get the current Zen Mode state from localStorage
    const isZenMode = localStorage.getItem("nerdtype_zen_mode") === "true";

    // Get achievement sound setting (null or undefined = true by default)
    const achievementSoundEnabled = localStorage.getItem(
      "achievement_sound_enabled",
    );
    const isSoundEnabled =
      achievementSoundEnabled === null || achievementSoundEnabled === "true";

    // Get keypress sound setting (null or undefined = true by default)
    const keypressSoundEnabled = localStorage.getItem("keypress_sound_enabled");
    const isKeypressSoundEnabled =
      keypressSoundEnabled === null || keypressSoundEnabled === "true";

    // Get space after words setting (null or undefined = false by default)
    const showSpacesEnabled =
      localStorage.getItem("showSpacesAfterWords") === "true";

    const dataCollectionEnabled = localStorage.getItem(
      "data_collection_enabled",
    );
    const isDataCollectionEnabled =
      dataCollectionEnabled === null || dataCollectionEnabled === "true";

    let statusText;

    if (isZenMode) {
      // Zen Mode status
      statusText = `
CURRENT GAME SETTINGS:
================================
ZEN MODE: <span style='color:#c3e88d'>ON</span>
ZEN WORD GOAL: <span style='color:#c3e88d'>${settings.zenWordGoal || 30}</span> words
LANGUAGE: <span style='color:#bb9af7'>${currentLanguage.toUpperCase()}</span>
SPACE AFTER WORDS: <span style='color:${showSpacesEnabled ? "#c3e88d" : "#ff007c"}'>${showSpacesEnabled ? "ON" : "OFF"}</span>
ACHIEVEMENT SOUND: <span style='color:${isSoundEnabled ? "#c3e88d" : "#ff007c"}'>${isSoundEnabled ? "ON" : "OFF"}</span>
KEYPRESS SOUND: <span style='color:${isKeypressSoundEnabled ? "#c3e88d" : "#ff007c"}'>${isKeypressSoundEnabled ? "ON" : "OFF"}</span>
DATA COLLECTION: <span style='color:${isDataCollectionEnabled ? "#c3e88d" : "#ff007c"}'>${isDataCollectionEnabled ? "ON" : "OFF"}</span>
================================
`;
    } else {
      // Classic Mode status
      statusText = `
CURRENT GAME SETTINGS:
================================
ZEN MODE: <span style='color:#ff007c'>OFF</span>
MODE: <span style='color:#ff9e64'>${settings.currentMode?.toUpperCase() || "CLASSIC"}</span>
WORDS NEEDED: <span style='color:#c3e88d'>${settings.timeLimit || 30}</span>
BONUS ENERGY: <span style='color:#bb9af7'>${settings.bonusTime || 3}</span> units
INITIAL ENERGY: <span style='color:#7dcfff'>${settings.initialTime || 10}</span> units
LANGUAGE: <span style='color:#bb9af7'>${currentLanguage.toUpperCase()}</span>
SPACE AFTER WORDS: <span style='color:${showSpacesEnabled ? "#c3e88d" : "#ff007c"}'>${showSpacesEnabled ? "ON" : "OFF"}</span>
ACHIEVEMENT SOUND: <span style='color:${isSoundEnabled ? "#c3e88d" : "#ff007c"}'>${isSoundEnabled ? "ON" : "OFF"}</span>
KEYPRESS SOUND: <span style='color:${isKeypressSoundEnabled ? "#c3e88d" : "#ff007c"}'>${isKeypressSoundEnabled ? "ON" : "OFF"}</span>
DATA COLLECTION: <span style='color:${isDataCollectionEnabled ? "#c3e88d" : "#ff007c"}'>${isDataCollectionEnabled ? "ON" : "OFF"}</span>
================================
`;
    }

    this.showInfoModal("Game Status", statusText);
  }

  showInfoModal(title, content) {
    // Create a modal for displaying longer info
    let modalContainer = document.getElementById("game-command-modal");

    // Get the current username
    const playerUsername =
      localStorage.getItem("nerdtype_username") || "runner";

    // Customize path based on command type
    let terminalPath = "~";
    if (title === "Game Status") {
      terminalPath = "~/.config";
    } else if (title === "Game Commands Help") {
      terminalPath = "~/docs/manual";
    }

    // Title
    const formattedTitle = `[${playerUsername}@PENTAGON-CORE:${terminalPath}]$`;

    if (!modalContainer) {
      // Create the modal if it doesn't exist
      modalContainer = document.createElement("div");
      modalContainer.id = "game-command-modal";
      modalContainer.className = "modal fade";
      modalContainer.tabIndex = "-1";
      modalContainer.role = "dialog";
      // Create the basic modal structure
      modalContainer.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header border-bottom-0 text-center">
          <h5 class="modal-title w-100" id="game-command-modal-title"></h5>
        </div>
        <div class="modal-body border-top-0 border-bottom-0">
          <pre id="game-command-modal-content" class="terminal-output"></pre>
        </div>
        <div class="modal-footer border-top-0 d-flex justify-content-center" style="background-color: #24283b">
          <button id="game-command-modal-close" type="button" class="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  `;
      document.body.appendChild(modalContainer);
      // Add modal close button event listener
      document
        .getElementById("game-command-modal-close")
        .addEventListener("click", () => {
          const modal = bootstrap.Modal.getInstance(
            document.getElementById("game-command-modal"),
          );
          if (modal) {
            modal.hide();
            setTimeout(() => {
              location.reload();
            }, 500);
          }
        });
      // Add modal hidden event listener
      modalContainer.addEventListener("hidden.bs.modal", () => {
        this.showNotification("Reloading game...", "info");
        setTimeout(() => {
          location.reload();
        }, 500);
      });
    }

    // Set modal content - use innerHTML instead of textContent
    document.getElementById("game-command-modal-title").textContent =
      formattedTitle;
    document.getElementById("game-command-modal-content").innerHTML = content;

    // Show the modal
    const modal = new bootstrap.Modal(
      document.getElementById("game-command-modal"),
    );
    modal.show();
  }
}

// Create and initialize game commands
const gameCommands = new GameCommands();
document.addEventListener("DOMContentLoaded", () => {
  gameCommands.init();
});

export default gameCommands;
