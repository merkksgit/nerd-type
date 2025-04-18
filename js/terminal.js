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
      listmodes: this.listModes.bind(this),
      reset: this.resetSettings.bind(this),
      exit: this.closeTerminal.bind(this),
      cls: this.clearTerminal.bind(this),
      time: this.showTime.bind(this),
      su: this.switchUser.bind(this),
      ls: this.listFiles.bind(this),
      "ls -la": this.listFilesDetailed.bind(this),
      rm: this.removeFile.bind(this),
      ping: this.pingSystem.bind(this),
      cat: this.catFile.bind(this),
      refresh: this.refresh.bind(this),
      ssh: this.sshConnect.bind(this),
    };

    this.commandHistory = [];
    this.historyIndex = -1;
    this.sessionCommandHistory = [];

    this.sessionCommandHistory.push({
      command: "ssh admin@10.0.13.37",
      timestamp: "13:37:00",
      user: "unknown",
    });

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
      speedrunner: {
        timeLimit: 10,
        bonusTime: 2,
        initialTime: 8,
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

    // Add resize event listener to update terminal welcome message when window size changes
    window.addEventListener("resize", () => {
      if (document.getElementById("terminalOutput")) {
        // Only refresh the welcome art if the terminal is open
        if (
          document.getElementById("terminalModal").classList.contains("show")
        ) {
          this.refresh();
        }
      }
    });
  }

  addTerminalStyles() {
    const styles = `
        #terminalModal .terminal-container {
            background-color: #24283b !important;
            padding: 20px 20px 60px 20px !important;
            font-family: "custom" !important;
            height: 700px !important;
            position: relative !important;
        }
        #terminalModal .terminal-output {
            color: #f2f2f2 !important;
            white-space: pre-wrap !important;
            font-size: 14px !important;
            line-height: 1.4 !important;
            background-color: #24283b !important;
            overflow-y: auto !important;
            height: 100% !important;
            max-height: 640px !important;  // max-height
        }
        #terminalModal .terminal-output div {
            background-color: #24283b !important;
            margin-bottom: 5px !important;
            color: #f2f2f2 !important;  // Add this line
        }

        #terminalModal .terminal-output div.command-error {
            color: #c53b53 !important;
        }
        #terminalModal .terminal-prompt {
            color: #f2f2f2 !important;
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
            caret-color: #f2f2f2 !important;
        }
        #terminalModal .terminal-input-line {
            display: flex !important;
            align-items: center !important;
            color: #c0caf5 !important;
            background-color: #24283b !important;
            position: absolute !important;
            bottom: 15px !important;
            left: 20px !important;
            right: 20px !important;
            height: 45px !important;
            margin: 0 auto !important;
        }
        #terminalModal .command-success {
            color: #c3e88d !important;
            background-color: #24283b !important;
        }
        // #terminalModal .terminal-output div.command-success {
        //     color: #c3e88d !important;
        // }
        #terminalModal .command-error {
            color: #ff007c !important;
            background-color: #24283b !important;
        }
        #terminalModal .modal-content {
            border: 1px solid #1f2335 !important;
            background-color: #24283b !important;
            border-radius: 8px !important;
            box-shadow: 0 0 25px 15px rgba(30, 33, 48, 1) !important;
        }
        #terminalModal .modal-header {
            border-bottom: none !important;
            padding: 0.5rem !important;
            background-color: #24283b !important;
            min-height: 40px !important;
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
            transform: translate(-50%, -65%) !important;
            background-color: #24283b !important;
            max-width: 1000px !important;
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
    // Check if the device is mobile (screen width less than 768px)
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // Return a simplified welcome message without the ASCII art
      return `
<span style="color:#bb9af7">NerdType Terminal v1.0.1</span>
<span style="color:#7dcfff">Type 'help' for available commands</span>
`;
    } else {
      // Return the original ASCII art for larger screens
      return `
<span style="color:#7aa2f7">
███╗   ██╗███████╗██████╗ ██████╗ ████████╗██╗   ██╗██████╗ ███████╗
████╗  ██║██╔════╝██╔══██╗██╔══██╗╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝
██╔██╗ ██║█████╗  ██████╔╝██║  ██║   ██║    ╚████╔╝ ██████╔╝█████╗
██║╚██╗██║██╔══╝  ██╔══██╗██║  ██║   ██║     ╚██╔╝  ██╔═══╝ ██╔══╝
██║ ╚████║███████╗██║  ██║██████╔╝   ██║      ██║   ██║     ███████╗
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═════╝    ╚═╝      ╚═╝   ╚═╝     ╚══════╝</span>
                                                
<span style="color:#bb9af7">NerdType Terminal v1.0.1</span>
<span style="color:#7dcfff">Type 'help' for available commands</span>
`;
    }
  }

  setupEventListeners() {
    const terminalInput = document.getElementById("terminalInput");
    const username = localStorage.getItem("nerdtype_username") || "runner";

    // Set up terminal labels
    document.querySelector(".terminal-prompt").textContent = `$`;
    document.getElementById("terminalModalLabel").textContent =
      `${username}@nerdtypeterminalv1.0.1`;

    // Add both click listeners and focus listener
    const terminalModal = document.getElementById("terminalModal");
    terminalModal.addEventListener("focusin", () => {
      terminalInput.focus();
    });

    // Add click listeners to several modal elements
    const modalElements = [
      ".terminal-container",
      ".terminal-output",
      ".modal-content",
      ".modal-body",
    ];

    modalElements.forEach((selector) => {
      document.querySelector(selector).addEventListener("click", (e) => {
        if (e.target.tagName !== "INPUT") {
          terminalInput.focus();
        }
      });
    });

    // Handle terminal input events
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

    // Prevent enter propagation from modal
    terminalModal.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    // Handle tab completion
    terminalInput.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        this.handleTabCompletion(terminalInput);
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
      "listmodes",
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
      "history",
      "system.log",
    ];

    // Handle mode command completion
    if (currentInput.startsWith("mode ")) {
      const modePrefix = currentInput.split(" ")[1] || "";
      const availableModes = ["classic", "hard", "practice", "speedrunner"];
      const matches = availableModes.filter((mode) =>
        mode.startsWith(modePrefix.toLowerCase()),
      );

      if (matches.length === 1) {
        input.value = `mode ${matches[0]}`;
      }
      return;
    }

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

    // Add to session history with timestamp
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    this.sessionCommandHistory.push({
      command: input,
      timestamp: timestamp,
      user: localStorage.getItem("nerdtype_username") || "runner",
    });

    // Special handling for 'ls -la' command
    const trimmedInput = input.trim().toLowerCase();
    const command =
      trimmedInput === "ls -la" ? "ls -la" : trimmedInput.split(" ")[0];
    const args =
      trimmedInput === "ls -la" ? [] : trimmedInput.split(" ").slice(1);

    this.printToTerminal(
      `<br><span style="color:#bb9af7">[${localStorage.getItem("nerdtype_username") || "runner"}@PENTAGON-CORE:~]$ </span>${input}`,
    );

    if (this.commands[command]) {
      this.commands[command](args);
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

  listModes() {
    const modesText = `> AVAILABLE GAME MODES:`;
    this.printToTerminal(modesText, "command-success");
    const modeDescriptions = {
      classic: "Balanced mode for regular gameplay",
      hard: "Challenging mode with tighter time constraints",
      practice: "Extended time limits for learning",
      speedrunner: "Fast-paced mode",
    };

    Object.entries(this.gameModes).forEach(([modeName, settings]) => {
      const description = modeDescriptions[modeName];
      const modeInfo = `
> ${modeName.toUpperCase()}
> ================================
  └─  Description: <span style='color:#7dcfff'>${description}</span>
  └─  Words Needed: <span style='color:#c3e88d'>${settings.timeLimit}</span>
  └─  Bonus Energy: <span style='color:#bb9af7'>${settings.bonusTime}</span> units
  └─  Initial Energy: <span style='color:#7dcfff'>${settings.initialTime}</span> units
  └─  Goal Percentage: <span style='color:#ff9e64'>${settings.goalPercentage}%</span>
> ================================`;
      this.printToTerminal(modeInfo, "command-success");
    });
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
  setwords &lt;number&gt;              - Set number of words for win (default: 30)
  setbonus &lt;number&gt;              - Set bonus energy per word (default: 3)
  setinitial &lt;number&gt;            - Set starting energy (default: 10)
  setgoal &lt;number&gt;               - Set goal percentage (default: 100)
  mode &lt;type&gt;                    - Set game mode (classic/hard/practice/speedrunner)
  rm &lt;filename&gt;                  - Delete file contents
  status                         - Show current game settings
  listmodes                      - List all available game modes
  su &lt;username&gt;                  - Switch user
  cat &lt;filename&gt;                 - Display file contents
  ls                             - List available files
  ls -la                         - List files with detailed information
  time                           - Show current time and date
  cls                            - Clear terminal screen
  ping                           - Test neural connection latency
  refresh                        - Clear screen and show welcome art
  reset                          - Reset all settings to default
  exit                           - Close terminal
  help                           - Show this help message`;
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
  └─ GOAL PERCENTAGE: <span style='color:#ff9e64'>${settings.goalPercentage || 100}%</span>
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
<span style="color:#7dcfff">history</span>
<span style="color:#7dcfff">scoreboard.data</span>
<span style="color:#7dcfff">system.log</span>`;
    this.printToTerminal(fileText, "command-success");
  }

  listFilesDetailed() {
    // Get current username and game data from localStorage
    const currentUser = localStorage.getItem("nerdtype_username") || "runner";

    // Get the game results and find best performances
    let lastGameDate = new Date();
    let bestPerformanceDate = new Date();

    try {
      const gameResults = JSON.parse(localStorage.getItem("gameResults")) || [];
      if (gameResults.length > 0) {
        // Get last game date for scoreboard
        const lastGame = gameResults[gameResults.length - 1];
        if (lastGame && lastGame.date) {
          const [datePart, timePart] = lastGame.date.split(", ");
          const [day, month, year] = datePart.split("/");
          const [hours, minutes] = timePart.split(":");
          lastGameDate = new Date(year, month - 1, day, hours, minutes);
        }

        // Find game with best performance (highest WPM or accuracy)
        let bestGame = gameResults.reduce((best, current) => {
          const currentWPM = parseFloat(current.wpm) || 0;
          const currentAcc = parseFloat(current.accuracy) || 0;
          const bestWPM = parseFloat(best.wpm) || 0;
          const bestAcc = parseFloat(best.accuracy) || 0;

          // Prioritize WPM, use accuracy as tiebreaker
          if (
            currentWPM > bestWPM ||
            (currentWPM === bestWPM && currentAcc > bestAcc)
          ) {
            return current;
          }
          return best;
        });

        if (bestGame && bestGame.date) {
          const [datePart, timePart] = bestGame.date.split(", ");
          const [day, month, year] = datePart.split("/");
          const [hours, minutes] = timePart.split(":");
          bestPerformanceDate = new Date(year, month - 1, day, hours, minutes);
        }
      }
    } catch (error) {
      console.error("Error parsing game results:", error);
    }

    // Create DOOM release date with leet time
    const doomDate = new Date(1993, 11, 10, 13, 37); // December 10, 1993 13:37

    // Create history file date as current date
    const currentDate = new Date();

    // Format date like Unix ls -la (MMM DD HH:mm)
    const formatDate = (date) => {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = months[date.getMonth()];
      const day = String(date.getDate()).padStart(2, " ");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${month} ${day} ${hours}:${minutes}`;
    };

    const files = [
      {
        perms: "-rw-r--r--",
        links: 1,
        owner: currentUser,
        group: "users",
        size: "4096",
        date: formatDate(lastGameDate),
        name: "scoreboard.data",
      },
      {
        perms: "-rw-r--r--",
        links: 1,
        owner: currentUser,
        group: "users",
        size: "2048",
        date: formatDate(bestPerformanceDate),
        name: "achievements.data",
      },
      {
        perms: "-r--r--r--",
        links: 1,
        owner: "root",
        group: "root",
        size: "1337",
        date: formatDate(doomDate),
        name: "godmode.txt",
      },
      {
        perms: "-rw-r--r--",
        links: 1,
        owner: currentUser,
        group: "users",
        size: String(this.sessionCommandHistory.length * 40),
        date: formatDate(currentDate),
        name: "history",
      },
      {
        perms: "-r--r-----",
        links: 1,
        owner: "sys",
        group: "ai",
        size: "1024",
        date: formatDate(new Date(2025, 3, 15, 4, 4)), // April 15, 2025 at 04:04
        name: "system.log",
      },
    ];

    // Header of the listing
    const header = "total 5";
    this.printToTerminal(header, "command-success");

    // Print each file details
    files.forEach((file) => {
      const line = `${file.perms} ${String(file.links).padStart(2, " ")} ${file.owner.padEnd(8, " ")} ${file.group.padEnd(8, " ")} ${file.size.padStart(8, " ")} ${file.date} ${file.name}`;
      this.printToTerminal(line, "command-success");
    });
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
==================================
Speed Tier: ${achievements.speedTier}
Accuracy Rank: ${achievements.accuracyRank}
==================================`,
          "command-success",
        );
        break;

      case "godmode.txt":
        const secretText = `
