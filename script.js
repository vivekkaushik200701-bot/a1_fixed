
var applyButton = document.getElementById("apply-filters");
var resetButton = document.getElementById("reset-filters");

applyButton.addEventListener("click", filterAdventures);
resetButton.addEventListener("click", resetFilters);

function filterAdventures() {
    var locationFilter = document.getElementById("location").value;
    var budgetFilter = document.getElementById("budget").value;

    var cards = document.getElementsByClassName("card");
    var count = 0;

    for (var i = 0; i < cards.length; i++) {
        var location = cards[i].getAttribute("data-location");
        var budget = cards[i].getAttribute("data-budget");

        var locationMatch = locationFilter == "all" ||
                            locationFilter == location;

        var budgetMatch = budgetFilter == "all" ||
                          budgetFilter == budget;

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
