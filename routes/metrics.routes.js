
const express = require('express');
const router = express.Router();

const authenticateToken = require('../middleware/auth.middleware');

const {
  getMetrics,
  createMetrics,
} = require('../controllers/metrics.controller');

router.get(
  '/contents/:id/metrics',
  authenticateToken,
  getMetrics
);

router.post(
  '/contents/:id/metrics',
  authenticateToken,
  createMetrics
);

module.exports = router;
