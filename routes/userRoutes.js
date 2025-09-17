const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createUser,
    toggleUserStatus,
    getDistance,
    userListing
} = require('../controllers/userController');

router.post('/create-user', createUser);
router.put('/toggle-status', auth, toggleUserStatus);
router.get('/get-distance', auth, getDistance);
router.get('/user-listing', auth, userListing);

module.exports = router;
