// firebase-config.js - Enhanced with Firebase Auth

// Firebase configuration (keep your existing config)
const firebaseConfig = {
  apiKey: "AIzaSyD40pIb2RoLbGYVE7mpbS5eN4rcsP742gE",
  authDomain: "nerdtype-leaderboard.firebaseapp.com",
  databaseURL:
    "https://nerdtype-leaderboard-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "nerdtype-leaderboard",
  storageBucket: "nerdtype-leaderboard.firebasestorage.app",
  messagingSenderId: "880144823417",
  appId: "1:880144823417:web:c567724792c6e37647d0a8",
};

// Global variables
let firebaseApp = null;
let database = null;
let auth = null;
let currentUser = null;

function isDataCollectionEnabled() {
  const setting = localStorage.getItem("data_collection_enabled");
  return setting === null || setting === "true";
}

// Enhanced Firebase initialization with Auth
window.initializeFirebaseApp = function (firebaseModules) {
  const {
    initializeApp,
    getDatabase,
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    ref,
    push,
    query,
    orderByChild,
    limitToLast,
    get,
    equalTo,
    set,
    remove,
  } = firebaseModules;

  try {
    console.log("🔥 Initializing Firebase...");
    firebaseApp = initializeApp(firebaseConfig);
    database = getDatabase(firebaseApp);
    auth = getAuth(firebaseApp);

    // Make database and auth globally available
    window.database = database;
    window.auth = auth;

    console.log("✅ Firebase initialized successfully");

    // Set up auth state listener
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      handleAuthStateChange(user);
    });

    // Test connection
    testConnection({ ref, set, remove });
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
  }
};

// Test Firebase connection
async function testConnection(firebaseModules) {
  const { ref, set, remove } = firebaseModules;

  try {
    const testRef = ref(database, "connectionTest");
    await set(testRef, {
      message: "Connection test from game",
      timestamp: Date.now(),
    });
    console.log("✅ Firebase connection test successful");

    // Clean up
    await remove(testRef);
  } catch (error) {
    console.error("❌ Firebase connection test failed:", error);
  }
}

// Handle authentication state changes - FIXED TO RESPECT FONT SETTINGS
function handleAuthStateChange(user) {
  const usernameDisplay = document.getElementById("usernameDisplay");
  const changeUsernameBtn = document.getElementById("changeUsername");

  if (user) {
    console.log("✅ User logged in:", user.email);

    // Use email username (part before @) as display name
    const emailUsername = user.email.split("@")[0];

    // Update displays immediately
    if (usernameDisplay) {
      usernameDisplay.textContent = emailUsername;
      // FIXED: Use current font setting instead of hardcoded font
      const currentFont =
        localStorage.getItem("nerdtype_font") || "jetbrains-mono";
      usernameDisplay.style.fontFamily = currentFont + " !important";
    }

    // Store for game use
    localStorage.setItem("nerdtype_username", emailUsername);
    window.playerUsername = emailUsername;

    // Clear guest mode
    localStorage.removeItem("nerdtype_guest_mode");

    console.log("🎮 User ready to play as:", emailUsername);

    // FIXED: Apply current font setting for all game elements after login
    setTimeout(() => {
      const currentFont =
        localStorage.getItem("nerdtype_font") || "jetbrains-mono";

      const gameElements = document.querySelectorAll(
        "#userInput, #nextWord, #wordToType, #wordToType span, #currentGameMode, #timer, #timeLeft, #progressPercentage, .game-interface, .typing-area",
      );
      gameElements.forEach((element) => {
        if (element) {
          element.style.fontFamily = currentFont + " !important";
        }
      });

      // FIXED: Set CSS variable to current font instead of hardcoded jetbrains-mono
      document.documentElement.style.setProperty("--game-font", currentFont);
    }, 200);
  } else {
    console.log("❌ User logged out");

    // Clear user data
    localStorage.removeItem("nerdtype_username");
    window.playerUsername = "";

    // Update displays
    if (usernameDisplay) {
      usernameDisplay.textContent = "Login";
      // FIXED: Use current font setting instead of hardcoded font
      const currentFont =
        localStorage.getItem("nerdtype_font") || "jetbrains-mono";
      usernameDisplay.style.fontFamily = currentFont + " !important";
    }

    // FIXED: Apply current font setting for all game elements after logout
    setTimeout(() => {
      const currentFont =
        localStorage.getItem("nerdtype_font") || "jetbrains-mono";

      const gameElements = document.querySelectorAll(
        "#userInput, #nextWord, #wordToType, #wordToType span, #currentGameMode, #timer, #timeLeft, #progressPercentage, .game-interface, .typing-area",
      );
      gameElements.forEach((element) => {
        if (element) {
          element.style.fontFamily = currentFont + " !important";
        }
      });

      // FIXED: Set CSS variable to current font instead of hardcoded jetbrains-mono
      document.documentElement.style.setProperty("--game-font", currentFont);
    }, 200);

    // DO NOT automatically show login modal - let user choose when to login
    console.log("User can click the login button when ready");
  }
}

// Load user profile from database
async function loadUserProfile(uid) {
  const { ref, get } = window.firebaseModules;

  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();
      return userData;
    }
    return null;
  } catch (error) {
    console.error("❌ Error loading user profile:", error);
    return null;
  }
}

// Save game score to Firebase for guest users
window.saveGuestScore = async function (gameData) {
  if (!isDataCollectionEnabled()) {
    console.log("📴 Data collection disabled - score not saved to Firebase");
    return Promise.resolve({ key: "local-only" });
  }

  const { ref, push } = window.firebaseModules;

  try {
    console.log("💾 Saving guest score to Firebase:", gameData);

    // Enhanced game data for guest
    const enhancedGameData = {
      ...gameData,
      authenticatedScore: false,
      guestSubmission: true,
      submittedAt: new Date().toISOString(),
    };

    const scoresRef = ref(database, "scores");
    const result = await push(scoresRef, enhancedGameData);

    console.log("✅ Guest score saved successfully! Key:", result.key);
    return result;
  } catch (error) {
    console.error("❌ Error saving guest score:", error);
    throw error;
  }
};

