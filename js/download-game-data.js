document
  .getElementById("downloadDataBtn")
  .addEventListener("click", function () {
    const dataKey = "gameResults";
    const gameData = localStorage.getItem(dataKey);

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
    a.download = "game-data.json";
    a.click();

    // Clean up
    URL.revokeObjectURL(url);
  });
