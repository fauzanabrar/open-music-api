const Joi = require('joi');

const SongPayloadSchema = Joi.object({
  title: Joi.string().max(50).required(),
  year: Joi.number().required(),
  genre: Joi.string().max(50).required(),
  performer: Joi.string().max(50).required(),
  duration: Joi.number().integer().min(0),
  albumId: Joi.string().max(50),
});

module.exports = { SongPayloadSchema };