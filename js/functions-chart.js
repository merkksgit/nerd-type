function displayPreviousResults() {
  const resultsContainer = document.getElementById("previousResults");

  // Hae tulokset localStoragesta
  let results = JSON.parse(localStorage.getItem("gameResults")) || [];

  results.reverse();

  // Tyhjennä aiemmat tulokset
  resultsContainer.innerHTML = "";

  // Lisää jokainen tulos näkyviin
  results.forEach((result) => {
    const resultItem = document.createElement("li");
    resultItem.textContent = `${result.date} Score: ${result.timeLeft * 256}, WPM: ${result.wpm}`;
    resultsContainer.appendChild(resultItem);
  });
}

// Kutsutaan sivun latautuessa, jotta näytetään edelliset tulokset
document.addEventListener("DOMContentLoaded", displayPreviousResults);

document
  .getElementById("clearResultsBtn")
  .addEventListener("click", function () {
    // Clear results from localStorage
    localStorage.removeItem("gameResults");

    // Clear the displayed results from the page
    document.getElementById("previousResults").innerHTML = "";

    // Näytä mukautettu modaali
    const customAlertModal = new bootstrap.Modal(
      document.getElementById("customAlertModal"),
    );
    customAlertModal.show();
  });
