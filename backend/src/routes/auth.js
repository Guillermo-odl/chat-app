const express = require("express");
const router = express.Router();
const { signup, login, logout, getUserInfo, updateProfile } = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/userinfo", verifyToken, getUserInfo);
router.post("/update-profile", verifyToken, updateProfile);

module.exports = router;