// Save game score to Firebase for authenticated users
window.saveAuthenticatedScore = async function (gameData) {
  if (!isDataCollectionEnabled()) {
    console.log("📴 Data collection disabled - score not saved to Firebase");
    return Promise.resolve({ key: "local-only" });
  }

  if (!currentUser) {
    console.log(
      "❌ User not authenticated - score not saved to global leaderboard",
    );
    return Promise.resolve({ key: "guest-only" });
  }

  const { ref, push } = window.firebaseModules;

  try {
    console.log("💾 Saving authenticated score to Firebase:", gameData);

    // Enhanced game data with user ID and email username
    const emailUsername = currentUser.email.split("@")[0];
    const enhancedGameData = {
      ...gameData,
      username: emailUsername, // Use email username
      userId: currentUser.uid,
      userEmail: currentUser.email,
      authenticatedScore: true,
      submittedAt: new Date().toISOString(),
    };

    const scoresRef = ref(database, "scores");
    const result = await push(scoresRef, enhancedGameData);

    console.log("✅ Authenticated score saved successfully! Key:", result.key);
    return result;
  } catch (error) {
    console.error("❌ Error saving authenticated score:", error);
    throw error;
  }
};

window.saveScoreToFirebase = async function (gameData) {
  if (!isDataCollectionEnabled()) {
    console.log("📴 Data collection disabled - score not saved to Firebase");
    return Promise.resolve({ key: "local-only" });
  }

  // Check if Firebase is ready
  if (!window.firebaseModules || !database) {
    console.error("❌ Firebase not ready, cannot save score");
    return Promise.reject("Firebase not initialized");
  }

  try {
    const currentUser = window.getCurrentUser();

    if (currentUser) {
      console.log("💾 Saving authenticated score...");
      // Use the existing saveAuthenticatedScore function
      return await window.saveAuthenticatedScore(gameData);
    } else {
      console.log("💾 Saving guest score...");
      // Use the existing saveGuestScore function
      return await window.saveGuestScore(gameData);
    }
  } catch (error) {
    console.error("❌ Error saving score to Firebase:", error);
    throw error;
  }
};

// Update the score retrieval functions to handle authentication
window.getTopScores = async function () {
  if (!isDataCollectionEnabled()) {
    console.log("📴 Data collection disabled - returning empty leaderboard");
    return [];
  }

  const firebaseModules = window.firebaseModules;
  if (!firebaseModules || !database) {
    console.error("Firebase not ready for getTopScores");
    return [];
  }

  const { ref, query, orderByChild, limitToLast, get } = firebaseModules;

  try {
    // Get authenticated scores only for main leaderboard
    const scoresRef = ref(database, "scores");
    const topScoresQuery = query(
      scoresRef,
      orderByChild("score"),
      limitToLast(20), // Increase limit for better ranking
    );
    const snapshot = await get(topScoresQuery);

    if (snapshot.exists()) {
      const scores = [];
      snapshot.forEach((childSnapshot) => {
        const score = childSnapshot.val();
        // Only include authenticated scores in main leaderboard
        if (score.authenticatedScore === true) {
          scores.push(score);
        }
      });
      return scores.reverse(); // Highest scores first
    }
    return [];
  } catch (error) {
    console.error("Error fetching authenticated scores:", error);
    return [];
  }
};

window.loginUser = async function (email, password) {
  const { signInWithEmailAndPassword } = window.firebaseModules;

  // CAPTURE GUEST STATE BEFORE ANY AUTH CHANGES
  const wasGuestMode = localStorage.getItem("nerdtype_guest_mode") === "true";
  const prevUsername = localStorage.getItem("nerdtype_username");

  // If we're logging in from guest mode, backup the guest achievements
  if (wasGuestMode || prevUsername === "runner" || !prevUsername) {
    const currentAchievements = localStorage.getItem("nerdtype_achievements");
    if (currentAchievements) {
      localStorage.setItem(
        "nerdtype_guest_achievements_backup",
        currentAchievements,
      );
      console.log("💾 Backed up guest achievements before login");
    }
  }

  try {
    console.log("🔐 Attempting enhanced login for:", email);

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Extract username from email (part before @)
    const emailUsername = user.email.split("@")[0];

    // Check if user exists in database
    const { ref, get, set } = window.firebaseModules;
    const userRef = ref(database, `users/${user.uid}`);
    const userSnapshot = await get(userRef);

    let username = emailUsername;

    if (!userSnapshot.exists()) {
      // User doesn't exist in database - create entry
      console.log(
        "📝 Creating database entry for existing user:",
        emailUsername,
      );

      // Check if this username is already taken
      const usernameCheck = await checkUsernameAvailability(emailUsername);

      if (!usernameCheck.available) {
        // Email username is taken, need to create a unique one
        let counter = 1;
        let uniqueUsername = `${emailUsername}${counter}`;

        while (!(await checkUsernameAvailability(uniqueUsername)).available) {
          counter++;
          uniqueUsername = `${emailUsername}${counter}`;
        }

        username = uniqueUsername;
        console.log("📝 Email username taken, using:", username);
      }

      // Reserve the username and create user profile
      await reserveUsername(username, user.uid, user.email);
    } else {
      // User exists in database, get their username
      const userData = userSnapshot.val();
      username = userData.username || emailUsername;
    }

    // Store username locally
    localStorage.setItem("nerdtype_username", username);

    // Clear guest mode flag since we're now logged in
    localStorage.removeItem("nerdtype_guest_mode");

    // Simple approach: Clear local achievements on login unless it's the same user
    const shouldClearAchievements =
      !prevUsername || prevUsername !== username || wasGuestMode;

    if (shouldClearAchievements && window.clearAchievementsForUserSwitch) {
      console.log("🧹 Clearing achievements - different user login");
      window.clearAchievementsForUserSwitch();
    }

    // Load user's settings from cloud FIRST (before other systems)
    if (window.syncSettingsAfterLogin) {
      try {
        await window.syncSettingsAfterLogin();
        console.log("✅ Settings sync completed during login");
      } catch (error) {
        console.error("❌ Failed to sync settings after login:", error);
      }
    }

    // Load user's achievements from cloud after settings
    if (
      window.achievementSystem &&
      typeof window.achievementSystem.loadUserAchievementsFromCloud ===
        "function"
    ) {
      setTimeout(() => {
        window.achievementSystem
          .loadUserAchievementsFromCloud()
          .catch((error) => {
            console.error("❌ Failed to load achievements after login:", error);
          });
      }, 500); // Smaller delay since settings are already loaded
    }

    // Switch to user-specific scoreboard
    if (window.switchToUserScoreboard) {
      setTimeout(() => {
        window.switchToUserScoreboard().catch((error) => {
          console.error(
            "❌ Failed to switch to user scoreboard after login:",
            error,
          );
        });
      }, 1000); // After achievements
    }

    console.log("✅ Enhanced login successful:", user.email, "as", username);
    return { success: true, user: user, username: username };
  } catch (error) {
    console.error("❌ Login error:", error);

    let errorMessage = "Login failed. Please try again.";
    if (error.code === "auth/user-not-found") {
      errorMessage = "No account found with this email.";
    } else if (error.code === "auth/wrong-password") {
      errorMessage = "Incorrect password.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Please enter a valid email address.";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed attempts. Please try again later.";
    }

    return { success: false, error: errorMessage };
  }
};

