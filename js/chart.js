// Chart
function calculateDifficultyMultiplier(settings) {
  try {
    // Reference values (classic mode settings)
    const refTimeLimit = 30;
    const refBonusTime = 3;
    const refInitialTime = 10;

    // Calculate difficulty factors
    const timeLimitFactor = refTimeLimit / Math.max(1, settings.timeLimit);
    const bonusTimeFactor = refBonusTime / Math.max(1, settings.bonusTime);
    const initialTimeFactor =
      refInitialTime / Math.max(1, settings.initialTime);

    // Combined multiplier
    const multiplier = Math.pow(
      timeLimitFactor * bonusTimeFactor * initialTimeFactor,
      1 / 3,
    );

    // Normalize to a range of 0.75 - 1.75
    // Classic mode would get a multiplier of 1.0
    return 0.75 + multiplier * 0.5;
  } catch (error) {
    console.error("Error calculating difficulty multiplier:", error);
    // Return default multiplier in case of error
    return 1.0;
  }
}

function calculateScore(timeLeft, wpm, accuracy, settings) {
  try {
    // Use max of 1 WPM to avoid division by zero
    const safeWPM = Math.max(1, wpm);
    const safeAccuracy = parseFloat(accuracy.replace("%", "")) / 100;

    // Calculate difficulty multiplier
    const difficultyMultiplier = calculateDifficultyMultiplier(settings);

    // Base score calculation: (WPM * 10) * (accuracy^2) * difficultyMultiplier
    const baseScore = Math.round(
      safeWPM * 10 * (safeAccuracy * safeAccuracy) * difficultyMultiplier,
    );

    // Energy bonus: Add a small bonus for remaining energy (timeLeft)
    // But cap it to prevent it from being the dominant factor
    const energyBonus = Math.min(timeLeft * 5, baseScore * 0.2); // Cap at 20% of base score

    // Final score (rounded to nearest integer)
    return Math.round(baseScore + energyBonus);
  } catch (error) {
    console.error("Error calculating score:", error);
    // Fallback to original scoring if an error occurs
    return timeLeft * 256;
  }
}

function enhanceChartVisuals() {
  Chart.defaults.color = "#7dcfff";
  Chart.defaults.borderColor = "#3b4261";
  Chart.defaults.plugins.tooltip.displayColors = false;

  // Tooltip appearance - fonts and colors
  Chart.defaults.font.family = "'jetbrains-mono', monospace";
  Chart.defaults.font.size = 12;
  Chart.defaults.font.weight = "normal";
  Chart.defaults.plugins.tooltip.backgroundColor = "#1f2335";
  Chart.defaults.plugins.tooltip.titleColor = "#7dcfff";
  Chart.defaults.plugins.tooltip.bodyColor = "#c0caf5";
  Chart.defaults.plugins.tooltip.borderColor = "#3b4261";
  Chart.defaults.plugins.tooltip.borderWidth = 2;
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 4;
  Chart.defaults.plugins.tooltip.boxPadding = 6;
  Chart.defaults.plugins.tooltip.titleFont = {
    family: "'jetbrains-mono', monospace",
    size: 14,
  };
  Chart.defaults.plugins.tooltip.bodyFont = {
    family: "'jetbrains-mono', monospace",
    size: 13,
  };

  // Make text colors match data colors
  Chart.defaults.plugins.tooltip.callbacks =
    Chart.defaults.plugins.tooltip.callbacks || {};
  Chart.defaults.plugins.tooltip.callbacks.labelTextColor = function (context) {
    return context.dataset.borderColor;
  };

  const scoreChartCanvas = document.getElementById("scoreChart");
  const zenChartCanvas = document.getElementById("zenChart");
}

document.addEventListener("DOMContentLoaded", function () {
  setTimeout(enhanceChartVisuals, 100);
});

