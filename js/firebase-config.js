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
