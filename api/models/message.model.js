import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: function () {
        // Text is required only when there are no attachments
        return this.attachments.length === 0;
      },
      default: "",
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Message", MessageSchema);
