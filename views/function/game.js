// Source Code/views/function/game.js
const evalButton = document.getElementById('eval-button');
const suggestionContainer = document.getElementById('suggestion-container');

var ruyLopez = 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R';
var board1 = Chessboard('board1', ruyLopez);


evalButton.addEventListener('click', () => {
    console.log('here')
    window.electronAPI.sendAPIRequest().then(response => {
        suggestionContainer.innerHTML = response;
    }).catch(error => {
        console.error(error);
    });
});
