// Import storage manager
import storageManager from './storage-manager.js';

function enhanceChartVisuals() {
  // Enhanced fonts and colors
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
  Chart.defaults.plugins.tooltip.displayColors = false;

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
  let results = storageManager.getGameResults();

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

  // Sort by timestamp (newest first) and take first 15, then reverse for timeline
  const sortedResults = classicResults.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const last15Results = sortedResults.slice(0, 15).reverse();

  // Destroy existing chart if it exists
  const canvas = document.getElementById("scoreChart");
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }

  // If no classic results, don't display anything
  if (last15Results.length === 0) {
    const ctx = canvas.getContext("2d");
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
          title: {
            display: true,
            text: "Last 15 Classic Mode Games",
            color: "#7dcfff",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 16,
              weight: "bold",
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          },
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
                size: 11,
              },
              callback: function (value) {
                return Math.round(value);
              },
            },
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            title: {
              display: true,
              text: "WPM",
              color: "#ff9e64",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 12,
              },
            },
            grid: {
              display: false,
              drawOnChartArea: false,
            },
            ticks: {
              color: "#ff9e64",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 11,
              },
              callback: function (value) {
                return Math.round(value);
              },
            },
          },
          y2: {
            type: "linear",
            display: true,
            position: "right",
            title: {
              display: true,
              text: "Accuracy %",
              color: "#bb9af7",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 12,
              },
              callback: function (value) {
                return Math.round(value);
              },
            },
            grid: {
              display: false,
              drawOnChartArea: false,
            },
            ticks: {
              color: "#bb9af7",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 11,
              },
              callback: function (value) {
                return Math.round(value);
              },
            },
          },
        },
      },
    });
    return;
  }

  // Extract data from last 15 results
  const dates = last15Results.map((result, index) => {
    return `Game ${index + 1}`;
  });

  const scores = last15Results.map((result) => result.score || 0);
  const wpmScores = last15Results.map((result) => parseFloat(result.wpm) || 0);
  const accuracyScores = last15Results.map(
    (result) => parseFloat(result.accuracy) || 0,
  );

  // Calculate averages
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
        title: {
          display: true,
          text: "Last 15 Classic Mode Games",
          color: "#7dcfff",
          font: {
            family: "'jetbrains-mono', monospace",
            size: 16,
            weight: "bold",
          },
          padding: {
            top: 10,
            bottom: 20,
          },
        },
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
        // ENHANCED TOOLTIP WITH USERNAME AND GAME MODE
        tooltip: {
          callbacks: {
            title: function (context) {
              if (context && context.length > 0) {
                const dataIndex = context[0].dataIndex;
                const result = last15Results[dataIndex];
                const username = result?.username || "runner";
                return username;
              }
              return "";
            },
            beforeBody: function (context) {
              if (context && context.length > 0) {
                const dataIndex = context[0].dataIndex;
                const result = last15Results[dataIndex];
                const date = result?.date || "Unknown";
                return date;
              }
              return "";
            },
            afterTitle: function (context) {
              if (context && context.length > 0) {
                const dataIndex = context[0].dataIndex;
                const result = last15Results[dataIndex];
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
              size: 11,
            },
            callback: function (value) {
              return Math.round(value);
            },
          },
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          title: {
            display: true,
            text: "WPM",
            color: "#ff9e64",
          },
          grid: {
            display: false,
            drawOnChartArea: false,
          },
          ticks: {
            color: "#ff9e64",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 11,
            },
            callback: function (value) {
              return Math.round(value);
            },
          },
        },
        y2: {
          type: "linear",
          display: true,
          position: "right",
          title: {
            display: true,
            text: "Accuracy %",
            color: "#bb9af7",
          },
          grid: {
            display: false,
            drawOnChartArea: false,
          },
          ticks: {
            color: "#bb9af7",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 11,
            },
            callback: function (value) {
              return Math.round(value);
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
  let results = storageManager.getGameResults();

  // Filter only Zen Mode results
  const zenResults = results.filter((result) => result.mode === "Zen Mode");

  // Sort by timestamp (newest first) and take first 15, then reverse for timeline
  const sortedZenResults = zenResults.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const last15ZenResults = sortedZenResults.slice(0, 15).reverse();

  // Destroy existing chart if it exists
  const canvas = document.getElementById("zenChart");
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }

  // If no zen results, don't display anything
  if (last15ZenResults.length === 0) {
    const ctx = canvas.getContext("2d");
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
          title: {
            display: true,
            text: "Last 15 Zen Mode Games",
            color: "#7dcfff",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 16,
              weight: "bold",
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          },
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
              text: "Zen Mode History",
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
                size: 11,
              },
              callback: function (value) {
                return Math.round(value);
              },
            },
          },
          y1: {
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
            grid: {
              display: false,
              color: "#292e42",
            },
            ticks: {
              color: "#ff9e64",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 11,
              },
              callback: function (value) {
                return Math.round(value);
              },
            },
          },
          y2: {
            type: "linear",
            display: true,
            position: "right",
            title: {
              display: true,
              text: "Accuracy %",
              color: "#bb9af7",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 12,
              },
              callback: function (value) {
                return Math.round(value);
              },
            },
            grid: {
              display: false,
              drawOnChartArea: false,
            },
            ticks: {
              color: "#bb9af7",
              font: {
                family: "'jetbrains-mono', monospace",
                size: 11,
              },
              callback: function (value) {
                return Math.round(value);
              },
            },
          },
        },
      },
    });
    return;
  }

  // Extract data from last 15 zen results
  const dates = last15ZenResults.map((result, index) => {
    return `Game ${index + 1}`;
  });

  const times = last15ZenResults.map((result) => {
    if (!result.totalTime) return 0;
    // Handle time format "m:ss" and convert to seconds
    if (
      typeof result.totalTime === "string" &&
      result.totalTime.includes(":")
    ) {
      const [minutes, seconds] = result.totalTime.split(":").map(Number);
      return minutes * 60 + seconds;
    }
    // If it's already a number, use it directly
    return parseFloat(result.totalTime) || 0;
  });
  const wpmScores = last15ZenResults.map(
    (result) => parseFloat(result.wpm) || 0,
  );
  const accuracyScores = last15ZenResults.map(
    (result) => parseFloat(result.accuracy) || 0,
  );

  // Calculate averages
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
        title: {
          display: true,
          text: "Last 15 Zen Mode Games",
          color: "#7dcfff",
          font: {
            family: "'jetbrains-mono', monospace",
            size: 16,
            weight: "bold",
          },
          padding: {
            top: 10,
            bottom: 20,
          },
        },
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
        // ENHANCED TOOLTIP WITH USERNAME AND GAME MODE FOR ZEN MODE
        tooltip: {
          callbacks: {
            title: function (context) {
              if (context && context.length > 0) {
                const dataIndex = context[0].dataIndex;
                const result = last15ZenResults[dataIndex];
                const username = result?.username || "runner";
                return username;
              }
              return "";
            },
            beforeBody: function (context) {
              if (context && context.length > 0) {
                const dataIndex = context[0].dataIndex;
                const result = last15ZenResults[dataIndex];
                const date = result?.date || "Unknown";
                return date;
              }
              return "";
            },
            afterTitle: function (context) {
              if (context && context.length > 0) {
                const dataIndex = context[0].dataIndex;
                const result = last15ZenResults[dataIndex];
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
            callback: function (value) {
              return Math.round(value);
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
            callback: function (value) {
              return Math.round(value);
            },
          },
        },
        y2: {
          type: "linear",
          display: true,
          position: "right",
          title: {
            display: true,
            text: "Accuracy %",
            color: "#bb9af7",
          },
          grid: {
            display: false,
            drawOnChartArea: false,
          },
          ticks: {
            color: "#bb9af7",
            font: {
              family: "'jetbrains-mono', monospace",
              size: 12,
            },
            callback: function (value) {
              return Math.round(value);
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

let chartRefreshTimeout;

window.refreshChartsWithLatestData = async function refreshChartsWithLatestData() {
  try {
    // Check if user is logged in and can sync from Firebase
    if (window.canSyncScoreboardToFirebase && window.canSyncScoreboardToFirebase()) {
      // Load fresh data from Firebase
      const cloudData = await window.loadScoreboardFromFirebase();
      
      if (cloudData && cloudData.scores && cloudData.scores.length > 0) {
        // Store total count separately before updating localStorage
        storageManager.setTotalGameCount(cloudData.totalCount);
        
        // Update localStorage with fresh data
        storageManager.setGameResults(cloudData.scores);
      } else if (cloudData && cloudData.length > 0) {
        // Fallback for old format (if function returns array directly)
        storageManager.setGameResults(cloudData);
        storageManager.setTotalGameCount(cloudData.length);
      }
    } else {
      // User is logged out - ensure we're using guest data
    }
  } catch (error) {
    console.error("❌ Failed to refresh chart data:", error);
  }
  
  // Clear any pending refresh to prevent duplicate renders
  if (chartRefreshTimeout) {
    clearTimeout(chartRefreshTimeout);
  }
  
  // Wait a moment for localStorage to be fully updated, then display charts
  chartRefreshTimeout = setTimeout(() => {
    displayScoreGraph();
    displayZenModeGraph();
    chartRefreshTimeout = null;
  }, 100);
}

document.addEventListener("DOMContentLoaded", () => {
  // Small delay to ensure Firebase is initialized
  setTimeout(() => {
    refreshChartsWithLatestData();
  }, 500);
});
