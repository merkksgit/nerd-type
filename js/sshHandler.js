// sshHandler.js
class SSHHandler {
  constructor(terminal) {
    this.terminal = terminal;
    this.isAuthenticated = false;
    this.passwordAttempts = 0;
    this.maxAttempts = 3;
    this.originalPrompt = null;
    this.originalModalLabel = null;
    this.originalHandleCommand = null;
  }

  connect() {
    this.terminal.printToTerminal(
      "Connecting to 10.0.13.37...",
      "command-success",
    );
    setTimeout(() => {
      this.promptPassword();
    }, 1000);
  }

  promptPassword() {
    this.terminal.printToTerminal("Password: ", "");

    // Save the current command handler
    const originalHandler = this.terminal.handleCommand;

    // Override the command handler to handle password input
    this.terminal.handleCommand = (input) => {
      // Don't add password attempts to command history
      this.terminal.commandHistory.pop();

      // Remove the password from session history too
      this.terminal.sessionCommandHistory.pop();

      // Check password (placeholder for now)
      if (input === "iddqd") {
        this.isAuthenticated = true;
        this.terminal.printToTerminal("", "command-success");
        this.terminal.printToTerminal(
          "Authentication successful!",
          "command-success",
        );
        setTimeout(() => {
          this.handleSuccessfulLogin();
        }, 500);
      } else {
        this.passwordAttempts++;

        if (this.passwordAttempts >= this.maxAttempts) {
          this.terminal.printToTerminal("", "command-error");
          this.terminal.printToTerminal(
            "Too many authentication failures",
            "command-error",
          );
          this.terminal.printToTerminal(
            "Connection to 10.0.13.37 closed.",
            "command-error",
          );

          // Restore original command handler
          this.terminal.handleCommand = originalHandler;
          return;
        }

        this.terminal.printToTerminal("", "command-error");
        this.terminal.printToTerminal("Access denied", "command-error");
        this.promptPassword();
        return;
      }

      // Restore original command handler
      this.terminal.handleCommand = originalHandler;
    };
  }

  handleSuccessfulLogin() {
    // Display the ASCII art logo
    const cortanaLogo = `
 ▄████▄   ▒█████   ██▀███  ▄▄▄█████▓ ▄▄▄       ███▄    █  ▄▄▄      
▒██▀ ▀█  ▒██▒  ██▒▓██ ▒ ██▒▓  ██▒ ▓▒▒████▄     ██ ▀█   █ ▒████▄    
▒▓█    ▄ ▒██░  ██▒▓██ ░▄█ ▒▒ ▓██░ ▒░▒██  ▀█▄  ▓██  ▀█ ██▒▒██  ▀█▄  
▒▓▓▄ ▄██▒▒██   ██░▒██▀▀█▄  ░ ▓██▓ ░ ░██▄▄▄▄██ ▓██▒  ▐▌██▒░██▄▄▄▄██ 
▒ ▓███▀ ░░ ████▓▒░░██▓ ▒██▒  ▒██▒ ░  ▓█   ▓██▒▒██░   ▓██░ ▓█   ▓██▒
░ ░▒ ▒  ░░ ▒░▒░▒░ ░ ▒▓ ░▒▓░  ▒ ░░    ▒▒   ▓▒█░░ ▒░   ▒ ▒  ▒▒   ▓▒█░
  ░  ▒     ░ ▒ ▒░   ░▒ ░ ▒░    ░      ▒   ▒▒ ░░ ░░   ░ ▒░  ▒   ▒▒ ░
░        ░ ░ ░ ▒    ░░   ░   ░        ░   ▒      ░   ░ ░   ░   ▒   
░ ░          ░ ░     ░                    ░  ░         ░       ░  ░
░                                                                  
`;

    this.terminal.printToTerminal(
      `<span style="color:#c53b53">${cortanaLogo}</span>`,
      "command-success",
    );
    this.terminal.printToTerminal(
      `<span style="color:#c3e88d">Welcome to CortanaOS v1.17</span>`,
      "command-success",
    );
    this.terminal.printToTerminal(
      `<span style="color:#c3e88d">Last login: Thu Jan 13 13:37:00 2022</span>`,
      "command-success",
    );
    // this.terminal.printToTerminal(
    //   `<span style="color:#c3e88d">Type 'help' for available commands</span>`,
    //   "command-success",
    // );

    // Change the window title
    const modalLabelElement = document.getElementById("terminalModalLabel");
    if (modalLabelElement) {
      this.originalModalLabel = modalLabelElement.textContent;
      modalLabelElement.textContent = "admin@10.0.13.37";
    }

    // Save the original command handler
    this.originalHandleCommand = this.terminal.handleCommand;

    // Create a custom command handler for the SSH session
    this.terminal.handleCommand = (input) => {
      if (!input.trim()) return;

      // Process the command as usual
      this.terminal.commandHistory.push(input);
      this.terminal.historyIndex = this.terminal.commandHistory.length;

      // Add to session history with timestamp
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      this.terminal.sessionCommandHistory.push({
        command: input,
        timestamp: timestamp,
        user: "admin", // Note this is now "admin" instead of the regular username
      });

      // Display the command with the admin prompt in the output area
      this.terminal.printToTerminal(
        `<br><span style="color:#bb9af7">[admin@10.0.13.37:~]$ </span>${input}`,
      );

      // Check for SSH-specific commands
      if (
        input.trim().toLowerCase() === "exit" ||
        input.trim().toLowerCase() === "logout"
      ) {
        this.terminal.printToTerminal(
          "Connection to 10.0.13.37 closed.",
          "command-success",
        );

        // Restore original title
        if (modalLabelElement && this.originalModalLabel) {
          modalLabelElement.textContent = this.originalModalLabel;
        }

        // Restore original command handler
        this.terminal.handleCommand = this.originalHandleCommand;
        return;
      }

      // Add your custom SSH commands here
      if (input.trim().toLowerCase() === "ls") {
        this.terminal.printToTerminal(
          "secret_file.txt  classified  system.log",
          "command-success",
        );
        return;
      }

      if (input.trim().toLowerCase() === "cat secret_file.txt") {
        this.terminal.printToTerminal(
          "YOU FOUND THE SECRET MESSAGE!",
          "command-success",
        );
        this.terminal.printToTerminal(
          "Congratulations on discovering this easter egg.",
          "command-success",
        );
        return;
      }

      // For unrecognized commands
      this.terminal.printToTerminal(
        "Command not found. This is a restricted shell.",
        "command-error",
      );
    };
  }
}

export default SSHHandler;