window.registerUser = async function (email, password) {
  const { createUserWithEmailAndPassword } = window.firebaseModules;

  try {
    console.log("📝 Starting registration for:", email);

    // Get username from the form
    const usernameInput = document.getElementById("registerUsername");
    const username = usernameInput
      ? usernameInput.value.trim()
      : email.split("@")[0];

    console.log("📝 Using username:", username);

    // Validate username availability
    const usernameValidation = await validateUsernameComplete(username);
    if (!usernameValidation.isValid) {
      console.log("❌ Username validation failed:", usernameValidation.message);
      return { success: false, error: usernameValidation.message };
    }

    console.log(
      "✅ Username validation passed, creating Firebase Auth account...",
    );

    // Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    console.log("✅ Firebase Auth account created:", user.email);

    // Reserve the username in database
    try {
      console.log("📝 Reserving username in database...");
      await reserveUsername(username, user.uid, user.email);

      // Store username locally
      localStorage.setItem("nerdtype_username", username);

      // Sync local achievements to cloud for new user
      if (
        window.achievementSystem &&
        typeof window.achievementSystem.syncAchievementsToFirebase ===
          "function"
      ) {
        setTimeout(() => {
          window.achievementSystem
            .syncAchievementsToFirebase()
            .catch((error) => {
              console.error(
                "❌ Failed to sync achievements after registration:",
                error,
              );
            });
        }, 1000); // Small delay to ensure all systems are ready
      }

      // Switch to user scoreboard for new user (will be empty initially)
      if (window.switchToUserScoreboard) {
        setTimeout(() => {
          window.switchToUserScoreboard().catch((error) => {
            console.error(
              "❌ Failed to switch to user scoreboard after registration:",
              error,
            );
          });
        }, 1500); // Slightly later than achievements
      }

      console.log(
        "✅ Registration completed successfully:",
        user.email,
        "as",
        username,
      );
      return { success: true, user: user, username: username };
    } catch (usernameError) {
      console.error(
        "❌ Username reservation failed, cleaning up auth account...",
        usernameError,
      );

      // If username reservation fails, clean up the auth account
      try {
        await user.delete();
        console.log("🧹 Auth account cleaned up successfully");
      } catch (deleteError) {
        console.error("❌ Failed to clean up auth account:", deleteError);
      }

      return {
        success: false,
        error:
          "Username became unavailable during registration. Please try again.",
      };
    }
  } catch (error) {
    console.error("❌ Registration error:", error);

    let errorMessage = "Registration failed. Please try again.";
    if (error.code === "auth/email-already-in-use") {
      errorMessage =
        "This email is already registered. Try logging in instead.";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak. Please use at least 6 characters.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Please enter a valid email address.";
    }

    return { success: false, error: errorMessage };
  }
};

