var contactForm = document.getElementById("contact-form");
var statusMessage = document.getElementById("form-status");
var messageCount = document.getElementById("message-count");
var messageInput = document.getElementById("message");
var submitButton = contactForm.querySelector('button[type="submit"]');

var formFields = [
    {
        name: "name",
        input: document.getElementById("name"),
        getValue: function () {
            return this.input.value.trim();
        },
        validate: function (value) {
            if (value.length < 2 || value.length > 50) {
                return "Name must be between 2 and 50 characters.";
            }
            return "";
        }
    },
    {
        name: "email",
        input: document.getElementById("email"),
        getValue: function () {
            return this.input.value.trim();
        },
        validate: function (value) {
            if (!value || !this.input.validity.valid) {
                return "Please enter a valid email address.";
            }
            return "";
        }
    },
    {
        name: "subject",
        input: document.getElementById("subject"),
        getValue: function () {
            return this.input.value;
        },
        validate: function (value) {
            if (!value) {
                return "Please choose a subject.";
            }
            return "";
        }
    },
    {
        name: "message",
        input: messageInput,
        getValue: function () {
            return this.input.value.trim();
        },
        validate: function (value) {
            if (value.length < 10 || value.length > 500) {
                return "Message must be between 10 and 500 characters.";
            }
            return "";
        }
    }
];

contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    clearStatus();

    if (!contactForm.reportValidity()) {
        return;
    }

    var submission = {};

    for (var index = 0; index < formFields.length; index++) {
        var field = formFields[index];
        var value = field.getValue();
        var errorMessage = field.validate(value);

        if (errorMessage) {
            showFormError(errorMessage, field.input);
            return;
        }

        submission[field.name] = value;
    }

    submitButton.disabled = true;
    try {
        var response = await fetch('/api/contact', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submission)
        });
        var responseBody = await response.text();
        var result;
        try {
            result = JSON.parse(responseBody);
        } catch (error) {
            throw new Error(
                "The contact endpoint returned a non-JSON response (HTTP " +
                response.status + "). Run npm start and open " +
                "http://localhost:3000/contact.html; Live Server and static hosting cannot save submissions."
            );
        }

        if (!response.ok) {
            throw new Error(result.error || "Your message could not be saved.");
        }

        statusMessage.textContent = "Thanks, " + submission.name +
            ". Your message was received.";
        contactForm.reset();
        updateMessageCount();
    } catch (error) {
        showFormError(error instanceof TypeError
            ? "Could not reach the contact server. Start it and try again."
            : error.message || "Your message could not be saved.", null);
    } finally {
        submitButton.disabled = false;
    }
});

for (var fieldIndex = 0; fieldIndex < formFields.length; fieldIndex++) {
    formFields[fieldIndex].input.addEventListener("input", clearStatus);
    formFields[fieldIndex].input.addEventListener("change", clearStatus);
}

messageInput.addEventListener("input", updateMessageCount);
updateMessageCount();

function updateMessageCount() {
    messageCount.textContent = messageInput.value.length + "/500 characters";
}

function clearStatus() {
    statusMessage.textContent = "";
    statusMessage.classList.remove("form-status--error");
}

function showFormError(message, input) {
    statusMessage.textContent = message;
    statusMessage.classList.add("form-status--error");

    if (input) {
        input.focus();
    }
}
