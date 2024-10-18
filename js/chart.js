function displayScoreGraph() {
  // Fetch results from localStorage
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];

  // Extract dates and scores from the results
  const dates = results.map((result) => result.date); // Dates that we will hide
  const scores = results.map((result) => result.timeLeft * 256); // Scores

  // Get the canvas context
  const ctx = document.getElementById("scoreChart").getContext("2d");

  // Create the chart on the canvas
  new Chart(ctx, {
    type: "line", // Line chart
    data: {
      labels: dates, // X-axis: Dates (we will hide these)
      datasets: [
        {
          label: "Score Progress", // Label for the dataset
          data: scores, // Y-axis: Scores
          borderColor: "#7aa2f7", // Line color
          backgroundColor: "rgba(122, 162, 247, 0.2)", // Line background fill color
          fill: true, // Fill area below the line
        },
      ],
    },
    options: {
      responsive: true, // Make the chart responsive
      maintainAspectRatio: false, // Disable aspect ratio to allow CSS control
      scales: {
        x: {
          title: {
            display: true, // Display the X-axis title
            text: "Date", // Title text
          },
          ticks: {
            display: false, // Hide the date labels
          },
          grid: {
            display: false, // Keep the grid lines visible if needed
          },
        },
        y: {
          title: {
            display: true,
            text: "Score", // Y-axis title
          },
        },
      },
    },
  });
}
// Hae nykyiset tulokset localStoragesta
let results = JSON.parse(localStorage.getItem("gameResults")) || [];

// Ensure the graph is loaded when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", displayScoreGraph);
