// Import word lists with fallback
const FALLBACK_WORDS = [
  "type",
  "word",
  "game",
  "ship",
  "star",
  "code",
  "fast",
  "move",
  "jump",
  "fire",
  "space",
  "laser",
  "defend",
  "rocket",
  "planet",
  "galaxy",
  "orbit",
  "cosmic",
  "asteroid",
  "meteor",
  "comet",
  "nebula",
  "thrust",
  "engine",
  "mission",
  "pilot",
  "shield",
  "energy",
  "weapon",
  "target",
  "destroy",
  "survive",
  "attack",
  "dodge",
  "speed",
  "power",
  "boost",
  "charge",
  "blast",
  "storm",
  "force",
  "craft",
  "beam",
  "core",
  "zone",
  "nova",
  "void",
  "flux",
  "grid",
  "hack",
  "data",
  "link",
  "node",
];

// Achievement system not imported - asteroid game is separate
// Storage manager not imported - using localStorage directly

class AsteroidGame {
  constructor() {
    this.canvas = document.getElementById("asteroidCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.input = document.getElementById("asteroidInput");
    this.gameOverModal = document.getElementById("asteroidGameOver");

    // UI elements
    this.scoreElement = document.getElementById("asteroidScore");
    this.livesElement = document.getElementById("asteroidLives");
    this.levelElement = document.getElementById("asteroidLevel");
    this.finalScoreElement = document.getElementById("asteroidFinalScore");
    this.finalLevelElement = document.getElementById("asteroidFinalLevel");
    this.finalWordsElement = document.getElementById("asteroidFinalWords");

    // Game state
    this.gameRunning = false;
    this.gameStarted = false;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.wordsDestroyed = 0;

    // Game objects
    this.ship = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      size: 20,
      angle: 0, // Current rotation angle in radians
      targetAngle: 0, // Target rotation angle
      rotationSpeed: 0.1, // How fast the ship rotates
    };

    // Load ship image
    this.shipImage = new Image();
    this.shipImage.src = "../images/spaceship.png";
    this.shipImageLoaded = false;
    this.shipImage.onload = () => {
      this.shipImageLoaded = true;
    };

    this.words = [];
    this.particles = [];
    this.lasers = [];

    // Word list and settings
    this.wordList = []; // Start empty, will be loaded properly
    this.currentLanguage = "english";
    this.difficulty = "normal";

    // Game timing
    this.lastSpawnTime = 0;
    this.spawnInterval = 2000; // milliseconds
    this.gameLoopId = null;

    // Difficulty settings
    this.difficultySettings = {
      easy: {
        lives: 5,
        baseSpeed: 0.3,
        spawnInterval: 3000,
        speedIncrease: 0.02,
      },
      normal: {
        lives: 3,
        baseSpeed: 0.5,
        spawnInterval: 2000,
        speedIncrease: 0.03,
      },
      hard: {
        lives: 1,
        baseSpeed: 0.8,
        spawnInterval: 1500,
        speedIncrease: 0.05,
      },
    };

    this.init();
  }

  async init() {
    console.log("Initializing asteroid game...");
    this.setupEventListeners();
    this.loadSettings();
    await this.loadWordList();
    console.log(`Word list loaded: ${this.wordList.length} words`);
    console.log(`Current language: ${this.currentLanguage}`);
    console.log(`Sample words:`, this.wordList.slice(0, 5));
    this.drawWelcomeScreen();
    this.updateUI();
    console.log("Asteroid game initialized");
  }

