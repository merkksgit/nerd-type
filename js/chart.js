function displayScoreGraph() {
  // Fetch results from localStorage
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];
  // Extract dates, scores, and WPM from the results
  const dates = results.map((result) => result.date); // Dates that we will hide
  const scores = results.map((result) => result.timeLeft * 256); // Scores
  const wpmScores = results.map((result) => result.wpm); // WPM scores
  // Calculate the average score and average WPM
  const averageScore =
    scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const averageWPM =
    wpmScores.reduce((sum, wpm) => sum + wpm, 0) / wpmScores.length;
  // Get the canvas context
  const ctx = document.getElementById("scoreChart").getContext("2d");
  // Create the chart on the canvas
  new Chart(ctx, {
    type: "line", // Line chart
    data: {
      labels: dates, // X-axis
      datasets: [
        {
          label: "Score", // Label for the score dataset
          data: scores, // Y-axis: Scores
          borderColor: "#7aa2f7", // Line color
          backgroundColor: "rgba(122, 162, 247, 0.2)", // Line background fill color
          fill: false, // Fill area below the line
          yAxisID: "y",
        },
        {
          label: "WPM", // Label for the WPM dataset
          data: wpmScores, // Y-axis: WPM scores
          borderColor: "#ff9e64", // Line color for WPM
          backgroundColor: "rgba(255, 158, 100, 0.2)", // Line background fill color for WPM
          fill: false, // Fill area below the line
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true, // Make the chart responsive
      maintainAspectRatio: false, // Disable aspect ratio to allow CSS control
      plugins: {
        legend: {
          display: true, // Display legend to differentiate between Score and WPM
        },
      },
      scales: {
        x: {
          title: {
            display: true, // Display the X-axis title
            text: "Game History", // Title text
          },
          ticks: {
            display: false, // Hide the date labels
          },
          grid: {
            display: true, // Keep the grid lines visible if needed
            color: "#3b4261",
          },
        },
        y: {
          title: {
            display: true,
            text: "Score", // Y-axis title for Score
          },
          position: "left",
          grid: {
            color: "#414868",
          },
        },
        y1: {
          title: {
            display: true,
            text: "WPM", // Y-axis title for WPM
          },
          position: "right",
          grid: {
            drawOnChartArea: false, // Only want the grid lines for one axis to show up
            color: "#414868",
          },
        },
      },
    },
    plugins: [
      {
        beforeDraw: (chart) => {
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;

          // Draw average score line
          const yValue = chart.scales.y.getPixelForValue(averageScore);
          ctx.save();
          ctx.strokeStyle = "#7aa2f7";
          ctx.lineWidth = 2;
          ctx.setLineDash([9, 5]); // Set line style to dashed
          ctx.beginPath();
          ctx.moveTo(chartArea.left, yValue);
          ctx.lineTo(chartArea.right, yValue);
          ctx.stroke();
          ctx.restore();

          // Draw average score text
          ctx.fillStyle = "#414868";
          ctx.font = "12px Arial";
          ctx.fillText(
            `Avg Score: ${averageScore.toFixed(0)}`,
            chartArea.right - 120,
            yValue - 5,
          );

          // Draw average WPM line
          const y1Value = chart.scales.y1.getPixelForValue(averageWPM);
          ctx.save();
          ctx.strokeStyle = "#ff9e64";
          ctx.lineWidth = 2;
          ctx.setLineDash([9, 5]); // Set line style to dashed
          ctx.beginPath();
          ctx.moveTo(chartArea.left, y1Value);
          ctx.lineTo(chartArea.right, y1Value);
          ctx.stroke();
          ctx.restore();

          // Draw average WPM text
          ctx.fillStyle = "#414868";
          ctx.font = "12px Arial";
          ctx.fillText(
            `Avg WPM: ${averageWPM.toFixed(0)}`,
            chartArea.left + 10,
            y1Value - 5,
          );
        },
      },
    ],
  });
}

// Ensure the graph is loaded when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", displayScoreGraph);
