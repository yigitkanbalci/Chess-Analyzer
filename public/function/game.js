
// Source Code/views/function/game.js
const evalButton = document.getElementById('eval-button');
const suggestionContainer = document.getElementById('suggestion-box');

var engine = new Worker('./stockfish-nnue-16.js');

engine.postMessage('uci'); // Initialize the UCI interface
engine.postMessage('isready'); // Check if the engine is ready
engine.postMessage('ucinewgame'); // Start a new game


var  config = {
    position: 'start',
    draggable: true,
    onDrop: onDrop,
    onDragStart: onDragStart,
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
    highlightSquare(move.from, move.color === 'w' ? 'white' : 'black', 'best');
    highlightSquare(move.to, move.color === 'w' ? 'white' : 'black', 'best');
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
        player1.style.display = 'inline';
        player2.style.display = 'none';
    } else {
        player2.style.display = 'inline';
        player1.style.display = 'none';
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
            updateBoardAndState(response);
        }
    }).catch(error => {
        board1.position(oldPos);
        clearHighlights();
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
    turn = response.turn;
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

