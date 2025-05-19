import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    members: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      required: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    lastMessageAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    // Explicitly set the collection name to avoid auto-pluralization
    collection: "conversations",
    // Explicitly set the _id field and disable id virtuals to prevent id index issues
    id: false,
    // This will ensure that MongoDB uses the default _id field
    _id: true,
  }
);

// Add a compound index on members to efficiently search for conversations between users
ConversationSchema.index({ members: 1 });

export default mongoose.model("Conversation", ConversationSchema);
