const mongoose = require('mongoose');
// Define a schema for storing videoId and thumbnailPath
const videoSchema = new mongoose.Schema({
  videoId: { type: String, unique: true },
  thumbnailPath: String,
});
// Create a model based on the schema
const Video = mongoose.model('Video', videoSchema);
module.exports = Video;