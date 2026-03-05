module.exports = function requireRole(...allowedRoles) {
  const allowed = new Set(allowedRoles);

  return (req, res, next) => {
    const role = req.user?.role;

    if (!role) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!allowed.has(role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    return next();
  };
};








