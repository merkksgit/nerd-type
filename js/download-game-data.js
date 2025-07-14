document
  .getElementById("downloadDataBtn")
  .addEventListener("click", async function () {
    let gameData;
    let filename = "game-data.json";

    // Generate timestamp for filename
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19); // YYYY-MM-DDTHH-MM-SS

    // Check if user is logged in and can access full Firebase data
    if (window.canSyncScoreboardToFirebase && window.canSyncScoreboardToFirebase()) {
      try {
        // Load FULL data from Firebase for logged-in users
        const cloudData = await loadFullGameDataFromFirebase();
        if (cloudData && cloudData.length > 0) {
          gameData = JSON.stringify(cloudData);
          filename = `game-data-full-${timestamp}.json`;
        } else {
          // Fallback to localStorage if no cloud data
          gameData = localStorage.getItem("gameResults");
          filename = `game-data-${timestamp}.json`;
        }
      } catch (error) {
        console.error("Failed to load full data from Firebase:", error);
        // Fallback to localStorage
        gameData = localStorage.getItem("gameResults");
        filename = `game-data-${timestamp}.json`;
      }
    } else {
      // Guest mode - use localStorage
      gameData = localStorage.getItem("gameResults");
      filename = `game-data-local-${timestamp}.json`;
    }

    if (!gameData) {
      alert("No game data found!");
      return;
    }

    // Create a Blob with the JSON data
    const blob = new Blob([gameData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create a temporary link to trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    // Clean up
    URL.revokeObjectURL(url);
  });

// Function to load FULL game data from Firebase (no limit)
async function loadFullGameDataFromFirebase() {
  if (!window.canSyncScoreboardToFirebase()) {
    console.log("🔒 Cannot load full data from Firebase - not logged in or data sharing disabled");
    return [];
  }

  try {
    const currentUser = window.getCurrentUser();
    if (!currentUser) {
      console.log("❌ No current user for full data load");
      return [];
    }

    const { ref, get } = window.firebaseModules;
    const userScoreboardRef = ref(
      window.database,
      `users/${currentUser.uid}/scoreboard`,
    );

    const snapshot = await get(userScoreboardRef);

    if (snapshot.exists()) {
      const cloudScores = [];
      snapshot.forEach((child) => {
        cloudScores.push(child.val());
      });

      // Sort by timestamp (most recent first) but DON'T limit for download
      cloudScores.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      console.log("📥 Loaded FULL scoreboard from Firebase for download:", cloudScores.length, "entries");
      return cloudScores;
    }

    console.log("📭 No scoreboard entries found for download");
    return [];
  } catch (error) {
    console.error("❌ Error loading full scoreboard from Firebase:", error);
    return [];
  }
}

// Dashboard button functionality
document
  .getElementById("openDashboardBtn")
  .addEventListener("click", function () {
    const dashboardUrl = "https://nerdtype-dashboard.streamlit.app/";
    window.open(dashboardUrl, "_blank");
  });
