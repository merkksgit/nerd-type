class SmoothCaret {
  constructor() {
    this.caretElement = null;
    this.isInitialized = false;
    this.currentPosition = { x: 0, y: 0 };
    this.targetPosition = { x: 0, y: 0 };
    this.animationFrameId = null;
    this.isAnimating = false;
    this.lastUpdateTime = 0;

    // Animation settings
    this.easeAmount = 0.45; // How smooth the animation is (balanced between smooth and responsive)
    this.threshold = 1.0; // Stop animating when within this many pixels
    this.fastTypingThreshold = 40; // Distance threshold for fast typing detection
    this.fastEaseAmount = 0.75; // Faster but still smooth animation for fast typing
    this.instantTypingThreshold = 100; // If distance is huge, just snap instantly
    this.typingSpeedThreshold = 120; // Time threshold for detecting fast typing (ms)
  }

  /**
   * Initialize the smooth caret system
   */
  init() {
    if (this.isInitialized) return;

    this.createCaretElement();
    this.isInitialized = true;
  }

  /**
   * Create the floating caret element
   */
  createCaretElement() {
    // Create the caret element
    this.caretElement = document.createElement("div");
    this.caretElement.id = "smooth-caret";
    this.caretElement.className = "smooth-caret";

    // Add to the word container
    const wordToType = document.getElementById("wordToType");
    if (wordToType) {
      wordToType.appendChild(this.caretElement);

      // Set initial position
      this.updateCaretPosition();
    }
  }

  /**
   * Update caret position to the current letter
   */
  updateCaretPosition(animate = true) {
    if (!this.caretElement) return;

    const currentLetter = document.querySelector(".letter.current");
    if (!currentLetter) {
      this.hideCaretElement();
      return;
    }

    this.showCaretElement();

    // Get the position of the current letter relative to the word container
    const wordContainer = document.getElementById("wordToType");
    if (!wordContainer) return;

    const letterRect = currentLetter.getBoundingClientRect();
    const containerRect = wordContainer.getBoundingClientRect();

    // Calculate target position relative to container
    const newTargetX = letterRect.left - containerRect.left - 2; // -2px for left offset
    const newTargetY = letterRect.top - containerRect.top;

    // Calculate distance and timing
    const distance = Math.sqrt(
      Math.pow(newTargetX - this.currentPosition.x, 2) +
        Math.pow(newTargetY - this.currentPosition.y, 2),
    );

    const currentTime = performance.now();
    const timeSinceLastUpdate = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    this.targetPosition.x = newTargetX;
    this.targetPosition.y = newTargetY;

    // Decide animation strategy based on distance and timing
    const isVeryFastTyping =
      distance > this.instantTypingThreshold ||
      (distance > this.fastTypingThreshold &&
        timeSinceLastUpdate < this.typingSpeedThreshold);

    if (!animate || !this.isInitialized || distance < 2 || isVeryFastTyping) {
      // Instant positioning for: initialization, small movements, or very fast typing
      this.stopAnimation();
      this.currentPosition.x = this.targetPosition.x;
      this.currentPosition.y = this.targetPosition.y;
      this.applyPosition();
    } else {
      // Animate for normal typing
      this.stopAnimation();
      this.startAnimation();
    }
  }

  /**
   * Start the smooth animation to target position
   */
  startAnimation() {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.animate();
  }

  /**
   * Animation loop using requestAnimationFrame
   */
  animate() {
    // Calculate distance to target
    const deltaX = this.targetPosition.x - this.currentPosition.x;
    const deltaY = this.targetPosition.y - this.currentPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // If we're close enough, snap to target and stop
    if (distance < this.threshold) {
      this.currentPosition.x = this.targetPosition.x;
      this.currentPosition.y = this.targetPosition.y;
      this.applyPosition();
      this.isAnimating = false;
      return;
    }

    // Use faster animation for large distances
    const easeAmount =
      distance > this.fastTypingThreshold
        ? this.fastEaseAmount
        : this.easeAmount;

    // Apply easing
    this.currentPosition.x += deltaX * easeAmount;
    this.currentPosition.y += deltaY * easeAmount;

    this.applyPosition();

    // Continue animation
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Apply the current position to the caret element
   */
  applyPosition() {
    if (!this.caretElement) return;

    this.caretElement.style.transform = `translate(${this.currentPosition.x}px, ${this.currentPosition.y}px)`;
  }

  /**
   * Show the caret element
   */
  showCaretElement() {
    if (this.caretElement) {
      this.caretElement.style.opacity = "1";
    }
  }

  /**
   * Hide the caret element
   */
  hideCaretElement() {
    if (this.caretElement) {
      this.caretElement.style.opacity = "0";
    }
  }

  /**
   * Stop any ongoing animation
   */
  stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isAnimating = false;
  }

  /**
   * Destroy the smooth caret system
   */
  destroy() {
    this.stopAnimation();

    if (this.caretElement) {
      if (this.caretElement.parentNode) {
        this.caretElement.parentNode.removeChild(this.caretElement);
      }
      this.caretElement = null;
    }

    // Clean up any references

    this.isInitialized = false;
    this.currentPosition = { x: 0, y: 0 };
    this.targetPosition = { x: 0, y: 0 };
    this.lastUpdateTime = 0;
  }

  /**
   * Set animation speed (easing amount)
   * @param {number} speed - Value between 0.1 (slow) and 1.0 (instant)
   */
  setAnimationSpeed(speed) {
    this.easeAmount = Math.max(0.1, Math.min(1.0, speed));
  }
}

// Create global instance immediately
window.smoothCaret = new SmoothCaret();

// Export for ES6 modules if needed
if (typeof module !== "undefined" && module.exports) {
  module.exports = SmoothCaret;
}

