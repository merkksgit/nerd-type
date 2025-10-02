const https = require("https");

const DATABASE_URL =
  "https://nerdtype-leaderboard-default-rtdb.europe-west1.firebasedatabase.app";

async function fetchScores() {
  return new Promise((resolve, reject) => {
    const url = `${DATABASE_URL}/scores.json?orderBy="score"&limitToLast=100`;

    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const scores = JSON.parse(data);
            resolve(scores);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  brightYellow: "\x1b[93m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",
};

function formatScoreboardText(scores, stats) {
  const lines = [];

  lines.push("");
  lines.push(
    ANSI.bold +
      ANSI.brightYellow +
      "                        NERD TYPE GAME - Global Scoreboard                        " +
      ANSI.reset,
  );
  lines.push("");

  lines.push(
    ANSI.cyan +
      "┌──────┬──────────────────────┬─────────┬───────┬──────────┬───────────────┬──────────┐" +
      ANSI.reset,
  );
  lines.push(
    ANSI.cyan +
      "│ Rank │ Player               │  Score  │  WPM  │ Accuracy │     Mode      │   List   │" +
      ANSI.reset,
  );
  lines.push(
    ANSI.cyan +
      "├──────┼──────────────────────┼─────────┼───────┼──────────┼───────────────┼──────────┤" +
      ANSI.reset,
  );

  scores.forEach((score, index) => {
    const rank = index + 1;
    const rankStr = rank.toString().padStart(4, " ");

    const playerName = (score.username || "Anonymous").substring(0, 20);
    const playerStr = playerName.padEnd(20, " ");

    const scoreStr = score.score.toString().padStart(7, " ");
    const wpmStr = score.wpm.toString().padStart(5, " ");
    const accuracyStr = (score.accuracy || "N/A").padStart(8, " ");
    const modeStr = (score.mode || "Unknown").substring(0, 13).padEnd(13, " ");
    const wordListStr = (score.wordList || "Unknown")
      .substring(0, 8)
      .padEnd(8, " ");

    let rankDisplay = rankStr;
    let playerDisplay = playerStr;
    let scoreDisplay = scoreStr;
    let wpmDisplay = wpmStr;

    if (rank === 1) {
      rankDisplay = ANSI.yellow + ANSI.bold + rankStr + ANSI.reset;
      playerDisplay = ANSI.bold + ANSI.brightWhite + playerStr + ANSI.reset;
      scoreDisplay = ANSI.bold + ANSI.yellow + scoreStr + ANSI.reset;
    } else if (rank === 2) {
      rankDisplay = ANSI.white + ANSI.bold + rankStr + ANSI.reset;
      playerDisplay = ANSI.bold + ANSI.brightWhite + playerStr + ANSI.reset;
    } else if (rank === 3) {
      rankDisplay = ANSI.brightYellow + ANSI.bold + rankStr + ANSI.reset;
      playerDisplay = ANSI.bold + ANSI.brightWhite + playerStr + ANSI.reset;
    }

    if (score.wpm >= 100) {
      wpmDisplay = ANSI.green + ANSI.bold + wpmStr + ANSI.reset;
    } else if (score.wpm >= 80) {
      wpmDisplay = ANSI.green + wpmStr + ANSI.reset;
    }

    lines.push(
      ANSI.cyan +
        "│ " +
        ANSI.reset +
        rankDisplay +
        ANSI.cyan +
        " │ " +
        ANSI.reset +
        playerDisplay +
        ANSI.cyan +
        " │ " +
        ANSI.reset +
        scoreDisplay +
        ANSI.cyan +
        " │ " +
        ANSI.reset +
        wpmDisplay +
        ANSI.cyan +
        " │ " +
        ANSI.reset +
        accuracyStr +
        ANSI.cyan +
        " │ " +
        ANSI.reset +
        modeStr +
        ANSI.cyan +
        " │ " +
        ANSI.reset +
        wordListStr +
        ANSI.cyan +
        " │" +
        ANSI.reset,
    );
  });

  lines.push(
    ANSI.cyan +
      "└──────┴──────────────────────┴─────────┴───────┴──────────┴───────────────┴──────────┘" +
      ANSI.reset,
  );
  lines.push("");

  lines.push(
    ANSI.white +
      "  Total Players: " +
      stats.uniquePlayers +
      "    Total Games: " +
      stats.totalGames +
      ANSI.reset,
  );
  lines.push("");
  lines.push(
    ANSI.white + "  🌐 Visit: https://www.nerdtypegame.com" + ANSI.reset,
  );
  lines.push("");

  return lines.join("\n");
}

async function testScoreboard() {
  try {
    console.log("🔥 Fetching scores from Firebase...\n");

    const scoresData = await fetchScores();

    if (!scoresData) {
      console.log("No scores found!");
      return;
    }

    const allScores = [];
    const allAuthScores = [];
    const uniqueUsers = new Set();

    Object.values(scoresData).forEach((scoreData) => {
      if (scoreData.authenticatedScore === true) {
        allAuthScores.push(scoreData);
        allScores.push(scoreData);
        if (scoreData.username) {
          uniqueUsers.add(scoreData.username);
        }
      }
    });

    allScores.sort((a, b) => b.score - a.score);
    const topScores = allScores.slice(0, 20);

    const stats = {
      uniquePlayers: uniqueUsers.size,
      totalGames: allAuthScores.length,
    };

    const output = formatScoreboardText(topScores, stats);
    console.log(output);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testScoreboard();
