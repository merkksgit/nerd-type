const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

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
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
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

function isTerminalRequest(userAgent) {
  if (!userAgent) return false;

  const terminalClients = [
    "curl",
    "wget",
    "httpie",
    "fetch",
    "powershell",
    "windowspowershell",
    "python-requests",
    "python-urllib",
    "go-http-client",
    "rust-reqwest",
  ];

  const lowerUA = userAgent.toLowerCase();
  return terminalClients.some((client) => lowerUA.includes(client));
}

exports.scoreboard = onRequest(async (req, res) => {
  const userAgent = req.get("user-agent") || "";
  const isTerminal = isTerminalRequest(userAgent);

  try {
    const db = admin.database();
    const scoresRef = db.ref("scores");

    const snapshot = await scoresRef
      .orderByChild("score")
      .limitToLast(20)
      .once("value");

    if (!snapshot.exists()) {
      if (isTerminal) {
        res.set("Content-Type", "text/plain; charset=utf-8");
        return res.send("\nNo scores available yet.\n\n");
      } else {
        return res.redirect(
          "https://www.nerdtypegame.com/pages/globalscoreboard.html",
        );
      }
    }

    const allScores = [];
    snapshot.forEach((child) => {
      const scoreData = child.val();
      if (scoreData.authenticatedScore === true) {
        allScores.push(scoreData);
      }
    });

    const topScores = allScores.reverse().slice(0, 20);

    const allAuthSnapshot = await scoresRef.once("value");
    const allAuthScores = [];
    const uniqueUsers = new Set();

    allAuthSnapshot.forEach((child) => {
      const scoreData = child.val();
      if (scoreData.authenticatedScore === true) {
        allAuthScores.push(scoreData);
        if (scoreData.username) {
          uniqueUsers.add(scoreData.username);
        }
      }
    });

    const stats = {
      uniquePlayers: uniqueUsers.size,
      totalGames: allAuthScores.length,
    };

    if (isTerminal) {
      const textOutput = formatScoreboardText(topScores, stats);
      res.set("Content-Type", "text/plain; charset=utf-8");
      res.set("Cache-Control", "public, max-age=300");
      return res.send(textOutput);
    } else {
      const jsonData = {
        scores: topScores,
        stats: stats,
        timestamp: new Date().toISOString(),
      };

      const format = req.query.format || "redirect";

      if (format === "json") {
        res.set("Content-Type", "application/json");
        res.set("Cache-Control", "public, max-age=300");
        return res.json(jsonData);
      } else {
        return res.redirect(
          "https://www.nerdtypegame.com/pages/globalscoreboard.html",
        );
      }
    }
  } catch (error) {
    console.error("Error fetching scores:", error);

    if (isTerminal) {
      res.set("Content-Type", "text/plain; charset=utf-8");
      return res.status(500).send("\nError fetching scoreboard data.\n\n");
    } else {
      return res.status(500).json({ error: "Failed to fetch scoreboard data" });
    }
  }
});