window.logoutUser = async function () {
  const { signOut } = window.firebaseModules;

  try {
    console.log("🚪 Logging out user...");

    // Clear local storage first
    localStorage.removeItem("nerdtype_username");
    localStorage.removeItem("nerdtype_guest_mode");

    // Save current user's achievements to cloud before logout (if logged in)
    if (
      currentUser &&
      window.achievementSystem &&
      typeof window.achievementSystem.syncAchievementsToFirebase === "function"
    ) {
      try {
        await window.achievementSystem.syncAchievementsToFirebase();
        console.log("💾 Synced achievements before logout");
      } catch (error) {
        console.error("❌ Failed to sync achievements before logout:", error);
      }
    }

    // Save current user's settings to cloud before logout (if logged in)
    if (currentUser && window.syncSettingsToFirebase) {
      try {
        await window.syncSettingsToFirebase();
        console.log("💾 Synced settings before logout");
      } catch (error) {
        console.error("❌ Failed to sync settings before logout:", error);
      }
    }

    // Reset to guest mode and restore guest achievements
    localStorage.setItem("nerdtype_guest_mode", "true");
    localStorage.setItem("nerdtype_username", "runner");

    // Restore guest achievements if they exist
    const guestBackup = localStorage.getItem(
      "nerdtype_guest_achievements_backup",
    );
    if (guestBackup && window.achievementSystem) {
      try {
        localStorage.setItem("nerdtype_achievements", guestBackup);
        // Reload the achievement system with the restored data
        const backupData = JSON.parse(guestBackup);
        window.achievementSystem.achievementsData = backupData;
        console.log("🔄 Restored guest achievements from backup");
      } catch (error) {
        console.error("❌ Failed to restore guest achievements:", error);
        // Fallback to reset
        if (
          window.achievementSystem &&
          typeof window.achievementSystem.resetAchievements === "function"
        ) {
          window.achievementSystem.resetAchievements();
        }
      }
    } else {
      // No backup, reset to fresh guest state
      if (
        window.achievementSystem &&
        typeof window.achievementSystem.resetAchievements === "function"
      ) {
        window.achievementSystem.resetAchievements();
        console.log("🆕 Started fresh guest session - no backup found");
      }
    }

    // Switch back to guest scoreboard
    if (window.switchToGuestScoreboard) {
      window.switchToGuestScoreboard();
    }

    // Clear global variables
    window.playerUsername = "";
    currentUser = null;

    // Sign out from Firebase
    if (auth) {
      await signOut(auth);
    }

    console.log("✅ Logout successful");
    return { success: true };
  } catch (error) {
    console.error("❌ Logout error:", error);
    return { success: false, error: error.message };
  }
};

// Show login modal
window.showLoginModal = function () {
  const loginModal = document.getElementById("loginModal");
  if (loginModal) {
    const modal = new bootstrap.Modal(loginModal);
    modal.show();
  }
};

// Show username setup modal for authenticated users without username
function showUsernameSetupModal() {
  const usernameModal = document.getElementById("usernameModal");
  if (usernameModal) {
    const modal = new bootstrap.Modal(usernameModal);
    modal.show();
  }
}

// Get current authenticated user
window.getCurrentUser = function () {
  return currentUser;
};

// Check if user is authenticated
window.isUserAuthenticated = function () {
  return currentUser !== null;
};

// Add font change listener to update fonts when user changes them in settings
window.addEventListener("fontChanged", function (event) {
  console.log("🎨 Font changed to:", event.detail.fontFamily);

  // Apply the new font immediately to all elements
  const gameElements = document.querySelectorAll(
    "#userInput, #nextWord, #wordToType, #wordToType span, #currentGameMode, #timer, #timeLeft, #progressPercentage, .game-interface, .typing-area, #usernameDisplay",
  );
  gameElements.forEach((element) => {
    if (element) {
      element.style.fontFamily = event.detail.fontFamily + " !important";
    }
  });

  // Update CSS variable
  document.documentElement.style.setProperty(
    "--game-font",
    event.detail.fontFamily,
  );
});

// Function to reapply current font whenever needed
window.reapplyCurrentFont = function () {
  const currentFont = localStorage.getItem("nerdtype_font") || "jetbrains-mono";

  const gameElements = document.querySelectorAll(
    "#userInput, #nextWord, #wordToType, #wordToType span, #currentGameMode, #timer, #timeLeft, #progressPercentage, .game-interface, .typing-area, #usernameDisplay",
  );
  gameElements.forEach((element) => {
    if (element) {
      element.style.fontFamily = currentFont + " !important";
    }
  });

  document.documentElement.style.setProperty("--game-font", currentFont);
  console.log("🎨 Reapplied font:", currentFont);
};

// Generate or get device ID for scoreboard tracking
function getDeviceId() {
  let deviceId = localStorage.getItem("nerdtype_device_id");
  if (!deviceId) {
    deviceId =
      "device_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
    localStorage.setItem("nerdtype_device_id", deviceId);
  }
  return deviceId;
}

// Scoreboard Sync Functions
window.canSyncScoreboardToFirebase = function () {
  // Check if user is logged in
  const currentUser = window.getCurrentUser && window.getCurrentUser();
  if (!currentUser) return false;

  // Check if data sharing is enabled
  const dataShareEnabled = localStorage.getItem("data_collection_enabled");
  if (dataShareEnabled === "false") return false;

  // Check if Firebase is available
  if (!window.firebaseModules || !window.database) return false;

  return true;
};

window.syncScoreboardToFirebase = async function (gameData) {
  if (!window.canSyncScoreboardToFirebase()) {
    console.log(
      "🔒 Cannot sync scoreboard to Firebase - not logged in or data sharing disabled",
    );
    return;
  }

  try {
    const currentUser = window.getCurrentUser();
    if (!currentUser) {
      console.log("❌ No current user for scoreboard sync");
      return;
    }

    const { ref, push } = window.firebaseModules;
    const userScoreboardRef = ref(
      window.database,
      `users/${currentUser.uid}/scoreboard`,
    );

    // Add metadata
    const scoreEntry = {
      ...gameData,
      syncedAt: new Date().toISOString(),
      deviceId: getDeviceId(),
    };

    await push(userScoreboardRef, scoreEntry);
    console.log("✅ Scoreboard entry synced to Firebase");
  } catch (error) {
    console.error("❌ Error syncing scoreboard to Firebase:", error);
  }
};

