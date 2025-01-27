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
    div.style.bottom = "40%";
    div.style.left = "10%";
    div.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    div.style.color = "#00ff00";
    div.style.fontFamily = "monospace";
    div.style.fontSize = "18px";
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
    this.debugDiv.appendChild(content);
    return content;
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

  updateInfo(gameData) {
    const {
      currentWord,
      wordLength,
      totalCharactersTyped,
      gameStartTime,
      wordsTyped,
      hasStartedTyping,
    } = gameData;

    const currentTime = gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0;
    const timeInMinutes = currentTime / 60;
    const currentWPM = gameStartTime
      ? Math.round(totalCharactersTyped / 5 / timeInMinutes)
      : 0;

    this.debugContent.innerHTML = `
      Current Word: ${currentWord} (${wordLength} chars)<br>
      Total Characters: ${totalCharactersTyped}<br>
      Standard Words (chars/5): ${(totalCharactersTyped / 5).toFixed(2)}<br>
      Time Elapsed: ${currentTime.toFixed(2)}s<br>
      Current WPM: ${currentWPM}<br>
      Words Typed: ${wordsTyped.length}<br>
      Accuracy: ${gameData.accuracy}%<br>
      Timer Started: ${gameStartTime ? "Yes" : "No"}<br>
      Typing Started: ${hasStartedTyping ? "Yes" : "No"}
    `;
  }
}
