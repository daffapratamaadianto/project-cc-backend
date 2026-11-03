// const express = require('express');
// const router = express.Router();

// const authenticateToken = require('../middleware/auth.middleware');
// const authorizeRole = require('../middleware/role.middleware');

// // Import getEditors bersama dengan getAllUsers dari controller
// const { getAllUsers, getEditors,getUserById } = require('../controllers/users.controller');

// router.get(
//   '/',
//   authenticateToken,
//   authorizeRole('admin'),
//   getAllUsers
// );

// router.get('/editors', authenticateToken, getEditors);

// router.get(
//   '/:id',
//   authenticateToken,
//   authorizeRole('admin'),
//   getUserById
// );

// module.exports = router;


const express = require('express');
const router = express.Router();

const authenticateToken = require('../middleware/auth.middleware');
const authorizeRole = require('../middleware/role.middleware');

const {
  getAllUsers,
  getEditors,
  updateUserRole,
} = require('../controllers/users.controller');

// Route khusus Editor (Creator & Admin bisa akses)
router.get('/editors', authenticateToken, getEditors);

// Route khusus Admin (Get All Users & Update Role)
router.get('/', authenticateToken, authorizeRole('admin'), getAllUsers);
router.patch('/:id/role', authenticateToken, authorizeRole('admin'), updateUserRole);

module.exports = router;