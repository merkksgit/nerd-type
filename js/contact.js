document.getElementById("contactForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const message = document.getElementById("message").value;
  let rating = "";
  // Get the selected rating
  const ratingInputs = document.querySelectorAll('input[name="rating"]');
  for (const input of ratingInputs) {
    if (input.checked) {
      rating = input.value;
      break;
    }
  }

  // Create form data
  const formData = new FormData();
  formData.append("entry.1645632144", name);
  formData.append("entry.1783052925", message);
  formData.append("entry.1410907249", rating);

  // Build the URL with parameters
  const url =
    "https://docs.google.com/forms/d/e/1FAIpQLSezNSfZryWqA3yX_PTI5NPfjfMBmJhQG2lIbhKwi16OfYGKqA/formResponse";

  // Use fetch to submit the form
  fetch(url, {
    method: "POST",
    mode: "no-cors",
    body: formData,
  })
    .then(() => {
      // Success handler
      document.getElementById("formSuccessMessage").style.display = "block";
      document.getElementById("formErrorMessage").style.display = "none";
      document.getElementById("contactForm").reset();
    })
    .catch((error) => {
      // Error handler
      document.getElementById("formErrorMessage").style.display = "block";
      document.getElementById("formSuccessMessage").style.display = "none";
      console.error("Submission error:", error);
    });
});
