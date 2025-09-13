import storageManager from "./storage-manager.js";
import statsCard from "./stats-card.js";

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

function displayZenModeGraph() {
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

let chartRefreshTimeout;
let isRefreshing = false;

window.refreshChartsWithLatestData =
  async function refreshChartsWithLatestData() {
    if (isRefreshing) {
      return;
    }

    isRefreshing = true;
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
          const existingData = storageManager.getGameResults() || [];
          const existingZenGames = existingData.filter(
            (result) => result.mode === "Zen Mode",
          );
          const newZenGames = cloudData.scores.filter(
            (result) => result.mode === "Zen Mode",
          );

          if (existingZenGames.length > 0 && newZenGames.length === 0) {
          }

          storageManager.setTotalGameCount(cloudData.totalCount);

          storageManager.setGameResults(cloudData.scores);
        } else if (cloudData && cloudData.length > 0) {
          const existingData = storageManager.getGameResults() || [];
          const existingZenGames = existingData.filter(
            (result) => result.mode === "Zen Mode",
          );
          const newZenGames = cloudData.filter(
            (result) => result.mode === "Zen Mode",
          );

          storageManager.setGameResults(cloudData);
          storageManager.setTotalGameCount(cloudData.length);
        } else {
        }
      } else {
      }
    } catch (error) {}

    if (chartRefreshTimeout) {
      clearTimeout(chartRefreshTimeout);
    }

    chartRefreshTimeout = setTimeout(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));

      displayScoreGraph();
      displayZenModeGraph();
      await statsCard.refresh();
      chartRefreshTimeout = null;
      isRefreshing = false;
    }, 100);
  };

document.addEventListener("DOMContentLoaded", () => {
  const scoreChartEl = document.getElementById("scoreChart");
  const zenChartEl = document.getElementById("zenChart");

  setTimeout(() => {
    refreshChartsWithLatestData();
  }, 500);
});
