// terminal.js
class Terminal {
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

    this.commands = {
      help: this.showHelp.bind(this),
      status: this.showStatus.bind(this),
      setwords: this.setWords.bind(this),
      setbonus: this.setBonus.bind(this),
      setinitial: this.setInitial.bind(this),
      setgoal: this.setGoal.bind(this),
      mode: this.setMode.bind(this),
      reset: this.resetSettings.bind(this),
      exit: this.closeTerminal.bind(this),
      cls: this.clearTerminal.bind(this),
      time: this.showTime.bind(this),
      su: this.switchUser.bind(this),
      ls: this.listFiles.bind(this),
      rm: this.removeFile.bind(this),
      ping: this.pingSystem.bind(this),
      ls: this.listFiles.bind(this),
      cat: this.catFile.bind(this),
      refresh: this.refresh.bind(this),
    };

    this.commandHistory = [];
    this.historyIndex = -1;

    // Preset modes
    this.gameModes = {
      classic: {
        timeLimit: 30,
        bonusTime: 3,
        initialTime: 10,
        goalPercentage: 100,
      },
      hard: {
        timeLimit: 20,
        bonusTime: 2,
        initialTime: 8,
        goalPercentage: 100,
      },
      practice: {
        timeLimit: 60,
        bonusTime: 5,
        initialTime: 15,
        goalPercentage: 100,
      },
    };

