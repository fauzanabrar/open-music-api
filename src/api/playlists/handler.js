const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(
    playlistsService,
    playlistSongsService,
    playlistSongActivitiesService,
    songsService,
    validator,
  ) {
    this._validator = validator;
    this._playlistsService = playlistsService;
    this._playlistSongsService = playlistSongsService;
    this._playlistSongActivitiesService = playlistSongActivitiesService;
    this._songsService = songsService;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload);
    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    const playlistId = await this._playlistsService.addPlaylist({ name, owner: credentialId });

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });

    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;

    const [playlists, cache] = await this._playlistsService.getPlaylists(credentialId);

    const response = h.response({
      status: 'success',
      data: {
        playlists,
      },
    });

    if (cache) {
      response.header('X-Data-Source', 'cache');
    }
    return response;
  }

  async deletePlaylistByIdHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._playlistsService.verifyPlaylistOwner(id, credentialId);
    await this._playlistsService.deletePlaylistById(id);

    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async postSongToPlaylistByIdHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { id: playlistId } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);
    await this._songsService.verifySongId(songId);
    await this._playlistSongsService.addPlaylistSong({ playlistId, songId });
    await this._playlistSongActivitiesService.addActionActivities('add', playlistId, songId, credentialId);

    const response = h.response({
      status: 'success',
      message: 'PlaylistSong berhasil ditambahkan',
    });

    response.code(201);
    return response;
  }

  async getSongsInPlaylistByIdHandler(request, h) {
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);
    const [playlist, cachePlaylist] = await this._playlistsService.getPlaylistById(playlistId);
    const [songs, cacheSongs] = await this._playlistSongsService.getSongsInPlaylistById(playlistId);
    playlist.songs = songs;

    const response = h.response({
      status: 'success',
      data: {
        playlist,
      },
    });

    if (cachePlaylist || cacheSongs) {
      response.header('X-Data-Source', 'cache');
    }

    return response;
  }

  async deleteSongsInPlaylistByIdHandler(request) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { id: playlistId } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);
    await this._playlistSongsService.deleteSongsInPlaylist(playlistId, songId);
    await this._playlistSongActivitiesService.addActionActivities('delete', playlistId, songId, credentialId);

    return {
      status: 'success',
      message: 'PlaylistSong berhasil dihapus',
    };
  }

  async getActivitiesPlaylistByIdHandler(request, h) {
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);
    const [activities, cache] = await this._playlistSongActivitiesService.getActivities(playlistId);

    const response = h.response({
      status: 'success',
      data: {
        playlistId,
        activities,
      },
    });

    if (cache) {
      response.header('X-Data-Source', 'cache');
    }

    return response;
  }
}

module.exports = PlaylistsHandler;
