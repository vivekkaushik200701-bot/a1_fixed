var contactForm = document.getElementById("contact-form");
var statusMessage = document.getElementById("form-status");
var messageCount = document.getElementById("message-count");
var messageInput = document.getElementById("message");

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

contactForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearStatus();

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

    submission.getConfirmation = function () {
        return "Thanks, " + this.name + ". Your message was saved on this device.";
    };

    var saveResult = saveSubmission(submission);
    if (!saveResult.success) {
        showFormError(saveResult.message, null);
        return;
    }

    statusMessage.textContent = submission.getConfirmation() +
        " It has not been sent to an inbox.";
    contactForm.reset();
    updateMessageCount();
});

for (var fieldIndex = 0; fieldIndex < formFields.length; fieldIndex++) {
    formFields[fieldIndex].input.addEventListener("input", clearStatus);
    formFields[fieldIndex].input.addEventListener("change", clearStatus);
}

messageInput.addEventListener("input", updateMessageCount);
updateMessageCount();

function saveSubmission(submission) {
    var savedSubmissions;

    try {
        var storedSubmissions = window.localStorage.getItem(
            "randomAdventureContactSubmissions"
        );
        savedSubmissions = storedSubmissions ? JSON.parse(storedSubmissions) : [];
    } catch (error) {
        return {
            success: false,
            message: "Saved messages could not be read from this browser."
        };
    }

    if (!Array.isArray(savedSubmissions)) {
        return {
            success: false,
            message: "Saved messages have an invalid format. Please clear the browser's saved contact data and try again."
        };
    }

    savedSubmissions.push({
        name: submission.name,
        email: submission.email,
        subject: submission.subject,
        message: submission.message
    });

    try {
        window.localStorage.setItem(
            "randomAdventureContactSubmissions",
            JSON.stringify(savedSubmissions)
        );
    } catch (error) {
        return {
            success: false,
            message: "Your message could not be saved in this browser."
        };
    }

    return { success: true, message: "" };
}

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
