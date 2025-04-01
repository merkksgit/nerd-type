// Define a list of available word lists
const availableWordLists = {
  finnish: {
    name: "Finnish",
    source: "./words-fin.js",
  },
  english: {
    name: "English",
    source: "./words-eng.js",
  },
  swedish: {
    name: "Swedish",
    source: "./words-sve.js",
  },
  programming: {
    name: "Programming",
    source: "./words-prog.js",
  },
  nightmare: {
    name: "Nightmare",
    source: "./words-nm.js",
  },
};

const wordListIcons = {
  english: "🇬🇧 ",
  finnish: "🇫🇮 ",
  swedish: "🇸🇪 ",
  programming: "🖥️ ",
  nightmare: "💀 ",
};

// Default language (you can set this based on the current page)
let currentLanguage = localStorage.getItem("nerdtype_wordlist") || "finnish";

// Function to dynamically import word lists
async function loadWordList(language) {
  try {
    // Store user preference
    localStorage.setItem("nerdtype_wordlist", language);
    currentLanguage = language;
    // Dynamically import the selected word list
    const module = await import(availableWordLists[language].source);
    return module.words;
  } catch (error) {
    console.error("Error loading word list:", error);
    // Fallback to Finnish if there's an error
    const fallback = await import("./words-fin.js");
    return fallback.words;
  }
}

// Function to create the word list selector UI
function createWordListSelector(container) {
  // Create a select element for the word lists
  const selectContainer = document.createElement("div");
  selectContainer.className = "word-list-selector mb-3";

  // Create label
  const label = document.createElement("label");
  label.textContent = "Language:";
  label.className = "me-2";
  label.style.color = "#7aa2f7";

  // Create select element
  const select = document.createElement("select");
  select.id = "wordListSelect";
  select.className = "form-select form-select-sm d-inline-block w-auto";

  // Add options for each word list
  Object.keys(availableWordLists).forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = availableWordLists[key].name;
    if (key === currentLanguage) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  // Change language modal
  select.addEventListener("change", async function () {
    const selectedLanguage = this.value;
    // Only reload if necessary
    if (selectedLanguage !== currentLanguage) {
      localStorage.setItem("nerdtype_wordlist", selectedLanguage);

      // Create modal content
      const modalElement = document.getElementById("gameOverModal");
      const modalLabel = document.getElementById("gameOverModalLabel");
      const modalBody = modalElement.querySelector(".modal-body");

      // Set the terminal header
      const playerUsername =
        localStorage.getItem("nerdtype_username") || "runner";
      modalLabel.textContent = `[${playerUsername}@PENTAGON-CORE:~]$`;

      // Create terminal-style content
      const terminalLines = [
        "> INITIALIZING LANGUAGE SWITCH...",
        `> TARGET LANGUAGE: ${selectedLanguage.toUpperCase()}`,
        "> ================================",
        "> EXECUTING OPERATIONS:",
        "  └─ LOADING VOCABULARY DATABASE",
        "  └─ RECONFIGURING INTERFACE",
        "> ================================",
        "> SYSTEM MESSAGE:",
        `  <span style='color:#c3e88d'>DATABASE SWITCH IN PROGRESS</span>`,
        "> ================================",
        "> STANDBY FOR IMPLEMENTATION",
        "> END OF TRANSMISSION_",
      ];

      // Set up the modal body
      modalBody.innerHTML = '<pre class="terminal-output"></pre>';

      let currentLine = 0;
      let modalContent = "";

      // Create a Bootstrap modal instance
      const gameOverModal = new bootstrap.Modal(modalElement);

      // Function to type lines one by one
      function typeNextLine() {
        if (currentLine < terminalLines.length) {
          modalContent += terminalLines[currentLine] + "\n";
          modalBody.querySelector(".terminal-output").innerHTML = modalContent;
          currentLine++;

          // Add progress indicator to the last line
          if (currentLine === terminalLines.length) {
            let progress = 0;
            const progressInterval = setInterval(() => {
              progress += 10;
              if (progress <= 100) {
                modalBody.querySelector(".terminal-output").innerHTML =
                  modalContent +
                  `> PROGRESS: <span style='color:#c3e88d'>${progress}%</span>\n`;
              } else {
                clearInterval(progressInterval);
                // Reload page after progress reaches 100%
                setTimeout(() => {
                  location.reload();
                }, 500);
              }
            }, 200);
          }

          setTimeout(typeNextLine, 150);
        }
      }

      // Hide the restart button only for language change modal
      const restartGameBtn = document.getElementById("restartGameBtn");
      if (restartGameBtn) {
        // Save the original display style
        const originalDisplay = restartGameBtn.style.display;
        restartGameBtn.style.display = "none";

        // Add an event listener to restore the button when modal is hidden
        modalElement.addEventListener(
          "hidden.bs.modal",
          function restoreButton() {
            restartGameBtn.style.display = originalDisplay;
            modalElement.removeEventListener("hidden.bs.modal", restoreButton);
          },
          { once: true },
        );
      }

      // Show the modal and start typing
      gameOverModal.show();
      typeNextLine();
    }
  });

  // Add elements to container
  selectContainer.appendChild(label);
  selectContainer.appendChild(select);
  container.appendChild(selectContainer);

  return select;
}

// Export functions and variables
export {
  loadWordList,
  createWordListSelector,
  wordListIcons,
  availableWordLists,
  currentLanguage,
};
