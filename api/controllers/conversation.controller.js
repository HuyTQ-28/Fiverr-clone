import Conversation from "../models/conversation.model.js";
import createError from "../utils/createError.js";
import mongoose from "mongoose";

export const createConversation = async (req, res, next) => {
  try {
    const { sellerId, buyerId } = req.body;

    console.log("Creating conversation with IDs:", {
      sellerId,
      buyerId,
      userId: req.userId,
    });

    if (!sellerId || !buyerId) {
      console.error("Missing required IDs for conversation creation");
      return next(createError(400, "Both seller and buyer IDs are required"));
    }

    // Validate ObjectIDs
    if (
      !mongoose.Types.ObjectId.isValid(sellerId) ||
      !mongoose.Types.ObjectId.isValid(buyerId)
    ) {
      console.error("Invalid ObjectID format:", { sellerId, buyerId });
      return next(createError(400, "Invalid ID format provided"));
    }

    // Convert strings to ObjectIDs to ensure consistent comparison
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const buyerObjectId = new mongoose.Types.ObjectId(buyerId);

    // More robust query using $all to find conversations containing both members
    const existingConversation = await Conversation.findOne({
      members: {
        $all: [
          { $elemMatch: { $eq: sellerObjectId } },
          { $elemMatch: { $eq: buyerObjectId } },
        ],
      },
    });

    if (existingConversation) {
      console.log("Using existing conversation:", existingConversation._id);
      return res.status(200).send(existingConversation);
    }

    console.log(
      "Creating new conversation between:",
      sellerObjectId,
      buyerObjectId
    );

    // Create new conversation with explicit members array
    const newConversation = new Conversation({
      members: [sellerObjectId, buyerObjectId],
      lastMessageAt: new Date(),
    });

    // Save with explicit error handling
    const savedConversation = await newConversation.save();
    console.log("Created new conversation:", savedConversation._id);

    res.status(201).send(savedConversation);
  } catch (err) {
    console.error("Error creating conversation:", err);
    next(err);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.userId;
    console.log("Getting conversations for user:", userId);

    // Validate ObjectID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid user ID format:", userId);
      return next(createError(400, "Invalid user ID format"));
    }

    // Convert to ObjectID for consistent comparison
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Use a more reliable query to find conversations containing the user
    const conversations = await Conversation.find({
      members: userObjectId,
    })
      .sort({ lastMessageAt: -1 })
      .populate({
        path: "members",
        select: "username email img fullName",
      })
      .populate({
        path: "lastMessage",
      });

    console.log(
      `Found ${conversations.length} conversations for user:`,
      userId
    );
    res.status(200).send(conversations);
  } catch (err) {
    console.error("Error getting conversations:", err);
    next(err);
  }
};

export const getSingleConversation = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createError(400, "Invalid conversation ID format"));
    }

    const conversation = await Conversation.findById(id)
      .populate({
        path: "members",
        select: "username email img fullName",
      })
      .populate({
        path: "lastMessage",
      });

    if (!conversation) return next(createError(404, "Conversation not found"));

    // Convert userId to string for safer comparison
    const userIdStr = req.userId.toString();

    // Check if user is a member of this conversation
    if (
      !conversation.members.some(
        (member) => member._id.toString() === userIdStr
      )
    ) {
      return next(
        createError(403, "You don't have access to this conversation")
      );
    }

    res.status(200).send(conversation);
  } catch (err) {
    console.error("Error getting single conversation:", err);
    next(err);
  }
};

export const updateLastMessage = async (req, res, next) => {
  try {
    const { conversationId, messageId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(conversationId) ||
      !mongoose.Types.ObjectId.isValid(messageId)
    ) {
      return next(createError(400, "Invalid ID format provided"));
    }

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: new mongoose.Types.ObjectId(messageId),
        lastMessageAt: new Date(),
      },
      { new: true }
    );

    if (!updatedConversation)
      return next(createError(404, "Conversation not found"));

    res.status(200).send(updatedConversation);
  } catch (err) {
    console.error("Error updating last message:", err);
    next(err);
  }
};
