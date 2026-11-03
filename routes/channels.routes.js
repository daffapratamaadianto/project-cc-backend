
const express = require('express');
const router = express.Router();

const authenticateToken = require('../middleware/auth.middleware');

const {
  getChannels,
  createChannel,
} = require('../controllers/channels.controller');

router.get('/', authenticateToken, getChannels);
router.post('/', authenticateToken, createChannel);

module.exports = router;