function displayScoreGraph() {
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];

  // Filter only Classic Mode results
  const classicResults = results.filter(
    (result) =>
      result.mode === "Classic Mode" ||
      result.mode === "Custom Mode" ||
      result.mode === "Speedrunner Mode" ||
      result.mode === "Hard Mode" ||
      result.mode === "Practice Mode" ||
      !result.mode,
  );

  // If no classic results, don't display anything
  if (classicResults.length === 0) {
    const ctx = document.getElementById("scoreChart").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Score",
            data: [],
            borderColor: "#7aa2f7",
            backgroundColor: "rgba(122, 162, 247, 0.2)",
            fill: false,
            yAxisID: "y",
          },
          {
            label: "WPM",
            data: [],
            borderColor: "#ff9e64",
            backgroundColor: "rgba(255, 158, 100, 0.2)",
            fill: false,
            yAxisID: "y1",
          },
          {
            label: "Accuracy",
            data: [],
            borderColor: "#bb9af7",
            backgroundColor: "rgba(187, 154, 247, 0.2)",
            fill: false,
            yAxisID: "y2",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            onClick: function (e, legendItem, legend) {
              const index = legendItem.datasetIndex;
              const ci = legend.chart;

              if (ci.isDatasetVisible(index)) {
                ci.hide(index);
                legendItem.hidden = true;
              } else {
                ci.show(index);
                legendItem.hidden = false;
              }
            },
            labels: {
              usePointStyle: true,
              pointStyle: "rect",
              cursor: "pointer",
              color: "#f2f2f2",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 13,
                weight: "normal",
              },
            },
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: false,
              text: "Classic Mode History",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 14,
              },
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Score",
              color: "#7aa2f7",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 12,
              },
            },
            grid: {
              display: false,
              color: "#292e42",
            },
            ticks: {
              color: "#7aa2f7",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 12,
              },
            },
          },
          y1: {
            display: true,
            title: {
              display: true,
              text: "WPM",
              color: "#ff9e64",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 12,
              },
            },
            position: "right",
            ticks: {
              color: "#ff9e64",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 12,
              },
            },
          },
          y2: {
            display: true,
            title: {
              display: true,
              text: "Accuracy %",
              color: "#bb9af7",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 12,
              },
            },
            position: "right",
            grid: {
              display: false,
              color: "#292e42",
            },
            ticks: {
              color: "#bb9af7",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 12,
              },
            },
          },
        },
      },
    });
    return;
  }

  // Calculate scores and prepare data
  const dates = classicResults.map((result) => result.date);
  const scores = classicResults.map((result) => {
    if (result.score) return result.score;

    const resultSettings = {
      timeLimit: result.timeLimit || 30,
      bonusTime: result.bonusTime || 3,
      initialTime: result.initialTime || 10,
      goalPercentage: 100,
      currentMode: result.mode || "classic",
    };

    return calculateScore(
      result.timeLeft || 0,
      result.wpm || 0,
      result.accuracy || "0%",
      resultSettings,
    );
  });

  const wpmScores = classicResults.map((result) => result.wpm);
  const accuracyScores = classicResults.map(
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

  const ctx = document.getElementById("scoreChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: "Score",
          data: scores,
          borderColor: "#7aa2f7",
          backgroundColor: "rgba(122, 162, 247, 0.2)",
          fill: false,
          yAxisID: "y",
          borderWidth: 2,
        },
        {
          label: "WPM",
          data: wpmScores,
          borderColor: "#ff9e64",
          backgroundColor: "rgba(255, 158, 100, 0.2)",
          fill: false,
          yAxisID: "y1",
          borderWidth: 2,
        },
        {
          label: "Accuracy",
          data: accuracyScores,
          borderColor: "#bb9af7",
          backgroundColor: "rgba(187, 154, 247, 0.2)",
          fill: false,
          yAxisID: "y2",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          onClick: function (e, legendItem, legend) {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;

            if (ci.isDatasetVisible(index)) {
              ci.hide(index);
              legendItem.hidden = true;
            } else {
              ci.show(index);
              legendItem.hidden = false;
            }
          },
          labels: {
            usePointStyle: true,
            pointStyle: "rect",
            cursor: "pointer",
            color: "#f2f2f2",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 13,
              weight: "normal",
            },
          },
        },
        // ENHANCED TOOLTIP WITH GAME MODE
        tooltip: {
          callbacks: {
            afterTitle: function (context) {
              if (context && context.length > 0) {
                const dataIndex = context[0].dataIndex;
                const result = classicResults[dataIndex];
                let gameMode = result?.mode || "Classic Mode";
                // Remove "Mode" from the end if it exists
                gameMode = gameMode.replace(/ Mode$/, "");
                return `Mode: ${gameMode}`;
              }
              return "";
            },
            label: function (context) {
              const datasetLabel = context.dataset.label;
              const value = context.parsed.y;

              if (datasetLabel === "Score") {
                return `Score: ${Math.round(value)} points`;
              } else if (datasetLabel === "WPM") {
                return `WPM: ${Math.round(value)} words`;
              } else if (datasetLabel === "Accuracy") {
                return `Accuracy: ${value.toFixed(1)}%`;
              }
              return `${datasetLabel}: ${value}`;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: false,
            text: "Classic Mode History",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 12,
              weight: "bold",
            },
          },
          ticks: {
            display: false,
          },
          grid: {
            display: false,
            color: "#292e42",
          },
        },
        y: {
          title: {
            display: true,
            text: "Score",
            color: "#7aa2f7",
          },
          position: "left",
          grid: {
            color: "#292e42",
            display: false,
          },
          ticks: {
            color: "#7aa2f7",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 12,
            },
          },
        },
        y1: {
          title: {
            display: true,
            text: "WPM",
            color: "#ff9e64",
          },
          position: "right",
          grid: {
            display: false,
            color: "#292e42",
          },
          ticks: {
            color: "#ff9e64",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 12,
            },
          },
        },
        y2: {
          title: {
            display: true,
            text: "Accuracy %",
            color: "#bb9af7",
          },
          position: "right",
          grid: {
            display: false,
            color: "#292e42",
          },
          ticks: {
            color: "#bb9af7",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 12,
            },
          },
        },
      },
    },
    plugins: [
      {
        beforeDraw: (chart) => {
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;

          if (scores.length > 0) {
            const yValue = chart.scales.y.getPixelForValue(averageScore);
            ctx.save();
            ctx.strokeStyle = "#7aa2f7";
            ctx.lineWidth = 2;
            ctx.setLineDash([9, 3]);
            ctx.beginPath();
            ctx.moveTo(chartArea.left, yValue);
            ctx.lineTo(chartArea.right, yValue);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = "#7aa2f7";
            ctx.font = "12px 'jetbrains-mono', monospace";
            ctx.fillText(
              `Avg Score: ${averageScore.toFixed(0)}`,
              chartArea.left + 10,
              yValue - 5,
            );
          }

          if (wpmScores.length > 0) {
            const y1Value = chart.scales.y1.getPixelForValue(averageWPM);
            ctx.save();
            ctx.strokeStyle = "#ff9e64";
            ctx.lineWidth = 2;
            ctx.setLineDash([9, 3]);
            ctx.beginPath();
            ctx.moveTo(chartArea.left, y1Value);
            ctx.lineTo(chartArea.right, y1Value);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = "#ff9e64";
            ctx.font = "12px 'jetbrains-mono', monospace";
            ctx.fillText(
              `Avg WPM: ${averageWPM.toFixed(0)}`,
              chartArea.right - 120,
              y1Value - 5,
            );
          }

          if (accuracyScores.length > 0) {
            const y2Value = chart.scales.y2.getPixelForValue(averageAccuracy);
            ctx.save();
            ctx.strokeStyle = "#bb9af7";
            ctx.lineWidth = 2;
            ctx.setLineDash([9, 3]);
            ctx.beginPath();
            ctx.moveTo(chartArea.left, y2Value);
            ctx.lineTo(chartArea.right, y2Value);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = "#bb9af7";
            ctx.font = "12px 'jetbrains-mono', monospace";
            ctx.fillText(
              `Avg Accuracy: ${averageAccuracy.toFixed(1)}%`,
              chartArea.right - 150,
              y2Value - 5,
            );
          }
        },
      },
    ],
  });
}

