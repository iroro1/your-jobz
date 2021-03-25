const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
    name: String,
    subject: String,
    email: String,
    phone: String,
    message:String,
    dateSent: Date,
    read: Boolean
  });
  
  const Contact = mongoose.model("Contact", contactSchema);

  module.exports = Contact