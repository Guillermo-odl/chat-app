const Message = require("../models/Message");

const getMessages = async (req, res) => {
  try {
    const { id: contactorId } = req.body;
    if (!contactorId) return res.status(400).json({ message: "contactorId is required" });

    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: contactorId },
        { sender: contactorId, recipient: req.userId },
      ],
    })
      .sort({ timestamp: 1 })
      .populate("sender", "_id firstName lastName email image color")
      .populate("recipient", "_id firstName lastName email image color");

    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getMessages };
