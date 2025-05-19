import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const main = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to MongoDB");

    // Get the conversations collection
    const db = mongoose.connection.db;
    const conversations = db.collection("conversations");

    // List indexes
    const indexes = await conversations.indexes();
    console.log("Indexes on conversations collection:");
    console.log(JSON.stringify(indexes, null, 2));

    // Close connection
    await mongoose.connection.close();
    console.log("Connection closed");
  } catch (error) {
    console.error("Error:", error);
  }
};

main();
