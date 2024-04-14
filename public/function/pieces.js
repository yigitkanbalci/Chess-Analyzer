class ChessPiece {
    constructor(type, color, id) {
        this.type = type; // e.g., 'P' for pawn, 'R' for rook
        this.color = color; // 'W' for white, 'B' for black
        this.eeprom_id = id;
        this.tile = null;
    }
}

class Tile {
    constructor(name, row, col) {
        this.tileName = name;
        this.row = row;
        this.col = col;
        this.piece = null; // Initially, no piece on the tile
    }

    setPiece(piece) {
        this.piece = piece;
    }

    clearPiece() {
        this.piece = null;
    }
}