window.loadScoreboardFromFirebase = async function () {
  if (!window.canSyncScoreboardToFirebase()) {
    console.log(
      "🔒 Cannot load scoreboard from Firebase - not logged in or data sharing disabled",
    );
    return [];
  }

  try {
    const currentUser = window.getCurrentUser();
    if (!currentUser) {
      console.log("❌ No current user for scoreboard load");
      return [];
    }

    const { ref, get } = window.firebaseModules;
    const userScoreboardRef = ref(
      window.database,
      `users/${currentUser.uid}/scoreboard`,
    );

    // Check if scoreboard exists
    const allSnapshot = await get(userScoreboardRef);

    if (!allSnapshot.exists()) {
      console.log("📭 No scoreboard data found in Firebase for this user");
      return [];
    }

    // Get all entries (we'll sort locally to avoid Firebase indexing requirements)
    const snapshot = await get(userScoreboardRef);

    if (snapshot.exists()) {
      const cloudScores = [];
      snapshot.forEach((child) => {
        cloudScores.push(child.val());
      });

      // Sort by timestamp locally (most recent first) and limit to 50
      cloudScores.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      const limitedScores = cloudScores.slice(0, 50);

      console.log(
        "📥 Loaded scoreboard from Firebase:",
        limitedScores.length,
        "entries",
      );
      return limitedScores;
    }

    console.log("📭 No scoreboard entries found");
    return [];
  } catch (error) {
    console.error("❌ Error loading scoreboard from Firebase:", error);
    return [];
  }
};

window.switchToUserScoreboard = async function () {
  if (!window.canSyncScoreboardToFirebase()) {
    console.log("🔒 Cannot sync scoreboard - using local only");
    return;
  }

  try {
    console.log("🔄 Switching to user-specific scoreboard...");

    // Backup current local scores (guest scores) before switching
    const localScores = JSON.parse(localStorage.getItem("gameResults")) || [];
    if (localScores.length > 0) {
      localStorage.setItem(
        "gameResults_guest_backup",
        JSON.stringify(localScores),
      );
      console.log("💾 Backed up guest scores");
    }

    // Load user's cloud scores
    const cloudScores = await window.loadScoreboardFromFirebase();

    // Replace local storage with user's cloud scores only
    localStorage.setItem("gameResults", JSON.stringify(cloudScores));

    console.log(
      "✅ Switched to user scoreboard:",
      cloudScores.length,
      "entries",
    );

    // Refresh scoreboard display if visible
    if (typeof window.displayPreviousResults === "function") {
      window.displayPreviousResults();
    }
  } catch (error) {
    console.error("❌ Error switching to user scoreboard:", error);
  }
};

window.switchToGuestScoreboard = function () {
  console.log("🔄 Switching to guest scoreboard...");

  try {
    // Restore guest scores from backup
    const guestBackup = localStorage.getItem("gameResults_guest_backup");
    if (guestBackup) {
      localStorage.setItem("gameResults", guestBackup);
      console.log("🔄 Restored guest scoreboard from backup");
    } else {
      // No backup, start fresh guest scoreboard
      localStorage.setItem("gameResults", JSON.stringify([]));
      console.log("🆕 Started fresh guest scoreboard");
    }

    // Refresh scoreboard display if visible
    if (typeof window.displayPreviousResults === "function") {
      window.displayPreviousResults();
    }
  } catch (error) {
    console.error("❌ Error switching to guest scoreboard:", error);
  }
};

// Settings Sync Functions
window.canSyncSettingsToFirebase = function () {
  // Check if user is logged in
  const currentUser = window.getCurrentUser && window.getCurrentUser();
  if (!currentUser) return false;

  // Check if data sharing is enabled
  const dataShareEnabled = localStorage.getItem("data_collection_enabled");
  if (dataShareEnabled === "false") return false;

  // Check if Firebase is available
  if (!window.firebaseModules || !window.database) return false;

  return true;
};

window.syncSettingsToFirebase = async function () {
  if (!window.canSyncSettingsToFirebase()) {
    console.log(
      "🔒 Cannot sync settings to Firebase - not logged in or data sharing disabled",
    );
    return;
  }

  try {
    const currentUser = window.getCurrentUser();
    if (!currentUser) {
      console.log("❌ No current user for settings sync");
      return;
    }

    const { ref, set } = window.firebaseModules;
    const userSettingsRef = ref(
      window.database,
      `users/${currentUser.uid}/settings`,
    );

    // Collect all game settings from localStorage
    const gameSettings = JSON.parse(localStorage.getItem("gameSettings")) || {};
    const settingsToSync = {
      // Core game settings
      gameSettings: gameSettings,

      // Individual settings
      wordlist: localStorage.getItem("nerdtype_wordlist") || "english",
      zenMode: localStorage.getItem("nerdtype_zen_mode") === "true",
      font: localStorage.getItem("nerdtype_font") || "jetbrains-mono",
      hideUI: localStorage.getItem("nerdtype_hide_ui") === "true",
      showSpacesAfterWords:
        localStorage.getItem("showSpacesAfterWords") !== "false",
      dataCollectionEnabled:
        localStorage.getItem("data_collection_enabled") !== "false",
      achievementSoundEnabled:
        localStorage.getItem("achievement_sound_enabled") === "true",
      keypressSoundEnabled:
        localStorage.getItem("keypress_sound_enabled") === "true",

      // Metadata
      syncedAt: new Date().toISOString(),
      deviceId: getDeviceId(),
    };

    await set(userSettingsRef, settingsToSync);
    console.log("✅ Settings synced to Firebase successfully");
  } catch (error) {
    console.error("❌ Error syncing settings to Firebase:", error);
  }
};

window.loadSettingsFromFirebase = async function () {
  if (!window.canSyncSettingsToFirebase()) {
    console.log(
      "🔒 Cannot load settings from Firebase - not logged in or data sharing disabled",
    );
    return null;
  }

  try {
    const currentUser = window.getCurrentUser();
    if (!currentUser) {
      console.log("❌ No current user for settings load");
      return null;
    }

    const { ref, get } = window.firebaseModules;
    const userSettingsRef = ref(
      window.database,
      `users/${currentUser.uid}/settings`,
    );

    const snapshot = await get(userSettingsRef);

    if (!snapshot.exists()) {
      console.log("📭 No settings data found in Firebase for this user");
      return null;
    }

    const cloudSettings = snapshot.val();
    console.log("📥 Loaded settings from Firebase:", cloudSettings);
    return cloudSettings;
  } catch (error) {
    console.error("❌ Error loading settings from Firebase:", error);
    return null;
  }
};

