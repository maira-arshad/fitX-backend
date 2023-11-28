const mongoose = require("mongoose");

const watchHistorySchema = mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "signUp",
      required: true,
    },
    type: { type: String, required: true },
    level: { type: String, required: true },
    days: [
      {
        _id: false, // Exclude the _id field from the array objects
        day: { type: Number, required: true },
        status: {
          type: String,
          enum: ["completed", "uncompleted"],
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const watchHistory = mongoose.model("watchHistory", watchHistorySchema);
module.exports = watchHistory;
