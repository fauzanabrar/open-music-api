const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class PlaylistSongsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addPlaylistSong({ playlistId, songId }) {
    const id = `playlistSong-${nanoid(16)}`;
    const created_at = new Date().toISOString();

    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, playlistId, songId, created_at, created_at],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('PlaylistSong gagal ditambahkan');
    }

    await this._cacheService.delete(`songs-playlistId:${playlistId}`);
  }

  async getSongsInPlaylistById(playlistId) {
    try {
      const result = await this._cacheService.get(`songs-playlistId:${playlistId}`);
      const songs = JSON.parse(result);

      return [songs, true];
    } catch (error) {
      const query = {
        text: `SELECT s.id, s.title, s.performer 
        FROM playlist_songs AS ps
        INNER JOIN songs AS s ON s.id = ps.song_id
        WHERE ps.playlist_id = $1`,
        values: [playlistId],
      };

      const result = await this._pool.query(query);
      const songs = result.rows;

      await this._cacheService.set(`songs-playlistId:${playlistId}`, JSON.stringify(songs));

      return [songs, false];
    }
  }

  async deleteSongsInPlaylist(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist song gagal dihapus. Playlist song tidak ditemukan');
    }

    await this._cacheService.delete(`songs-playlistId:${playlistId}`);
  }
}

module.exports = PlaylistSongsService;