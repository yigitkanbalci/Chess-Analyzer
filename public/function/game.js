
// Source Code/views/function/game.js
const evalButton = document.getElementById('eval-button');
const suggestionContainer = document.getElementById('suggestion-box');
const suggestionText = document.getElementById('suggestion-text')

var engine = new Worker('./stockfish-nnue-16.js');

engine.postMessage('uci'); // Initialize the UCI interface
engine.postMessage('isready'); // Check if the engine is ready
engine.postMessage('ucinewgame'); // Start a new game


var  config = {
    position: 'start',
    draggable: true,
    onDrop: onDrop,
    onDragStart: onDragStart,
    onChange: onChange,
}

const board1 = Chessboard('board1', config);
var squareClass = 'square-55d63'
var squareToHighlight = null
var colorToHighlight = null

const player1 = document.getElementById('player1-indicator');
const player2 = document.getElementById('player2-indicator');

const p1 = document.getElementById('p1-text');
const p2 = document.getElementById('p2-text');

var turn = 'w';
var gameOver = false;
player2.style.display = 'none';

function suggestMove(moveString) {
   window.ChessAPI.showMove(moveString).then(response => {
    console.log(response);
    var move = response.move;
    var resp = response.eval;
    if (move) {
        suggestionText.innerHTML = resp;
        clearHighlights();
        highlightSquare(move.from, move.color === 'w' ? 'white' : 'black', 'best');
        highlightSquare(move.to, move.color === 'w' ? 'white' : 'black', 'best');
        suggestionContainer.innerHTML = 'Suggested best move: ' + moveString;
    }
   }).catch(error => {
    console.log(error);
   });
};

function clearHighlights() {
    document.querySelectorAll('.' + squareClass).forEach(square => {
        square.classList.remove('highlight-white-legal', 'highlight-black-legal');
        square.classList.remove('highlight-white-best', 'highlight-black-best');
    });
}

function highlightSquare(square, color, mode) {
    const squareElement = document.querySelector('.square-' + square);
    if (squareElement) {
        squareElement.classList.add('highlight-' + color + '-' + mode);
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

function getSuggestion(pos) {
    return new Promise((resolve, reject) => {
        // Set up a temporary message handler to capture the best move
        const tempHandler = event => {
            if (event.data.startsWith('bestmove')) {
                var bestMove = event.data.split(' ')[1];
                engine.removeEventListener('message', tempHandler); // Clean up
                resolve(bestMove); // Resolve the promise with the best move
            }
        };

        engine.addEventListener('message', tempHandler);

        // Send position and start calculation
        engine.postMessage('ucinewgame');
        engine.postMessage(pos);
        
        engine.postMessage('go depth 15');
    });
}

evalButton.addEventListener('click', () => {
    window.ChessAPI.getState().then(response => {
        const searchStr = 'position fen ' + response.state;
        getSuggestion(searchStr).then(rec => {
            let moveString = rec.slice(0, 2) + '-' + rec.slice(2);
            suggestMove(moveString);
        });
    });
});

function onDrop(source, target, piece, newPos, oldPos, orientation) {
    let moveString = source.concat('-', target);
    window.ChessAPI.makeMove(moveString).then(response => {
        if (!response.success) {
            board1.position(oldPos);
            clearHighlights();
        } else {
            if (response.game.gameOver) {
                clearHighlights();
                suggestionContainer.innerHTML = 'Game Over! winner is ' + response.game.winner;
            }
            updateBoardAndState(response);
        }
    }).catch(error => {
        board1.position(oldPos);
        clearHighlights();
        if (error.gameOver) {
            suggestionContainer.innerHTML = 'Game Over! winner is ' + response.game.winner;
        }
    });
}

function updateBoardAndState(response) {
    let move = response.move;
    if (move.san === 'O-O') {
        if (response.turn === 'b') {
           board1.move('h8-f8'); 
        } else {
            board1.move('h1-f1');
        }
    } 

    if (move.san === 'O-O-O') {
        if (response.turn === 'b') {
            board1.move('a8-c8');
        } else {
            board1.move('a1-c1');
        }
    }
    turn = response.game.turn;
    changeTurn(turn);
    clearHighlights();
    board1.position(response.state, false);
}

function onDragStart(source, piece) {
    window.ChessAPI.legalMoves(source).then(response => {
        for (const move of response.moves) {
            highlightSquare(move.to, move.color === 'w' ? 'white' : 'black', 'legal')
        }
    }).catch(error => {
        clearHighlights();
        console.log(error);
    });
  }

  function getGameIdFromQuery() {
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get('gameId');
}

async function loadGameDetails() {
    const gameId = getGameIdFromQuery();
    if (!gameId) {
        console.error('Game ID is missing in the URL');
        return;
    }
    
    window.LowAPI.getGameById(gameId).then(response => {
        let game = response.game;
        turn = game.turn;
        board1.position(game.lastMove);
        gameOver = game.gameOver;
        displayGameDetails(game);
        if (gameOver) {
            suggestionContainer.innerHTML = 'Game Over! winner is ' + game.winner;
        }
    })
    
}

function displayGameDetails(game) {
    changeTurn(game.turn);
    p1.innerText = game.p1;
    p2.innerText = game.p2;
}

function onChange(oldPos, newPos) {
    if (!gameOver) {
        suggestionContainer.innerHTML = 'Suggested move';
        suggestionText.innerHTML = '';
    }
}

document.addEventListener('DOMContentLoaded', loadGameDetails);


