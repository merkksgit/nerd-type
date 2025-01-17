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
      clear: this.clearTerminal.bind(this),
      time: this.showTime.bind(this),
      // Secret commands
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
            padding: 0 20px 20px 20px !important;  // Removed top padding
            font-family: "custom" !important;
            height: 500px !important;
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
            max-height: calc(500px - 40px) !important;
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
            color: #ff007c !important;
            font-family: monospace !important;
            font-size: 16px !important;
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
                                                
<span style="color:#bb9af7">    Welcome to NerdType Terminal v1.0.0</span>
<span style="color:#7dcfff">    Type 'help' for available commands</span>
`;
  }

  setupEventListeners() {
    const terminalInput = document.getElementById("terminalInput");
    const username = localStorage.getItem("nerdtype_username") || "runner";

    document.querySelector(".terminal-prompt").textContent = `>>`;
    document.getElementById("terminalModalLabel").textContent =
      `${username}@terminal`;

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
  status               - Show current game settings
  time                 - Show current time and date
  clear                - Clear terminal screen
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
    this.printToTerminal(`<span style="color:#7dcfff">godmode.txt</span>`);
  }

  catFile(args) {
    if (!args.length) {
      this.printToTerminal("Usage: cat <filename>", "command-error");
      return;
    }

    const filename = args[0];
    if (filename === "godmode.txt") {
      const secretText = `
# BEGIN ENCRYPTED FILE #
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z
7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6
9f8e7d6c5b4a3b2c1d0e9f8e7d6c5b4a3b2c1d0e9f8e7d6c5b4
x4y3z2a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w
9f8e7d6c5b4a3b2###############4a3b2c1d0e9f8e7d6c5b4
åa1b2c3d4e5GAME# MODE: zen   #hk2jh34j24hjk2lh342jc
u9f8e7d6c5b4a3b# CODE: iddqd #4lkih23434hl23hk4l2h3 
2c1d0e9f8e7d6c5###############7d6c5b4a3b2c1d0e9f8e7
7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6
2c1d0e9f8e7d6c5b4a3b2c1d0e9f8e7d6c5b4a3b2c1d0e9f8e7
x4y3z2a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z
# END ENCRYPTED FILE #</span>`;
      this.printToTerminal(secretText, "command-success");
    } else {
      this.printToTerminal(
        `Error: ${filename}: No such file or directory`,
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
      `Success: Initial time set to ${initial} seconds`,
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
