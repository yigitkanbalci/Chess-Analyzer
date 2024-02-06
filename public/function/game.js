
// Source Code/views/function/game.js
const evalButton = document.getElementById('eval-button');
const suggestionContainer = document.getElementById('suggestion-box');

var ruyLopez = 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R';
var  config = {
    position: 'start',
    draggable: true,
    onDrop: onDrop,
}

const board1 = Chessboard('board1', config);
var squareClass = 'square-55d63'
var squareToHighlight = null
var colorToHighlight = null

const player1 = document.getElementById('player1-indicator');
const player2 = document.getElementById('player2-indicator');
var turn = 'w';
player2.style.display = 'none';

function suggestMove(moveString) {
   window.ChessAPI.showMove(moveString).then(response => {
    var move = response.move
    clearHighlights();
    highlightSquare(move.from, move.color === 'w' ? 'white' : 'black');
    highlightSquare(move.to, move.color === 'w' ? 'white' : 'black');
   }).catch(error => {
    console.log(error);
   });
};

function clearHighlights() {
    document.querySelectorAll('.' + squareClass).forEach(square => {
        square.classList.remove('highlight-white', 'highlight-black');
    });
}

function highlightSquare(square, color) {
    const squareElement = document.querySelector('.square-' + square);
    if (squareElement) {
        squareElement.classList.add('highlight-' + color);
    }
}


function changeTurn(turn) {
    if (turn === 'b') {
        player1.style.display = 'none';
        player2.style.display = 'inline';
    } else {
        player2.style.display = 'none';
        player1.style.display = 'inline';
    }
}

evalButton.addEventListener('click', () => {
    window.electronAPI.sendAPIRequest().then(response => {
        console.log(response);
        suggestionContainer.innerHTML = 'Suggested ' + response.data;
        respArr = response.data.split(' ');
        let chars = [...respArr[1]];
        chars.splice(2, 0, '-'); 
        let moveString = chars.join('');
        suggestMove(moveString);
    }).catch(error => {
        console.error(error);
    });
});

function onDrop (source, target, piece, newPos, oldPos, orientation) {
    let moveString = source.concat('-', target);
    console.log(moveString);
    window.ChessAPI.makeMove(moveString).then(response => {
        turn = response.turn;
        changeTurn(turn);
        clearHighlights();
        console.log(response.state);
    }).catch(error => {
        console.log(error);
    });
  }