window.applyCloudSettingsToLocal = function (cloudSettings) {
  if (!cloudSettings) {
    console.log("❌ No cloud settings provided to apply");
    return;
  }

  try {
    console.log("🔄 Applying cloud settings to local storage...");

    // Apply core game settings
    if (
      cloudSettings.gameSettings &&
      typeof cloudSettings.gameSettings === "object"
    ) {
      localStorage.setItem(
        "gameSettings",
        JSON.stringify(cloudSettings.gameSettings),
      );
    }

    // Apply individual settings
    if (cloudSettings.wordlist) {
      localStorage.setItem("nerdtype_wordlist", cloudSettings.wordlist);
    }

    if (typeof cloudSettings.zenMode === "boolean") {
      localStorage.setItem(
        "nerdtype_zen_mode",
        cloudSettings.zenMode.toString(),
      );
    }

    if (cloudSettings.font) {
      localStorage.setItem("nerdtype_font", cloudSettings.font);
    }

    if (typeof cloudSettings.hideUI === "boolean") {
      localStorage.setItem("nerdtype_hide_ui", cloudSettings.hideUI.toString());
    }

    if (typeof cloudSettings.showSpacesAfterWords === "boolean") {
      localStorage.setItem(
        "showSpacesAfterWords",
        cloudSettings.showSpacesAfterWords.toString(),
      );
    }

    if (typeof cloudSettings.dataCollectionEnabled === "boolean") {
      localStorage.setItem(
        "data_collection_enabled",
        cloudSettings.dataCollectionEnabled.toString(),
      );
    }

    if (typeof cloudSettings.achievementSoundEnabled === "boolean") {
      localStorage.setItem(
        "achievement_sound_enabled",
        cloudSettings.achievementSoundEnabled.toString(),
      );
    }

    if (typeof cloudSettings.keypressSoundEnabled === "boolean") {
      localStorage.setItem(
        "keypress_sound_enabled",
        cloudSettings.keypressSoundEnabled.toString(),
      );
    }

    console.log("✅ Cloud settings applied to local storage successfully");

    // Force immediate application of some settings that can be applied without reload
    setTimeout(() => {
      try {
        // Apply font changes immediately
        if (
          cloudSettings.font &&
          typeof window.reapplyCurrentFont === "function"
        ) {
          window.reapplyCurrentFont();
        }

        // Apply UI hide settings immediately
        if (
          typeof cloudSettings.hideUI === "boolean" &&
          typeof window.applyUIHideSettings === "function"
        ) {
          window.applyUIHideSettings(cloudSettings.hideUI);
        }

        // Force reload of gameSettings variables in all modules
        if (typeof window.reloadGameSettings === "function") {
          window.reloadGameSettings();
        }

        // Dispatch setting change events for immediate UI updates
        window.dispatchEvent(
          new CustomEvent("gameSettingsChanged", {
            detail: { setting: "all", source: "cloud_sync" },
          }),
        );
      } catch (immediateError) {
        console.error("❌ Error applying immediate settings:", immediateError);
      }
    }, 100);
  } catch (error) {
    console.error("❌ Error applying cloud settings:", error);
  }
};

window.syncSettingsAfterLogin = async function () {
  if (!window.canSyncSettingsToFirebase()) {
    console.log("🔒 Cannot sync settings after login - conditions not met");
    return;
  }

  try {
    console.log("🔄 Loading user settings after login...");

    // Load settings from cloud
    const cloudSettings = await window.loadSettingsFromFirebase();

    if (cloudSettings) {
      console.log("📥 Found cloud settings, applying to local storage...");

      // Apply cloud settings to local storage
      window.applyCloudSettingsToLocal(cloudSettings);

      // Store notification for after reload
      localStorage.setItem(
        "pending_settings_notification",
        JSON.stringify({
          message: "Settings synced from cloud",
          type: "success",
        }),
      );

      // Schedule reload for after login completes
      setTimeout(() => {
        location.reload();
      }, 1500);
    } else {
      // No cloud settings found, sync current local settings to cloud
      console.log(
        "💾 No cloud settings found, syncing local settings to cloud...",
      );
      await window.syncSettingsToFirebase();
      console.log("✅ Current settings uploaded to cloud");
    }
  } catch (error) {
    console.error("❌ Error during settings sync after login:", error);
  }
};

