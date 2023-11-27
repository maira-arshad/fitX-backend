const mongoose = require("mongoose");
const signUpSchema = mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    email: {
      type: String,
      required: [true, "Email is mandatory for signup"],
    },
    password: {
      type: String,
      required: [true, "Password is mandatory for signup"],
    },
    weight_kg: { type: Number },
    height_cm: { type: Number }
  },
  {
    timestamps: true,
  }
);

const signUp = mongoose.model("SignUp", signUpSchema);

module.exports = signUp;
