class SmoothCaret {
  constructor() {
    this.caretElement = null;
    this.isInitialized = false;
    this.currentPosition = { x: 0, y: 0 };
    this.targetPosition = { x: 0, y: 0 };
    this.animationFrameId = null;
    this.isAnimating = false;
    this.lastFrameTime = performance.now();
    this.lastUpdateTime = 0;

    // Animation settings
    this.easeAmount = 0.65;
    this.threshold = 1.0;
    this.fastTypingThreshold = 40;
    this.fastEaseAmount = 0.75;
    this.instantTypingThreshold = 100;
    this.typingSpeedThreshold = 120;
  }

  init() {
    if (this.isInitialized) return;
    this.createCaretElement();
    this.isInitialized = true;
  }

  createCaretElement() {
    this.caretElement = document.createElement("div");
    this.caretElement.id = "smooth-caret";
    this.caretElement.className = "smooth-caret";

    const wordToType = document.getElementById("wordToType");
    if (wordToType) {
      wordToType.appendChild(this.caretElement);
      this.updateCaretPosition(false);
    }
  }

  updateCaretPosition(animate = true) {
    if (!this.caretElement) return;

    const currentLetter = document.querySelector(".letter.current");
    if (!currentLetter) {
      this.hideCaretElement();
      return;
    }

    this.showCaretElement();

    const wordContainer = document.getElementById("wordToType");
    if (!wordContainer) return;

    const letterRect = currentLetter.getBoundingClientRect();
    const containerRect = wordContainer.getBoundingClientRect();

    const newTargetX = letterRect.left - containerRect.left - 2;
    const newTargetY = letterRect.top - containerRect.top;

    this.targetPosition.x = newTargetX;
    this.targetPosition.y = newTargetY;

    if (!animate || !this.isInitialized) {
      // Instant positioning only during init
      this.stopAnimation();
      this.currentPosition.x = this.targetPosition.x;
      this.currentPosition.y = this.targetPosition.y;
      this.applyPosition();
    } else {
      // Always animate
      this.stopAnimation();
      this.startAnimation();
    }
  }

  startAnimation() {
    this.isAnimating = true;
    this.lastFrameTime = performance.now();
    this.animate();
  }

  animate() {
    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000; // seconds
    this.lastFrameTime = now;

    const deltaX = this.targetPosition.x - this.currentPosition.x;
    const deltaY = this.targetPosition.y - this.currentPosition.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance < this.threshold) {
      this.currentPosition = { ...this.targetPosition };
      this.applyPosition();
      this.isAnimating = false;
      return;
    }

    // Use LERP for smoother frame-rate independent movement
    const speed = 21; // Higher = snappier, use values between 10–25
    const t = 1 - Math.exp(-speed * deltaTime); // Exponential smoothing

    this.currentPosition.x += deltaX * t;
    this.currentPosition.y += deltaY * t;

    this.applyPosition();
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  applyPosition() {
    if (!this.caretElement) return;
    this.caretElement.style.transform = `translate(${this.currentPosition.x}px, ${this.currentPosition.y}px)`;
  }

  showCaretElement() {
    if (this.caretElement) {
      this.caretElement.style.opacity = "1";
    }
  }

  hideCaretElement() {
    if (this.caretElement) {
      this.caretElement.style.opacity = "0";
    }
  }

  stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isAnimating = false;
  }

  destroy() {
    this.stopAnimation();
    if (this.caretElement?.parentNode) {
      this.caretElement.parentNode.removeChild(this.caretElement);
    }
    this.caretElement = null;
    this.isInitialized = false;
    this.currentPosition = { x: 0, y: 0 };
    this.targetPosition = { x: 0, y: 0 };
    this.lastUpdateTime = 0;
  }

  setAnimationSpeed(speed) {
    this.easeAmount = Math.max(0.1, Math.min(1.0, speed));
  }
}

window.smoothCaret = new SmoothCaret();

if (typeof module !== "undefined" && module.exports) {
  module.exports = SmoothCaret;
}
