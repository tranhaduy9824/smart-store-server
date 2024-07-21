module.exports = (req, res, next) => {
  if (req.userData.role !== "staff") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
