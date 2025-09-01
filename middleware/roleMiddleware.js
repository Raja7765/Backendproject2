// middleware/roleMiddleware.js
module.exports = function(requiredRole) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${requiredRole} only.`,
      });
    }
    next();
  };
};

//inga dhanda code dey iruku
//