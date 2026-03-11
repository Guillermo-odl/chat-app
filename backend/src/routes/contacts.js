const express = require("express");
const router = express.Router();
const { searchContacts, getAllContacts, getContactsForList, deleteDM } = require("../controllers/contactController");
const { verifyToken } = require("../middleware/auth");

router.post("/search", verifyToken, searchContacts);
router.get("/all-contacts", verifyToken, getAllContacts);
router.get("/get-contacts-for-list", verifyToken, getContactsForList);
router.delete("/delete-dm/:dmId", verifyToken, deleteDM);

module.exports = router;
