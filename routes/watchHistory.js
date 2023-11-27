const express = require('express');
const router = express.Router();
const watchHistoryController = require('../controllers/watchHistoryController');

// Route to get all watch history 
router.get('/watchHistory', watchHistoryController.getWatchHistory);

// Route to create a watch history 
router.post('/watchHistory', watchHistoryController.addWatchHistory);

// Route to get a watch history of user
router.get('/watchHistory/:userId', watchHistoryController.getWatchHistoryByUserId);

// Route to delete a watch history 
router.delete('/watchHistory/:id', watchHistoryController.deleteWatchHistory);

// Route to add new add watch history 
router.put('/watchHistory/:id', watchHistoryController.updateWatchHistory);

module.exports = router;
