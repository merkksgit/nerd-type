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

  // Create hidden form to submit to Google
  const googleForm = document.createElement("form");
  googleForm.method = "POST";
  googleForm.action =
    "https://docs.google.com/forms/d/e/1FAIpQLSezNSfZryWqA3yX_PTI5NPfjfMBmJhQG2lIbhKwi16OfYGKqA/formResponse";
  googleForm.target = "_blank";

  // Add name field (optional)
  const nameField = document.createElement("input");
  nameField.name = "entry.1645632144";
  nameField.value = name;

  // Add message field (required)
  const messageField = document.createElement("input");
  messageField.name = "entry.1783052925";
  messageField.value = message;

  // Add rating field (optional)
  const ratingField = document.createElement("input");
  ratingField.name = "entry.1410907249";
  ratingField.value = rating;

  googleForm.appendChild(nameField);
  googleForm.appendChild(messageField);
  googleForm.appendChild(ratingField);

  document.body.appendChild(googleForm);

  try {
    googleForm.submit();
    document.getElementById("formSuccessMessage").style.display = "block";
    document.getElementById("formErrorMessage").style.display = "none";
    document.getElementById("contactForm").reset();
  } catch (error) {
    document.getElementById("formErrorMessage").style.display = "block";
    document.getElementById("formSuccessMessage").style.display = "none";
  }

  document.body.removeChild(googleForm);
});
