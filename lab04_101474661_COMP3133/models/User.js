const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validator.isEmail, "Invalid email address"]
  },
  city: {
    type: String,
    required: true,
    match: [/^[A-Za-z\s]+$/, "City must contain only alphabets and spaces"]
  },
  website: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return validator.isURL(v, {
          protocols: ["http", "https"],
          require_protocol: true
        });
      },
      message: "Invalid website URL"
    }
  },
  zipcode: {
    type: String,
    required: true,
    match: [/^\d{5}-\d{4}$/, "Zip code must be in 12345-1234 format"]
  },
  phone: {
    type: String,
    required: true,
    match: [/^1-\d{3}-\d{3}-\d{4}$/, "Phone must be 1-123-123-1234"]
  }
});

module.exports = mongoose.model("User", userSchema);
