const randomAdventureButton = document.getElementById("random-adventure-button");
const randomAdventureResult = document.getElementById("random-adventure-result");

const adventures = [
    { name: "Go for a Walk", page: "adventure.html" },
    { name: "Movie Night", page: "adventure-movie.html" },
    { name: "Try a New Recipe", page: "adventure-cooking.html" },
    { name: "Go Cycling", page: "adventure-cycling.html" },
    { name: "Read a Book", page: "adventure-reading.html" },
    { name: "Photography Walk", page: "adventure-photography.html" },
    { name: "Visit a Cafe", page: "adventure-cafe.html" },
    { name: "Discover New Music", page: "adventure-music.html" },
    { name: "Hiking", page: "adventure-hiking.html" },
    { name: "Gaming Night", page: "adventure-gaming.html" },
    { name: "Picnic" },
    { name: "Meditation" },
    { name: "Stargazing" },
    { name: "Baking" },
    { name: "Badminton" },
    { name: "Journaling" }
];

randomAdventureButton.addEventListener("click", () => {
    const adventure = adventures[Math.floor(Math.random() * adventures.length)];

    if (adventure.page) {
        const link = document.createElement("a");
        link.href = adventure.page;
        link.textContent = adventure.name;
        randomAdventureResult.replaceChildren("How about: ", link, "?");
    } else {
        const activityName = document.createElement("span");
        activityName.className = "recommendation-name";
        activityName.textContent = adventure.name;
        randomAdventureResult.replaceChildren("How about: ", activityName, "?");
    }
});