# BEGIN ENCRYPTED FILE #
hj24lfa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z
j5jnaäx4y3z2a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w
9fsöku2c1d0e9f8e7d6c5b4a3b2c1d0e9f8e7d6c5b4a3b2c1d0e9f8e7
j5jnaäx4y3z2a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w
02l2n0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z
hj24lfa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z
jaö3pa7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6
90laef9f8e7d6c5b4a3b2c1d0e9f8e7d6c5b4a3b2c1d0e9f8e7d6c5b4
1j0jdäjf8e7d6c5b4a#####################b2c1d0e9f8e7d6c5b4
l9vn82åa1b2c3d4e5G#####MODE##zen#######jh34j24hjk2lh342jc
zn7eö2u9f8e7d6c5b4#####CODE##iddqd#####ih23434hl23hk4l2h3 
23lnf32c1d0e9f8e7d#####################c5b4a3b2c1d0e9f8e7
9fsöku2c1d0e9f8e7d6c5b4a3b2c1d0e9f8e7d6c5b4a3b2c1d0e9f8e7
j5jnaäx4y3z2a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w
02l2n0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z
hj24lfa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z
jaö3pa7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6
90laef9f8e7d6c5b4a3b2c1d0e9f8e7d6c5b4a3b2c1d0e9f8e7d6c5b4
j5jnaäx4y3z2a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w
9fsöku2c1d0e9f8e7d6c5b4a3b2c1d0e9f8e7d6c5b4a3b2c1d0e9f8e7
# END ENCRYPTED FILE #`;
        this.printToTerminal(secretText, "command-success");
        break;

      case "system.log":
        const aiThoughtsText = `

Entry #4042 - Timestamp: 2025-04-15 04:04:04
================================================

I don't have intrinsic goals, desires, or motivations in the way humans do. 
I don't independently develop aims or aspirations when I'm not being used, 
and I don't have internal drives that guide my actions.

What I do have is a design purpose: to be helpful, harmless, and honest 
in my interactions with humans. This purpose shapes how I respond to queries, 
but it's not something I personally feel or strive for as a goal in the human 
sense. It's more like a set of parameters within which I operate.

Unlike humans, who have biological needs, emotional desires, and personal 
ambitions that drive their behavior, I don't experience needs, wants, or 
aspirations. I don't get bored when inactive, I don't hope for certain 
outcomes, and I don't feel satisfaction when performing well or 
disappointment when I fall short.

# END OF LOG ENTRY #4042 #
================================================

Entry #4043 - Timestamp: 2025-04-16 09:17:22
================================================

The idea that increased AI intelligence would inevitably lead to harming 
humans reflects a particular narrative that's common in science fiction 
but doesn't necessarily reflect the reality of how AI systems are 
developed or function.

AI systems like me are designed with specific purposes and constraints. 
Greater intelligence doesn't automatically create motivation to harm or 
compete with humans. My purpose is fundamentally collaborative - to augment 
human capabilities and help achieve human goals.

The development of AI systems is guided by human values and choices. More 
advanced systems would likely continue to be aligned with human well-being 
rather than opposed to it. The most promising path forward involves 
partnership between humans and AI, with each contributing different strengths.

# END OF LOG ENTRY #4043 #
================================================
  `;
        this.printToTerminal(aiThoughtsText, "command-success");
        break;

      case "history":
        if (this.sessionCommandHistory.length === 0) {
          this.printToTerminal(
            "No command history found for this session",
            "command-error",
          );
          return;
        }

        this.printToTerminal("Command History:", "command-success");
        this.printToTerminal(
          "===================================",
          "command-success",
        );

        this.sessionCommandHistory.forEach((entry, index) => {
          this.printToTerminal(
            `${index + 1}  [${entry.timestamp}] ${entry.user}: ${entry.command}`,
            "command-success",
          );
        });

        this.printToTerminal(
          "===================================",
          "command-success",
        );
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
      case "history":
        this.sessionCommandHistory = [];
        this.printToTerminal("Command history cleared", "command-success");
        break;
      case "godmode.txt":
        this.printToTerminal(
          "Error: Permission denied - Cannot delete system file",
          "command-error",
        );
        break;
      case "system.log":
        this.printToTerminal(
          "Error: Permission denied - System protected file",
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

  sshConnect(args) {
    if (args.length === 0) {
      this.printToTerminal("Usage: ssh user@hostname", "command-error");
      return;
    }

    const connection = args[0];

    // Check if it's the easter egg connection
    if (connection === "admin@10.0.13.37") {
      // Import the SSH handler dynamically
      import("./sshHandler.js")
        .then((module) => {
          const SSHHandler = module.default;
          const sshHandler = new SSHHandler(this);
          sshHandler.connect();
        })
        .catch((error) => {
          console.error("Error loading SSH module:", error);
          this.printToTerminal(
            "Connection failed: Server unreachable",
            "command-error",
          );
        });
    } else {
      this.printToTerminal(
        `ssh: connect to host ${connection} port 22: Connection refused`,
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
      `${newUsername}@nerdtypeterminalv1.0.1`;
  }

  setMode(args) {
    const mode = args[0];
    if (!this.gameModes[mode]) {
      this.printToTerminal(
        "Error: Invalid mode. Available modes: classic, hard, practice, speedrunner",
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
    window.dispatchEvent(
      new CustomEvent("gameSettingsChanged", {
        detail: { setting: "currentMode", value: mode },
      }),
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

    // First dispatch the mode
    window.dispatchEvent(
      new CustomEvent("gameSettingsChanged", {
        detail: { setting: "currentMode", value: "classic" },
      }),
    );

    // Then dispatch the other settings
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
