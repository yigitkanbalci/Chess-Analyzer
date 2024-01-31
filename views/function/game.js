// Source Code/views/function/game.js
const evalButton = document.getElementById('eval-button');
const suggestionContainer = document.getElementById('suggestion-box');

var ruyLopez = 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R';
var  config = {
    position: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R',
    draggable: true,
}

var board1 = Chessboard('board1', config);

const player1 = document.getElementById('player1-indicator');
const player2 = document.getElementById('player2-indicator');
var turn = 'p2';

if (turn === 'p2') {
    player1.style.display = 'none';
} else {
    player2.style.display = 'none';
}

evalButton.addEventListener('click', () => {
    console.log('here')
    window.electronAPI.sendAPIRequest().then(response => {
        suggestionContainer.innerHTML = 'Suggested ' + response;
    }).catch(error => {
        console.error(error);
    });
});


