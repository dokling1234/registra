import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const userAuth = (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ success: false });
  }
  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

    if (tokenDecode.id) {
      req.user = {
        userId: tokenDecode.id,
        fullName: tokenDecode.fullName,
        userType: tokenDecode.userType,
      };
      next();
    } else {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in again2." });
    }
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token. Please log in again." });
  }
};

const userTypeAuth = (alloweduserTypes) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.body.userId);
      if (!user || !alloweduserTypes.includes(user.userType)) {
        return res.status(403).json({ success: false, message: "Access Denied" });
      }
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
};
export { userAuth, userTypeAuth };

