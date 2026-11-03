
const express = require('express');
const router = express.Router();

const authenticateToken = require('../middleware/auth.middleware');

const {
  getChecklists,
  createChecklist,
  toggleChecklist,
  deleteChecklist,
} = require('../controllers/checklists.controller');

router.get(
  '/contents/:id/checklists',
  authenticateToken,
  getChecklists
);

router.post(
  '/contents/:id/checklists',
  authenticateToken,
  createChecklist
);

router.patch(
  '/checklists/:id/toggle',
  authenticateToken,
  toggleChecklist
);

router.delete('/checklists/:id', authenticateToken, deleteChecklist);

module.exports = router;
