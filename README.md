# open-music-api

This project is a submission for the Dicoding platform, aimed at creating a powerful and efficient CRUD Music API. It includes models for Albums, Songs, and Playlists, and utilizes Hapi.js for server-side functionality and PostgreSQL as the underlying database. The resulting API provides a seamless and intuitive experience for users seeking to manage and organize their music collections.

## Key Features

Here are the key features of open-music-api:

- CRUD functionality for managing albums, songs, and playlists
- Robust server-side functionality provided by Hapi.js
- PostgreSQL database for efficient data management
- Playlist: Users can create playlists and add songs to them. Playlists require authentication using Hapi/jwt, and users can add, edit, or delete songs from their playlists. Playlists can also be shared with other users for collaboration, but there can only be one owner per playlist.
- Cover URL for albums: Users can upload cover art for their albums and save it in the server. Server will save it in local storage using fileSystem.
- Email export: Users can export their playlists to their email using RabbitMQ to queue the email and another [consumer service](https://github.com/fauzanabrar/openmusic-queue-consumer) will consume the queue and send it to your mail with nodemailer.
- Redis cache: Complex SQL queries are cached using Redis for faster database access.

## Installation

To use Open Music API, you will need to have the following installed on your computer:

- Node.js
- PostgreSQL
- Redis
- RabbitMQ

Once you have these installed, follow these steps to get started:

1. Clone this repository: `git clone https://github.com/your-username/open-music-api.git`
2. Navigate to the project directory: `cd open-music-api`
3. Install the required packages: `npm install`
4. Create a PostgreSQL database named `musicsapp`
5. Rename the `.env.example` file to `.env`, and modify the configuration to match your system
6. Run the database migration and seeding: `npm run migrate && npm run seed`
7. Start the application: `npm run start`

## Usage

After installation, you can access the API through `http://<your-server-host>:<your-server-port>/`. 

Here are the available API routes:

### Albums

- `POST /albums`: Add a new album
- `GET /albums/{id}`: Get a specific album by ID
- `PUT /albums/{id}`: Update an existing album
- `DELETE /albums/{id}`: Delete an album by ID
- `POST /albums/{id}/covers`: Add a cover to album by ID
- `GET /albums/covers/{param*}`: Get all covers used in albums
- `POST /albums/{id}/likes`: Give like to album by ID
- `DELETE /albums/{id}/likes`: Delete like to album by ID
- `GET /albums/{id}/likes`: Get count of likes in album by ID

### Songs
- `POST /songs`: Add a new song
- `GET /songs`: Get a list of all songs
- `GET /songs/{id}`: Get a specific song by ID
- `PUT /songs/{id}`: Update an existing song
- `DELETE /songs/{id}`: Delete a song by ID

### Playlists
- `POST /playlists`: Add a new playlist
- `GET /playlists`: Get a list of all playlists
- `DELETE /playlists/{id}`: Delete a playlist by ID
- `POST /playlists/{id}/songs`: Add a song to playlist 
- `GET /playlists/{id}/songs`: Get list of all songs in  specific playlist by ID
- `DELETE /playlists/{id}/songs`: Remove a song in playlist 
- `GET /playlists/{id}/activities`: Get list of activities of playlist 

### Users
- `POST /users`: Register a new user
- `GET /users/{id}`: Get specified user by ID
- `GET /users`: Get list of all users

### Authentications
- `POST /authentications`: Login and get an access token
- `PUT /authentications`: Update access token
- `DELETE /authentications`: Delete access token

### Collaborations
- `POST /collaborations`: Add other user to collaborate in playlist
- `DELETE /collaborations`: Remove other user from collaboration in playlist

### Exports
- `POST /export/playlists/{playlistId}`: Export data playlist by playlist ID to email 

