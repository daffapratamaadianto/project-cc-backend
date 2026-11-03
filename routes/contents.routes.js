
const express = require('express');
const router = express.Router();

const authenticateToken = require('../middleware/auth.middleware');

const {
  getContents,
  getContentDetail,
  createContent,
  updateContent,
  deleteContent,
  advanceProductionStatus,
  submitForEditing,
  startEditing,
  completeEditing,
  requestRevision,
  approveContent,
  publishContent,
} = require('../controllers/contents.controller');

// CRUD konten
router.get('/', authenticateToken, getContents);
router.post('/', authenticateToken, createContent);
router.get('/:id', authenticateToken, getContentDetail);
router.patch('/:id', authenticateToken, updateContent);
router.delete('/:id', authenticateToken, deleteContent);
router.put('/:id', authenticateToken, updateContent);


// Workflow produksi konten
router.patch('/:id/production-status', authenticateToken, advanceProductionStatus);

// Workflow editing
router.post('/:id/submit-for-editing', authenticateToken, submitForEditing);
router.post('/:id/start-editing', authenticateToken, startEditing);
router.post('/:id/complete-editing', authenticateToken, completeEditing);
router.post('/:id/request-revision', authenticateToken, requestRevision);
router.post('/:id/approve', authenticateToken, approveContent);
router.post('/:id/publish', authenticateToken, publishContent);


module.exports = router;
