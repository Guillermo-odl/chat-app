const User = require("../models/User");
const Message = require("../models/Message");
const mongoose = require("mongoose");

const searchContacts = async (req, res) => {
  try {
    const { searchTerm } = req.body;
    if (!searchTerm) return res.status(400).json({ message: "searchTerm is required" });

    const regex = new RegExp(searchTerm, "i");
    const contacts = await User.find({
      _id: { $ne: req.userId },
      $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
    }).select("_id firstName lastName email");

    res.status(200).json({ contacts });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllContacts = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } }).select("_id firstName lastName");
    const contacts = users.map((u) => ({
      label: `${u.firstName} ${u.lastName}`.trim() || "Unknown",
      value: u._id,
    }));
    res.status(200).json({ contacts });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getContactsForList = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .sort({ timestamp: -1 })
      .populate("sender", "_id firstName lastName email image color")
      .populate("recipient", "_id firstName lastName email image color");

    const contactMap = new Map();
    for (const msg of messages) {
      const other = msg.sender._id.equals(userId) ? msg.recipient : msg.sender;
      if (!contactMap.has(other._id.toString())) {
        contactMap.set(other._id.toString(), {
          _id: other._id,
          firstName: other.firstName,
          lastName: other.lastName,
          email: other.email,
          image: other.image,
          color: other.color,
          lastMessageTime: msg.timestamp,
        });
      }
    }

    res.status(200).json({ contacts: Array.from(contactMap.values()) });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteDM = async (req, res) => {
  try {
    const { dmId } = req.params;
    if (!dmId) return res.status(400).json({ message: "dmId is required" });

    await Message.deleteMany({
      $or: [
        { sender: req.userId, recipient: dmId },
        { sender: dmId, recipient: req.userId },
      ],
    });

    res.status(200).json({ message: "DM deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { searchContacts, getAllContacts, getContactsForList, deleteDM };
