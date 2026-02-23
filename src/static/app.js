document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // clear dropdown as well (avoid duplicate options)
      activitySelect.innerHTML = "<option value=\"\">-- Select an activity --</option>";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants list HTML
        let participantsHTML = "";
        if (details.participants && details.participants.length > 0) {
          participantsHTML = `<div class="participants">
              <strong>Participants:</strong>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    p =>
                      `<li>${p} <span class="remove-participant" data-activity="${name}" data-email="${p}" title="Remove">✖</span></li>`
                  )
                  .join("")}
              </ul>
            </div>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = `snackbar success show`;
        signupForm.reset();
        fetchActivities(); // refresh activity data after signup
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = `snackbar error show`;
      }

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.className = "snackbar"; // reset
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "snackbar error show";
      console.error("Error signing up:", error);
      setTimeout(() => {
        messageDiv.className = "snackbar";
      }, 5000);
    }
  });

  // unregister handler (delegated)
  activitiesList.addEventListener("click", async (e) => {
    if (e.target.classList.contains("remove-participant")) {
      const activity = e.target.dataset.activity;
      const email = e.target.dataset.email;
      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
          { method: "POST" }
        );
        const result = await response.json();
        if (response.ok) {
          messageDiv.textContent = result.message;
          messageDiv.className = "snackbar success show";
          fetchActivities(); // refresh list
        } else {
          messageDiv.textContent = result.detail || "Failed to remove participant";
          messageDiv.className = "snackbar error show";
        }
        setTimeout(() => {
          messageDiv.className = "snackbar";
        }, 5000);
      } catch (error) {
        console.error("Error removing participant:", error);
        messageDiv.textContent = "Failed to remove participant. Please try again.";
        messageDiv.className = "snackbar error show";
        setTimeout(() => {
          messageDiv.className = "snackbar";
        }, 5000);
      }
    }
  });

  // Initialize app
  fetchActivities();
});
