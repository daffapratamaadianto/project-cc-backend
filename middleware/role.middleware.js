
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Kamu tidak memiliki akses.',
        });
      }

      return next();
    } catch (error) {
      console.error('Role middleware error:', error.message);

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan pada server.',
      });
    }
  };
};

module.exports = authorizeRole;
