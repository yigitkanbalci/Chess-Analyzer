
const evalButton = document.getElementById('eval-button');
const suggestionBox = document.getElementById('suggestion-box');
const suggestionText = document.getElementById('suggestion-text')
const suggestionContainer = document.getElementById('suggestion-container');
const historyContainer = document.getElementById('history-container');
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
var cachedResponse = {
    moveString: null,
    move: null,
    resp: null
}

const player1 = document.getElementById('player1-indicator');
const player2 = document.getElementById('player2-indicator');

const p1 = document.getElementById('p1-text');
const p2 = document.getElementById('p2-text');

var turn = 'w';
var gameOver = false;
player2.style.display = 'none';

function suggestMove(moveString) {
    const start = performance.now();
   window.ChessAPI.showMove(moveString).then(response => {
    console.log(response);
    var move = response.move;
    var resp = response.eval;
    if (move) {
       cachedResponse.moveString = moveString;
        cachedResponse.move = move;
        cachedResponse.resp = resp;
    }
    const end = performance.now();
    console.log(`Time taken to execute suggestMove function: ${end - start}ms.`)
   }).catch(error => {
    console.log(error);
   });
};

function displayBestMove(moveString, move, resp) {
    suggestionText.innerText = resp;
    clearHighlights();
    highlightSquare(move.from, move.color === 'w' ? 'white' : 'black', 'best');
    highlightSquare(move.to, move.color === 'w' ? 'white' : 'black', 'best');
    suggestionBox.innerHTML = 'Suggested best move: ' + moveString;
}

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

function getSuggestion() {
    window.ChessAPI.getState().then(response => {
        const searchStr = 'position fen ' + response.state;
        runEngine(searchStr).then(rec => {
            let moveString = rec.slice(0, 2) + '-' + rec.slice(2);
            suggestMove(moveString);
        });
    });
}

function runEngine(pos) {
    
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
    displayBestMove(cachedResponse.moveString, cachedResponse.move, cachedResponse.resp);
});

function handleTileReceived(obj) {
    console.log('Tile received', obj.tile);
    window.ChessAPI.legalMoves(obj.tile).then(response => {
        console.log(response)
        for (const move of response.moves) {
            highlightSquare(move.to, move.color === 'w' ? 'white' : 'black', 'legal')
        }
    }).catch(error => {
        clearHighlights();
        console.log(error);
    });

    getSuggestion();
}

function handleMoveReceived(obj) {
    let moveString = obj.move.toLowerCase()
    window.ChessAPI.makeMove(moveString).then(response => {
        if (!response.success) {
            board1.position(oldPos);
            clearHighlights();
        } else {
            if (response.game.gameOver) {
                clearHighlights();
                suggestionBox.innerHTML = 'Game Over! winner is'+ response.game.winner;
                window.ChessAPI.endGame();
            }
            updateBoardAndState(response);
            clearHighlights();
        }
    }).catch(error => {
        board1.position(oldPos);
        clearHighlights();
        if (error.gameOver) {
            suggestionBox.innerHTML = 'Game Over! winner is'+ error.game.winner;
        }
    })
}

window.electronAPI.onClearTiles(clearHighlights);
window.electronAPI.onTileReceived(handleTileReceived);
window.electronAPI.onMoveReceived(handleMoveReceived);

function resetBoard ()  {
    board1.position('start');
}

