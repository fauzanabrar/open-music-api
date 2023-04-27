const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(collaborationsService, cacheService) {
    this._pool = new Pool();
    this._collaborationsService = collaborationsService;
    this._cacheService = cacheService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const created_at = new Date().toISOString();
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, owner, created_at, created_at],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    await this._cacheService.delete(`playlists:${owner}`);

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    try {
      const result = await this._cacheService.get(`playlists:${owner}`);
      const playlists = JSON.parse(result);

      return [playlists, true];
    } catch (error) {
      const query = {
        text: `SELECT p.id, p.name, u.username 
        FROM playlists AS p
        LEFT JOIN users AS u ON u.id = p.owner
        LEFT JOIN collaborations AS c ON c.playlist_id = p.id
        WHERE p.owner = $1 OR c.user_id = $1
        GROUP BY p.id, u.username`,
        values: [owner],
      };
      const result = await this._pool.query(query);
      const playlists = result.rows;

      await this._cacheService.set(`playlists:${owner}`, JSON.stringify(playlists));

      return [playlists, false];
    }
  }

  async getPlaylistById(id) {
    try {
      const result = await this._cacheService.get(`playlist:${id}`);
      const playlist = JSON.parse(result);
      return [playlist, true];
    } catch (error) {
      const query = {
        text: `SELECT p.id, p.name, u.username 
        FROM playlists AS p
        LEFT JOIN users AS u ON u.id = p.owner
        WHERE p.id = $1`,
        values: [id],
      };
      const result = await this._pool.query(query);
      const playlist = result.rows[0];

      await this._cacheService.set(`playlist:${id}`, JSON.stringify(playlist));

      return [playlist, false];
    }
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id, owner',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
    const { owner } = result.rows[0];

    await this._cacheService.delete(`playlists:${owner}`);
    await this._cacheService.delete(`playlist:${id}`);
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT owner FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses playlist ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        await this._collaborationsService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;