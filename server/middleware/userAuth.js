const jwt = require("jsonwebtoken");

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

module.exports = userAuth;