function displayZenModeGraph() {
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];

  // Filter only Zen Mode results
  const zenResults = results.filter((result) => result.mode === "Zen Mode");

  // If no zen results, don't display anything
  if (zenResults.length === 0) {
    const ctx = document.getElementById("zenChart").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Time",
            data: [],
            borderColor: "#c3e88d",
            backgroundColor: "rgba(195, 232, 141, 0.2)",
            fill: false,
            yAxisID: "y",
          },
          {
            label: "WPM",
            data: [],
            borderColor: "#ff9e64",
            backgroundColor: "rgba(255, 158, 100, 0.2)",
            fill: false,
            yAxisID: "y1",
          },
          {
            label: "Accuracy",
            data: [],
            borderColor: "#bb9af7",
            backgroundColor: "rgba(187, 154, 247, 0.2)",
            fill: false,
            yAxisID: "y2",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            onClick: function (e, legendItem, legend) {
              const index = legendItem.datasetIndex;
              const ci = legend.chart;

              if (ci.isDatasetVisible(index)) {
                ci.hide(index);
                legendItem.hidden = true;
              } else {
                ci.show(index);
                legendItem.hidden = false;
              }
            },
            labels: {
              usePointStyle: true,
              pointStyle: "rect",
              cursor: "pointer",
              color: "#f2f2f2",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 13,
                weight: "normal",
              },
            },
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Time (sec.)",
              color: "#c3e88d",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 12,
              },
            },
            grid: {
              display: false,
              color: "#292e42",
            },
            ticks: {
              color: "#c3e88d",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 12,
              },
            },
          },
          y1: {
            display: true,
            title: {
              display: true,
              text: "WPM",
              color: "#ff9e64",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 12,
              },
            },
            position: "right",
            ticks: {
              color: "#ff9e64",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 12,
              },
            },
          },
          y2: {
            display: true,
            title: {
              display: true,
              text: "Accuracy %",
              color: "#bb9af7",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 12,
              },
            },
            position: "right",
            grid: {
              display: false,
              color: "#292e42",
            },
            ticks: {
              color: "#bb9af7",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 12,
              },
            },
          },
        },
      },
    });
    return;
  }

  const dates = zenResults.map((result) => result.date);
  const times = zenResults
    .map((result) => {
      if (!result.totalTime) return null;
      const [minutes, seconds] = result.totalTime.split(":").map(Number);
      return minutes * 60 + seconds;
    })
    .filter((time) => time !== null);

  const wpmScores = zenResults.map((result) => result.wpm);
  const accuracyScores = zenResults.map(
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

  const ctx = document.getElementById("zenChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: "Time",
          data: times,
          borderColor: "#c3e88d",
          backgroundColor: "rgba(195, 232, 141, 0.2)",
          fill: false,
          yAxisID: "y",
          borderWidth: 2,
        },
        {
          label: "WPM",
          data: wpmScores,
          borderColor: "#ff9e64",
          backgroundColor: "rgba(255, 158, 100, 0.2)",
          fill: false,
          yAxisID: "y1",
          borderWidth: 2,
        },
        {
          label: "Accuracy",
          data: accuracyScores,
          borderColor: "#bb9af7",
          backgroundColor: "rgba(187, 154, 247, 0.2)",
          fill: false,
          yAxisID: "y2",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          onClick: function (e, legendItem, legend) {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;

            if (ci.isDatasetVisible(index)) {
              ci.hide(index);
              legendItem.hidden = true;
            } else {
              ci.show(index);
              legendItem.hidden = false;
            }
          },
          labels: {
            usePointStyle: true,
            pointStyle: "rect",
            cursor: "pointer",
            color: "#f2f2f2",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 13,
              weight: "normal",
            },
          },
        },
        // ENHANCED TOOLTIP WITH GAME MODE FOR ZEN MODE
        tooltip: {
          callbacks: {
            afterTitle: function (context) {
              if (context && context.length > 0) {
                const dataIndex = context[0].dataIndex;
                const result = zenResults[dataIndex];
                let gameMode = result?.mode || "Zen Mode";
                // Remove "Mode" from the end if it exists
                gameMode = gameMode.replace(/ Mode$/, "");

                // Add word goal if available
                const wordGoal = result?.wordGoal || "";
                if (wordGoal) {
                  return `Mode: ${gameMode} [${wordGoal}]`;
                }
                return `Mode: ${gameMode}`;
              }
              return "";
            },
            label: function (context) {
              const datasetLabel = context.dataset.label;
              const value = context.parsed.y;

              if (datasetLabel === "Time") {
                const minutes = Math.floor(value / 60);
                const seconds = Math.round(value % 60);
                return `Time: ${minutes}:${seconds.toString().padStart(2, "0")}`;
              } else if (datasetLabel === "WPM") {
                return `WPM: ${Math.round(value)} words`;
              } else if (datasetLabel === "Accuracy") {
                return `Accuracy: ${value.toFixed(1)}%`;
              }
              return `${datasetLabel}: ${value}`;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: false,
            text: "Zen Mode History",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 12,
              weight: "bold",
            },
          },
          ticks: {
            display: false,
          },
          grid: {
            display: false,
            color: "#292e42",
          },
        },
        y: {
          title: {
            display: true,
            text: "Time (sec.)",
            color: "#c3e88d",
          },
          position: "left",
          grid: {
            color: "#292e42",
            display: false,
          },
          ticks: {
            color: "#c3e88d",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 12,
            },
          },
        },
        y1: {
          title: {
            display: true,
            text: "WPM",
            color: "#ff9e64",
          },
          position: "right",
          grid: {
            display: false,
            color: "#292e42",
          },
          ticks: {
            color: "#ff9e64",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 12,
            },
          },
        },
        y2: {
          title: {
            display: true,
            text: "Accuracy %",
            color: "#bb9af7",
          },
          position: "right",
          grid: {
            display: false,
            color: "#292e42",
          },
          ticks: {
            color: "#bb9af7",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 12,
            },
          },
        },
      },
    },
    plugins: [
      {
        beforeDraw: (chart) => {
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;

          if (times.length > 0) {
            const yValue = chart.scales.y.getPixelForValue(averageTime);
            ctx.save();
            ctx.strokeStyle = "#c3e88d";
            ctx.lineWidth = 2;
            ctx.setLineDash([9, 3]);
            ctx.beginPath();
            ctx.moveTo(chartArea.left, yValue);
            ctx.lineTo(chartArea.right, yValue);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = "#c3e88d";
            ctx.font = "12px 'jetbrains-mono', monospace";
            ctx.fillText(
              `Avg Time: ${averageTime.toFixed(0)}s`,
              chartArea.left + 10,
              yValue - 5,
            );
          }

          if (wpmScores.length > 0) {
            const y1Value = chart.scales.y1.getPixelForValue(averageWPM);
            ctx.save();
            ctx.strokeStyle = "#ff9e64";
            ctx.lineWidth = 2;
            ctx.setLineDash([9, 3]);
            ctx.beginPath();
            ctx.moveTo(chartArea.left, y1Value);
            ctx.lineTo(chartArea.right, y1Value);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = "#ff9e64";
            ctx.font = "12px 'jetbrains-mono', monospace";
            ctx.fillText(
              `Avg WPM: ${averageWPM.toFixed(0)}`,
              chartArea.right - 120,
              y1Value - 5,
            );
          }

          if (accuracyScores.length > 0) {
            const y2Value = chart.scales.y2.getPixelForValue(averageAccuracy);
            ctx.save();
            ctx.strokeStyle = "#bb9af7";
            ctx.lineWidth = 2;
            ctx.setLineDash([9, 3]);
            ctx.beginPath();
            ctx.moveTo(chartArea.left, y2Value);
            ctx.lineTo(chartArea.right, y2Value);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = "#bb9af7";
            ctx.font = "12px 'jetbrains-mono', monospace";
            ctx.fillText(
              `Avg Accuracy: ${averageAccuracy.toFixed(1)}%`,
              chartArea.right - 150,
              y2Value - 5,
            );
          }
        },
      },
    ],
  });
}

document.addEventListener("DOMContentLoaded", () => {
  displayScoreGraph();
  displayZenModeGraph();
});
