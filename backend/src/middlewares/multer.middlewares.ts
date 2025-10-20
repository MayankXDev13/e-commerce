import multer from "multer";
import fs from "fs/promises";

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = "./public/images";
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },

  filename: function (req, file, cb) {
    let fileExtension = "";
    if (file.originalname.split(".").length > 1) {
      fileExtension = file.originalname.substring(
        file.originalname.lastIndexOf(".")
      );
    }
    const filenameWithoutExtension = file.originalname
      .toLowerCase()
      .split(" ")
      .join("-")
      .split(".")[0];
    
    cb(
      null,
      filenameWithoutExtension +
        Date.now() +
        Math.ceil(Math.random() * 1e5) +
        fileExtension
    );
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 1 * 1000 * 1000,
  },
});