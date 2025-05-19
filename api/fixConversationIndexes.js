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

    // List current indexes
    console.log("Current indexes:");
    const currentIndexes = await conversations.indexes();
    console.log(JSON.stringify(currentIndexes, null, 2));

    // Drop problematic id index if it exists
    const idIndex = currentIndexes.find(
      (index) => index.key && index.key.id === 1
    );

    if (idIndex) {
      console.log("Found problematic id index, dropping...");
      await conversations.dropIndex("id_1");
      console.log("Index dropped");
    } else {
      console.log("No problematic id index found");
    }

    // Create or ensure proper indexes
    console.log("Creating proper indexes...");
    await conversations.createIndex({ members: 1 });
    console.log("Members index created/updated");

    // List indexes after changes
    console.log("Updated indexes:");
    const updatedIndexes = await conversations.indexes();
    console.log(JSON.stringify(updatedIndexes, null, 2));

    // Close connection
    await mongoose.connection.close();
    console.log("Connection closed");
  } catch (error) {
    console.error("Error:", error);
  }
};

main();
