const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');

class AlbumLikesService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addLike(albumId, userId) {
    if (await this.verifyUserLike(albumId, userId)) {
      throw new InvariantError('userId sudah menyukai album ini!');
    }

    const id = `user_album_like-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('gagal menambahakn user album like');
    }

    await this._cacheService.delete(`album-like:${albumId}`);
  }

  async getLikes(albumId) {
    try {
      const result = await this._cacheService.get(`album-like:${albumId}`);
      return [parseInt(result), true];
    } catch (error) {
      const query = {
        text: 'SELECT COUNT(*) AS likes FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);
      const likes = parseInt(result.rows[0].likes);

      await this._cacheService.set(`album-like:${albumId}`, likes);

      return [likes, false];
    }
  }

  async deleteLike(albumId, userId) {
    if (!this.verifyUserLike(albumId, userId)) {
      throw new InvariantError('userId belum menyukai album ini!');
    }

    const query = {
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Gagal menghapus user album like');
    }

    await this._cacheService.delete(`album-like:${albumId}`);
  }

  async verifyUserLike(albumId, userId) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);

    return result.rowCount;
  }
}

module.exports = AlbumLikesService;