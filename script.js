
var cardsContainer = document.getElementById("adventure-cards");
var applyButton = document.getElementById("apply-filters");
var resetButton = document.getElementById("reset-filters");

if (cardsContainer && applyButton && resetButton) {
    applyButton.addEventListener("click", filterAdventures);
    resetButton.addEventListener("click", resetFilters);
    loadAdventures();
}

function loadAdventures() {
    fetch("adventures.json")
        .then(function (response) {
            if (!response.ok) {
                throw new Error("The adventure data could not be loaded.");
            }

            return response.json();
        })
        .then(function (adventures) {
            adventures.forEach(createAdventureCard);
            filterAdventures();
        })
        .catch(function (error) {
            console.error("Error loading adventures:", error);
            cardsContainer.textContent =
                "Unable to load adventures. Please try again later.";
        });
}

function createAdventureCard(adventure) {
    var card = document.createElement("div");
    card.className = "card";
    card.setAttribute("data-location", adventure.location);
    card.setAttribute("data-budget", adventure.budget);

    var image = document.createElement("img");
    image.src = adventure.image;
    image.alt = adventure.alt;
    card.appendChild(image);

    var content = document.createElement("div");
    content.className = "card-content";

    var heading = document.createElement("h3");
    heading.textContent = adventure.name;
    content.appendChild(heading);

    var categoryParagraph = document.createElement("p");
    var categoryLabel = document.createElement("b");
    categoryLabel.textContent = "Category:";
    categoryParagraph.appendChild(categoryLabel);
    categoryParagraph.appendChild(
        document.createTextNode(" " + adventure.category)
    );
    content.appendChild(categoryParagraph);

    var durationParagraph = document.createElement("p");
    var durationLabel = document.createElement("b");
    durationLabel.textContent = "Time:";
    durationParagraph.appendChild(durationLabel);
    durationParagraph.appendChild(
        document.createTextNode(" " + adventure.duration)
    );
    content.appendChild(durationParagraph);

    var priceParagraph = document.createElement("p");
    var priceLabel = document.createElement("b");
    priceLabel.textContent = "Budget:";
    priceParagraph.appendChild(priceLabel);
    priceParagraph.appendChild(
        document.createTextNode(" " + adventure.price)
    );
    content.appendChild(priceParagraph);

    var link = document.createElement("a");
    link.href = adventure.link;
    link.className = "small-button";
    link.textContent = "View Adventure";
    content.appendChild(link);

    card.appendChild(content);
    cardsContainer.appendChild(card);
}

function filterAdventures() {
    var locationFilter = document.getElementById("location").value;
    var budgetFilter = document.getElementById("budget").value;
    var cards = cardsContainer.getElementsByClassName("card");
    var count = 0;

    for (var i = 0; i < cards.length; i++) {
        var location = cards[i].getAttribute("data-location");
        var budget = cards[i].getAttribute("data-budget");

        var locationMatch = locationFilter === "all" ||
                            locationFilter === location;

        var budgetMatch = budgetFilter === "all" ||
                          budgetFilter === budget;

        if (locationMatch && budgetMatch) {
            cards[i].style.display = "";
            count++;
        } else {
            cards[i].style.display = "none";
        }
    }

    document.getElementById("filter-result").innerText =
        "Showing " + count + " of " + cards.length + " adventures.";
}

function resetFilters() {
    document.getElementById("location").value = "all";
    document.getElementById("budget").value = "all";

    filterAdventures();
}
