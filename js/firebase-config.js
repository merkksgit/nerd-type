// firebase-config.js - Firebase v9 configuration and functions

// Firebase configuration
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

// This will be set when Firebase initializes
let firebaseApp = null;
let database = null;

// Initialize Firebase (called from HTML module)
window.initializeFirebaseApp = function (firebaseModules) {
  const {
    initializeApp,
    getDatabase,
    ref,
    push,
    query,
    orderByChild,
    limitToLast,
    get,
    equalTo,
  } = firebaseModules;

  try {
    console.log("🔥 Initializing Firebase...");
    firebaseApp = initializeApp(firebaseConfig);
    database = getDatabase(firebaseApp);
    console.log("✅ Firebase initialized successfully");

    // Test connection
    testConnection(firebaseModules);
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

// Save score to Firebase
window.saveScoreToFirebase = async function (gameData) {
  // Wait for Firebase modules to be available
  const firebaseModules = window.firebaseModules;
  if (!firebaseModules || !database) {
    console.error("❌ Firebase not initialized or modules not available");
    return Promise.reject("Firebase not ready");
  }

  const { ref, push } = firebaseModules;

  try {
    console.log("💾 Saving score to Firebase:", gameData);

    // Check for reserved username BEFORE saving
    if (!canUseUsername(gameData.username)) {
      console.log(
        `Username "${gameData.username}" is reserved - using Anonymous`,
      );
      gameData.username = "Anonymous";
    }

    const scoresRef = ref(database, "scores");
    const result = await push(scoresRef, gameData);

    console.log("✅ Score saved successfully! Key:", result.key);
    return result;
  } catch (error) {
    console.error("❌ Error saving score:", error);
    throw error;
  }
};

// Get top 10 scores
window.getTopScores = async function () {
  const firebaseModules = window.firebaseModules;
  if (!firebaseModules || !database) {
    console.error("Firebase not ready for getTopScores");
    return [];
  }

  const { ref, query, orderByChild, limitToLast, get } = firebaseModules;

  try {
    const scoresRef = ref(database, "scores");
    const topScoresQuery = query(
      scoresRef,
      orderByChild("score"),
      limitToLast(10),
    );
    const snapshot = await get(topScoresQuery);

    if (snapshot.exists()) {
      const scores = [];
      snapshot.forEach((childSnapshot) => {
        scores.push(childSnapshot.val());
      });
      return scores.reverse(); // Highest scores first
    }
    return [];
  } catch (error) {
    console.error("Error fetching scores:", error);
    return [];
  }
};

// Get top scores for a specific mode
window.getTopScoresByMode = async function (mode) {
  const firebaseModules = window.firebaseModules;
  if (!firebaseModules || !database) {
    console.error("Firebase not ready for getTopScoresByMode");
    return [];
  }

  const { ref, query, orderByChild, equalTo, get } = firebaseModules;

  try {
    const scoresRef = ref(database, "scores");
    const modeQuery = query(scoresRef, orderByChild("mode"), equalTo(mode));
    const snapshot = await get(modeQuery);

    if (snapshot.exists()) {
      const scores = [];
      snapshot.forEach((childSnapshot) => {
        scores.push(childSnapshot.val());
      });
      return scores.sort((a, b) => b.score - a.score).slice(0, 10);
    }
    return [];
  } catch (error) {
    console.error("Error fetching scores by mode:", error);
    return [];
  }
};

// Display global high scores (for modal)
window.displayGlobalHighScores = async function () {
  const highScoresContainer = document.getElementById("globalHighScores");
  if (!highScoresContainer) {
    console.log("globalHighScores container not found");
    return;
  }

  highScoresContainer.innerHTML =
    '<li style="color: #565f89; font-style: italic;">Loading global high scores...</li>';

  try {
    const topScores = await window.getTopScores();

    highScoresContainer.innerHTML = "";

    if (topScores.length === 0) {
      highScoresContainer.innerHTML =
        '<li style="color: #565f89; font-style: italic;">No global scores yet. Be the first!</li>';
      return;
    }

    topScores.forEach((score, index) => {
      const scoreItem = document.createElement("li");
      const rank = index + 1;
      const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3;

      const date = new Date(score.date || score.timestamp).toLocaleDateString(
        "en-GB",
      );
      const wordListName = score.wordList || "";
      const wordListInfo = wordListName ? ` | ${wordListName}` : "";

      scoreItem.innerHTML = `
        <span style="color: #7aa2f7; font-weight: bold;">${rankEmoji} #${rank}</span> 
        <span style="color: #9ece6a;">${score.username || "Anonymous"}</span> | 
        <span style="color: #ff9e64;">Score: ${score.score || 0}</span> | 
        <span style="color: #7dcfff;">WPM: ${score.wpm || 0}</span> | 
        <span style="color: #bb9af7;">Accuracy: ${score.accuracy || "N/A"}</span> | 
        <span style="color: #565f89;">${date}${wordListInfo}</span>
      `;

      highScoresContainer.appendChild(scoreItem);
    });
  } catch (error) {
    console.error("Error loading high scores:", error);
    highScoresContainer.innerHTML =
      '<li style="color: #f7768e; font-style: italic;">Error loading high scores. Please try again later.</li>';
  }
};

console.log("🔥 Firebase config file loaded");

// Reserved usernames list
const reservedUsernames = ["merkks", "admin", "moderator", "nerdtype"];

function isReservedUsername(username) {
  return reservedUsernames.some(
    (reserved) => username.toLowerCase() === reserved.toLowerCase(),
  );
}

// Secret admin mode
let isAdminMode = localStorage.getItem("nerdtype_admin") === "true";

window.enableAdminMode = function (secretKey) {
  if (secretKey === "nerdtype2025") {
    // Your secret password
    isAdminMode = true;
    localStorage.setItem("nerdtype_admin", "true");
    console.log('👑 Admin mode activated - you can now use "merkks"');
    return true;
  }
  return false;
};

function canUseUsername(username) {
  // Check if trying to use "merkks"
  if (username.toLowerCase() === "merkks") {
    return isAdminMode; // Only allow if admin mode is active
  }
  // Block other reserved usernames
  return !isReservedUsername(username);
}
