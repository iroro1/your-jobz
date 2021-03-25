const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");

const userSchema = new mongoose.Schema({
    username: String,
    alias: String,
    password: String,
    phone: String,
    isAdmin: Boolean,
    isRoot: Boolean,
    token: String,
    expireToken: String,
    gender: String,
    highest_level_education: String,
    location: String,
    work_experience: Array,
    education: Array,
    dateJoined: Date,
    imgUrl: String
  });
  
  userSchema.plugin(passportLocalMongoose, {
    MissingPasswordError: "No password was given",
    IncorrectPasswordError: "No password was given",
    IncorrectUsernameError: "No password was given",
  });
  userSchema.plugin(findOrCreate);
  const User = mongoose.model("User", userSchema);

  module.exports = User