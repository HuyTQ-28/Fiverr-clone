import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import createError from "../utils/createError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return next(createError(400, "No files were uploaded"));
    }

    const file = req.files.file;
    const uploadDir = path.join(__dirname, "../../public/uploads");

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename to prevent overrides
    const fileExt = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    // Move file to upload directory
    file.mv(filePath, (err) => {
      if (err) {
        return next(createError(500, "Error saving file"));
      }

      // Return success with file URL
      res.status(200).json({
        success: true,
        url: `/uploads/${fileName}`,
      });
    });
  } catch (err) {
    next(err);
  }
};
