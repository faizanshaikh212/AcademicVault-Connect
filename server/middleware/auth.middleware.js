import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * Middleware to protect routes that require authentication.
 * It verifies the JWT and attaches the user to the request object.
 */
const protect = async (req, res, next) => {
  let token;

  // Check if the Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(" ")[1];

      // Verify the token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by the ID from the token payload
      // Exclude the password field from the result
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      console.error("Token verification failed:", error.message);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

/**
 * Middleware to optionally authenticate a user.
 * If a valid token is provided, it attaches the user to the request object.
 * If no token or invalid token, it still allows the request to proceed.
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      console.log("Optional auth token invalid:", error.message);
    }
  }

  next();
};

export { protect, optionalAuth };
