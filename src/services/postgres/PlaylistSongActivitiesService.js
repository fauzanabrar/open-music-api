const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const NotFoundError = require('../../exceptions/NotFoundError');
const InvariantError = require('../../exceptions/InvariantError');

class PlaylistSongActivitiesService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async getActivities(playlistId) {
    try {
      const result = await this._cacheService.get(`activities:${playlistId}`);
      const activities = JSON.parse(result);

      return [activities, true];
    } catch (error) {
      const query = {
        text: `SELECT u.username, s.title, psa.action, psa.time
          FROM playlist_song_activities AS psa
          JOIN users AS u ON u.id = psa.user_id
          JOIN songs AS s ON s.id = psa.song_id
          JOIN playlists AS p ON p.id = $1
          ORDER BY psa.time`,
        values: [playlistId],
      };

      const result = await this._pool.query(query);

      if (!result.rowCount) {
        throw new NotFoundError('Activities tidak ditemukan');
      }

      const activities = result.rows;
      await this._cacheService.set(`activities:${playlistId}`, JSON.stringify(activities));

      return [activities, false];
    }
  }

  async addActivities(playlistId, songId) {
    const id = `playlistSongActivities-${nanoid(16)}`;
    const action = 'add';
    const time = new Date().toISOString();

    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, playlistId, songId, action, time],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('activities gagal ditambahkan');
    }

    await this._cacheService.delete(`activities:${playlistId}`);

    return result.rows[0].id;
  }

  async addActionActivities(action, playlistId, songId, userId) {
    const id = `playlistSongActivities-${nanoid(16)}`;
    const time = new Date().toISOString();

    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlistId, songId, userId, action, time],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('activities gagal ditambahkan');
    }

    await this._cacheService.delete(`activities:${playlistId}`);
  }
}

module.exports = PlaylistSongActivitiesService;