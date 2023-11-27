const mongoose = require("mongoose");
const userRepSchema = mongoose.Schema(
  {
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "signUp", required: true },
    videoID: { type: String, required: true },
    liftType: { type: String, required: true },
    attemptedReps: { type: Number, required: true },
    goodReps: { type: Number, required: true },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const userRep = mongoose.model("userRep", userRepSchema);
module.exports = userRep;
