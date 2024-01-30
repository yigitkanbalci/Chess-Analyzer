const activeGames = [{"id": "1", "player1": "Mahmut", "player2": "Hasan", "lastmove": "Nf3",}, 
                    {"id": "2", "player1": "Dave", "player2": "Mahmut", "lastmove": "Bg6"},
                    {"id": "3", "player1": "James", "player2": "Atakan", "lastmove": "Bg7"} 
    // Add your game objects here
];

// Function to check for active games and update the UI
function updateActiveGamesDisplay() {
    const gamesTable = document.getElementById('gamesTable');
    const noActiveGames = document.getElementById('noActiveGames');
    
    if (activeGames.length > 0) {
        // Populate the table with active games
        activeGames.forEach(game => {
            const row = gamesTable.insertRow();
            row.innerHTML = `<td>${game.id}</td><td>${game.player1}</td><td>${game.player2}</td><td>${game.lastmove}</td>`;

            row.addEventListener('click', () => {
                // Navigate to the game's page
                // Assuming you have a URL pattern like '/game/{gameId}'
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
