import { ipcMain } from "electron";

function writeToMCU(data, port) {
    try {
        port.write(data, function(err) {
            if (err) {
                return console.log('Error on write: ', err.message);
            }
            console.log('message written', data);
        });
    } catch {
        console.log("error writing to mcu");
    }

}

export const handlers = {
    sendMessage: (type, data, port) => {
        const header = Buffer.from([type]);  // Assuming 'type' is a single byte
        const body = Buffer.from(data, 'utf8');  // Convert string data to Buffer
        const message = Buffer.concat([header, body]);  // Concatenate header and body
        port.write(message, (err) => {
          if (err) {
            return console.log('Error on write:', err.message);
          }
          console.log('Message sent: ', message);
        });
    },
};

export const MessageTypes = {
    ERROR: 0x01,
    START_GAME: 0x02,
    MOVE_MADE: 0x03,
    LEGAL_MOVES: 0x04,
    SUGGESTED_MOVE: 0x05,
    END_GAME: 0x06,
    VALIDATE_POSITIONS: 0x07,
    LOAD_GAME: 0x08,
    RESET: 0x09,
};