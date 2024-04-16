var activeGames = [];

async function loadGames() {
    try {
        const response = await window.ChessAPI.getGames();
        activeGames = response.games;
    } catch (error) {
        console.log(error);
    }
}

loadGames().then(() => {
    console.log(activeGames);
});

async function updateActiveGamesDisplay() {
    await loadGames();
    const gamesTable = document.getElementById('gamesTable');
    const noActiveGames = document.getElementById('active-games');
    
    if (activeGames.length > 0) {
        // Populate the table with active games
        activeGames.forEach(game => {
            const row = gamesTable.insertRow();
            let moves = game.moves;
            if (!game.gameOver) {
            row.innerHTML = `<td>${game.id}</td><td>${game.p1}</td><td>${game.p2}</td><td>${moves[moves.length - 1]}</td>`;

            row.addEventListener('click', () => {
                // Navigate to the game's page
                
                window.location.href = `game.html?gameId=${game.id}`;
            });
        }
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
const closeModalBtn = document.getElementById('closeModal');

startGameBtn.addEventListener('click', () => {
    showModal();
})

const modal = document.getElementById('playerModal');

function showModal() {
    modal.style.display = 'block';
}

function hideModal() {
    modal.style.display = 'none';
}

closeModalBtn.addEventListener('click', () => {
    hideModal();
})

const startButton = document.getElementById('startGame');

startButton.addEventListener('click', async () => {
    const player1Name = document.getElementById('player1Name').value.trim();
    const player2Name = document.getElementById('player2Name').value.trim();

    // Check if both player names are provided
    if (player1Name && player2Name) {
        // Names are provided, submit them for further processing
        await window.ChessAPI.startGame(player1Name, player2Name).then(response => {
            let game = response.game;
            window.location.href = `game.html?gameId=${game.id}`;
            console.log(window.location.href);
        }).catch(error => {
            console.log(error);
        });
    } else {
        // If not, alert the user or handle as appropriate
        alert("Please enter names for both players.");
    }
});

const errorModal = document.getElementById('errorModal');
const closeErrorModalBtn = document.getElementById('close-error-modal');
const modalTitle = document.getElementById('modal-error-title');
const modalText = document.getElementById('modal-error-text');
const validateFixBtn = document.getElementById('validateFix');

function handleErrorReceived(obj) {
    console.log(obj);
    modalTitle.innerText = obj.title;
    modalText.innerText = obj.text;
    showModal();
}

closeErrorModalBtn.addEventListener('click', () => {
    hideModal();
})

validateFixBtn.addEventListener('click', () => {
    // Validate if error is fixed on the UI side
    hideModal();
})

window.electronAPI.onErrorReceived(handleErrorReceived);
