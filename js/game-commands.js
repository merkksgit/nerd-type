// game-commands.js - Handles direct game commands input from the user input field
// These allow players to use quick commands directly in the game
// All commands need to start with a slash (/)
import {
  currentLanguage,
  loadWordList,
  availableWordLists,
} from "./word-list-manager.js";
import { DebugDisplay } from "./debug.js";

class GameCommands {
  constructor() {
    // Initialize debug instances
    this.debugDisplay = new DebugDisplay();
    // Load saved settings from localStorage or use defaults
    this.gameSettings = JSON.parse(localStorage.getItem("gameSettings")) || {
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
      hardcore: {
        timeLimit: 30,
        bonusTime: 2,
        initialTime: 4,
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
      "/punc": this.togglePunctuation.bind(this),
      "/punctuation": this.togglePunctuation.bind(this), // Alias for /punc
      "/sound": this.toggleKeypressSound.bind(this),
      "/help": this.showHelp.bind(this),
      "/status": this.showStatus.bind(this),
      "/reset": this.resetGame.bind(this),
      "/data": this.toggleDataCollection.bind(this),
      "/discord": this.toggleDiscordWebhook.bind(this),
      "/debug": this.toggleDebug.bind(this),
      "/rm": this.removeData.bind(this),
      "/prac": this.startCustomPractice.bind(this),
      "/offscreen": this.openOffscreenWindow.bind(this),
      "/login": this.showLogin.bind(this),
      "/logout": this.logout.bind(this),
      "/save": this.saveCustomSettings.bind(this),
      "/load": this.loadCustomSettings.bind(this),
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
      "/punc",
      "/punctuation",
      "/reset",
      "/sound",
      "/data",
      "/load",
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
      `Data collection ${newState ? "enabled" : "disabled"}. ${newState ? "Scores will be saved to global leaderboards." : "Scores will not be saved to global leaderboards."}`,
      "success",
    );
  }

  toggleDiscordWebhook(args) {
    // Get current state
    const currentState = localStorage.getItem("discord_webhook_enabled");
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
    localStorage.setItem("discord_webhook_enabled", newState.toString());
    // Show notification
    this.showNotification(
      `Discord webhook ${newState ? "enabled" : "disabled"}. ${newState ? "Scores will be sent to Discord." : "Scores will not be sent to Discord."}`,
      "success",
    );
  }

  toggleKeypressSound(args) {
    // Get current state
    const currentState =
      localStorage.getItem("keypress_sound_enabled") === "true"; // Default is false

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

  // Toggle punctuation command
  togglePunctuation(args) {
    // Get current state
    const currentState = localStorage.getItem("punctuation_enabled") === "true";

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
    localStorage.setItem("punctuation_enabled", newState.toString());

    // Clear punctuation cache when setting changes
    if (typeof window.clearPunctuationCache === "function") {
      window.clearPunctuationCache();
    }

    // Dispatch event to update the game setting
    window.dispatchEvent(
      new CustomEvent("gameSettingsChanged", {
        detail: { setting: "punctuation_enabled", value: newState },
      }),
    );

    // Show notification
    this.showNotification(
      `Punctuation ${newState ? "enabled" : "disabled"}`,
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
      localStorage.setItem("gameSettings", JSON.stringify(this.gameSettings));

      // Reset other Zen-related settings to defaults
      localStorage.setItem("nerdtype_zen_mode", "true"); // Keep in Zen mode but reset settings
      localStorage.setItem("showSpacesAfterWords", "true"); // Reset to default
      localStorage.setItem("achievement_sound_enabled", "true"); // Reset to default
      localStorage.setItem("keypress_sound_enabled", "false"); // Reset to default

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
          detail: { setting: "showSpacesAfterWords", value: true },
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
      localStorage.setItem("gameSettings", JSON.stringify(this.gameSettings));

      // Reset other Classic-related settings
      localStorage.setItem("nerdtype_zen_mode", "false"); // Ensure Zen mode is off
      localStorage.setItem("showSpacesAfterWords", "true"); // Reset to default
      localStorage.setItem("achievement_sound_enabled", "true"); // Reset to default
      localStorage.setItem("keypress_sound_enabled", "false"); // Reset to default

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
          detail: { setting: "showSpacesAfterWords", value: true },
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
          background-color: #1f2335;
          border-left: 4px solid #c3e88d;
        }
        .game-command-notification.error {
          background-color: #1f2335;
          border-left: 4px solid #ff007c;
        }
        .game-command-notification.info {
          background-color: #1f2335;
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

    // Ensure background color is set for consistency
    notification.style.backgroundColor = "#1f2335";

    notificationContainer.appendChild(notification);

    // Remove after animation completes
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Command implementations
  setWords(args) {
    const wordCount = parseInt(args[0]);

    if (isNaN(wordCount) || wordCount < 10 || wordCount > 200) {
      this.showNotification(
        "Error: Please provide a valid number of words (10-200)",
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
      localStorage.setItem("gameSettings", JSON.stringify(this.gameSettings));

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

      localStorage.setItem("gameSettings", JSON.stringify(this.gameSettings));

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

    if (isNaN(bonus) || bonus < 1 || bonus > 10) {
      this.showNotification(
        "Error: Please provide a valid bonus energy (1-10)",
        "error",
      );
      return;
    }

    this.gameSettings.bonusTime = bonus;

    // Check if this creates a custom mode
    const currentMode = this.checkIfCustomMode();
    this.gameSettings.currentMode = currentMode;

    localStorage.setItem("gameSettings", JSON.stringify(this.gameSettings));

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

    if (isNaN(initial) || initial < 4 || initial > 20) {
      this.showNotification(
        "Error: Please provide a valid initial energy (4-20)",
        "error",
      );
      return;
    }

    this.gameSettings.initialTime = initial;

    // Check if this creates a custom mode
    const currentMode = this.checkIfCustomMode();
    this.gameSettings.currentMode = currentMode;

    localStorage.setItem("gameSettings", JSON.stringify(this.gameSettings));

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
    let mode = args[0];

    // Handle hardcore mode alias
    if (mode === "hc") {
      mode = "hardcore";
    }

    if (!this.gameModes[mode]) {
      this.showNotification(
        "Error: Invalid mode. Available modes: classic, hard, practice, speedrunner, hardcore (or hc)",
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
    localStorage.setItem("gameSettings", JSON.stringify(this.gameSettings));

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

    // When enabling zen mode, reset currentMode to classic to avoid hardcore mode behavior
    if (enableZen) {
      console.log("Setting zen mode - before:", this.gameSettings.currentMode);
      this.gameSettings.currentMode = "classic";

      // Force synchronous localStorage update
      localStorage.setItem("gameSettings", JSON.stringify(this.gameSettings));

      // Verify the update was saved
      const savedSettings = JSON.parse(localStorage.getItem("gameSettings"));
      console.log(
        "Setting zen mode - after:",
        this.gameSettings.currentMode,
        "localStorage saved as:",
        savedSettings.currentMode,
      );

      // Dispatch event to update the current mode
      window.dispatchEvent(
        new CustomEvent("gameSettingsChanged", {
          detail: { setting: "currentMode", value: "classic" },
        }),
      );
    }

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
    // Get the current username
    const playerUsername =
      localStorage.getItem("nerdtype_username") || "runner";

    const helpText = `<span style='color:#7dcfff'>[${playerUsername}@nerdtype_terminal:~/docs/manual]$</span> cat commands.txt

<span style='color:#bb9af7'>/setwords</span>       - Set number of words for win
<span style='color:#bb9af7'>/setbonus</span>       - Set bonus energy per word
<span style='color:#bb9af7'>/setinitial</span>     - Set starting energy
<span style='color:#bb9af7'>/mode</span>           - Set game mode
                  <span style='color:#ff9e64'>[classic, hard, practice, speedrunner, hardcore, hc]</span>
<span style='color:#bb9af7'>/zen</span>            - Toggle Zen Mode on/off
<span style='color:#bb9af7'>/lang</span>           - Switch language
                  <span style='color:#ff9e64'>[finnish, english, swedish, programming, nightmare]</span>
<span style='color:#bb9af7'>/space</span>          - Toggle space after words
<span style='color:#bb9af7'>/punc</span>           - Toggle punctuation marks
<span style='color:#bb9af7'>/sound</span>          - Toggle keypress sound
<span style='color:#bb9af7'>/data</span>           - Toggle data collection
<span style='color:#bb9af7'>/discord</span>        - Toggle Discord webhook
<span style='color:#bb9af7'>/prac</span>           - Practice specific words
                  <span style='color:#ff9e64'>[word1 word2 word3...]</span>
<span style='color:#bb9af7'>/offscreen</span>      - Open popup with current word list
<span style='color:#bb9af7'>/rm</span>             - Remove data from localStorage
                  <span style='color:#ff9e64'>[scoreboard.data, achievements.data]</span>
<span style='color:#bb9af7'>/save</span>           - Save current custom settings
<span style='color:#bb9af7'>/load</span>           - Load saved custom settings
<span style='color:#bb9af7'>/login</span>          - Open login modal
<span style='color:#bb9af7'>/logout</span>         - Logout current user
<span style='color:#bb9af7'>/status</span>         - Show current game settings
<span style='color:#bb9af7'>/reset</span>          - Reset to default settings
<span style='color:#bb9af7'>/help</span>           - Show this help message
`;
    this.showInfoModal("Game Commands Help", helpText);
  }

  async showStatus() {
    const settings = this.gameSettings;

    if (!settings) {
      this.showNotification("Error: Could not load game settings", "error");
      return;
    }

    // Get the current username
    const playerUsername =
      localStorage.getItem("nerdtype_username") || "runner";

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
    const discordWebhookEnabled = localStorage.getItem(
      "discord_webhook_enabled",
    );
    const isDiscordWebhookEnabled =
      discordWebhookEnabled === null || discordWebhookEnabled === "true";

    // Get current font selection
    const currentFont =
      localStorage.getItem("nerdtype_font") || "jetbrains-light";

    // Convert font name to display format
    const fontDisplayNames = {
      "jetbrains-mono": "JetBrains Mono",
      "jetbrains-light": "JetBrains Mono Light",
      "departure-mono": "Departure Mono",
      "firacode-mono": "FiraCode Mono",
      "firacode-light": "FiraCode Mono Light",
      "bigblueterm-mono": "BigBlueTerm Mono",
      "oxproto-mono": "0xProto Mono",
    };

    const fontDisplayName = fontDisplayNames[currentFont] || currentFont;

    // Get saved custom settings
    const currentUser = window.getCurrentUser ? window.getCurrentUser() : null;
    let savedSettings = null;

    if (currentUser) {
      if (window.firebaseModules && window.database) {
        try {
          const { ref, get } = window.firebaseModules;
          const customSettingsRef = ref(
            window.database,
            `users/${currentUser.uid}/customSettings`,
          );
          const snapshot = await get(customSettingsRef);
          if (snapshot.exists()) {
            savedSettings = snapshot.val();
          }
        } catch (error) {
          console.error("Error loading custom settings from Firebase:", error);
        }
      }
    }

    if (!savedSettings) {
      const localSettings = localStorage.getItem("nerdtype_custom_settings");
      savedSettings = localSettings ? JSON.parse(localSettings) : null;
    }

    // Format saved settings if they exist
    let savedSettingsText = "";
    if (savedSettings) {
      const savedDate = savedSettings.savedAt
        ? new Date(savedSettings.savedAt).toLocaleString()
        : "Unknown";
      savedSettingsText = `
<span style='color:#9ece6a'>## Saved Custom Settings (use /load to apply)</span>
saved_at=<span style='color:#e0af68'>${savedDate}</span>
words_needed=<span style='color:#c3e88d'>${savedSettings.timeLimit}</span>
bonus_energy=<span style='color:#bb9af7'>${savedSettings.bonusTime}</span>
initial_energy=<span style='color:#7dcfff'>${savedSettings.initialTime}</span>
space_after_words=<span style='color:${savedSettings.showSpacesAfterWords ? "#c3e88d" : "#ff007c"}'>${savedSettings.showSpacesAfterWords ? "enabled" : "disabled"}</span>
punctuation=<span style='color:${savedSettings.punctuationEnabled ? "#c3e88d" : "#ff007c"}'>${savedSettings.punctuationEnabled ? "enabled" : "disabled"}</span>
`;
    }

    let statusText;

    if (isZenMode) {
      // Zen Mode status with terminal-style output
      statusText = `<span style='color:#7dcfff'>[${playerUsername}@nerdtype_terminal:~/.config]$</span> cat settings.data

zen_mode=<span style='color:#c3e88d'>enabled</span>
zen_word_goal=<span style='color:#c3e88d'>${settings.zenWordGoal || 30}</span>
language=<span style='color:#bb9af7'>${currentLanguage.toLowerCase()}</span>
space_after_words=<span style='color:${showSpacesEnabled ? "#c3e88d" : "#ff007c"}'>${showSpacesEnabled ? "enabled" : "disabled"}</span>
achievement_sound=<span style='color:${isSoundEnabled ? "#c3e88d" : "#ff007c"}'>${isSoundEnabled ? "enabled" : "disabled"}</span>
keypress_sound=<span style='color:${isKeypressSoundEnabled ? "#c3e88d" : "#ff007c"}'>${isKeypressSoundEnabled ? "enabled" : "disabled"}</span>
global_leaderboard=<span style='color:${isDataCollectionEnabled ? "#c3e88d" : "#ff007c"}'>${isDataCollectionEnabled ? "enabled" : "disabled"}</span>
discord_webhook=<span style='color:${isDiscordWebhookEnabled ? "#c3e88d" : "#ff007c"}'>${isDiscordWebhookEnabled ? "enabled" : "disabled"}</span>
font=<span style='color:#f7768e'>${currentFont}</span>
${savedSettingsText}`;
    } else {
      // Classic Mode status with terminal-style output
      statusText = `<span style='color:#7dcfff'>[${playerUsername}@nerdtype_terminal:~/.config]$</span> cat settings.data

zen_mode=<span style='color:#ff007c'>disabled</span>
game_mode=<span style='color:#ff9e64'>${settings.currentMode?.toLowerCase() || "classic"}</span>
words_needed=<span style='color:#c3e88d'>${settings.timeLimit || 30}</span>
bonus_energy=<span style='color:#bb9af7'>${settings.bonusTime || 3}</span>
initial_energy=<span style='color:#7dcfff'>${settings.initialTime || 10}</span>
language=<span style='color:#bb9af7'>${currentLanguage.toLowerCase()}</span>
space_after_words=<span style='color:${showSpacesEnabled ? "#c3e88d" : "#ff007c"}'>${showSpacesEnabled ? "enabled" : "disabled"}</span>
achievement_sound=<span style='color:${isSoundEnabled ? "#c3e88d" : "#ff007c"}'>${isSoundEnabled ? "enabled" : "disabled"}</span>
keypress_sound=<span style='color:${isKeypressSoundEnabled ? "#c3e88d" : "#ff007c"}'>${isKeypressSoundEnabled ? "enabled" : "disabled"}</span>
data_collection=<span style='color:${isDataCollectionEnabled ? "#c3e88d" : "#ff007c"}'>${isDataCollectionEnabled ? "enabled" : "disabled"}</span>
discord_webhook=<span style='color:${isDiscordWebhookEnabled ? "#c3e88d" : "#ff007c"}'>${isDiscordWebhookEnabled ? "enabled" : "disabled"}</span>
font=<span style='color:#f7768e'>${currentFont}</span>
${savedSettingsText}`;
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
    const formattedTitle = `[${playerUsername}@nerdtype_terminal:${terminalPath}]$`;

    if (!modalContainer) {
      // Create the modal if it doesn't exist
      modalContainer = document.createElement("div");
      modalContainer.id = "game-command-modal";
      modalContainer.className = "modal fade";
      modalContainer.tabIndex = "-1";
      modalContainer.role = "dialog";
      // Create the basic modal structure
      modalContainer.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content" style="background-color: #24283b; border: 1px solid #414868;">
        <div class="modal-body border-top-0 border-bottom-0" style="background-color: #24283b;">
          <pre id="game-command-modal-content" class="terminal-output" style="text-align: left;"></pre>
        </div>
        <div class="modal-footer border-top-0 d-flex justify-content-center" style="background-color: #24283b;">
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
          }
        });
      // Add modal hidden event listener
      modalContainer.addEventListener("hidden.bs.modal", () => {
        location.reload();
      });
    }

    // Set modal content - use innerHTML instead of textContent
    document.getElementById("game-command-modal-content").innerHTML = content;

    // Show the modal
    const modal = new bootstrap.Modal(
      document.getElementById("game-command-modal"),
    );
    modal.show();
  }

  // Toggle debug display
  toggleDebug() {
    this.showNotification("Toggling debug display...", "info");
    this.debugDisplay.toggle();
    // Note: Debug command typically reloads the page
    setTimeout(() => {
      location.reload();
    }, 1000);
  }

  startCustomPractice(args) {
    if (args.length === 0) {
      this.showNotification(
        "Usage: /prac &lt;word1&gt; &lt;word2&gt; ... - Start practice session with specified words",
        "info",
      );
      return;
    }

    // Filter out empty strings and trim whitespace
    const customWords = args
      .map((word) => word.trim())
      .filter((word) => word.length > 0);

    if (customWords.length === 0) {
      this.showNotification(
        "Error: Please provide at least one valid word for practice",
        "error",
      );
      return;
    }

    // Start practice session immediately without page reload
    this.startCustomPracticeSession(customWords);
  }

  startCustomPracticeSession(customWords) {
    // Check if startPracticeMistakesMode function is available
    if (typeof window.startPracticeMistakesMode === "function") {
      // Store the custom words temporarily for the practice session
      localStorage.setItem("customPracticeWords", JSON.stringify(customWords));

      // Start the practice session directly
      window.startPracticeMistakesMode();

      // Activate the game immediately after a small delay
      setTimeout(() => {
        if (typeof window.activateGame === "function") {
          window.activateGame();
        }
      }, 100);
    } else {
      this.showNotification(
        "Error: Practice mode not available on this page",
        "error",
      );
    }
  }

  removeData(args) {
    if (args.length === 0) {
      this.showNotification(
        "Usage: /rm <data_type>. Available: scoreboard.data, achievements.data",
        "info",
      );
      return;
    }

    const dataType = args[0].toLowerCase();

    switch (dataType) {
      case "scoreboard.data":
        // Clear scoreboard data from localStorage including backups
        localStorage.removeItem("gameResults");
        localStorage.removeItem("gameResults_guest_backup");
        this.showNotification(
          "Scoreboard data cleared successfully.",
          "success",
        );
        break;

      case "achievements.data":
        // Clear achievements data from localStorage
        localStorage.removeItem("nerdtype_achievements");
        this.showNotification(
          "Achievements data cleared successfully.",
          "success",
        );
        break;

      default:
        this.showNotification(
          `Unknown data type: ${dataType}. Available: scoreboard.data, achievements.data`,
          "error",
        );
        break;
    }
  }

  openOffscreenWindow() {
    try {
      // Check if we have access to current words from the game
      if (typeof window.getCurrentWords === "function") {
        const currentWords = window.getCurrentWords();
        this.createOffscreenPopup(currentWords);
      } else if (
        typeof window.words !== "undefined" &&
        window.words.length > 0
      ) {
        // Fallback to global words array
        this.createOffscreenPopup(window.words);
      } else {
        this.showNotification(
          "No word list available. Start a game first.",
          "error",
        );
      }
    } catch (error) {
      this.showNotification("Error opening offscreen window", "error");
    }
  }

  createOffscreenPopup(wordList, showNotification = true) {
    // Close any existing offscreen window
    if (window.offscreenWindow && !window.offscreenWindow.closed) {
      window.offscreenWindow.close();
    }

    // Mark that we have an offscreen window active for restoration after reloads
    localStorage.setItem("offscreen_window_active", "true");

    // Create new popup window
    const popup = window.open(
      "",
      "offscreenWords",
      "width=800,height=600,resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no",
    );

    if (!popup) {
      this.showNotification(
        "Popup blocked! Please allow popups for this site.",
        "error",
      );
      return;
    }

    window.offscreenWindow = popup;

    // Get player's current font setting
    const currentFont =
      localStorage.getItem("nerdtype_font") || "jetbrains-light";

    // Set up auto-refresh when game starts
    this.setupPopupAutoRefresh(popup);

    // Create the popup content
    popup.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NerdType - Word List</title>
        <link rel="stylesheet" href="../css/fontawesome/all.min.css" />
        <style>
          ${this.getFontCSS(currentFont)}

          body {
            background-color: #24283b;
            color: #c0caf5;
            margin: 0;
            padding: 40px 20px;
            font-family: ${this.getFontFamily(currentFont)};
            overflow-x: hidden;
          }

          .word-display {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: flex-start;
            gap: 1.5rem;
            font-size: 2rem;
            line-height: 1.3;
            text-align: center;
            padding: 2rem;
          }

          .word {
            color: #565f89;
            font-family: inherit;
            white-space: nowrap;
            transition: color 0.2s ease;
          }

          .word:hover {
            color: #c0caf5;
          }

          .mobile-close-btn {
            display: none;
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #f7768e;
            color: #24283b;
            border: none;
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transition: background-color 0.2s ease;
          }

          .mobile-close-btn:hover {
            background-color: #ff7a93;
          }

          .mobile-close-btn:active {
            background-color: #e73c7e;
          }

          @media (max-width: 768px), (pointer: coarse) {
            .mobile-close-btn {
              display: block;
            }
          }
        </style>
      </head>
      <body>
        <button class="mobile-close-btn" onclick="closeWindow()"><i class="fas fa-times"></i></button>
        <div class="word-display" id="wordDisplay">
          ${wordList.map((word) => `<span class="word">${word}</span>`).join("")}
        </div>

        <script>
          // Function to close the popup window
          function closeWindow() {
            if (window.opener && !window.opener.closed) {
              // Clear the offscreen window reference in parent
              if (window.opener.offscreenWindow) {
                window.opener.offscreenWindow = null;
              }
              // Clear the active flag
              if (window.opener.localStorage) {
                window.opener.localStorage.removeItem('offscreen_window_active');
              }
            }
            window.close();
          }

          // Function to update the word list
          function updateWordList(newWords) {
            const wordDisplay = document.getElementById('wordDisplay');
            wordDisplay.innerHTML = newWords.map(word =>
              '<span class="word">' + word + '</span>'
            ).join('');
          }

          // Function to request word list update from parent window
          function requestWordListUpdate() {
            if (window.opener && !window.opener.closed) {
              try {
                let currentWords = [];
                if (typeof window.opener.getCurrentWords === 'function') {
                  currentWords = window.opener.getCurrentWords();
                } else if (window.opener.words && window.opener.words.length > 0) {
                  currentWords = window.opener.words.slice();
                }

                if (currentWords.length > 0) {
                  updateWordList(currentWords);
                }
              } catch (error) {
                // Error updating word list, continue silently
              }
            }
          }

          // Listen for updates from parent window
          window.addEventListener('message', function(event) {
            if (event.origin === window.location.origin && event.data.type === 'updateWords') {
              updateWordList(event.data.words);
            }
          });

          // Handle window close
          window.addEventListener('beforeunload', function() {
            if (window.opener && !window.opener.closed) {
              if (window.opener.offscreenWindow) {
                window.opener.offscreenWindow = null;
              }
              // Clear the active flag when popup is manually closed
              if (window.opener.localStorage) {
                window.opener.localStorage.removeItem('offscreen_window_active');
              }
            }
          });
        </script>
      </body>
      </html>
    `);

    popup.document.close();

    if (showNotification) {
      this.showNotification(
        "Offscreen mode enabled! Drag the popup to your second monitor for multi-screen practice.",
        "success",
      );
    }
  }

  setupPopupAutoRefresh(popup) {
    // Store reference to popup for updates
    if (!window.gameCommandsPopupUpdater) {
      window.gameCommandsPopupUpdater = {
        popups: new Set(),
        updateAllPopups: function (words) {
          this.popups.forEach((popup) => {
            if (popup && !popup.closed) {
              try {
                popup.postMessage(
                  {
                    type: "updateWords",
                    words: words,
                  },
                  window.location.origin,
                );
              } catch (error) {
                this.popups.delete(popup);
              }
            } else {
              this.popups.delete(popup);
            }
          });
        },
      };
    }

    window.gameCommandsPopupUpdater.popups.add(popup);

    // Clean up on popup close
    popup.addEventListener("beforeunload", () => {
      window.gameCommandsPopupUpdater.popups.delete(popup);
    });
  }

  getFontFamily(fontKey) {
    // Use the exact same font family names as defined in style.css
    return `"${fontKey}", "Courier New", monospace`;
  }

  getFontCSS(fontKey) {
    // Return the exact @font-face declarations from style.css
    const fontCSS = {
      "jetbrains-mono": `
        @font-face {
          src: url(../font/JetBrainsMonoNLNerdFontMono-SemiBold.ttf);
          font-family: "jetbrains-mono";
        }`,
      "jetbrains-light": `
        @font-face {
          src: url(../font/JetBrainsMonoNLNerdFont-Light.ttf);
          font-family: "jetbrains-light";
        }`,
      "departure-mono": `
        @font-face {
          src: url(../font/DepartureMonoNerdFontMono-Regular.otf);
          font-family: "departure-mono";
        }`,
      "firacode-mono": `
        @font-face {
          src: url(../font/FiraCodeNerdFontMono-SemiBold.ttf);
          font-family: "firacode-mono";
        }`,
      "firacode-light": `
        @font-face {
          src: url(../font/FiraCodeNerdFontMono-Light.ttf);
          font-family: "firacode-light";
        }`,
      "bigblueterm-mono": `
        @font-face {
          src: url(../font/BigBlueTerm437NerdFontMono-Regular.ttf);
          font-family: "bigblueterm-mono";
        }`,
      "oxproto-mono": `
        @font-face {
          src: url(../font/0xProtoNerdFontMono-Regular.ttf);
          font-family: "oxproto-mono";
        }`,
    };
    return fontCSS[fontKey] || fontCSS["jetbrains-light"];
  }

  showLogin() {
    const currentUser = window.getCurrentUser ? window.getCurrentUser() : null;

    if (currentUser) {
      const emailUsername = currentUser.email
        ? currentUser.email.split("@")[0]
        : "unknown";
      this.showNotification(`Already logged in as ${emailUsername}`, "info");
      return;
    }

    if (typeof window.showLoginModal === "function") {
      window.showLoginModal();
      this.showNotification("Opening login modal...", "info");
    } else {
      this.showNotification("Login not available on this page", "error");
    }
  }

  logout() {
    const currentUser = window.getCurrentUser ? window.getCurrentUser() : null;

    if (!currentUser) {
      const isGuestMode =
        localStorage.getItem("nerdtype_guest_mode") === "true";
      if (isGuestMode) {
        this.showNotification("Already in guest mode", "info");
      } else {
        this.showNotification("Not currently logged in", "info");
      }
      return;
    }

    if (typeof window.logoutAndRedirect === "function") {
      this.showNotification("Logging out...", "info");

      window.logoutAndRedirect();

      setTimeout(() => {
        location.reload();
      }, 1000);
    } else {
      this.showNotification("Logout not available on this page", "error");
    }
  }

  async saveCustomSettings() {
    try {
      const settingsToSave = {
        timeLimit: this.gameSettings.timeLimit,
        bonusTime: this.gameSettings.bonusTime,
        initialTime: this.gameSettings.initialTime,
        showSpacesAfterWords:
          localStorage.getItem("showSpacesAfterWords") === "true",
        punctuationEnabled:
          localStorage.getItem("punctuation_enabled") === "true",
        savedAt: new Date().toISOString(),
      };

      const currentUser = window.getCurrentUser
        ? window.getCurrentUser()
        : null;

      if (currentUser) {
        if (!window.firebaseModules || !window.database) {
          this.showNotification(
            "Firebase not available - settings saved locally only",
            "info",
          );
          localStorage.setItem(
            "nerdtype_custom_settings",
            JSON.stringify(settingsToSave),
          );
          return;
        }

        const { ref, set } = window.firebaseModules;
        const customSettingsRef = ref(
          window.database,
          `users/${currentUser.uid}/customSettings`,
        );

        await set(customSettingsRef, settingsToSave);
        this.showNotification(
          "Custom settings saved to cloud successfully",
          "success",
        );
      } else {
        localStorage.setItem(
          "nerdtype_custom_settings",
          JSON.stringify(settingsToSave),
        );
        this.showNotification(
          "Custom settings saved locally (guest mode)",
          "success",
        );
      }
    } catch (error) {
      console.error("Error saving custom settings:", error);
      this.showNotification("Error saving custom settings", "error");
    }
  }

  async loadCustomSettings() {
    try {
      const currentUser = window.getCurrentUser
        ? window.getCurrentUser()
        : null;
      let savedSettings = null;

      if (currentUser) {
        if (!window.firebaseModules || !window.database) {
          this.showNotification(
            "Firebase not available - loading from local storage",
            "info",
          );
          const localSettings = localStorage.getItem(
            "nerdtype_custom_settings",
          );
          savedSettings = localSettings ? JSON.parse(localSettings) : null;
        } else {
          const { ref, get } = window.firebaseModules;
          const customSettingsRef = ref(
            window.database,
            `users/${currentUser.uid}/customSettings`,
          );

          const snapshot = await get(customSettingsRef);
          if (snapshot.exists()) {
            savedSettings = snapshot.val();
          }
        }
      } else {
        const localSettings = localStorage.getItem("nerdtype_custom_settings");
        savedSettings = localSettings ? JSON.parse(localSettings) : null;
      }

      if (!savedSettings) {
        this.showNotification("No custom settings found to load", "info");
        return;
      }

      const isCurrentlyZenMode =
        localStorage.getItem("nerdtype_zen_mode") === "true";

      if (isCurrentlyZenMode) {
        localStorage.setItem("nerdtype_zen_mode", "false");

        window.dispatchEvent(
          new CustomEvent("gameSettingsChanged", {
            detail: { setting: "zenMode", value: false },
          }),
        );
      }

      this.gameSettings.timeLimit = savedSettings.timeLimit;
      this.gameSettings.bonusTime = savedSettings.bonusTime;
      this.gameSettings.initialTime = savedSettings.initialTime;

      const currentMode = this.checkIfCustomMode();
      this.gameSettings.currentMode = currentMode;

      localStorage.setItem("gameSettings", JSON.stringify(this.gameSettings));

      localStorage.setItem(
        "showSpacesAfterWords",
        savedSettings.showSpacesAfterWords.toString(),
      );
      localStorage.setItem(
        "punctuation_enabled",
        savedSettings.punctuationEnabled.toString(),
      );

      window.dispatchEvent(
        new CustomEvent("gameSettingsChanged", {
          detail: { setting: "currentMode", value: currentMode },
        }),
      );

      Object.entries({
        timeLimit: savedSettings.timeLimit,
        bonusTime: savedSettings.bonusTime,
        initialTime: savedSettings.initialTime,
      }).forEach(([setting, value]) => {
        window.dispatchEvent(
          new CustomEvent("gameSettingsChanged", {
            detail: { setting, value },
          }),
        );
      });

      window.dispatchEvent(
        new CustomEvent("gameSettingsChanged", {
          detail: {
            setting: "showSpacesAfterWords",
            value: savedSettings.showSpacesAfterWords,
          },
        }),
      );

      window.dispatchEvent(
        new CustomEvent("gameSettingsChanged", {
          detail: {
            setting: "punctuation_enabled",
            value: savedSettings.punctuationEnabled,
          },
        }),
      );

      this.showNotification("Custom settings loaded successfully", "success");
    } catch (error) {
      console.error("Error loading custom settings:", error);
      this.showNotification("Error loading custom settings", "error");
    }
  }

  checkAndRestoreOffscreenPopup() {
    // Check if offscreen popup was active before page reload
    const wasOffscreenActive =
      localStorage.getItem("offscreen_window_active") === "true";

    if (wasOffscreenActive) {
      // Wait a bit for the page to fully load, then restore the popup
      setTimeout(() => {
        if (typeof window.getCurrentWords === "function") {
          const currentWords = window.getCurrentWords();
          if (currentWords && currentWords.length > 0) {
            this.createOffscreenPopup(currentWords, false);
          }
        }
      }, 100); // Wait 100ms for game to initialize
    }
  }
}

// Create and initialize game commands
const gameCommands = new GameCommands();
document.addEventListener("DOMContentLoaded", () => {
  gameCommands.init();

  // Check if we should restore offscreen popup after page reload
  gameCommands.checkAndRestoreOffscreenPopup();
});

export default gameCommands;