function onDrop(source, target, piece, newPos, oldPos, orientation) {
    let moveString = source.concat('-', target);
    window.ChessAPI.makeMove(moveString).then(response => {
        if (!response.success) {
            board1.position(oldPos);
            clearHighlights();
        } else {
            if (response.game.gameOver) {
                clearHighlights();
                suggestionBox.innerHTML = 'Game Over! winner is ' + response.game.winner;
            }
            updateBoardAndState(response);
        }
    }).catch(error => {
        board1.position(oldPos);
        clearHighlights();
        if (error.gameOver) {
            suggestionBox.innerHTML = 'Game Over! winner is ' + response.game.winner;
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

function onDragStart(source) {
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

const historyTable = document.getElementById('move-history-table');

async function loadGameDetails() {
    const gameId = getGameIdFromQuery();
    if (!gameId) {
        console.error('Game ID is missing in the URL');
        return;
    }
    
    window.LowAPI.getGameById(gameId).then(response => {
        let game = response.game;
        turn = game.turn;
        gameOver = game.gameOver;
        displayGameDetails(game);
        if (gameOver) {
            board1.position('start');
            suggestionBox.innerHTML = 'Game Over! winner is ' + game.winner;
            suggestionContainer.style.display = 'none';
            historyContainer.style.display = 'inline';
            player1.style.display = 'none';
            player2.style.display = 'none';
            addMoves(game);
        } else {
            historyContainer.style.display = 'none';
            board1.position(game.lastMove);
        }
    })
    
}

function addCardToTableCell(rowIndex, content, color, fen) {
    if (!historyTable) return; // Exit if table isn't found

    const row = historyTable.rows[rowIndex]; // Access the specific row
    if (!row) return; // Exit if row isn't found

    // Create the card div
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("move-card"); // Add a 'card' class for styling
    console.log(content);
    cardDiv.innerHTML = '# ' + rowIndex + ' | ' + 'From: ' + content.from + ' - ' + 'To: ' + content.to + ' | ' + 'Turn: ' + color; // Set the content inside the card
    cardDiv.classList.add('card-divs');
    cardDiv.addEventListener('click', () => {
        board1.position(fen);
        clearHighlights();
        highlightSquare(content.from, color === 'w' ? 'white' : 'black', 'best');
        highlightSquare(content.to, color === 'w' ? 'white' : 'black', 'best');
    });
    // Clear previous contents of the cell and add the new card
    row.innerHTML = "";
    row.appendChild(cardDiv);
}

function addMoves(game) {  
    let moves = game.moves; [0, 0, 0]
    for (let i = 1; i < moves.length; i++) {
        let j = i - 1;
        let move0 = moves[j];
        let move1 = moves[i];
        //console.log(move0)
        const row = historyTable.insertRow();
        let BoardState0 = parseFEN(move0);
        let BoardState1 = parseFEN(move1);

        let res = compareStates(BoardState0, BoardState1);
        console.log(res);
        addCardToTableCell(i, res, BoardState0.gameState.activeColor, move1);
        //row.innerHTML =
    }
}

const moveHistCont = document.getElementById('move-history-container');

function displayMoveHistory(game) {
    moveHistCont.style.display = 'inline';
}

function parseFEN(fen) {
    const sections = fen.split(' ');
    const boardFEN = sections[0];
    const activeColor = sections[1];
    const castlingAvailability = sections[2];
    const enPassantTargetSquare = sections[3];
    const halfmoveClock = parseInt(sections[4], 10);
    const fullmoveNumber = parseInt(sections[5], 10);

    const board = [];

    boardFEN.split('/').forEach((row, rowIndex) => {
        board[rowIndex] = [];
        let columnIndex = 0;

        for (const char of row) {
            if (isNaN(char)) {
                board[rowIndex][columnIndex] = char;
                columnIndex++;
            } else {
                for (let i = 0; i < parseInt(char, 10); i++) {
                    board[rowIndex][columnIndex] = null; // Represent empty squares with null
                    columnIndex++;
                }
            }
        }
    });

    return {
        board: board,
        gameState: {
            activeColor: activeColor,
            castlingAvailability: castlingAvailability,
            enPassantTargetSquare: enPassantTargetSquare === '-' ? null : enPassantTargetSquare,
            halfmoveClock: halfmoveClock,
            fullmoveNumber: fullmoveNumber,
        },
    };
}

function displayGameDetails(game) {
    changeTurn(game.turn);
    p1.innerText = game.p1;
    p2.innerText = game.p2;
}

function onChange(oldPos, newPos) {
    if (!gameOver) {
        suggestionBox.innerHTML = 'Suggested move';
        suggestionText.innerHTML = '';
    }
}

document.addEventListener('DOMContentLoaded', loadGameDetails);


boardMap = {
    A1: {index: [7, 0]}, B1: {index: [7, 1]}, C1: {index: [7, 2]}, D1: {index: [7, 3]}, 
    E1: {index: [7, 4]}, F1: {index: [7, 5]}, G1: {index: [7, 6]}, H1: {index: [7, 7]},
    A2: {index: [6, 0]}, B2: {index: [6, 1]}, C2: {index: [6, 2]}, D2: {index: [6, 3]},
    E2: {index: [6, 4]}, F2: {index: [6, 5]}, G2: {index: [6, 6]}, H2: {index: [6, 7]},
    A3: {index: [5, 0]}, B3: {index: [5, 1]}, C3: {index: [5, 2]}, D3: {index: [5, 3]},
    E3: {index: [5, 4]}, F3: {index: [5, 5]}, G3: {index: [5, 6]}, H3: {index: [5, 7]},
    A4: {index: [4, 0]}, B4: {index: [4, 1]}, C4: {index: [4, 2]}, D4: {index: [4, 3]},
    E4: {index: [4, 4]}, F4: {index: [4, 5]}, G4: {index: [4, 6]}, H4: {index: [4, 7]},
    A5: {index: [3, 0]}, B5: {index: [3, 1]}, C5: {index: [3, 2]}, D5: {index: [3, 3]},
    E5: {index: [3, 4]}, F5: {index: [3, 5]}, G5: {index: [3, 6]}, H5: {index: [3, 7]},
    A6: {index: [2, 0]}, B6: {index: [2, 1]}, C6: {index: [2, 2]}, D6: {index: [2, 3]},
    E6: {index: [2, 4]}, F6: {index: [2, 5]}, G6: {index: [2, 6]}, H6: {index: [2, 7]},
    A7: {index: [1, 0]}, B7: {index: [1, 1]}, C7: {index: [1, 2]}, D7: {index: [1, 3]},
    E7: {index: [1, 4]}, F7: {index: [1, 5]}, G7: {index: [1, 6]}, H7: {index: [1, 7]},
    A8: {index: [0, 0]}, B8: {index: [0, 1]}, C8: {index: [0, 2]}, D8: {index: [0, 3]},
}

function getIndexToSquareMap(boardMap) {
    const indexToSquareMap = {};
    for (const [square, data] of Object.entries(boardMap)) {
        const key = `${data.index[0]},${data.index[1]}`; // Create a string key like "7,0" for easier matching
        indexToSquareMap[key] = square;
    }
    return indexToSquareMap;
}

const indexToSquare = getIndexToSquareMap(boardMap);

function findMoveFromIndexes(fromIndex, toIndex) {
    const fromSquare = indexToSquare[`${fromIndex.i},${fromIndex.j}`];
    const toSquare = indexToSquare[`${toIndex.i},${toIndex.j}`];

    return { from: fromSquare, to: toSquare };
}

function compareStates (state1, state2) {
    let before = state1.board;
    let after = state2.board;
    let from = null;
    let to = null;

    // Loop through each row and column of the board
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            // Check if a piece moved from this position
            if (before[i][j] !== null && (after[i][j] === null || after[i][j] !== before[i][j])) {
                from = { i, j };
            }
            // Check if a piece moved to this position
            if (after[i][j] !== null && (before[i][j] === null || after[i][j] !== before[i][j])) {
                to = { i, j };
            }
        }
    }

    // Return the move if both from and to positions are found
    if (from && to) {
        return findMoveFromIndexes(from, to);
    } else {
        return null; // No move found or the boards are identical
    }
}

const modal = document.getElementById('errorModal');
const closeModalBtn = document.getElementById('close-error-modal');
const modalTitle = document.getElementById('modal-error-title');
const modalText = document.getElementById('modal-error-text');
const backHomeBtn = document.getElementById('backHome');

function showModal() {
    modal.style.display = 'block';
}

function hideModal() {
    modal.style.display = 'none';
}

function handleErrorReceived(obj) {
    console.log(obj);
    modalTitle.innerText = obj.title;
    modalText.innerText = obj.text;
    showModal();
}

closeModalBtn.addEventListener('click', () => {
    hideModal();
})

backHomeBtn.addEventListener('click', () => {
    // Validate if error is fixed on the UI side
    //hideModal();
    window.location.href = 'home.html';
})

window.electronAPI.onErrorReceived(handleErrorReceived);