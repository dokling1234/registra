import jwt from 'jsonwebtoken';
import User from '../mobile_admin_models/admin.model.js';

export const userAuth = (req, res, next) => {
  let token = req.cookies.token;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return res.json({ success: false, message: 'Unauthorized Login Again' });

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    req.body.userId = tokenDecode.id;
    next();
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const roleAuth = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.body.userId);
      if (!user || !allowedRoles.includes(user.role)) {
        return res.status(403).json({ success: false, message: 'Access Denied' });
      }
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
};