// Debug functions for testing settings sync
window.debugSettingsSync = {
  // Test the full sync functionality
  test: async function () {
    console.log("🔧 Testing settings sync functionality...");

    if (!window.canSyncSettingsToFirebase()) {
      console.log(
        "❌ Cannot test - user not logged in or data sharing disabled",
      );
      return;
    }

    try {
      console.log("📤 Testing sync to Firebase...");
      await window.syncSettingsToFirebase();
      console.log("✅ Sync to Firebase successful");

      console.log("📥 Testing load from Firebase...");
      const settings = await window.loadSettingsFromFirebase();
      console.log("✅ Load from Firebase successful:", settings);

      console.log("🔧 Settings sync test completed successfully!");
      return { success: true, settings };
    } catch (error) {
      console.error("❌ Settings sync test failed:", error);
      return { success: false, error };
    }
  },

  // Force sync current settings to cloud
  forceSyncUp: async function () {
    console.log("🔧 Force syncing current settings to cloud...");
    if (!window.canSyncSettingsToFirebase()) {
      console.log(
        "❌ Cannot sync - user not logged in or data sharing disabled",
      );
      return;
    }
    try {
      await window.syncSettingsToFirebase();
      console.log("✅ Force sync to cloud completed");
    } catch (error) {
      console.error("❌ Force sync failed:", error);
    }
  },

  // Force load settings from cloud and apply them
  forceSyncDown: async function () {
    console.log("🔧 Force loading settings from cloud...");
    if (!window.canSyncSettingsToFirebase()) {
      console.log(
        "❌ Cannot load - user not logged in or data sharing disabled",
      );
      return;
    }
    try {
      const cloudSettings = await window.loadSettingsFromFirebase();
      if (cloudSettings) {
        window.applyCloudSettingsToLocal(cloudSettings);
        console.log(
          "✅ Force load from cloud completed - page reload recommended",
        );

        // Ask user if they want to reload
        if (
          confirm(
            "Settings loaded from cloud. Reload page to apply all changes?",
          )
        ) {
          location.reload();
        }
      } else {
        console.log("📭 No cloud settings found");
      }
    } catch (error) {
      console.error("❌ Force load failed:", error);
    }
  },

  // Show current local settings
  showLocal: function () {
    console.log("💻 Current local settings:");
    console.log(
      "  gameSettings:",
      JSON.parse(localStorage.getItem("gameSettings")),
    );
    console.log("  wordlist:", localStorage.getItem("nerdtype_wordlist"));
    console.log("  zenMode:", localStorage.getItem("nerdtype_zen_mode"));
    console.log("  font:", localStorage.getItem("nerdtype_font"));
    console.log("  hideUI:", localStorage.getItem("nerdtype_hide_ui"));
    console.log("  showSpaces:", localStorage.getItem("showSpacesAfterWords"));
    console.log(
      "  dataCollection:",
      localStorage.getItem("data_collection_enabled"),
    );
    console.log(
      "  achievementSound:",
      localStorage.getItem("achievement_sound_enabled"),
    );
    console.log(
      "  keypressSound:",
      localStorage.getItem("keypress_sound_enabled"),
    );
  },

  // Show cloud settings
  showCloud: async function () {
    if (!window.canSyncSettingsToFirebase()) {
      console.log(
        "❌ Cannot load cloud settings - user not logged in or data sharing disabled",
      );
      return;
    }
    try {
      const cloudSettings = await window.loadSettingsFromFirebase();
      console.log("☁️ Cloud settings:", cloudSettings);
    } catch (error) {
      console.error("❌ Failed to load cloud settings:", error);
    }
  },

  // Simulate the login settings sync process for debugging
  simulateLoginSync: async function () {
    console.log("🔧 Simulating login settings sync process...");

    if (!window.canSyncSettingsToFirebase()) {
      console.log(
        "❌ Cannot simulate - user not logged in or data sharing disabled",
      );
      return;
    }

    try {
      console.log("1️⃣ Current local settings before sync:");
      this.showLocal();

      console.log("2️⃣ Loading settings from cloud...");
      const cloudSettings = await window.loadSettingsFromFirebase();

      if (cloudSettings) {
        console.log("3️⃣ Found cloud settings:", cloudSettings);
        console.log("4️⃣ Applying cloud settings to local storage...");
        window.applyCloudSettingsToLocal(cloudSettings);

        console.log("5️⃣ Local settings after applying cloud:");
        this.showLocal();

        console.log(
          "✅ Login sync simulation completed - manually reload page to see all effects",
        );
      } else {
        console.log("3️⃣ No cloud settings found");
      }
    } catch (error) {
      console.error("❌ Login sync simulation failed:", error);
    }
  },

  // Test just the game settings reload functionality
  testGameSettingsReload: function () {
    console.log("🔧 Testing game settings reload...");

    // Show current game settings variable
    if (typeof window.reloadGameSettings === "function") {
      console.log("1️⃣ Current gameSettings variable before reload:");
      console.log(
        "  (This should show the in-memory variable from functions-classic.js)",
      );

      console.log("2️⃣ Current localStorage gameSettings:");
      console.log(
        "  ",
        JSON.parse(localStorage.getItem("gameSettings") || "{}"),
      );

      console.log("3️⃣ Calling reloadGameSettings()...");
      window.reloadGameSettings();

      console.log("✅ Game settings reload test completed");
    } else {
      console.log("❌ reloadGameSettings function not available");
    }
  },
};

// Keep the old function name for backwards compatibility
window.testSettingsSync = window.debugSettingsSync.test;

console.log("🔥 Firebase config file loaded with authentication");

const reservedUsernames = [
  "admin",
  "moderator",
  "nerdtype",
  "runner",
  "guest",
  "user",
  "test",
];

function isReservedUsername(username) {
  return reservedUsernames.some(
    (reserved) => username.toLowerCase() === reserved.toLowerCase(),
  );
}

function canUseReservedUsername(username) {
  const isAdminMode = localStorage.getItem("nerdtype_admin") === "true";
  if (username.toLowerCase() === "merkks") return isAdminMode;
  return !isReservedUsername(username);
}

function validateUsernameFormat(username) {
  const trimmed = username.trim();

  if (!trimmed) return { isValid: false, message: "Username cannot be empty" };
  if (trimmed.length < 2 || trimmed.length > 20)
    return {
      isValid: false,
      message: "Username must be between 2-20 characters",
    };
  if (!canUseReservedUsername(trimmed))
    return { isValid: false, message: `"${trimmed}" is a reserved codename` };
  if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed))
    return {
      isValid: false,
      message:
        "Username can only contain letters, numbers, spaces, underscores, and hyphens",
    };

  return { isValid: true };
}

