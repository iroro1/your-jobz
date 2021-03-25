const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
    datePosted: Date,
    deadline: Date,
    logoUrl: String,
    imgUrl: String,
    company: String,
    salary: String,
    yearsOfExp: String,
    typeOfJob: String,
    category: String,
    applyLink: String,
    location: String,
    content: String,
    title: String,
  });
  
  const Job = mongoose.model("Job", jobSchema);

  module.exports = Job