const activeGames = [
    // Add your game objects here
];

// Function to check for active games and update the UI
function updateActiveGamesDisplay() {
    const gamesTable = document.getElementById('gamesTable');
    const noActiveGames = document.getElementById('active-games');
    
    if (activeGames.length > 0) {
        // Populate the table with active games
        activeGames.forEach(game => {
            const row = gamesTable.insertRow();
            row.innerHTML = `<td>${game.id}</td><td>${game.player1}</td><td>${game.player2}</td><td>${game.lastmove}</td>`;

            row.addEventListener('click', () => {
                // Navigate to the game's page
                window.location.href = 'game.html'
            });
        });
        noActiveGames.classList.add('hidden');
    } else {
        // Hide the table and show the message and button
        gamesTable.style.display = 'none';
        noActiveGames.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', updateActiveGamesDisplay);


const startGameBtn = document.getElementById('start-game-btn');

startGameBtn.addEventListener('click', () => {
    showModal();
})

const modal = document.getElementById('playerModal');

function showModal() {
    modal.style.display = 'block';
}

const startButton = document.getElementById('startGame');

startButton.addEventListener('click', () => {
    const player1Name = document.getElementById('player1Name').value.trim();
    const player2Name = document.getElementById('player2Name').value.trim();

    // Check if both player names are provided
    if (player1Name && player2Name) {
        // Names are provided, submit them for further processing
        window.ChessAPI.startGame(player1Name, player2Name);
        window.location.href = 'game.html';
    } else {
        // If not, alert the user or handle as appropriate
        alert("Please enter names for both players.");
    }
});
