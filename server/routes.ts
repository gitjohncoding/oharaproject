import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailService } from "./email";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { insertSubmissionSchema } from "@shared/schema";
import { z } from "zod";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uuid = uuidv4().slice(0, 8);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${uuid}${ext}`);
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP3, WAV, and M4A files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    // Add CORS headers for audio files
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  }, express.static(uploadsDir));

  // Serve attached assets
  const attachedAssetsDir = path.join(process.cwd(), "attached_assets");
  if (fs.existsSync(attachedAssetsDir)) {
    app.use('/attached_assets', express.static(attachedAssetsDir));
  }

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

  // Submit new recording
  app.post("/api/submissions", upload.single('audioFile'), async (req, res) => {
    try {
      console.log("=== UPLOAD REQUEST RECEIVED ===");
      console.log("Request body:", req.body);
      console.log("Request file:", req.file);
      
      if (!req.file) {
        console.log("No file received");
        return res.status(400).json({ message: "Audio file is required" });
      }

      // Log received data for debugging
      console.log("Received form data:", req.body);
      console.log("Received file:", req.file ? { name: req.file.filename, size: req.file.size, type: req.file.mimetype } : "No file");

      // Validate form data
      const submissionData = {
        ...req.body,
        anonymous: req.body.anonymous === 'true',
      };

      console.log("Processed submission data:", submissionData);

      const validatedData = insertSubmissionSchema.parse(submissionData);

      // Get poem ID from slug
      const poem = await storage.getPoemBySlug(validatedData.poemSlug);
      if (!poem) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "Invalid poem" });
      }

      // Generate approval token
      const approvalToken = uuidv4();

      // Create submission
      const submission = await storage.createSubmission({
        ...validatedData,
        poemId: poem.id,
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        approvalToken,
      });

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
      // Clean up uploaded file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      if (error instanceof z.ZodError) {
        console.log("Validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Invalid form data",
          errors: error.errors
        });
      }

      console.error("Submission error:", error);
      res.status(500).json({ message: "Failed to process submission" });
    }
  });

  // Admin routes
  
  // Get admin stats
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const allSubmissions = await storage.getSubmissions();
      const stats = {
        pending: allSubmissions.filter(s => s.status === 'pending').length,
        approved: allSubmissions.filter(s => s.status === 'approved').length,
        rejected: allSubmissions.filter(s => s.status === 'rejected').length,
        total: allSubmissions.length
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Get pending submissions
  app.get("/api/admin/submissions/pending", async (req, res) => {
    try {
      const pendingSubmissions = await storage.getSubmissionsByStatus('pending');
      const poems = await storage.getPoems();
      
      const enrichedSubmissions = pendingSubmissions.map(submission => {
        const poem = poems.find(p => p.id === submission.poemId);
        return {
          ...submission,
          poemTitle: poem?.title || 'Unknown Poem'
        };
      });

      res.json(enrichedSubmissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending submissions" });
    }
  });

  // Approve submission via email link
  app.get("/api/admin/approve/:token", async (req, res) => {
    try {
      const submission = await storage.getSubmissionByToken(req.params.token);
      if (!submission) {
        return res.status(404).send(`
          <html>
            <body style="font-family: Inter, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
              <h1 style="color: #dc3545;">Submission Not Found</h1>
              <p>The submission token is invalid or has already been processed.</p>
            </body>
          </html>
        `);
      }

      if (submission.status !== 'pending') {
        return res.status(400).send(`
          <html>
            <body style="font-family: Inter, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
              <h1 style="color: #ffc107;">Already Processed</h1>
              <p>This submission has already been ${submission.status}.</p>
            </body>
          </html>
        `);
      }

      // Update submission status
      await storage.updateSubmissionStatus(submission.id, 'approved');

      // Create recording entry
      await storage.createRecording({
        poemId: submission.poemId,
        submissionId: submission.id,
        readerName: submission.anonymous ? "Anonymous Reader" : submission.readerName,
        location: submission.location,
        background: submission.background,
        interpretationNote: submission.interpretationNote,
        anonymous: submission.anonymous,
        fileName: submission.fileName,
        originalFileName: submission.originalFileName,
        fileSize: submission.fileSize,
        mimeType: submission.mimeType,
      });

      // Get poem title for confirmation email
      const poem = await storage.getPoems().then(poems => 
        poems.find(p => p.id === submission.poemId)
      );
      
      // Send approval confirmation email
      await emailService.sendApprovalConfirmation(
        submission.email,
        submission.readerName,
        poem?.title || 'Unknown Poem'
      );

      res.send(`
        <html>
          <body style="font-family: Inter, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
            <h1 style="color: #28a745;">✅ Submission Approved</h1>
            <p>The recording has been approved and is now live on the website.</p>
            <a href="${process.env.BASE_URL || 'http://localhost:5000'}" 
               style="background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px;">
              Visit Website
            </a>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Approval error:", error);
      res.status(500).send(`
        <html>
          <body style="font-family: Inter, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
            <h1 style="color: #dc3545;">Error</h1>
            <p>An error occurred while processing the approval.</p>
          </body>
        </html>
      `);
    }
  });

  // Reject submission via email link
  app.get("/api/admin/reject/:token", async (req, res) => {
    try {
      const submission = await storage.getSubmissionByToken(req.params.token);
      if (!submission) {
        return res.status(404).send(`
          <html>
            <body style="font-family: Inter, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
              <h1 style="color: #dc3545;">Submission Not Found</h1>
              <p>The submission token is invalid or has already been processed.</p>
            </body>
          </html>
        `);
      }

      if (submission.status !== 'pending') {
        return res.status(400).send(`
          <html>
            <body style="font-family: Inter, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
              <h1 style="color: #ffc107;">Already Processed</h1>
              <p>This submission has already been ${submission.status}.</p>
            </body>
          </html>
        `);
      }

      // Update submission status
      await storage.updateSubmissionStatus(submission.id, 'rejected');

      // Delete the uploaded file
      const filePath = path.join(uploadsDir, submission.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.send(`
        <html>
          <body style="font-family: Inter, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
            <h1 style="color: #dc3545;">❌ Submission Rejected</h1>
            <p>The recording has been rejected and removed from the system.</p>
            <a href="${process.env.BASE_URL || 'http://localhost:5000'}" 
               style="background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px;">
              Visit Website
            </a>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Rejection error:", error);
      res.status(500).send(`
        <html>
          <body style="font-family: Inter, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
            <h1 style="color: #dc3545;">Error</h1>
            <p>An error occurred while processing the rejection.</p>
          </body>
        </html>
      `);
    }
  });

  // Manual approve/reject for admin interface
  app.post("/api/admin/submissions/:id/approve", async (req, res) => {
    try {
      const submissionId = parseInt(req.params.id);
      const submission = await storage.getSubmissions().then(subs => 
        subs.find(s => s.id === submissionId)
      );

      if (!submission || submission.status !== 'pending') {
        return res.status(404).json({ message: "Submission not found or already processed" });
      }

      await storage.updateSubmissionStatus(submission.id, 'approved');

      await storage.createRecording({
        poemId: submission.poemId,
        submissionId: submission.id,
        readerName: submission.anonymous ? "Anonymous Reader" : submission.readerName,
        location: submission.location,
        background: submission.background,
        interpretationNote: submission.interpretationNote,
        anonymous: submission.anonymous,
        fileName: submission.fileName,
        originalFileName: submission.originalFileName,
        fileSize: submission.fileSize,
        mimeType: submission.mimeType,
      });

      res.json({ message: "Submission approved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve submission" });
    }
  });

  app.post("/api/admin/submissions/:id/reject", async (req, res) => {
    try {
      const submissionId = parseInt(req.params.id);
      const submission = await storage.getSubmissions().then(subs => 
        subs.find(s => s.id === submissionId)
      );

      if (!submission || submission.status !== 'pending') {
        return res.status(404).json({ message: "Submission not found or already processed" });
      }

      await storage.updateSubmissionStatus(submission.id, 'rejected');

      // Delete the uploaded file
      const filePath = path.join(uploadsDir, submission.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({ message: "Submission rejected successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject submission" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
