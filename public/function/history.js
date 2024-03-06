async function loadGames() {
    try {
        const response = await window.ChessAPI.getGames();
        activeGames = response.games;
    } catch (error) {
        console.log(error);
    }
}
let activeGames = [];

async function updateActiveGamesDisplay() {
    await loadGames();
    const gamesTable = document.getElementById('gamesTable');
    const finishedGames = document.getElementById('active-games');
    
    if (activeGames.length > 0) {
        // Populate the table with active games
        activeGames.forEach(game => {
            const row = gamesTable.insertRow();
            let moves = game.moves;
            if (game.gameOver) {
            row.innerHTML = `<td>${game.id}</td><td>${game.p1}</td><td>${game.p2}</td><td>${moves[moves.length - 1]}</td>`;
            
            row.addEventListener('click', () => {
                // Navigate to the game's page
                
                window.location.href = `game.html?gameId=${game.id}`;
            });
        }
        });
        finishedGames.classList.add('hidden');
    } else {
        // Hide the table and show the message and button
        gamesTable.style.display = 'none';
        finishedGames.classList.remove('hidden');
    }
}

loadGames().then(() => {
})

document.addEventListener('DOMContentLoaded', updateActiveGamesDisplay);
