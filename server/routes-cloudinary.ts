import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailService } from "./email";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { insertSubmissionSchema } from "@shared/schema";
import { z } from "zod";
import { v2 as cloudinary } from 'cloudinary';

// Configure multer for memory storage (Cloudinary upload)
const storage_multer = multer.memoryStorage();

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only audio files
    if (file.mimetype.startsWith('audio/') || 
        ['.mp3', '.m4a', '.wav', '.aac', '.ogg'].includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Cloudinary configuration
  if (!process.env.CLOUDINARY_URL) {
    throw new Error("CLOUDINARY_URL environment variable must be set");
  }

  // Serve attached assets
  const attachedAssetsDir = path.join(process.cwd(), "attached_assets");
  if (fs.existsSync(attachedAssetsDir)) {
    app.use('/attached_assets', express.static(attachedAssetsDir));
  }

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all poems
  app.get("/api/poems", async (req, res) => {
    try {
      const poems = await storage.getPoems();
      res.json(poems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch poems" });
    }
  });

  // Get recording counts for all poems (must come before /:slug route)
  app.get("/api/poems/stats", async (req, res) => {
    try {
      const poems = await storage.getPoems();
      const stats: Record<string, number> = {};
      
      for (const poem of poems) {
        const recordings = await storage.getRecordingsByPoemId(poem.id);
        stats[poem.slug] = recordings.length;
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch poem stats" });
    }
  });

  // Get all recordings
  app.get("/api/recordings", async (req, res) => {
    try {
      const recordings = await storage.getRecordings();
      res.json(recordings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recordings" });
    }
  });

  // Submit recording with Cloudinary upload
  app.post("/api/submissions", upload.single('audioFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Audio file is required" });
      }

      console.log("Received file upload:", {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      // Basic required field check
      if (!req.body.readerName || !req.body.email) {
        return res.status(400).json({ message: "Reader name and email are required" });
      }

      // Get poem ID from slug
      const poem = await storage.getPoemBySlug(req.body.poemSlug);
      if (!poem) {
        return res.status(400).json({ message: "Invalid poem" });
      }

      // Upload to Cloudinary
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const uuid = uuidv4().slice(0, 8);
      const publicId = `frank-ohara-readings/${timestamp}-${uuid}`;

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: "video", // Use "video" for audio files
            folder: "frank-ohara-readings",
            public_id: publicId,
            format: "mp3", // Convert to mp3 for consistency
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file!.buffer);
      });

      const cloudinaryResult = uploadResult as any;
      
      console.log("Cloudinary upload successful:", {
        public_id: cloudinaryResult.public_id,
        secure_url: cloudinaryResult.secure_url,
        duration: cloudinaryResult.duration
      });

      // Create submission with Cloudinary data
      const submissionData = {
        poemId: poem.id,
        readerName: req.body.readerName,
        email: req.body.email,
        location: req.body.location || null,
        background: req.body.background || null,
        interpretationNote: req.body.interpretationNote || null,
        anonymous: req.body.anonymous === 'true',
        fileName: cloudinaryResult.public_id,
        cloudinaryUrl: cloudinaryResult.secure_url,
        originalFileName: req.file!.originalname,
        fileSize: req.file!.size,
        mimeType: req.file!.mimetype,
        approvalToken: uuidv4(),
      };

      const submission = await storage.createSubmission(submissionData);

      // Send email notification
      const emailSent = await emailService.sendSubmissionNotification({
        submissionId: submission.id,
        readerName: submission.anonymous ? "Anonymous Reader" : submission.readerName,
        poemTitle: poem.title,
        email: submission.email,
        location: submission.location || undefined,
        background: submission.background || undefined,
        interpretationNote: submission.interpretationNote || undefined,
        fileName: submission.fileName,
        approvalToken: submission.approvalToken,
      });

      if (!emailSent) {
        console.warn("Failed to send email notification for submission", submission.id);
      }

      res.json({ 
        message: "Recording submitted successfully! It will be reviewed before appearing on the site.",
        submissionId: submission.id
      });
    } catch (error) {
      console.error("Submission error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to submit recording" });
    }
  });

  // Get poem by slug with recordings
  app.get("/api/poems/:slug", async (req, res) => {
    try {
      const poem = await storage.getPoemBySlug(req.params.slug);
      if (!poem) {
        return res.status(404).json({ message: "Poem not found" });
      }
      
      const recordings = await storage.getRecordingsByPoemId(poem.id);
      res.json({ poem, recordings });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch poem" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", isAuthenticated, async (req, res) => {
    try {
      const submissions = await storage.getSubmissions();
      const stats = {
        pending: submissions.filter(s => s.status === 'pending').length,
        approved: submissions.filter(s => s.status === 'approved').length,
        rejected: submissions.filter(s => s.status === 'rejected').length,
        total: submissions.length
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/submissions/pending", isAuthenticated, async (req, res) => {
    try {
      const submissions = await storage.getSubmissionsByStatus('pending');
      const poems = await storage.getPoems();
      
      const submissionsWithPoem = submissions.map(submission => {
        const poem = poems.find(p => p.id === submission.poemId);
        return {
          ...submission,
          poemTitle: poem?.title || 'Unknown Poem'
        };
      });
      
      res.json(submissionsWithPoem);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending submissions" });
    }
  });

  app.get("/api/admin/recordings", isAuthenticated, async (req, res) => {
    try {
      const recordings = await storage.getRecordings();
      const poems = await storage.getPoems();
      
      const recordingsWithPoem = recordings.map(recording => {
        const poem = poems.find(p => p.id === recording.poemId);
        return {
          ...recording,
          poemTitle: poem?.title || 'Unknown Poem'
        };
      });
      
      res.json(recordingsWithPoem);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recordings" });
    }
  });

  app.post("/api/admin/submissions/:id/approve", isAuthenticated, async (req, res) => {
    try {
      const submissionId = parseInt(req.params.id);
      const submission = await storage.updateSubmissionStatus(submissionId, 'approved', new Date());
      
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      // Create recording from approved submission
      const recording = await storage.createRecording({
        poemId: submission.poemId,
        submissionId: submission.id,
        readerName: submission.readerName,
        location: submission.location,
        background: submission.background,
        interpretationNote: submission.interpretationNote,
        anonymous: submission.anonymous,
        fileName: submission.fileName,
        cloudinaryUrl: submission.cloudinaryUrl,
        originalFileName: submission.originalFileName,
        fileSize: submission.fileSize,
        mimeType: submission.mimeType,
      });

      // Send approval confirmation email
      await emailService.sendApprovalConfirmation(
        submission.email, 
        submission.readerName, 
        "poem title" // We could get this from the poem data
      );

      res.json({ message: "Submission approved and recording created" });
    } catch (error) {
      console.error("Approval error:", error);
      res.status(500).json({ message: "Failed to approve submission" });
    }
  });

  app.post("/api/admin/submissions/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const submissionId = parseInt(req.params.id);
      const submission = await storage.updateSubmissionStatus(submissionId, 'rejected', new Date());
      
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      // Optionally delete from Cloudinary
      if (submission.fileName) {
        try {
          await cloudinary.uploader.destroy(submission.fileName, { resource_type: "video" });
          console.log("Deleted rejected file from Cloudinary:", submission.fileName);
        } catch (error) {
          console.warn("Failed to delete file from Cloudinary:", error);
        }
      }

      res.json({ message: "Submission rejected" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject submission" });
    }
  });

  app.delete("/api/admin/recordings/:id", isAuthenticated, async (req, res) => {
    try {
      const recordingId = parseInt(req.params.id);
      const recordings = await storage.getRecordings();
      const recording = recordings.find(r => r.id === recordingId);
      
      if (!recording) {
        return res.status(404).json({ message: "Recording not found" });
      }

      // Delete from Cloudinary
      if (recording.fileName) {
        try {
          await cloudinary.uploader.destroy(recording.fileName, { resource_type: "video" });
          console.log("Deleted file from Cloudinary:", recording.fileName);
        } catch (error) {
          console.warn("Failed to delete file from Cloudinary:", error);
        }
      }

      // Remove from database
      const deleted = await storage.deleteRecording(recordingId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Recording not found" });
      }

      res.json({ message: "Recording deleted successfully" });
    } catch (error) {
      console.error("Delete recording error:", error);
      res.status(500).json({ message: "Failed to delete recording" });
    }
  });

  // Favorites routes
  app.get("/api/favorites/recordings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getFavoriteRecordingsByUserId(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorite recordings" });
    }
  });

  app.post("/api/favorites/recordings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recordingId = parseInt(req.params.id);
      
      const favorite = await storage.addFavoriteRecording(userId, recordingId);
      res.json(favorite);
    } catch (error) {
      res.status(500).json({ message: "Failed to add favorite recording" });
    }
  });

  app.delete("/api/favorites/recordings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recordingId = parseInt(req.params.id);
      
      const removed = await storage.removeFavoriteRecording(userId, recordingId);
      if (!removed) {
        return res.status(404).json({ message: "Favorite not found" });
      }
      
      res.json({ message: "Favorite removed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove favorite recording" });
    }
  });

  app.get("/api/favorites/poems", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getFavoritePoemsByUserId(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorite poems" });
    }
  });

  app.post("/api/favorites/poems/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const poemId = parseInt(req.params.id);
      
      const favorite = await storage.addFavoritePoem(userId, poemId);
      res.json(favorite);
    } catch (error) {
      res.status(500).json({ message: "Failed to add favorite poem" });
    }
  });

  app.delete("/api/favorites/poems/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const poemId = parseInt(req.params.id);
      
      const removed = await storage.removeFavoritePoem(userId, poemId);
      if (!removed) {
        return res.status(404).json({ message: "Favorite not found" });
      }
      
      res.json({ message: "Favorite removed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove favorite poem" });
    }
  });

  app.get("/api/favorites/poet", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorite = await storage.getFavoritePoetByUserId(userId);
      res.json(favorite);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorite poet" });
    }
  });

  app.post("/api/favorites/poet", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorite = await storage.addFavoritePoet(userId);
      res.json(favorite);
    } catch (error) {
      res.status(500).json({ message: "Failed to add favorite poet" });
    }
  });

  app.delete("/api/favorites/poet", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const removed = await storage.removeFavoritePoet(userId);
      if (!removed) {
        return res.status(404).json({ message: "Favorite not found" });
      }
      
      res.json({ message: "Favorite removed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove favorite poet" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}