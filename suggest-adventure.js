var suggestionForm = document.getElementById("suggestion-form");
var statusMessage = document.getElementById("form-status");
var submitButton = document.getElementById("submit-suggestion");

suggestionForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    statusMessage.textContent = "";
    statusMessage.classList.remove("form-status--error");
    submitButton.disabled = true;

    var suggestion = {
        activity: document.getElementById("activity").value.trim(),
        category: document.getElementById("category").value,
        description: document.getElementById("description").value.trim(),
        duration: document.getElementById("duration").value.trim(),
        budget: document.getElementById("budget").value
    };

    try {
        var response = await fetch("/api/suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(suggestion)
        });
        var result;
        try {
            result = await response.json();
        } catch (error) {
            throw new Error("The suggestion server returned an invalid response.");
        }

        if (!response.ok) {
            throw new Error(result.error || "Your suggestion could not be saved.");
        }

        statusMessage.textContent = "Thanks! Your adventure suggestion has been saved.";
        suggestionForm.reset();
    } catch (error) {
        statusMessage.textContent = error instanceof TypeError
            ? "Could not reach the suggestion server. Start it and try again."
            : error.message || "Your suggestion could not be saved.";
        statusMessage.classList.add("form-status--error");
    } finally {
        submitButton.disabled = false;
    }
});