  setupEventListeners() {
    // No button event listeners needed - keyboard only controls

    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        // Don't handle Ctrl+Enter here - let it bubble up to global handler
        if (e.key === "Enter" && e.ctrlKey) {
          console.log(
            "Input field - Ctrl+Enter detected, letting it bubble up",
          );
          return; // Let the global handler deal with Ctrl+Enter
        }

        e.preventDefault();
        e.stopPropagation();
        console.log("Input field - checking word:", this.input.value);
        this.checkWord();
      }
    });

    this.input.addEventListener("input", () => {
      if (this.gameRunning) {
        this.highlightMatchingWords();
      }
    });

    // Add specific event listener for the game over modal
    this.gameOverModal.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        console.log("Enter pressed on game over modal");
        e.preventDefault();
        e.stopPropagation();
        this.restartGame();
      }
    });

    // Settings event listeners
    const difficultyRadios = document.querySelectorAll(
      'input[name="asteroidDifficulty"]',
    );
    difficultyRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.checked) {
          this.difficulty = radio.value;
          this.saveSettings();
        }
      });
    });

    const languageRadios = document.querySelectorAll(
      'input[name="asteroidLanguageMode"]',
    );
    languageRadios.forEach((radio) => {
      radio.addEventListener("change", async () => {
        if (radio.checked) {
          this.currentLanguage = radio.value;
          // Update the base game's word list setting too
          localStorage.setItem("nerdtype_wordlist", this.currentLanguage);
          await this.loadWordList();
          this.saveSettings();
        }
      });
    });

    document
      .getElementById("asteroidApplySettingsBtn")
      .addEventListener("click", () => {
        this.applySettings();
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("settingsModal"),
        );
        if (modal) modal.hide();
      });

    // Focus input when clicking canvas
    this.canvas.addEventListener("click", () => {
      this.input.focus();
    });

    // Listen for storage changes to sync with base game settings
    window.addEventListener("storage", (e) => {
      if (e.key === "nerdtype_wordlist") {
        console.log(`Storage change detected: ${e.oldValue} -> ${e.newValue}`);
        this.currentLanguage = e.newValue || "english";
        this.loadWordList();
        // Update radio button
        const languageElement = document.getElementById(
          `asteroidLang${this.currentLanguage.charAt(0).toUpperCase() + this.currentLanguage.slice(1)}`,
        );
        if (languageElement) {
          languageElement.checked = true;
        }
      }
    });

    // Global keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      // Debug logging for key events
      if (e.key === "Enter") {
        console.log(
          `Enter key pressed: ctrlKey=${e.ctrlKey}, gameRunning=${this.gameRunning}, gameStarted=${this.gameStarted}, modalVisible=${this.gameOverModal.style.display}, activeElement=${document.activeElement.id || "unknown"}`,
        );
      }

      // Handle Ctrl+Enter FIRST, regardless of what element has focus
      if (e.key === "Enter" && e.ctrlKey) {
        if (this.gameRunning) {
          e.preventDefault();
          e.stopPropagation();
          console.log("Ctrl+Enter pressed - resetting game");
          this.resetAndRestartGame();
          return;
        }
      }

      // Handle regular Enter when game is not running (start/restart)
      if (e.key === "Enter" && !e.ctrlKey && !this.gameRunning) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Enter pressed - starting/restarting game");

        // If game over modal is visible, restart the game
        if (this.gameOverModal.style.display === "block") {
          console.log("Restarting from game over modal");
          this.restartGame();
        } else if (!this.gameStarted) {
          console.log("Starting new game");
          this.startGame();
        }
        return;
      }

      // Don't trigger other shortcuts if typing in input field during game
      if (this.gameRunning && document.activeElement === this.input) {
        // Only allow Escape to pass through for refocusing
        if (e.key === "Escape") {
          e.preventDefault();
          this.input.focus();
        }
        return;
      }

      // Other shortcuts when not focused on input
      if (e.key === "Escape" && this.gameRunning) {
        e.preventDefault();
        this.input.focus();
        return;
      }
    });
  }

  loadSettings() {
    // Use the same word list as the base game
    this.currentLanguage =
      localStorage.getItem("nerdtype_wordlist") || "english";

    // Load asteroid-specific settings
    const settings = JSON.parse(
      localStorage.getItem("asteroidGameSettings") || "null",
    );
    if (settings) {
      this.difficulty = settings.difficulty || "normal";
      // Override with base game language setting
      this.currentLanguage =
        localStorage.getItem("nerdtype_wordlist") ||
        settings.language ||
        "english";

      // Update radio buttons
      const difficultyElement = document.getElementById(
        `asteroid${this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1)}`,
      );
      if (difficultyElement) {
        difficultyElement.checked = true;
      }

      const languageElement = document.getElementById(
        `asteroidLang${this.currentLanguage.charAt(0).toUpperCase() + this.currentLanguage.slice(1)}`,
      );
      if (languageElement) {
        languageElement.checked = true;
      }
    } else {
      // Set default difficulty radio button
      const normalElement = document.getElementById("asteroidNormal");
      if (normalElement) {
        normalElement.checked = true;
      }

      // Set language radio button based on base game setting
      const languageElement = document.getElementById(
        `asteroidLang${this.currentLanguage.charAt(0).toUpperCase() + this.currentLanguage.slice(1)}`,
      );
      if (languageElement) {
        languageElement.checked = true;
      }
    }
  }

  saveSettings() {
    const settings = {
      difficulty: this.difficulty,
      // Don't store language since we use the base game's setting
    };
    localStorage.setItem("asteroidGameSettings", JSON.stringify(settings));
  }

  applySettings() {
    this.saveSettings();
    if (!this.gameRunning) {
      this.resetGame();
    }
  }

  async loadWordList() {
    try {
      // Try to dynamically import word list manager
      const { loadWordList } = await import("./word-list-manager.js");
      this.wordList = await loadWordList(this.currentLanguage);
      console.log(
        `Loaded ${this.wordList.length} words for ${this.currentLanguage}`,
      );
    } catch (error) {
      console.error("Error loading word list, using fallback:", error);
      // Use fallback words
      this.wordList = [...FALLBACK_WORDS];
      console.log(
        `Using fallback word list with ${this.wordList.length} words`,
      );
    }
  }

  async startGame() {
    this.gameRunning = true;
    this.gameStarted = true;

    // Make sure we have the latest word list before starting
    await this.loadWordList();
    console.log(
      `Starting game with ${this.wordList.length} ${this.currentLanguage} words`,
    );

    this.resetGame();
    this.input.focus();
    this.gameOverModal.style.display = "none";
    this.lastSpawnTime = Date.now();
    this.gameLoop();
  }

  resetGame() {
    const settings = this.difficultySettings[this.difficulty];
    this.score = 0;
    this.lives = settings.lives;
    this.level = 1;
    this.wordsDestroyed = 0;
    this.words = [];
    this.particles = [];
    this.lasers = [];
    this.spawnInterval = settings.spawnInterval;
    this.input.value = ""; // Clear input field
    this.updateUI();
  }

  restartGame() {
    console.log(
      "restartGame() called - hiding modal and resetting to start screen",
    );
    this.gameOverModal.style.display = "none";
    // Reset to start screen instead of immediately starting new game
    this.resetToStartScreen();
  }

  resetToStartScreen() {
    // Stop any running game loop
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }

    // Reset game state to initial state
    this.gameRunning = false;
    this.gameStarted = false;
    this.gameOverModal.style.display = "none";

    // Clear existing game objects
    this.words = [];
    this.particles = [];
    this.lasers = [];

    // Reset game stats to initial values
    const settings = this.difficultySettings[this.difficulty];
    this.score = 0;
    this.lives = settings.lives;
    this.level = 1;
    this.wordsDestroyed = 0;
    this.spawnInterval = settings.spawnInterval;
    this.input.value = ""; // Clear input field

    // Update UI
    this.updateUI();

    // Draw welcome screen
    this.drawWelcomeScreen();

    // Remove focus from input field so Enter key can work to start new game
    this.input.blur();

    console.log("Reset to start screen from game over");
  }

  resetAndRestartGame() {
    console.log("resetAndRestartGame called - returning to start screen");
    this.resetToStartScreen();
  }

  gameLoop() {
    if (!this.gameRunning) return;

    this.update();
    this.draw();

    this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    const currentTime = Date.now();
    const settings = this.difficultySettings[this.difficulty];

    // Update ship rotation
    this.updateShipRotation();

    // Spawn new words
    if (currentTime - this.lastSpawnTime > this.spawnInterval) {
      console.log(`Spawning word... Current words: ${this.words.length}`);
      this.spawnWord();
      this.lastSpawnTime = currentTime;
    }

    // Update words
    for (let i = this.words.length - 1; i >= 0; i--) {
      const word = this.words[i];

      // Move word using velocity
      word.x += word.vx;
      word.y += word.vy;

      // Bounce off edges
      const wordWidth = 60; // Approximate word width for collision
      const wordHeight = 20; // Approximate word height for collision
      const bounceSpeedIncrease = 1.02; // Slight speed increase on bounce

      if (word.x <= wordWidth / 2 && word.vx < 0) {
        word.vx = -word.vx * bounceSpeedIncrease; // Reverse and slightly increase speed
        word.x = wordWidth / 2; // Keep word inside bounds
        this.createBounceEffect(word.x, word.y);
      } else if (word.x >= this.canvas.width - wordWidth / 2 && word.vx > 0) {
        word.vx = -word.vx * bounceSpeedIncrease;
        word.x = this.canvas.width - wordWidth / 2;
        this.createBounceEffect(word.x, word.y);
      }

      if (word.y <= wordHeight / 2 && word.vy < 0) {
        word.vy = -word.vy * bounceSpeedIncrease; // Reverse and slightly increase speed
        word.y = wordHeight / 2;
        this.createBounceEffect(word.x, word.y);
      } else if (word.y >= this.canvas.height - wordHeight / 2 && word.vy > 0) {
        word.vy = -word.vy * bounceSpeedIncrease;
        word.y = this.canvas.height - wordHeight / 2;
        this.createBounceEffect(word.x, word.y);
      }

      // Check collision with ship
      const dx = this.ship.x - word.x;
      const dy = this.ship.y - word.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.ship.size + 15) {
        this.words.splice(i, 1);
        this.lives--;
        this.createExplosion(word.x, word.y, "#ef4444");

        if (this.lives <= 0) {
          this.gameOver();
          return;
        }
        this.updateUI();
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      particle.alpha = particle.life / particle.maxLife;

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.life--;
      if (laser.life <= 0) {
        this.lasers.splice(i, 1);
      }
    }

    // Level progression
    const newLevel = Math.floor(this.wordsDestroyed / 10) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.updateUI();
    }
  }

  spawnWord() {
    if (this.wordList.length === 0) {
      console.warn("No words available to spawn, using fallback");
      this.wordList = [...FALLBACK_WORDS];
    }

    const word =
      this.wordList[Math.floor(Math.random() * this.wordList.length)];
    const settings = this.difficultySettings[this.difficulty];
    const speed =
      settings.baseSpeed + (this.level - 1) * settings.speedIncrease;

    // Random starting position around the edges
    let x, y;
    const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
    const margin = 50;

    switch (side) {
      case 0: // Top
        x = Math.random() * this.canvas.width;
        y = -margin;
        break;
      case 1: // Right
        x = this.canvas.width + margin;
        y = Math.random() * this.canvas.height;
        break;
      case 2: // Bottom
        x = Math.random() * this.canvas.width;
        y = this.canvas.height + margin;
        break;
      case 3: // Left
        x = -margin;
        y = Math.random() * this.canvas.height;
        break;
    }

    // Random velocity direction (not necessarily toward ship)
    const angle = Math.random() * Math.PI * 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const wordObj = {
      text: word,
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      matched: false,
      matchedLength: 0,
    };

    this.words.push(wordObj);
    console.log(
      `Spawned word: "${word}" from ${this.currentLanguage} list at (${x.toFixed(1)}, ${y.toFixed(1)}) with velocity (${vx.toFixed(2)}, ${vy.toFixed(2)})`,
    );
  }

  checkWord() {
    const inputText = this.input.value.trim().toLowerCase();
    console.log("checkWord called with:", inputText);

    if (inputText === "") {
      console.log("Empty input, returning");
      return;
    }

    // Find ALL matches and destroy them
    let matchCount = 0;
    const matchedWords = [];

    // First, collect all matching words (in reverse order to avoid index issues)
    for (let i = this.words.length - 1; i >= 0; i--) {
      const word = this.words[i];
      if (word.text.toLowerCase() === inputText) {
        matchedWords.push({ index: i, word: word });
        matchCount++;
      }
    }

    // Destroy all matched words
    if (matchCount > 0) {
      console.log(
        `Match found! Destroying ${matchCount} instances of "${inputText}"`,
      );

      matchedWords.forEach((match) => {
        this.destroyWord(match.index);
      });

      // Bonus points for multiple matches
      if (matchCount > 1) {
        const bonusPoints = (matchCount - 1) * 50 * this.level;
        this.score += bonusPoints;
        console.log(
          `Bonus! +${bonusPoints} points for destroying ${matchCount} words at once`,
        );
        this.updateUI();
      }

      this.input.value = "";
      console.log("Input cleared after match");
      return;
    }

    // If no match, clear input and reset word highlighting
    this.input.value = "";
    this.clearAllWordHighlights();
  }

  destroyWord(index) {
    const word = this.words[index];
    const points = word.text.length * 10 * this.level;
    this.score += points;
    this.wordsDestroyed++;

    // Calculate angle to target for ship rotation
    const dx = word.x - this.ship.x;
    const dy = word.y - this.ship.y;
    this.ship.targetAngle = Math.atan2(dy, dx);

    // Create laser effect
    this.createLaser(this.ship.x, this.ship.y, word.x, word.y);

    // Create explosion
    this.createExplosion(word.x, word.y, "#22c55e");

    // Remove word
    this.words.splice(index, 1);

    this.updateUI();

    // No achievement tracking - keeping the game separate
  }

  createLaser(startX, startY, endX, endY) {
    this.lasers.push({
      startX,
      startY,
      endX,
      endY,
      life: 10,
    });
  }

  createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        alpha: 1,
        color,
      });
    }
  }

  createBounceEffect(x, y) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 15 + Math.random() * 10,
        maxLife: 25,
        alpha: 1,
        color: "#a855f7",
      });
    }
  }

  highlightMatchingWords() {
    const inputText = this.input.value.toLowerCase();

    this.words.forEach((word) => {
      if (inputText && word.text.toLowerCase().startsWith(inputText)) {
        word.matched = true;
        word.matchedLength = inputText.length;
      } else {
        word.matched = false;
        word.matchedLength = 0;
      }
    });
  }

  clearAllWordHighlights() {
    this.words.forEach((word) => {
      word.matched = false;
      word.matchedLength = 0;
    });
  }

  draw() {
    // Clear canvas with space background
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      0,
      this.canvas.width / 2,
      this.canvas.height / 2,
      Math.max(this.canvas.width, this.canvas.height) / 2,
    );
    gradient.addColorStop(0, "#1a1625");
    gradient.addColorStop(1, "#0f0f1a");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw stars
    this.drawStars();

    // Draw ship
    this.drawShip();

    // Draw lasers
    this.drawLasers();

    // Draw words
    this.drawWords();

    // Draw particles
    this.drawParticles();
  }

  drawStars() {
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    for (let i = 0; i < 100; i++) {
      const x = (i * 123) % this.canvas.width;
      const y = (i * 456) % this.canvas.height;
      const size = Math.random() * 1.5;
      this.ctx.fillRect(x, y, size, size);
    }
  }

  drawShip() {
    this.ctx.save();
    this.ctx.translate(this.ship.x, this.ship.y);
    this.ctx.rotate(this.ship.angle + Math.PI / 2); // Add π/2 to make ship point "up" at angle 0

    if (this.shipImageLoaded) {
      // Draw pixel art ship
      const shipSize = this.ship.size * 2; // Make it a bit larger since it's pixel art
      this.ctx.drawImage(
        this.shipImage,
        -shipSize / 2,
        -shipSize / 2,
        shipSize,
        shipSize,
      );
    } else {
      // Fallback to triangle if image hasn't loaded yet
      this.ctx.fillStyle = "#7aa2f7";
      this.ctx.beginPath();
      this.ctx.moveTo(0, -this.ship.size); // Front point
      this.ctx.lineTo(-this.ship.size * 0.7, this.ship.size * 0.5); // Back left
      this.ctx.lineTo(this.ship.size * 0.7, this.ship.size * 0.5); // Back right
      this.ctx.closePath();
      this.ctx.fill();

      // Ship outline
      this.ctx.strokeStyle = "#e0def4";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawLasers() {
    this.ctx.strokeStyle = "#22c55e";
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = "#22c55e";
    this.ctx.shadowBlur = 10;

    this.lasers.forEach((laser) => {
      this.ctx.beginPath();
      this.ctx.moveTo(laser.startX, laser.startY);
      this.ctx.lineTo(laser.endX, laser.endY);
      this.ctx.stroke();
    });

    this.ctx.shadowBlur = 0;
  }

  drawWords() {
    this.ctx.font = "400 16px 'departure-mono', monospace";
    this.ctx.textAlign = "center";

    this.words.forEach((word) => {
      // Retro arcade-style word appearance
      const metrics = this.ctx.measureText(word.text);
      const padding = 8;
      const bgWidth = metrics.width + padding * 2;
      const bgHeight = 24;
      const x = word.x - bgWidth / 2;
      const y = word.y - bgHeight / 2;

      // Draw pixelated background using site colors (no corner overlaps)
      if (word.matched) {
        // Green accent for matched words
        this.ctx.fillStyle = "#c3e88d";
        // Top and bottom borders
        this.ctx.fillRect(x, y, bgWidth, 2);
        this.ctx.fillRect(x, y + bgHeight - 2, bgWidth, 2);
        // Left and right borders (excluding corners to avoid overlap)
        this.ctx.fillRect(x, y + 2, 2, bgHeight - 4);
        this.ctx.fillRect(x + bgWidth - 2, y + 2, 2, bgHeight - 4);
      } else {
        // Site's primary blue
        this.ctx.fillStyle = "#7aa2f7";
        // Top and bottom borders
        this.ctx.fillRect(x, y, bgWidth, 1);
        this.ctx.fillRect(x, y + bgHeight - 1, bgWidth, 1);
        // Left and right borders (excluding corners to avoid overlap)
        this.ctx.fillRect(x, y + 1, 1, bgHeight - 2);
        this.ctx.fillRect(x + bgWidth - 1, y + 1, 1, bgHeight - 2);
      }

      // Draw text with retro styling
      if (word.matched && word.matchedLength > 0) {
        const matchedText = word.text.substring(0, word.matchedLength);
        const remainingText = word.text.substring(word.matchedLength);

        const matchedWidth = this.ctx.measureText(matchedText).width;
        const totalWidth = metrics.width;
        const startX = word.x - totalWidth / 2;

        // Matched text in green
        this.ctx.fillStyle = "#c3e88d";
        this.ctx.textAlign = "left";
        this.ctx.fillText(matchedText, startX, word.y + 5);

        // Remaining text in site light grey
        this.ctx.fillStyle = "#a9b1d6";
        this.ctx.fillText(remainingText, startX + matchedWidth, word.y + 5);

        this.ctx.textAlign = "center";
      } else {
        // Normal text in site blue
        this.ctx.fillStyle = "#7aa2f7";
        this.ctx.fillText(word.text, word.x, word.y + 5);
      }
    });
  }

  drawParticles() {
    this.particles.forEach((particle) => {
      this.ctx.save();
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.fillRect(particle.x - 1, particle.y - 1, 3, 3);
      this.ctx.restore();
    });
  }

  drawWelcomeScreen() {
    this.draw();

    // Welcome message box with site colors and rounded corners
    const boxX = this.canvas.width / 2 - 200;
    const boxY = this.canvas.height / 2 - 100;
    const boxWidth = 400;
    const boxHeight = 200;
    const radius = 12;

    // Background with site color
    this.ctx.fillStyle = "#24283b";
    this.ctx.beginPath();
    this.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
    this.ctx.fill();

    // Border with site blue
    this.ctx.strokeStyle = "#7aa2f7";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
    this.ctx.stroke();

    this.ctx.fillStyle = "#7aa2f7";
    this.ctx.font = "400 24px 'departure-mono', monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "NERDROIDS",
      this.canvas.width / 2,
      this.canvas.height / 2 - 40,
    );

    this.ctx.fillStyle = "#a9b1d6";
    this.ctx.font = "400 16px 'departure-mono', monospace";
    this.ctx.fillText(
      "Defend your ship!",
      this.canvas.width / 2,
      this.canvas.height / 2 - 10,
    );

    this.ctx.fillStyle = "#ff9e64";
    this.ctx.fillText(
      "Press ENTER to begin",
      this.canvas.width / 2,
      this.canvas.height / 2 + 20,
    );
  }

  updateUI() {
    // Update the stat values in the new structure
    this.scoreElement.querySelector(".stat-value").textContent = this.score;
    this.livesElement.querySelector(".stat-value").textContent = this.lives;
    this.levelElement.querySelector(".stat-value").textContent = this.level;
  }

  gameOver() {
    this.gameRunning = false;
    this.gameStarted = false;

    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
    }

    // Update final stats
    this.finalScoreElement.textContent = this.score;
    this.finalLevelElement.textContent = this.level;
    this.finalWordsElement.textContent = this.wordsDestroyed;

    // Save score to Firebase for logged in users
    this.saveNerdroidsScore();

    // Show game over modal
    this.gameOverModal.style.display = "block";

    // Focus the modal so it can receive keyboard events
    this.gameOverModal.focus();
  }

  saveNerdroidsScore() {
    if (
      typeof window.getCurrentUser === "function" &&
      window.firebaseModules &&
      window.database
    ) {
      const currentUser = window.getCurrentUser();

      if (currentUser) {
        const nerdroidsData = {
          score: this.score,
          level: this.level,
          wordsDestroyed: this.wordsDestroyed,
          difficulty: this.difficulty,
          timestamp: Date.now(),
          gameType: "nerdroids",
          username:
            localStorage.getItem("nerdtype_username") ||
            currentUser.displayName ||
            currentUser.email.split("@")[0] ||
            "Anonymous",
          userId: currentUser.uid,
          userEmail: currentUser.email,
          authenticatedScore: true,
          submittedAt: new Date().toISOString(),
        };

        this.saveNerdroidsToFirebase(nerdroidsData)
          .then(() => {
            setTimeout(() => {
              loadNerdroidsLeaderboard();
            }, 1000);
          })
          .catch((error) => {
            console.error("Error saving Nerdroids score:", error);
          });
      }
    }
  }

  async saveNerdroidsToFirebase(nerdroidsData) {
    const { ref, push } = window.firebaseModules;
    const database = window.database;

    try {
      const currentUser = window.getCurrentUser();
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      const userNerdroidsRef = ref(
        database,
        `users/${currentUser.uid}/nerdroidsScores`,
      );
      const result = await push(userNerdroidsRef, nerdroidsData);

      try {
        const nerdroidsScoresRef = ref(database, "nerdroidsScores");
        await push(nerdroidsScoresRef, nerdroidsData);
      } catch (globalError) {
        // Ignore global collection errors
      }

      return result;
    } catch (error) {
      console.error("Error saving Nerdroids score:", error);
      throw error;
    }
  }

  updateShipRotation() {
    // Smoothly rotate ship toward target angle
    const angleDiff = this.ship.targetAngle - this.ship.angle;

    // Handle angle wrapping (shortest rotation path)
    let shortestAngleDiff = angleDiff;
    if (angleDiff > Math.PI) {
      shortestAngleDiff = angleDiff - 2 * Math.PI;
    } else if (angleDiff < -Math.PI) {
      shortestAngleDiff = angleDiff + 2 * Math.PI;
    }

    // Apply rotation with easing
    if (Math.abs(shortestAngleDiff) > 0.01) {
      this.ship.angle += shortestAngleDiff * this.ship.rotationSpeed;
    }

    // Keep angle in range [0, 2π]
    if (this.ship.angle < 0) this.ship.angle += 2 * Math.PI;
    if (this.ship.angle > 2 * Math.PI) this.ship.angle -= 2 * Math.PI;
  }

  // No score saving or achievement tracking - keeping the game completely separate
}

// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.asteroidGame = new AsteroidGame();

  // Load Nerdroids leaderboard
  loadNerdroidsLeaderboard();
});

async function loadNerdroidsLeaderboard() {
  const leaderboardContent = document.getElementById(
    "nerdroidsLeaderboardContent",
  );

  if (!leaderboardContent) return;

  try {
    if (!window.firebaseModules || !window.database) {
      leaderboardContent.innerHTML = `
        <div style="color: #6b7280; font-family: 'departure-mono', monospace; text-align: center; padding: 2rem;">
          Firebase not available
        </div>`;
      return;
    }

    const { ref, get } = window.firebaseModules;
    const database = window.database;
    let allScores = [];

    try {
      const nerdroidsScoresRef = ref(database, "nerdroidsScores");
      const globalSnapshot = await get(nerdroidsScoresRef);

      if (globalSnapshot.exists()) {
        globalSnapshot.forEach((childSnapshot) => {
          const score = childSnapshot.val();
          if (score.authenticatedScore === true) {
            allScores.push(score);
          }
        });
      }
    } catch (globalError) {
      // Fallback to user collections
    }

    if (allScores.length === 0) {
      try {
        const usersRef = ref(database, "users");
        const usersSnapshot = await get(usersRef);

        if (usersSnapshot.exists()) {
          const promises = [];

          usersSnapshot.forEach((userSnapshot) => {
            const userId = userSnapshot.key;
            const userData = userSnapshot.val();

            if (userData && userData.nerdroidsScores) {
              const userNerdroidsRef = ref(
                database,
                `users/${userId}/nerdroidsScores`,
              );
              promises.push(
                get(userNerdroidsRef)
                  .then((nerdroidsSnapshot) => {
                    const userScores = [];
                    if (nerdroidsSnapshot.exists()) {
                      nerdroidsSnapshot.forEach((scoreSnapshot) => {
                        const score = scoreSnapshot.val();
                        if (score.authenticatedScore === true) {
                          userScores.push(score);
                        }
                      });
                    }
                    return userScores;
                  })
                  .catch(() => []),
              );
            }
          });

          if (promises.length > 0) {
            const userScoresArrays = await Promise.all(promises);
            allScores = userScoresArrays.flat();
          }
        }
      } catch (usersError) {
        // Silent fallback
      }
    }

    if (allScores.length === 0) {
      leaderboardContent.innerHTML = `
        <div style="color: #a9b1d6; font-family: 'departure-mono', monospace; text-align: center; padding: 2rem;">
          No Nerdroids scores yet. Be the first pilot!
        </div>`;
      return;
    }

    const nerdroidsScores = allScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    if (nerdroidsScores.length === 0) {
      leaderboardContent.innerHTML = `
        <div style="color: #a9b1d6; font-family: 'departure-mono', monospace; text-align: center; padding: 2rem;">
          No Nerdroids scores yet. Be the first pilot!
        </div>`;
      return;
    }

    let leaderboardHTML = `
      <div style="font-family: 'departure-mono', monospace;">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 1rem; align-items: center; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid #3b4261; color: #7aa2f7; font-size: 0.8rem; font-weight: bold;">
          <div style="text-align: center;">RANK</div>
          <div style="text-align: center;">PILOT</div>
          <div style="text-align: center;">LEVEL</div>
          <div style="text-align: center;">SCORE</div>
        </div>`;

    nerdroidsScores.forEach((score, index) => {
      const rank = index + 1;

      leaderboardHTML += `
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 1rem; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid rgba(59, 66, 97, 0.3);">
          <div style="text-align: center; color: #7aa2f7; font-weight: bold; font-size: 1rem;">${rank}.</div>
          <div style="color: #e2e8f0; overflow: hidden; text-overflow: ellipsis; font-size: 0.9rem; text-align: center;">${score.username || "Anonymous"}</div>
          <div style="color: #9d7cd8; font-size: 0.9rem; text-align: center;">${score.level || 1}</div>
          <div style="color: #7aa2f7; font-weight: bold; font-size: 0.9rem; text-align: center;">${score.score.toLocaleString()}</div>
        </div>`;
    });

    leaderboardHTML += "</div>";
    leaderboardContent.innerHTML = leaderboardHTML;
  } catch (error) {
    console.error("Error loading Nerdroids leaderboard:", error);
    leaderboardContent.innerHTML = `
      <div style="color: #6b7280; font-family: 'departure-mono', monospace; text-align: center; padding: 2rem;">
        Failed to load leaderboard
      </div>`;
  }
}

export default AsteroidGame;
