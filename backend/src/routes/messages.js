const express = require("express");
const router = express.Router();
const { getMessages } = require("../controllers/messageController");
const { verifyToken } = require("../middleware/auth");

router.post("/get-messages", verifyToken, getMessages);

module.exports = router;
