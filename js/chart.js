import storageManager from "./storage-manager.js";
import statsCard from "./stats-card.js";

// Cache configuration
const CHART_CACHE_KEY = "nerdtype_chartData_cache";
const CHART_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Retrieves cached chart data if available and not expired
 * @returns {Object|null} Cached data or null if not available/expired
 */
function getCachedChartData() {
  try {
    const cached = localStorage.getItem(CHART_CACHE_KEY);
    if (!cached) return null;

    const { gameResults, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age < CHART_CACHE_DURATION) {
      return gameResults;
    }
    return null;
  } catch (error) {
    console.error("Error reading chart cache:", error);
    return null;
  }
}

/**
 * Saves chart data to cache
 * @param {Array} gameResults - Array of game results to cache
 */
function setCachedChartData(gameResults) {
  try {
    const cache = {
      gameResults: gameResults,
      timestamp: Date.now(),
    };
    localStorage.setItem(CHART_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error("Error saving chart cache:", error);
  }
}

/**
 * Clears the chart data cache
 */
function invalidateChartCache() {
  localStorage.removeItem(CHART_CACHE_KEY);
}

// Make cache invalidation available globally
window.invalidateChartCache = invalidateChartCache;

const plotlyConfig = {
  displayModeBar: true,
  modeBarButtonsToRemove: [
    "pan2d",
    "select2d",
    "lasso2d",
    "autoScale2d",
    "hoverClosestCartesian",
    "hoverCompareCartesian",
    "toggleSpikelines",
  ],
  displaylogo: false,
  responsive: true,
};

/**
 * Creates a simple sparkline chart for mobile view
 */
function createMobileSparkline(containerId, data, color, label, value) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="mobile-metric-card">
      <div class="metric-header">
        <span class="metric-label" style="color: ${color};">${label}</span>
        <span class="metric-value" style="color: ${color};">${value}</span>
      </div>
      <canvas class="sparkline-canvas"></canvas>
    </div>
  `;

  const canvas = container.querySelector(".sparkline-canvas");
  const ctx = canvas.getContext("2d");

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = 60 * dpr;

  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = 60;
  const padding = 5;

  if (!data || data.length === 0) {
    ctx.fillStyle = "#565f89";
    ctx.font = "12px jetbrains-mono";
    ctx.textAlign = "center";
    ctx.fillText("No data", width / 2, height / 2);
    return;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const stepX = (width - padding * 2) / (data.length - 1 || 1);
  const stepY = (height - padding * 2) / range;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  data.forEach((val, i) => {
    const x = padding + i * stepX;
    const y = height - padding - (val - min) * stepY;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  ctx.fillStyle = color;
  data.forEach((val, i) => {
    const x = padding + i * stepX;
    const y = height - padding - (val - min) * stepY;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

const getBaseLayout = (title) => ({
  title: {
    text: title,
    font: {
      family: "jetbrains-mono, monospace",
      size: 18,
      color: "#7aa2f7",
    },
    x: 0.5,
  },
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
  font: {
    family: "jetbrains-mono, monospace",
    size: 12,
    color: "#c0caf5",
  },
  showlegend: true,
  legend: {
    orientation: "h",
    yanchor: "bottom",
    y: 1.02,
    xanchor: "center",
    x: 0.5,
    font: {
      family: "jetbrains-mono, monospace",
      size: 12,
      color: "#f2f2f2",
    },
  },
  margin: {
    l: 80,
    r: 60,
    t: 80,
    b: 60,
  },
  hovermode: "closest",
  hoverlabel: {
    bgcolor: "#1f2335",
    bordercolor: "#3b4261",
    font: {
      family: "jetbrains-mono, monospace",
      size: 12,
      color: "#c0caf5",
    },
  },
});

function displayScoreGraph() {
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    displayScoreGraphMobile();
    return;
  }

  let results = storageManager.getGameResults();

  const classicResults = results.filter(
    (result) =>
      result.mode === "Classic Mode" ||
      result.mode === "Custom Mode" ||
      result.mode === "Speedrunner Mode" ||
      result.mode === "Hard Mode" ||
      result.mode === "Practice Mode" ||
      result.mode === "Hardcore Mode" ||
      !result.mode,
  );

  const sortedResults = classicResults.sort(
    (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
  );
  const last15Results = sortedResults.slice(0, 15).reverse();

  if (last15Results.length === 0) {
    const layout = {
      ...getBaseLayout("Last 15 Classic Mode Games"),
      xaxis: {
        title: "",
        showgrid: false,
        zeroline: false,
        color: "#7aa2f7",
        showticklabels: false,
      },
      yaxis: {
        title: "",
        showgrid: false,
        zeroline: false,
        showticklabels: false,
        visible: false,
      },
      annotations: [
        {
          x: 0.5,
          y: 0.5,
          xref: "paper",
          yref: "paper",
          text: "No Classic Mode games found",
          showarrow: false,
          font: {
            family: "jetbrains-mono, monospace",
            size: 16,
            color: "#7aa2f7",
          },
        },
      ],
    };

    Plotly.newPlot("scoreChart", [], layout, plotlyConfig);
    return;
  }

  const gameNumbers = last15Results.map((_, index) => `Game ${index + 1}`);
  const scores = last15Results.map((result) => result.score || 0);
  const wpmScores = last15Results.map((result) => parseFloat(result.wpm) || 0);
  const accuracyScores = last15Results.map(
    (result) => parseFloat(result.accuracy) || 0,
  );

  const averageScore = scores.length
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;
  const averageWPM = wpmScores.length
    ? wpmScores.reduce((sum, wpm) => sum + wpm, 0) / wpmScores.length
    : 0;
  const averageAccuracy = accuracyScores.length
    ? accuracyScores.reduce((sum, acc) => sum + acc, 0) / accuracyScores.length
    : 0;

  const scoreTrace = {
    x: gameNumbers,
    y: scores,
    type: "scatter",
    mode: "lines+markers",
    name: "Score",
    line: {
      color: "#7aa2f7",
      width: 2,
      shape: "spline",
    },
    marker: {
      color: "#7aa2f7",
      size: 8,
    },
    yaxis: "y",
    hovertemplate:
      "<b>%{customdata[0]}</b><br>" +
      "Mode: %{customdata[1]}<br>" +
      "Date: %{customdata[2]}<br>" +
      "Score: %{y} points<br>" +
      "<extra></extra>",
    customdata: last15Results.map((result) => [
      result.username || "runner",
      (result.mode || "Classic Mode").replace(/ Mode$/, ""),
      result.date || "Unknown",
    ]),
  };

  const wpmTrace = {
    x: gameNumbers,
    y: wpmScores,
    type: "scatter",
    mode: "lines+markers",
    name: "WPM",
    line: {
      color: "#ff9e64",
      width: 2,
      shape: "spline",
    },
    marker: {
      color: "#ff9e64",
      size: 8,
    },
    yaxis: "y2",
    hovertemplate:
      "<b>%{customdata[0]}</b><br>" +
      "Mode: %{customdata[1]}<br>" +
      "Date: %{customdata[2]}<br>" +
      "WPM: %{y} words<br>" +
      "<extra></extra>",
    customdata: last15Results.map((result) => [
      result.username || "runner",
      (result.mode || "Classic Mode").replace(/ Mode$/, ""),
      result.date || "Unknown",
    ]),
  };

  const accuracyTrace = {
    x: gameNumbers,
    y: accuracyScores,
    type: "scatter",
    mode: "lines+markers",
    name: "Accuracy",
    line: {
      color: "#bb9af7",
      width: 2,
      shape: "spline",
    },
    marker: {
      color: "#bb9af7",
      size: 8,
    },
    yaxis: "y3",
    hovertemplate:
      "<b>%{customdata[0]}</b><br>" +
      "Mode: %{customdata[1]}<br>" +
      "Date: %{customdata[2]}<br>" +
      "Accuracy: %{y:.1f}%<br>" +
      "<extra></extra>",
    customdata: last15Results.map((result) => [
      result.username || "runner",
      (result.mode || "Classic Mode").replace(/ Mode$/, ""),
      result.date || "Unknown",
    ]),
  };

  const avgScoreLine = {
    x: gameNumbers,
    y: Array(gameNumbers.length).fill(averageScore),
    type: "scatter",
    mode: "lines",
    name: `Avg Score: ${averageScore.toFixed(0)}`,
    line: {
      color: "#7aa2f7",
      width: 2,
      shape: "spline",
    },
    yaxis: "y",
    showlegend: false,
    hoverinfo: "skip",
    connectgaps: true,
  };

  const avgWpmLine = {
    x: gameNumbers,
    y: Array(gameNumbers.length).fill(averageWPM),
    type: "scatter",
    mode: "lines",
    name: `Avg WPM: ${averageWPM.toFixed(0)}`,
    line: {
      color: "#ff9e64",
      width: 2,
      shape: "spline",
    },
    yaxis: "y2",
    showlegend: false,
    hoverinfo: "skip",
    connectgaps: true,
  };

  const avgAccuracyLine = {
    x: gameNumbers,
    y: Array(gameNumbers.length).fill(averageAccuracy),
    type: "scatter",
    mode: "lines",
    name: `Avg Accuracy: ${averageAccuracy.toFixed(1)}%`,
    line: {
      color: "#bb9af7",
      width: 2,
      shape: "spline",
    },
    yaxis: "y3",
    showlegend: false,
    hoverinfo: "skip",
    connectgaps: true,
  };

  const data = [scoreTrace, wpmTrace, accuracyTrace];

  const maxScore = scores.length > 0 ? Math.max(...scores) : 100;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const scoreRange = maxScore - minScore;
  const scoreTickSpacing = Math.max(25, Math.ceil(scoreRange / 6));

  const layout = {
    ...getBaseLayout("Last 15 Classic Mode Games"),
    xaxis: {
      title: "",
      showgrid: false,
      zeroline: false,
      showticklabels: false,
      range: [-0.5, 15.2],
    },
    yaxis: {
      title: {
        text: "Score",
        font: {
          color: "#7aa2f7",
        },
      },
      side: "left",
      showgrid: false,
      gridcolor: "#292e42",
      zeroline: false,
      color: "#7aa2f7",
      tickfont: {
        color: "#7aa2f7",
      },
    },
    yaxis2: {
      title: {
        text: "WPM",
        font: {
          color: "#ff9e64",
        },
      },
      overlaying: "y",
      side: "right",
      showgrid: false,
      zeroline: false,
      color: "#ff9e64",
      tickfont: {
        color: "#ff9e64",
      },
      showticklabels: true,
    },
    yaxis3: {
      title: {
        text: "Accuracy %",
        font: {
          color: "#bb9af7",
        },
      },
      overlaying: "y",
      side: "right",
      position: 0.95,
      showgrid: false,
      zeroline: false,
      color: "#bb9af7",
      tickfont: {
        color: "#bb9af7",
      },
      showticklabels: true,
    },
  };

  Plotly.newPlot("scoreChart", data, layout, plotlyConfig);
}

function displayScoreGraphMobile() {
  let results = storageManager.getGameResults();

  const classicResults = results.filter(
    (result) =>
      result.mode === "Classic Mode" ||
      result.mode === "Custom Mode" ||
      result.mode === "Speedrunner Mode" ||
      result.mode === "Hard Mode" ||
      result.mode === "Practice Mode" ||
      result.mode === "Hardcore Mode" ||
      !result.mode,
  );

  const sortedResults = classicResults.sort(
    (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
  );
  const last15Results = sortedResults.slice(0, 15).reverse();

  const scoreChart = document.getElementById("scoreChart");
  if (!scoreChart) return;

  if (last15Results.length === 0) {
    scoreChart.innerHTML = `
      <div class="mobile-charts-container">
        <div class="mobile-chart-title">Last 15 Classic Mode Games</div>
        <div class="no-data-message">No Classic Mode games found</div>
      </div>
    `;
    return;
  }

  const scores = last15Results.map((result) => result.score || 0);
  const wpmScores = last15Results.map((result) => parseFloat(result.wpm) || 0);
  const accuracyScores = last15Results.map(
    (result) => parseFloat(result.accuracy) || 0,
  );

  const avgScore = (
    scores.reduce((sum, s) => sum + s, 0) / scores.length
  ).toFixed(0);
  const avgWpm = (
    wpmScores.reduce((sum, w) => sum + w, 0) / wpmScores.length
  ).toFixed(0);
  const avgAccuracy = (
    accuracyScores.reduce((sum, a) => sum + a, 0) / accuracyScores.length
  ).toFixed(1);

  scoreChart.innerHTML = `
    <div class="mobile-charts-container">
      <div class="mobile-chart-title">Last 15 Classic Mode Games</div>
      <div id="mobile-score-metric"></div>
      <div id="mobile-wpm-metric"></div>
      <div id="mobile-accuracy-metric"></div>
    </div>
  `;

  requestAnimationFrame(() => {
    createMobileSparkline(
      "mobile-score-metric",
      scores,
      "#7aa2f7",
      "Score",
      `${avgScore} avg`,
    );
    createMobileSparkline(
      "mobile-wpm-metric",
      wpmScores,
      "#ff9e64",
      "WPM",
      `${avgWpm} avg`,
    );
    createMobileSparkline(
      "mobile-accuracy-metric",
      accuracyScores,
      "#bb9af7",
      "Accuracy",
      `${avgAccuracy}% avg`,
    );
  });
}

function displayZenModeGraph() {
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    displayZenModeGraphMobile();
    return;
  }

  let results = storageManager.getGameResults();

  if (!results || !Array.isArray(results)) {
    results = [];
  }

  const zenResults = results.filter(
    (result) =>
      result &&
      result.mode === "Zen Mode" &&
      result.wpm !== undefined &&
      result.accuracy !== undefined,
  );

  const sortedZenResults = zenResults.sort(
    (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
  );
  const last15ZenResults = sortedZenResults.slice(0, 15).reverse();

  if (last15ZenResults.length === 0) {
    const layout = {
      ...getBaseLayout("Last 15 Zen Mode Games"),
      xaxis: {
        title: "",
        showgrid: false,
        zeroline: false,
        color: "#7aa2f7",
        showticklabels: false,
      },
      yaxis: {
        title: "",
        showgrid: false,
        zeroline: false,
        showticklabels: false,
        visible: false,
      },
      yaxis2: {
        visible: false,
      },
      yaxis3: {
        visible: false,
      },
      annotations: [
        {
          x: 0.5,
          y: 0.5,
          xref: "paper",
          yref: "paper",
          text: "No Zen Mode games found",
          showarrow: false,
          font: {
            family: "jetbrains-mono, monospace",
            size: 16,
            color: "#7aa2f7",
          },
        },
      ],
    };

    Plotly.newPlot("zenChart", [], layout, plotlyConfig);
    return;
  }

  const gameNumbers = last15ZenResults.map((_, index) => `Game ${index + 1}`);

  const times = last15ZenResults.map((result) => {
    if (!result.totalTime) return 0;
    if (
      typeof result.totalTime === "string" &&
      result.totalTime.includes(":")
    ) {
      const [minutes, seconds] = result.totalTime.split(":").map(Number);
      return minutes * 60 + seconds;
    }
    return parseFloat(result.totalTime) || 0;
  });

  const wpmScores = last15ZenResults.map(
    (result) => parseFloat(result.wpm) || 0,
  );
  const accuracyScores = last15ZenResults.map(
    (result) => parseFloat(result.accuracy) || 0,
  );

  const averageTime = times.length
    ? times.reduce((sum, time) => sum + time, 0) / times.length
    : 0;
  const averageWPM = wpmScores.length
    ? wpmScores.reduce((sum, wpm) => sum + wpm, 0) / wpmScores.length
    : 0;
  const averageAccuracy = accuracyScores.length
    ? accuracyScores.reduce((sum, acc) => sum + acc, 0) / accuracyScores.length
    : 0;

  const timeTrace = {
    x: gameNumbers,
    y: times,
    type: "scatter",
    mode: "lines+markers",
    name: "Time",
    line: {
      color: "#c3e88d",
      width: 2,
      shape: "spline",
    },
    marker: {
      color: "#c3e88d",
      size: 8,
    },
    yaxis: "y",
    hovertemplate:
      "<b>%{customdata[0]}</b><br>" +
      "Mode: %{customdata[1]}<br>" +
      "Date: %{customdata[2]}<br>" +
      "Time: %{y} seconds<br>" +
      "<extra></extra>",
    customdata: last15ZenResults.map((result) => [
      result.username || "runner",
      (result.mode || "Zen Mode").replace(/ Mode$/, "") +
        (result.wordGoal ? ` [${result.wordGoal} words]` : ""),
      result.date || "Unknown",
    ]),
  };

  const wpmTrace = {
    x: gameNumbers,
    y: wpmScores,
    type: "scatter",
    mode: "lines+markers",
    name: "WPM",
    line: {
      color: "#ff9e64",
      width: 2,
      shape: "spline",
    },
    marker: {
      color: "#ff9e64",
      size: 8,
    },
    yaxis: "y2",
    hovertemplate:
      "<b>%{customdata[0]}</b><br>" +
      "Mode: %{customdata[1]}<br>" +
      "Date: %{customdata[2]}<br>" +
      "WPM: %{y} words<br>" +
      "<extra></extra>",
    customdata: last15ZenResults.map((result) => [
      result.username || "runner",
      (result.mode || "Zen Mode").replace(/ Mode$/, "") +
        (result.wordGoal ? ` [${result.wordGoal} words]` : ""),
      result.date || "Unknown",
    ]),
  };

  const accuracyTrace = {
    x: gameNumbers,
    y: accuracyScores,
    type: "scatter",
    mode: "lines+markers",
    name: "Accuracy",
    line: {
      color: "#bb9af7",
      width: 2,
      shape: "spline",
    },
    marker: {
      color: "#bb9af7",
      size: 8,
    },
    yaxis: "y3",
    hovertemplate:
      "<b>%{customdata[0]}</b><br>" +
      "Mode: %{customdata[1]}<br>" +
      "Date: %{customdata[2]}<br>" +
      "Accuracy: %{y:.1f}%<br>" +
      "<extra></extra>",
    customdata: last15ZenResults.map((result) => [
      result.username || "runner",
      (result.mode || "Zen Mode").replace(/ Mode$/, "") +
        (result.wordGoal ? ` [${result.wordGoal} words]` : ""),
      result.date || "Unknown",
    ]),
  };

  const avgTimeLine = {
    x: gameNumbers,
    y: Array(gameNumbers.length).fill(averageTime),
    type: "scatter",
    mode: "lines",
    name: `Avg Time: ${averageTime.toFixed(0)}s`,
    line: {
      color: "#c3e88d",
      width: 2,
      shape: "spline",
    },
    yaxis: "y",
    showlegend: false,
    hoverinfo: "skip",
    connectgaps: true,
  };

  const avgWpmLine = {
    x: gameNumbers,
    y: Array(gameNumbers.length).fill(averageWPM),
    type: "scatter",
    mode: "lines",
    name: `Avg WPM: ${averageWPM.toFixed(0)}`,
    line: {
      color: "#ff9e64",
      width: 2,
      shape: "spline",
    },
    yaxis: "y2",
    showlegend: false,
    hoverinfo: "skip",
    connectgaps: true,
  };

  const avgAccuracyLine = {
    x: gameNumbers,
    y: Array(gameNumbers.length).fill(averageAccuracy),
    type: "scatter",
    mode: "lines",
    name: `Avg Accuracy: ${averageAccuracy.toFixed(1)}%`,
    line: {
      color: "#bb9af7",
      width: 2,
      shape: "spline",
    },
    yaxis: "y3",
    showlegend: false,
    hoverinfo: "skip",
    connectgaps: true,
  };

  const data = [timeTrace, wpmTrace, accuracyTrace];

  const layout = {
    ...getBaseLayout("Last 15 Zen Mode Games"),
    xaxis: {
      title: "",
      showgrid: false,
      zeroline: false,
      showticklabels: false,
      range: [-0.5, 15.2],
    },
    yaxis: {
      title: {
        text: "Time (sec.)",
        font: {
          color: "#c3e88d",
        },
      },
      side: "left",
      showgrid: false,
      gridcolor: "#292e42",
      zeroline: false,
      color: "#c3e88d",
      tickfont: {
        color: "#c3e88d",
      },
    },
    yaxis2: {
      title: {
        text: "WPM",
        font: {
          color: "#ff9e64",
        },
      },
      overlaying: "y",
      side: "right",
      showgrid: false,
      zeroline: false,
      color: "#ff9e64",
      tickfont: {
        color: "#ff9e64",
      },
      showticklabels: true,
    },
    yaxis3: {
      title: {
        text: "Accuracy %",
        font: {
          color: "#bb9af7",
        },
      },
      overlaying: "y",
      side: "right",
      position: 0.95,
      showgrid: false,
      zeroline: false,
      color: "#bb9af7",
      tickfont: {
        color: "#bb9af7",
      },
      showticklabels: true,
    },
  };

  Plotly.newPlot("zenChart", data, layout, plotlyConfig);
}

function displayZenModeGraphMobile() {
  let results = storageManager.getGameResults();

  if (!results || !Array.isArray(results)) {
    results = [];
  }

  const zenResults = results.filter(
    (result) =>
      result &&
      result.mode === "Zen Mode" &&
      result.wpm !== undefined &&
      result.accuracy !== undefined,
  );

  const sortedZenResults = zenResults.sort(
    (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
  );
  const last15ZenResults = sortedZenResults.slice(0, 15).reverse();

  const zenChart = document.getElementById("zenChart");
  if (!zenChart) return;

  if (last15ZenResults.length === 0) {
    zenChart.innerHTML = `
      <div class="mobile-charts-container">
        <div class="mobile-chart-title">Last 15 Zen Mode Games</div>
        <div class="no-data-message">No Zen Mode games found</div>
      </div>
    `;
    return;
  }

  const times = last15ZenResults.map((result) => {
    if (!result.totalTime) return 0;
    if (
      typeof result.totalTime === "string" &&
      result.totalTime.includes(":")
    ) {
      const [minutes, seconds] = result.totalTime.split(":").map(Number);
      return minutes * 60 + seconds;
    }
    return parseFloat(result.totalTime) || 0;
  });

  const wpmScores = last15ZenResults.map(
    (result) => parseFloat(result.wpm) || 0,
  );
  const accuracyScores = last15ZenResults.map(
    (result) => parseFloat(result.accuracy) || 0,
  );

  const avgTime = (times.reduce((sum, t) => sum + t, 0) / times.length).toFixed(
    0,
  );
  const avgWpm = (
    wpmScores.reduce((sum, w) => sum + w, 0) / wpmScores.length
  ).toFixed(0);
  const avgAccuracy = (
    accuracyScores.reduce((sum, a) => sum + a, 0) / accuracyScores.length
  ).toFixed(1);

  zenChart.innerHTML = `
    <div class="mobile-charts-container">
      <div class="mobile-chart-title">Last 15 Zen Mode Games</div>
      <div id="mobile-zen-time-metric"></div>
      <div id="mobile-zen-wpm-metric"></div>
      <div id="mobile-zen-accuracy-metric"></div>
    </div>
  `;

  requestAnimationFrame(() => {
    createMobileSparkline(
      "mobile-zen-time-metric",
      times,
      "#c3e88d",
      "Time (sec)",
      `${avgTime}s avg`,
    );
    createMobileSparkline(
      "mobile-zen-wpm-metric",
      wpmScores,
      "#ff9e64",
      "WPM",
      `${avgWpm} avg`,
    );
    createMobileSparkline(
      "mobile-zen-accuracy-metric",
      accuracyScores,
      "#bb9af7",
      "Accuracy",
      `${avgAccuracy}% avg`,
    );
  });
}

let chartRefreshTimeout;
let isRefreshing = false;

window.refreshChartsWithLatestData =
  async function refreshChartsWithLatestData() {
    if (isRefreshing) {
      return;
    }

    isRefreshing = true;

    // Always load from localStorage first (includes latest games)
    const localData = storageManager.getGameResults() || [];
    if (localData.length > 0) {
      displayScoreGraph();
      displayZenModeGraph();

      // Initialize stats card with local data
      statsCard
        .refresh()
        .catch((err) => console.error("Stats card refresh error:", err));
    }

    let freshDataLoaded = false;

    try {
      if (
        window.canSyncScoreboardToFirebase &&
        window.canSyncScoreboardToFirebase()
      ) {
        const cloudData = await window.loadScoreboardFromFirebasePaginated(
          200,
          0,
        );

        if (cloudData && cloudData.scores && cloudData.scores.length > 0) {
          const localData = storageManager.getGameResults() || [];

          // Merge local and cloud data, prioritizing local games that haven't synced yet
          const mergedData = [...localData];
          const localTimestamps = new Set(localData.map((g) => g.timestamp));

          // Add cloud games that aren't already in local storage
          cloudData.scores.forEach((cloudGame) => {
            if (!localTimestamps.has(cloudGame.timestamp)) {
              mergedData.push(cloudGame);
            }
          });

          // Sort by timestamp descending and take the latest 200 games
          mergedData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          const latest200 = mergedData.slice(0, 200);

          storageManager.setTotalGameCount(cloudData.totalCount);
          storageManager.setGameResults(latest200);

          setCachedChartData(latest200);
          freshDataLoaded = true;
        } else if (cloudData && cloudData.length > 0) {
          const localData = storageManager.getGameResults() || [];

          // Merge local and cloud data, prioritizing local games that haven't synced yet
          const mergedData = [...localData];
          const localTimestamps = new Set(localData.map((g) => g.timestamp));

          // Add cloud games that aren't already in local storage
          cloudData.forEach((cloudGame) => {
            if (!localTimestamps.has(cloudGame.timestamp)) {
              mergedData.push(cloudGame);
            }
          });

          // Sort by timestamp descending and take the latest 200 games
          mergedData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          const latest200 = mergedData.slice(0, 200);

          storageManager.setGameResults(latest200);
          storageManager.setTotalGameCount(latest200.length);

          setCachedChartData(latest200);
          freshDataLoaded = true;
        } else {
        }
      } else {
      }
    } catch (error) {
      console.error("Error loading chart data:", error);
    }

    if (chartRefreshTimeout) {
      clearTimeout(chartRefreshTimeout);
    }

    chartRefreshTimeout = setTimeout(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Re-render if fresh Firebase data was loaded
      if (freshDataLoaded) {
        displayScoreGraph();
        displayZenModeGraph();
        // Refresh stats card with all fresh data from Firebase
        statsCard
          .forceRefresh()
          .catch((err) =>
            console.error("Stats card force refresh error:", err),
          );
      }

      chartRefreshTimeout = null;
      isRefreshing = false;
    }, 100);
  };

document.addEventListener("DOMContentLoaded", () => {
  const scoreChartEl = document.getElementById("scoreChart");
  const zenChartEl = document.getElementById("zenChart");

  // Check if we have cache, load immediately if yes
  const cached = getCachedChartData();
  if (cached) {
    // Load cached data instantly without delay
    refreshChartsWithLatestData();
  } else {
    // No cache, wait for Firebase to be ready before first fetch
    setTimeout(() => {
      refreshChartsWithLatestData();
    }, 500);
  }
});

// Listen for new game results and refresh charts immediately
window.addEventListener("gameResultSaved", async (event) => {
  // Invalidate cache to ensure fresh data is loaded
  invalidateChartCache();

  // Force refresh charts and stats with latest data
  if (typeof window.refreshChartsWithLatestData === "function") {
    await window.refreshChartsWithLatestData();
  }
});
