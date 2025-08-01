/**
 * Middleware to check if the user is an administrator.
 */
const admin = (req, res, next) => {
  /*
  // --- DEBUGGING STEP ---

  if (req.user) {
    console.log(
      req.user.username,
      "Is 'admin'?",
      req.user.role.includes("admin")
    );
  } else {
    console.log("No user object found on request.");
  }
  console.log("");
  // --- END DEBUGGING STEP ---
  
  */

  if (req.user && req.user.role && req.user.role.includes("admin")) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin." });
  }
};

export { admin };
