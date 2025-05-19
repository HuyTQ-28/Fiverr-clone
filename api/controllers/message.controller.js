import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import createError from "../utils/createError.js";

export const createMessage = async (req, res, next) => {
  try {
    const { conversationId, text, receiverId, attachments } = req.body;
    const senderId = req.userId;

    console.log("Message creation request:", {
      conversationId,
      text,
      receiverId,
      attachments,
      senderId,
    });

    // Create new message
    const newMessage = new Message({
      conversationId,
      senderId,
      text,
      receiverId,
      attachments: attachments || [],
    });

    console.log("New message object:", newMessage);

    const savedMessage = await newMessage.save();

    // Update conversation with last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: savedMessage._id,
      lastMessageAt: new Date(),
    });

    res.status(201).json(savedMessage);
  } catch (err) {
    console.error("Error creating message:", err);
    next(err);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    // Check if user is part of this conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return next(createError(404, "Conversation not found"));
    }

    if (!conversation.members.includes(userId)) {
      return next(createError(403, "You don't have access to these messages"));
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate({
        path: "senderId",
        select: "username img",
      });

    res.status(200).json(messages);
  } catch (err) {
    next(err);
  }
};

export const markMessagesAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    // Mark all unread messages addressed to this user as read
    const result = await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    res.status(200).json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
};
