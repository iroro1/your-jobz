const mongoose = require("mongoose");

const emailListSchema = new mongoose.Schema({
    email: String,
    datePosted: Date,
  });
  
  const EmailList = mongoose.model("EmailList", emailListSchema);

  module.exports = EmailList