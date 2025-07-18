export class DebugDisplay {
  constructor() {
    this.debugDiv = this.createDebugDiv();
    this.debugContent = this.createContentContainer();
    this.setupDragging();
    this.isDragging = false;
    this.currentX = 0;
    this.currentY = 0;
    this.initialX = 0;
    this.initialY = 0;
    this.xOffset = 0;
    this.yOffset = 0;

    // Check localStorage for visibility state
    const isVisible = localStorage.getItem("debugWindowVisible") === "true";
    this.debugDiv.style.display = isVisible ? "block" : "none";
  }

  show() {
    this.debugDiv.style.display = "block";
    localStorage.setItem("debugWindowVisible", "true");
  }

  hide() {
    this.debugDiv.style.display = "none";
    localStorage.setItem("debugWindowVisible", "false");
  }

  toggle() {
    if (this.debugDiv.style.display === "none") {
      this.show();
    } else {
      this.hide();
    }
  }

  createDebugDiv() {
    const div = document.createElement("div");
    div.style.position = "fixed";
    // change debug window position
    div.style.bottom = "20%";
    div.style.left = "2%";
    div.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    div.style.color = "#00ff00";
    div.style.fontFamily = "monospace";
    div.style.fontSize = "14px";
    div.style.zIndex = "1000";
    div.style.cursor = "move";
    div.style.userSelect = "none";

    const handleBar = document.createElement("div");
    handleBar.style.backgroundColor = "#24283b";
    handleBar.style.padding = "2px";
    handleBar.style.textAlign = "center";
    handleBar.textContent = " ";
    div.appendChild(handleBar);

    document.body.appendChild(div);
    return div;
  }

  createContentContainer() {
    const content = document.createElement("div");
    
    // Create achievement testing section
    this.achievementSection = document.createElement("div");
    this.achievementSection.innerHTML = `
      <div id="achievement-checkboxes" style="max-height: 300px; overflow-y: auto; width: 350px;"></div>
    `;
    
    this.debugDiv.appendChild(content);
    this.debugDiv.appendChild(this.achievementSection);
    
    // Initialize achievement checkboxes when achievement system is available
    this.initAchievementCheckboxes();
    
    return content;
  }

  initAchievementCheckboxes() {
    // Wait for achievement system to be available
    if (typeof window.achievementSystem === 'undefined') {
      setTimeout(() => this.initAchievementCheckboxes(), 100);
      return;
    }

    const container = document.getElementById('achievement-checkboxes');
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    // Add reset button
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset All';
    resetButton.style.cssText = `
      background: rgba(255, 68, 68, 0.8); 
      color: #00ff00; 
      border: none;
      padding: 2px 6px; 
      margin-bottom: 5px; 
      cursor: pointer; 
      font-size: 12px;
      font-family: monospace;
    `;
    resetButton.onclick = () => {
      window.achievementSystem.resetAchievements();
      this.updateAchievementCheckboxes();
    };
    container.appendChild(resetButton);

    // Create checkboxes for each achievement
    Object.entries(window.achievementSystem.achievements).forEach(([id, achievement]) => {
      const wrapper = document.createElement('div');
      wrapper.style.marginBottom = '2px';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `achievement-${id}`;
      checkbox.style.marginRight = '5px';
      
      const label = document.createElement('label');
      label.htmlFor = `achievement-${id}`;
      label.style.cursor = 'pointer';
      label.style.fontSize = '12px';
      label.style.fontFamily = 'monospace';
      label.style.color = '#00ff00';
      label.textContent = `${achievement.name}`;
      
      // Set initial state
      checkbox.checked = !!window.achievementSystem.achievementsData.unlockedAchievements[id];
      
      // Add event listener
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          // Unlock achievement
          window.achievementSystem.achievementsData.unlockedAchievements[id] = {
            unlockedAt: new Date().toISOString(),
          };
          window.achievementSystem.saveData();
          window.achievementSystem.showNotification(achievement);
        } else {
          // Lock achievement
          delete window.achievementSystem.achievementsData.unlockedAchievements[id];
          window.achievementSystem.saveData();
        }
      });
      
      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      container.appendChild(wrapper);
    });
  }

  updateAchievementCheckboxes() {
    // Update checkbox states to match current achievement data
    if (typeof window.achievementSystem === 'undefined') return;
    
    Object.keys(window.achievementSystem.achievements).forEach(id => {
      const checkbox = document.getElementById(`achievement-${id}`);
      if (checkbox) {
        checkbox.checked = !!window.achievementSystem.achievementsData.unlockedAchievements[id];
      }
    });
  }

  setupDragging() {
    this.debugDiv.addEventListener(
      "mousedown",
      this.dragStart.bind(this),
      false,
    );
    document.addEventListener("mousemove", this.drag.bind(this), false);
    document.addEventListener("mouseup", this.dragEnd.bind(this), false);

    this.debugDiv.addEventListener(
      "touchstart",
      this.dragStart.bind(this),
      false,
    );
    document.addEventListener("touchmove", this.drag.bind(this), false);
    document.addEventListener("touchend", this.dragEnd.bind(this), false);
  }

  dragStart(e) {
    if (e.type === "touchstart") {
      this.initialX = e.touches[0].clientX - this.xOffset;
      this.initialY = e.touches[0].clientY - this.yOffset;
    } else {
      this.initialX = e.clientX - this.xOffset;
      this.initialY = e.clientY - this.yOffset;
    }

    if (e.target === this.debugDiv || this.debugDiv.contains(e.target)) {
      this.isDragging = true;
    }
  }

  dragEnd() {
    this.initialX = this.currentX;
    this.initialY = this.currentY;
    this.isDragging = false;
  }

  drag(e) {
    if (this.isDragging) {
      e.preventDefault();

      if (e.type === "touchmove") {
        this.currentX = e.touches[0].clientX - this.initialX;
        this.currentY = e.touches[0].clientY - this.initialY;
      } else {
        this.currentX = e.clientX - this.initialX;
        this.currentY = e.clientY - this.initialY;
      }

      this.xOffset = this.currentX;
      this.yOffset = this.currentY;

      this.setTranslate(this.currentX, this.currentY, this.debugDiv);
    }
  }

  setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }

  // Function to create a simple visual meter bar
  createMeterBar(value, max, color) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return `
      <div style="width: 100%; background-color: #333; height: 6px; margin: 0px 0;">
        <div style="width: ${percentage}%; background-color: ${color}; height: 6px;"></div>
      </div>
    `;
  }

  // Calculate difficulty multiplier
  calculateDifficultyMultiplier(settings) {
    try {
      // Reference values (classic mode settings)
      const refTimeLimit = 30;
      const refBonusTime = 3;
      const refInitialTime = 10;

      // Calculate individual difficulty factors
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

  updateInfo(gameData) {
    const {
      currentWord,
      wordLength,
      totalCharactersTyped,
      gameStartTime,
      wordsTyped,
      hasStartedTyping,
      accuracy,
      correctKeystrokes,
      wrongKeystrokes,
      totalKeystrokes,
      effectiveTime,
      timeLeft,
    } = gameData;

    // Get current settings
    const settings = JSON.parse(localStorage.getItem("gameSettings")) || {
      timeLimit: 30,
      bonusTime: 3,
      initialTime: 10,
      goalPercentage: 100,
      currentMode: "classic",
    };

    // Get achievement stats to display games played today
    const achievementData = JSON.parse(
      localStorage.getItem("nerdtype_achievements"),
    ) || {
      stats: { gamesPlayedToday: 0, lastGameDate: null },
    };

    // Calculate difficulty multiplier
    const difficultyMultiplier = this.calculateDifficultyMultiplier(settings);

    // Calculate time and WPM
    let currentTime;
    if (effectiveTime !== undefined) {
      currentTime = effectiveTime / 1000;
    } else {
      currentTime = gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0;
    }

    const timeInMinutes = currentTime / 60;
    const currentWPM =
      gameStartTime && timeInMinutes > 0
        ? Math.round(totalCharactersTyped / 5 / timeInMinutes)
        : 0;

    // Prepare difficulty visualization
    const refTimeLimit = 30;
    const refBonusTime = 3;
    const refInitialTime = 10;

    const timeLimitFactor = Math.min(
      3,
      Math.max(1, settings.timeLimit) / refTimeLimit,
    );
    const bonusTimeFactor = Math.min(
      3,
      refBonusTime / Math.max(0.5, settings.bonusTime),
    );
    const initialTimeFactor = Math.min(
      3,
      refInitialTime / Math.max(0.5, settings.initialTime),
    );

    // Create difficulty meter bars with a simpler style
    const timeLimitMeter = this.createMeterBar(timeLimitFactor, 3, "#ff9e64");
    const bonusTimeMeter = this.createMeterBar(bonusTimeFactor, 3, "#7aa2f7");
    const initialTimeMeter = this.createMeterBar(
      initialTimeFactor,
      3,
      "#bb9af7",
    );
    const combinedMeter = this.createMeterBar(
      difficultyMultiplier - 0.75,
      1,
      "#c3e88d",
    );

    // Simulate base score calculation for display
    const accuracyValue = parseFloat(accuracy) / 100;
    const safeWPM = Math.max(1, currentWPM);

    const baseScore = Math.round(
      safeWPM * 10 * (accuracyValue * accuracyValue) * difficultyMultiplier,
    );

    // Simulate energy bonus
    const energyBonus =
      timeLeft !== undefined
        ? Math.round(Math.min(timeLeft * 5, baseScore * 0.2))
        : 0;

    const finalScore = Math.round(baseScore + energyBonus);

    // Get the current date for display
    const currentDate = new Date().toLocaleDateString();

    this.debugContent.innerHTML = `
      Current Word: ${currentWord} (${wordLength} chars)<br>
      Total Characters: ${totalCharactersTyped}<br>
      Standard Words (chars/5): ${(totalCharactersTyped / 5).toFixed(2)}<br>
      Time Elapsed: ${currentTime.toFixed(2)}s<br>
      Current WPM: ${currentWPM}<br>
      Words Typed: ${wordsTyped.length}<br>
      Accuracy: ${accuracy}%<br>
      Correct Keys: ${correctKeystrokes}<br>
      Wrong Keys: ${wrongKeystrokes}<br>
      Total Keys: ${totalKeystrokes}<br>
      Timer Started: ${gameStartTime ? "Yes" : "No"}<br>
      Typing Started: ${hasStartedTyping ? "Yes" : "No"}<br>
      Energy Left: ${timeLeft !== undefined ? timeLeft : "N/A"}<br>
      <br>
      <span style="color: #ff9e64;">Mode: ${settings.currentMode} (Multiplier: ${difficultyMultiplier.toFixed(2)}x)</span><br>
      Goal Words Factor: ${timeLimitFactor.toFixed(2)}x<br>
      ${timeLimitMeter}
      Bonus Energy Factor: ${bonusTimeFactor.toFixed(2)}x<br>
      ${bonusTimeMeter}
      Initial Energy Factor: ${initialTimeFactor.toFixed(2)}x<br>
      ${initialTimeMeter}
      Combined Difficulty:<br>
      ${combinedMeter}
      <br>
      <span style="color: #ff9e64;">Score Breakdown:</span><br>
      Base Score: ${baseScore}<br>
      Energy Bonus: ${energyBonus}<br>
      Final Score: ${finalScore}
      <br>
      <span style="color: #ff9e64;">Achievement Data:</span><br>
      Games Played Today: ${achievementData.stats.gamesPlayedToday}<br>
      Date: ${currentDate}<br>
      Last Game Date: ${achievementData.stats.lastGameDate || "None"}
    `;
  }
}
