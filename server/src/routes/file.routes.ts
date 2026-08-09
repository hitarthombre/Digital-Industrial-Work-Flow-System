import { Router, Response } from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Single file upload route
router.post(
  "/upload",
  authenticate as any,
  upload.single("file"),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No file was attached to the request",
        });
        return;
      }

      // Check if Cloudinary credentials are set up
      const isCloudinaryConfigured =
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET;

      if (!isCloudinaryConfigured) {
        console.warn("[File Upload] Cloudinary credentials are missing. Simulating mock upload.");
        
        // Mock successful upload response
        const mockUrl = `https://res.cloudinary.com/demo/image/upload/sample.jpg`;
        res.status(200).json({
          success: true,
          message: "File uploaded successfully (Mock Mode)",
          data: {
            fileName: req.file.originalname,
            fileUrl: mockUrl,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
          },
        });
        return;
      }

      // Upload file buffer to Cloudinary
      const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      
      const uploadResult = await cloudinary.uploader.upload(fileBase64, {
        folder: `diws/${req.companyId || "general"}`,
        resource_type: "auto",
      });

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          fileName: req.file.originalname,
          fileUrl: uploadResult.secure_url,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
        },
      });
    } catch (error: any) {
      console.error("[File Upload Error]", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to upload file",
      });
    }
  }
);

export default router;
