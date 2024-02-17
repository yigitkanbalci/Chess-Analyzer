import { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from 'electron';

const db = await JSONFilePreset('db.json', { games: [] })

await db.read();

const dbOperations = {

    
  getGames: async () => {
    await db.read();
    return { success: true, message: 'Games fetched successfully', games: db.data.games };
  },

  addGame: async (game) => {
    db.data.games.push(game);
    await db.write();
    return { success: true, message: 'Game added to the database' };
  },

  getGame: async (id) => {
    await db.read();
    let game = db.data.games.find(game => game.id === id);
    return { success: true, message: 'Game found', game: game };
  },

  updateGame: async (id, gameUpdate) => {
    const game = db.data.games.find(game => game.id === id);
    if (game) {
      Object.assign(game, gameUpdate);
      await db.write();
    }
    return { success: true, message: 'Game updated' };
  },

  deleteGame: async (id) => {
    const index = db.data.games.findIndex(game => game.id === id);
    if (index !== -1) {
      db.data.games.splice(index, 1);
      await db.write();
    }
    return { success: true, message: 'Game successfully deleted' };
  }}

export default dbOperations;