    this.initializeTerminal();
  }

  initializeTerminal() {
    const modalHTML = `
            <div class="modal fade" id="terminalModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header border-bottom-0">
                            <h5 class="modal-title w-100 text-center" id="terminalModalLabel"></h5>
                        </div>
                        <div class="modal-body border-top-0 border-bottom-0">
                            <div class="terminal-container">
                                <div id="terminalOutput" class="terminal-output"></div>
                                <div class="terminal-input-line">
                                    <span class="terminal-prompt"></span>
                                    <input type="text" id="terminalInput" class="terminal-input" autocomplete="off">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    this.setupEventListeners();
    this.addTerminalStyles();

    // Add event listener for modal hide
    document
      .getElementById("terminalModal")
      .addEventListener("hidden.bs.modal", () => {
        // Restart the intervals
        window.dispatchEvent(new CustomEvent("terminalClosed"));
      });
  }

  addTerminalStyles() {
    const styles = `
        #terminalModal .terminal-container {
            background-color: #24283b !important;
            padding: 0 20px 20px 20px !important;
            font-family: "custom" !important;
            height: 600px !important;
            display: flex !important;
            flex-direction: column !important;
            position: relative !important;
        }
        #terminalModal .terminal-output {
            color: #a9b1d6 !important;
            white-space: pre-wrap !important;
            font-size: 14px !important;
            line-height: 1.4 !important;
            background-color: #24283b !important;
            overflow-y: auto !important;
            flex-grow: 1 !important;
            padding-top: 10px !important;
            padding-bottom: 60px !important;  // Adjusted to match new input height
            margin-bottom: 20px !important;
            max-height: calc(600px - 40px) !important;
        }
        #terminalModal .terminal-output div {
            background-color: #24283b !important;
            margin-bottom: 5px !important;  // Space between output lines
        }
        #terminalModal .terminal-prompt {
            color: #a9b1d6 !important;
            margin-right: 10px !important;
            font-size: 18px !important;
            background-color: #24283b !important;
            white-space: nowrap !important;
        }
        #terminalModal .terminal-input {
            background-color: #24283b !important;
            border: none !important;
            color: #ffffff !important;
            flex-grow: 1 !important;
            font-family: "custom", monospace !important;
            outline: none !important;
            font-size: 18px !important;
            padding: 0 !important;
            caret-color: #a9b1d6 !important;
        }
        #terminalModal .terminal-input-line {
            display: flex !important;
            align-items: center !important;
            color: #c0caf5 !important;
            background-color: #24283b !important;
            position: absolute !important;
            bottom: 0 !important;
            left: 20px !important;
            right: 20px !important;
            height: 60px !important;  // Explicitly set height
            margin: 0 auto !important;
        }
        }
        #terminalModal .command-success {
            color: #c3e88d !important;
            background-color: #24283b !important;
        }
        #terminalModal .command-error {
            color: #ff007c !important;
            background-color: #24283b !important;
        }
        #terminalModal .modal-content {
            border: 1px solid #1f2335 !important;
            background-color: #24283b !important;
            border-radius: 8px !important;
            box-shadow: 0 0 15px rgba(30, 33, 48, 1) !important;
        }
        #terminalModal .modal-header {
            border-bottom: none !important;
            padding: 1rem !important;
            background-color: #24283b !important;
            min-height: 60px !important;
        }
        #terminalModal .modal-title {
            color: #f2f2f2 !important;
            font-family: monospace !important;
            font-size: 14px !important;
            background-color: #24283b !important;
            width: 100% !important;
            text-align: center !important;
        }
        #terminalModal .modal-body {
            padding: 0 !important;
            background-color: #24283b !important;
            position: relative !important;
        }
        #terminalModal .modal-dialog {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -70%) !important;
            background-color: #24283b !important;
            max-width: 900px !important;
            width: 95% !important;  // This ensures some margin on mobile
            margin: 0 !important;
        }
        #terminalModal .terminal-input,
        #terminalModal .terminal-output,
        #terminalModal .terminal-prompt,
        #terminalModal .modal-title {
            font-family: "custom", monospace !important;
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  getWelcomeArt() {
    return `
<span style="color:#7aa2f7">
███╗   ██╗███████╗██████╗ ██████╗ ████████╗██╗   ██╗██████╗ ███████╗
████╗  ██║██╔════╝██╔══██╗██╔══██╗╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝
██╔██╗ ██║█████╗  ██████╔╝██║  ██║   ██║    ╚████╔╝ ██████╔╝█████╗
██║╚██╗██║██╔══╝  ██╔══██╗██║  ██║   ██║     ╚██╔╝  ██╔═══╝ ██╔══╝
██║ ╚████║███████╗██║  ██║██████╔╝   ██║      ██║   ██║     ███████╗
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═════╝    ╚═╝      ╚═╝   ╚═╝     ╚══════╝</span>
                                                
<span style="color:#bb9af7">Welcome to NerdType Terminal v1.0.0</span>
<span style="color:#7dcfff">Type 'help' for available commands</span>
`;
  }

  setupEventListeners() {
    const terminalInput = document.getElementById("terminalInput");
    const username = localStorage.getItem("nerdtype_username") || "runner";

    document.querySelector(".terminal-prompt").textContent = `>>`;
    document.getElementById("terminalModalLabel").textContent =
      `${username}@nerdtypeterminalv1.0.0`;

    terminalInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        this.handleCommand(terminalInput.value);
        terminalInput.value = "";
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.navigateHistory("up");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        this.navigateHistory("down");
      }
    });

    document
      .getElementById("terminalModal")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
        }
      });

    // tab completion
    terminalInput.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        this.handleTabCompletion(terminalInput);
      } else if (e.key === "Enter") {
      } else if (e.key === "ArrowUp") {
      }
    });
  }

  handleTabCompletion(input) {
    const currentInput = input.value;
    const availableCommands = [
      "help",
      "status",
      "setwords",
      "setbonus",
      "setinitial",
      "setgoal",
      "mode",
      "reset",
      "exit",
      "cls",
      "time",
      "su",
      "ls",
      "cat",
      "refresh",
      "ping",
    ];

    const availableFiles = [
      "scoreboard.data",
      "achievements.data",
      "godmode.txt",
    ];

    // If input starts with 'cat ' or 'rm ', complete filenames
    if (currentInput.startsWith("cat ") || currentInput.startsWith("rm ")) {
      const filePrefix = currentInput.split(" ")[1] || "";
      const matches = availableFiles.filter((file) =>
        file.startsWith(filePrefix.toLowerCase()),
      );

      if (matches.length === 1) {
        const command = currentInput.split(" ")[0];
        input.value = `${command} ${matches[0]}`;
      }
      return;
    }

    // Complete commands
    const matches = availableCommands.filter((cmd) =>
      cmd.startsWith(currentInput.toLowerCase()),
    );

    if (matches.length === 1) {
      input.value = matches[0];
    }
  }

  handleCommand(input) {
    if (!input.trim()) return;

    this.commandHistory.push(input);
    this.historyIndex = this.commandHistory.length;

    const args = input.trim().toLowerCase().split(" ");
    const command = args[0];

    this.printToTerminal(
      `<br><span style="color:#bb9af7">[${localStorage.getItem("nerdtype_username") || "runner"}@PENTAGON-CORE:~]$ </span>${input}`,
    );

    if (this.commands[command]) {
      this.commands[command](args.slice(1));
    } else {
      this.printToTerminal(
        'Command not found. Type "help" for available commands.',
        "command-error",
      );
    }
  }

  navigateHistory(direction) {
    const terminalInput = document.getElementById("terminalInput");

    if (direction === "up" && this.historyIndex > 0) {
      this.historyIndex--;
      terminalInput.value = this.commandHistory[this.historyIndex];
    } else if (
      direction === "down" &&
      this.historyIndex < this.commandHistory.length
    ) {
      this.historyIndex++;
      terminalInput.value = this.commandHistory[this.historyIndex] || "";
    }
  }

  printToTerminal(message, className = "") {
    const output = document.getElementById("terminalOutput");
    const messageElement = document.createElement("div");
    messageElement.innerHTML = message;
    if (className) {
      messageElement.classList.add(className);
    }
    output.appendChild(messageElement);
    output.scrollTop = output.scrollHeight;
  }

  clearTerminal() {
    const output = document.getElementById("terminalOutput");
    output.innerHTML = "";
  }

  showTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const dateStr = now.toLocaleDateString();
    const timeText = `
> TIME AND DATE:
> ================================
  └─ Time: <span style='color:#7dcfff'>${timeStr}</span>
  └─ Date: <span style='color:#7dcfff'>${dateStr}</span>
> ================================`;

    this.printToTerminal(timeText, "command-success");
  }

  showHelp() {
    const helpText = `
Available commands:
  setwords <number>            - Set number of words for win (default: 30)
  setbonus <seconds>            - Set bonus energy per word (default: 3)
  setinitial <seconds>          - Set starting energy (default: 10)
  setgoal <percentage>             - Set goal percentage (default: 100)
  mode <type>                - Set game mode (classic/hard/practice)
  rm <filename>                  - Delete file contents
  status               - Show current game settings
  su <username>                  - Switch user
  cat <filename>                 - Display file contents
  ls                   - List available files
  time                 - Show current time and date
  cls                  - Clear terminal screen
  ping                 - Test neural connection latency
  refresh              - Clear screen and show welcome art
  reset                - Reset all settings to default
  exit                 - Close terminal
  help                 - Show this help message`;
    this.printToTerminal(helpText, "command-success");
  }

  showStatus() {
    try {
      const settings = this.gameSettings;
      if (!settings) {
        this.printToTerminal(
          "Error: Could not load game settings",
          "command-error",
        );
        return;
      }

      const statusText = `> CURRENT GAME SETTINGS:
> ================================
  └─ MODE: <span style='color:#ff9e64'>${settings.currentMode?.toUpperCase() || "CLASSIC"}</span>
  └─ WORDS NEEDED: <span style='color:#c3e88d'>${settings.timeLimit || 30}</span>
  └─ BONUS ENERGY: <span style='color:#bb9af7'>${settings.bonusTime || 3}</span> units
  └─ INITIAL ENERGY: <span style='color:#7dcfff'>${settings.initialTime || 10}</span> units
  └─ GOAL PERCENTAGE: <span style='color:#ff9e64'>${settings.goalPercentage || 100}</span>%
> ================================`;

      this.printToTerminal(statusText, "command-success");
    } catch (error) {
      this.printToTerminal(
        "Error displaying status: " + error.message,
        "command-error",
      );
    }
  }

  refresh() {
    const output = document.getElementById("terminalOutput");
    output.innerHTML = "";
    this.printToTerminal(this.getWelcomeArt());
  }

  listFiles() {
    const fileText = `
  <span style="color:#7dcfff">achievements.data</span>
  <span style="color:#7dcfff">godmode.txt</span>
  <span style="color:#7dcfff">scoreboard.data</span>`;
    this.printToTerminal(fileText, "command-success");
  }

  pingSystem() {
    const responses = [
      "Establishing neural link...",
      "Scanning quantum networks...",
      "Bypassing security protocols...",
      "Calculating neural latency...",
    ];

    let currentLine = 0;
    const startPing = () => {
      if (currentLine < responses.length) {
        this.printToTerminal(responses[currentLine]);
        currentLine++;
        setTimeout(startPing, 500);
      } else {
        // Final response with random latency
        const latency = Math.floor(Math.random() * 20) + 1;
        this.printToTerminal(
          `Neural connection established - Latency: <span style='color:#c3e88d'>${latency}ms</span>`,
          "command-success",
        );
      }
    };

    startPing();
  }

  catFile(args) {
    const filename = args[0];
    if (!filename) {
      this.printToTerminal("Error: Please specify a file", "command-error");
      return;
    }

    switch (filename) {
      case "scoreboard.data":
        const results = JSON.parse(localStorage.getItem("gameResults")) || [];
        if (results.length === 0) {
          this.printToTerminal("No scoreboard data found", "command-error");
          return;
        }
        results.reverse().forEach((result) => {
          if (result.mode === "Classic Mode") {
            this.printToTerminal(
              `${result.date} | ${result.username} | ${result.mode} | Score: ${result.score}, WPM: ${result.wpm}, Accuracy: ${result.accuracy}`,
              "command-success",
            );
          }
          if (result.mode === "Zen Mode") {
            this.printToTerminal(
              `${result.date} | ${result.username} | ${result.mode} | Time: ${result.totalTime}, WPM: ${result.wpm}, Accuracy: ${result.accuracy}%`,
              "command-success",
            );
          }
        });
        break;

      case "achievements.data":
        const achievements =
          JSON.parse(localStorage.getItem("highestAchievements")) || {};
        if (!achievements.speedTier) {
          this.printToTerminal("No achievement data found", "command-error");
          return;
        }
        this.printToTerminal(
          `
Highest Achievements:
  Speed Tier: ${achievements.speedTier}
  Accuracy Rank: ${achievements.accuracyRank}`,
          "command-success",
        );
        break;

      case "godmode.txt":
        const secretText = `
# BEGIN ENCRYPTED FILE #
hj24lfa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z
jaö3pa7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6
90laef9f8e7d6c5b4a3b2c1d0e9f8e7d6c5b4a3b2c1d0e9f8e7d6c5b4
3nc3fjx4y3z2a1b2c3#####################4o5p6q7r8s9t0u1v2w
1j0jdäjf8e7d6c5b4a#####################b2c1d0e9f8e7d6c5b4
l9vn82åa1b2c3d4e5G#####MODE##zen#######jh34j24hjk2lh342jc
zn7eö2u9f8e7d6c5b4#####CODE##iddqd#####ih23434hl23hk4l2h3 
23lnf32c1d0e9f8e7d#####################c5b4a3b2c1d0e9f8e7
l34j5l7h8i9j0k1l2m#####################x4y5z6a1b2c3d4e5f6
9fsöku2c1d0e9f8e7d6c5b4a3b2c1d0e9f8e7d6c5b4a3b2c1d0e9f8e7
j5jnaäx4y3z2a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w
02l2n0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z
# END ENCRYPTED FILE #`;
        this.printToTerminal(secretText, "command-success");
        break;

      default:
        this.printToTerminal(
          `Error: File '${filename}' not found`,
          "command-error",
        );
    }
  }

  removeFile(args) {
    const filename = args[0];
    if (!filename) {
      this.printToTerminal("Error: Please specify a file", "command-error");
      return;
    }
    switch (filename) {
      case "scoreboard.data":
        localStorage.removeItem("gameResults");
        this.printToTerminal("Scoreboard data deleted", "command-success");
        break;
      case "achievements.data":
        localStorage.removeItem("highestAchievements");
        this.printToTerminal("Achievement data deleted", "command-success");
        break;
      case "godmode.txt":
        this.printToTerminal(
          "Error: Permission denied - Cannot delete system file",
          "command-error",
        );
        break;
      default:
        this.printToTerminal(
          `Error: File '${filename}' not found`,
          "command-error",
        );
    }
  }

  setWords(args) {
    const wordCount = parseInt(args[0]);
    if (isNaN(wordCount) || wordCount < 1) {
      this.printToTerminal(
        "Error: Please provide a valid number of words",
        "command-error",
      );
      return;
    }
    this.gameSettings.timeLimit = wordCount;
    localStorage.setItem("terminalSettings", JSON.stringify(this.gameSettings));
    this.printToTerminal(
      `Success: Word goal set to ${wordCount} words`,
      "command-success",
    );
    window.dispatchEvent(
      new CustomEvent("gameSettingsChanged", {
        detail: { setting: "timeLimit", value: wordCount },
      }),
    );
  }

  setBonus(args) {
    const bonus = parseInt(args[0]);
    if (isNaN(bonus) || bonus < 0) {
      this.printToTerminal(
        "Error: Please provide a valid bonus time",
        "command-error",
      );
      return;
    }
    this.gameSettings.bonusTime = bonus;
    localStorage.setItem("terminalSettings", JSON.stringify(this.gameSettings));
    this.printToTerminal(
      `Success: Bonus energy set to ${bonus} units`,
      "command-success",
    );
    window.dispatchEvent(
      new CustomEvent("gameSettingsChanged", {
        detail: { setting: "bonusTime", value: bonus },
      }),
    );
  }

  setInitial(args) {
    const initial = parseInt(args[0]);
    if (isNaN(initial) || initial < 1) {
      this.printToTerminal(
        "Error: Please provide a valid initial time",
        "command-error",
      );
      return;
    }
    this.gameSettings.initialTime = initial;
    localStorage.setItem("terminalSettings", JSON.stringify(this.gameSettings));
    this.printToTerminal(
      `Success: Initial energy set to ${initial} units`,
      "command-success",
    );
    window.dispatchEvent(
      new CustomEvent("gameSettingsChanged", {
        detail: { setting: "initialTime", value: initial },
      }),
    );
  }

  setGoal(args) {
    const goal = parseInt(args[0]);
    if (isNaN(goal) || goal < 1 || goal > 100) {
      this.printToTerminal(
        "Error: Please provide a valid goal percentage (1-100)",
        "command-error",
      );
      return;
    }
    this.gameSettings.goalPercentage = goal;
    localStorage.setItem("terminalSettings", JSON.stringify(this.gameSettings));
    this.printToTerminal(`Success: Goal set to ${goal}%`, "command-success");
    window.dispatchEvent(
      new CustomEvent("gameSettingsChanged", {
        detail: { setting: "goalPercentage", value: goal },
      }),
    );
  }

  switchUser(args) {
    const newUsername = args[0];
    if (!newUsername) {
      this.printToTerminal("Error: Please provide a username", "command-error");
      return;
    }

    localStorage.setItem("nerdtype_username", newUsername);
    this.printToTerminal(
      `Success: Switched user to ${newUsername}`,
      "command-success",
    );

    // Update terminal prompt
    document.querySelector(".terminal-prompt").textContent = `$`;
    document.getElementById("terminalModalLabel").textContent =
      `${newUsername}@nerdtypeterminalv1.0.0`;
  }

  setMode(args) {
    const mode = args[0];
    if (!this.gameModes[mode]) {
      this.printToTerminal(
        "Error: Invalid mode. Available modes: classic, hard, practice",
        "command-error",
      );
      return;
    }

    const settings = this.gameModes[mode];
    this.gameSettings = { ...settings, currentMode: mode };
    localStorage.setItem("terminalSettings", JSON.stringify(this.gameSettings));

    this.printToTerminal(
      `Success: Switched to ${mode} mode`,
      "command-success",
    );
    Object.entries(settings).forEach(([setting, value]) => {
      window.dispatchEvent(
        new CustomEvent("gameSettingsChanged", {
          detail: { setting, value },
        }),
      );
    });
  }

  resetSettings() {
    this.gameSettings = { ...this.gameModes.classic, currentMode: "classic" };
    localStorage.setItem("terminalSettings", JSON.stringify(this.gameSettings));
    this.printToTerminal(
      "Settings reset to classic mode defaults",
      "command-success",
    );
    Object.entries(this.gameModes.classic).forEach(([setting, value]) => {
      window.dispatchEvent(
        new CustomEvent("gameSettingsChanged", {
          detail: { setting, value },
        }),
      );
    });
  }

  closeTerminal() {
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("terminalModal"),
    );
    if (modal) {
      modal.hide();
      location.reload();
    }
  }

  open() {
    const modal = new bootstrap.Modal(document.getElementById("terminalModal"));
    modal.show();
    document.getElementById("terminalOutput").innerHTML = "";
    this.printToTerminal(this.getWelcomeArt());
    setTimeout(() => {
      document.getElementById("terminalInput").focus();
    }, 500);
  }

  getSettings() {
    return { ...this.gameSettings };
  }
}

export default Terminal;
