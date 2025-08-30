const teacher = (req, res, next) => {
  if (req.user && req.user.role && (req.user.role.includes("teacher") || req.user.role.includes("admin"))) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as a teacher." });
  }
};

export default teacher;
