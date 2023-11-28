const WatchHistory = require("../models/watchHistoryModal");

const addWatchHistory = async (req, res) => {
  try {
    const { userID, type, level, days } = req.body;
    console.log("body", req.body);

    const newHistoryEntry = new WatchHistory({
      userID,
      type,
      level,
      days,
    });

    const newHistory = await newHistoryEntry.save();

    res.status(201).json({
      message: "Watch history entry added successfully",
      payload: newHistory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Controller to get all watch history entries
const getWatchHistory = async (req, res) => {
  try {
    const watchHistoryEntries = await WatchHistory.find();
    res.status(200).json(watchHistoryEntries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Controller to get watch history entries by userId
const getWatchHistoryByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const watchHistoryEntries = await WatchHistory.find({ userID: userId });

    res.status(200).json(watchHistoryEntries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Controller to get watch history entries by userId, type, and level
const getWatchHistoryByFilter = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, level } = req.query;

    const filter = { userID: userId };
    if (type) {
      filter.type = type;
    }
    if (level) {
      filter.level = level;
    }

    // Find watch history entries based on the filter
    const watchHistoryEntries = await WatchHistory.find(filter);

    res.status(200).json(watchHistoryEntries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteWatchHistory = async (req, res) => {
  try {
    const { id } = req.params;

    await WatchHistory.findByIdAndDelete(id);

    res
      .status(200)
      .json({ message: "Watch history entry deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateWatchHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, status } = req.body;

    const updatedHistoryEntry = await WatchHistory.findByIdAndUpdate(
      id,
      {
        $push: {
          days: {
            day,
            status: status || "uncompleted", // Provide a default status if not provided
          },
        },
      },
      { new: true }
    );

    res.status(200).json({
      message: "Watch history entry updated successfully",
      updatedEntry: updatedHistoryEntry,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  addWatchHistory,
  getWatchHistory,
  getWatchHistoryByUserId,
  getWatchHistoryByFilter,
  deleteWatchHistory,
  updateWatchHistory,
};
