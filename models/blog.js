const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
    title: String,
    content: String,
    estimatedReadTime: String,
    imgUrl: String,
    comments: Array,
    datePosted: Date,
    author: Object
  });
  
  const Blog = mongoose.model("Blog", blogSchema);

  module.exports = Blog