async function checkUsernameAvailability(username) {
  if (!window.firebaseModules || !database) {
    console.warn("Firebase not ready for username check");
    return { available: true, message: "Unable to verify availability" };
  }

  const { ref, get } = window.firebaseModules;
  const trimmed = username.trim();

  console.log("🔍 Checking username availability for:", trimmed);

  try {
    // Check multiple possible keys since your database might have inconsistent casing
    const keysToCheck = [
      trimmed.toLowerCase(), // lowercase version
      trimmed, // exact case
      trimmed.toUpperCase(), // uppercase version
    ];

    for (const key of keysToCheck) {
      const usernameRef = ref(database, `usernames/${key}`);
      const usernameSnapshot = await get(usernameRef);

      console.log(`Checking key "${key}":`, usernameSnapshot.exists());

      if (usernameSnapshot.exists()) {
        const data = usernameSnapshot.val();
        console.log("Found username data:", data);
        return { available: false, message: "Username is already taken" };
      }
    }

    // Also check the users collection for case-insensitive matches
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);

    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      for (const userId in users) {
        const userData = users[userId];
        if (
          userData.username &&
          userData.username.toLowerCase() === trimmed.toLowerCase()
        ) {
          console.log(
            "Found matching username in users collection:",
            userData.username,
          );
          return { available: false, message: "Username is already taken" };
        }
      }
    }

    console.log("✅ Username is available:", trimmed);
    return { available: true, message: "Username is available" };
  } catch (error) {
    console.error("❌ Error checking username availability:", error);
    return { available: false, message: "Error checking availability" };
  }
}

// ENHANCED DEBUG FUNCTION - Add this to firebase-config.js
window.debugUsernameDatabase = async function () {
  if (!window.firebaseModules || !database) {
    console.log("Firebase not ready");
    return;
  }

  const { ref, get } = window.firebaseModules;

  try {
    console.log("=== DEBUGGING USERNAME DATABASE ===");

    // Check usernames collection
    const usernamesRef = ref(database, "usernames");
    const usernamesSnapshot = await get(usernamesRef);

    console.log("📁 USERNAMES COLLECTION:");
    if (usernamesSnapshot.exists()) {
      const usernames = usernamesSnapshot.val();
      Object.keys(usernames).forEach((key) => {
        console.log(
          `  Key: "${key}" -> Username: "${usernames[key].username}"`,
        );
      });
    } else {
      console.log("  No usernames collection found");
    }

    // Check users collection
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);

    console.log("👥 USERS COLLECTION:");
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      Object.keys(users).forEach((userId) => {
        const userData = users[userId];
        if (userData.username) {
          console.log(
            `  UserID: ${userId} -> Username: "${userData.username}"`,
          );
        }
      });
    } else {
      console.log("  No users collection found");
    }

    // Test specific usernames
    console.log("🔍 TESTING SPECIFIC USERNAMES:");
    const testUsernames = ["test2", "Test2", "TEST2", "merkks", "Merkks"];

    for (const testName of testUsernames) {
      const result = await checkUsernameAvailability(testName);
      console.log(
        `  "${testName}": ${result.available ? "AVAILABLE" : "TAKEN"} - ${result.message}`,
      );
    }
  } catch (error) {
    console.error("Debug error:", error);
  }
};

// IMPROVED RESERVE USERNAME FUNCTION - Replace in firebase-config.js
async function reserveUsername(username, userId, userEmail) {
  if (!window.firebaseModules || !database) {
    throw new Error("Firebase not ready");
  }

  const { ref, set, remove } = window.firebaseModules;
  const trimmed = username.trim();
  const lowercaseKey = trimmed.toLowerCase();

  try {
    console.log("📝 Reserving username:", trimmed, "with key:", lowercaseKey);

    // First, remove any existing entries with different casing
    const keysToClean = [trimmed, trimmed.toUpperCase(), trimmed.toLowerCase()];
    for (const key of keysToClean) {
      if (key !== lowercaseKey) {
        try {
          const cleanupRef = ref(database, `usernames/${key}`);
          await remove(cleanupRef);
          console.log("🧹 Cleaned up old key:", key);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
    }

    // Store with lowercase key for consistency
    const usernameRef = ref(database, `usernames/${lowercaseKey}`);
    await set(usernameRef, {
      username: trimmed, // Store the original casing
      userId: userId,
      userEmail: userEmail,
      createdAt: new Date().toISOString(),
    });

    // Also store in user profile
    const userRef = ref(database, `users/${userId}`);
    await set(userRef, {
      username: trimmed, // Store the original casing
      email: userEmail,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });

    console.log("✅ Username reserved successfully:", trimmed);
    return { success: true };
  } catch (error) {
    console.error("❌ Error reserving username:", error);
    throw error;
  }
}

async function reserveUsername(username, userId, userEmail) {
  if (!window.firebaseModules || !database) {
    throw new Error("Firebase not ready");
  }

  const { ref, set } = window.firebaseModules;
  const trimmed = username.trim();

  try {
    // Store in usernames collection for quick lookup
    const usernameRef = ref(database, `usernames/${trimmed.toLowerCase()}`);
    await set(usernameRef, {
      username: trimmed,
      userId: userId,
      userEmail: userEmail,
      createdAt: new Date().toISOString(),
    });

    // Also store in user profile
    const userRef = ref(database, `users/${userId}`);
    await set(userRef, {
      username: trimmed,
      email: userEmail,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });

    console.log("✅ Username reserved successfully:", trimmed);
    return { success: true };
  } catch (error) {
    console.error("❌ Error reserving username:", error);
    throw error;
  }
}

async function validateUsernameComplete(username) {
  const formatValidation = validateUsernameFormat(username);
  if (!formatValidation.isValid) return formatValidation;

  const availabilityCheck = await checkUsernameAvailability(username);
  if (!availabilityCheck.available) {
    return { isValid: false, message: availabilityCheck.message };
  }

  return { isValid: true, message: "Username is valid and available" };
}

// Fixed real-time checker
window.checkUsernameAvailabilityRealTime = (function () {
  let timeoutId;
  return function (username, callback, delay = 500) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      if (!username || username.trim().length < 2) {
        callback(null);
        return;
      }
      try {
        const formatValidation = validateUsernameFormat(username);
        if (!formatValidation.isValid) {
          callback({ available: false, message: formatValidation.message });
          return;
        }
        const result = await checkUsernameAvailability(username);
        callback(result);
      } catch (error) {
        console.error("Real-time username check error:", error);
        callback({ available: false, message: "Error checking availability" });
      }
    }, delay);
  };
})();
