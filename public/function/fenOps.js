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



function parseFENAndCompare(fen1, fen2) {
    const chess1 = new Chess(fen1);
    const chess2 = new Chess(fen2);
  
    const differences = [];
  
    // Iterate over all squares on the board
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const file = String.fromCharCode('a'.charCodeAt(0) + j); // Convert 0-7 to a-h
        const rank = 8 - i; // Convert 0-7 to 8-1
        const square = `${file}${rank}`;
  
        const piece1 = chess1.get(square);
        const piece2 = chess2.get(square);
  
        // If there's a difference in pieces between the two positions, record it
        if ((piece1 === null && piece2 !== null) || 
            (piece1 !== null && piece2 === null) ||
            (piece1 && piece2 && (piece1.type !== piece2.type || piece1.color !== piece2.color))) {
          differences.push({ square, from: piece1, to: piece2 });
        }
      }
    }
  
    return differences;
  }
