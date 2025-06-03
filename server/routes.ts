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
    fileSize: 15 * 1024 * 1024, // 15MB max
  },
  fileFilter: (req, file, cb) => {
    console.log("File filter check - file type:", file.mimetype);
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/m4a'];
    if (allowedTypes.includes(file.mimetype)) {
      console.log("File type accepted");
      cb(null, true);
    } else {
      console.log("File type rejected:", file.mimetype);
      cb(new Error('Invalid file type. Only MP3, WAV, and M4A files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Add logging middleware
  app.use('/api/submissions', (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Serve uploaded files with proper MIME types
  app.use('/uploads', (req, res, next) => {
    // Add CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // Set proper MIME types for audio files
    if (req.path.endsWith('.mp3')) {
      res.type('audio/mpeg');
    } else if (req.path.endsWith('.m4a')) {
      res.type('audio/mp4');
    } else if (req.path.endsWith('.wav')) {
      res.type('audio/wav');
    }
    
    next();
  }, express.static(uploadsDir));

  // Add debug route to test file serving
  app.get('/test-audio/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    console.log('Trying to serve:', filePath);
    console.log('File exists:', fs.existsSync(filePath));
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    
    // Set proper MIME type
    if (filename.endsWith('.mp3')) {
      res.type('audio/mpeg');
    } else if (filename.endsWith('.m4a')) {
      res.type('audio/mp4');
    } else if (filename.endsWith('.wav')) {
      res.type('audio/wav');
    }
    
    res.sendFile(filePath);
  });

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

  // Get all recordings
  app.get("/api/recordings", async (req, res) => {
    try {
      const recordings = await storage.getRecordings();
      res.json(recordings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recordings" });
    }
  });

  // Serve individual recordings with proper headers
  app.get("/api/recordings/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Recording not found" });
    }
    
    // Set proper MIME type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'audio/mpeg'; // default
    
    switch (ext) {
      case '.mp3':
        contentType = 'audio/mpeg';
        break;
      case '.m4a':
        contentType = 'audio/mp4';
        break;
      case '.wav':
        contentType = 'audio/wav';
        break;
    }
    
    // Set headers for proper audio streaming
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send the file
    res.sendFile(filePath);
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
  app.post("/api/submissions", (req, res, next) => {
    console.log("=== UPLOAD REQUEST STARTED ===");
    upload.single('audioFile')(req, res, (err) => {
      if (err) {
        console.log("Multer error:", err);
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, async (req, res) => {
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

      // Simple validation test - let's see what we actually receive
      console.log("Raw request body:", req.body);
      console.log("Raw file:", req.file);
      
      // Basic required field check
      if (!req.body.readerName || !req.body.email) {
        return res.status(400).json({ message: "Reader name and email are required" });
      }

      // Create basic submission data
      const validatedData = {
        poemSlug: req.body.poemSlug || '',
        readerName: req.body.readerName,
        email: req.body.email,
        location: req.body.location || null,
        background: req.body.background || null,
        interpretationNote: req.body.interpretationNote || null,
        anonymous: req.body.anonymous === 'true',
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        approvalToken: uuidv4(),
        poemId: 0 // We'll set this below
      };

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

  // Get all approved recordings (admin only)
  app.get("/api/admin/recordings", isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      const userId = req.user.claims.sub;
      const adminEmail = 'johntclinkscales@gmail.com';
      const user = await storage.getUser(userId);
      
      if (!user || user.email !== adminEmail) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const recordings = await storage.getRecordings();
      const poems = await storage.getPoems();
      
      const enrichedRecordings = recordings.map(recording => {
        const poem = poems.find(p => p.id === recording.poemId);
        return {
          ...recording,
          poemTitle: poem?.title || 'Unknown Poem'
        };
      });

      res.json(enrichedRecordings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recordings" });
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

  // Delete approved recording (admin only)
  app.delete("/api/admin/recordings/:id", isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      const userId = req.user.claims.sub;
      const adminEmail = 'johntclinkscales@gmail.com';
      const user = await storage.getUser(userId);
      
      if (!user || user.email !== adminEmail) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const recordingId = parseInt(req.params.id);
      const recordings = await storage.getRecordings();
      const recording = recordings.find(r => r.id === recordingId);

      if (!recording) {
        return res.status(404).json({ message: "Recording not found" });
      }

      // Delete from database (this should also cleanup favorites via foreign key)
      const success = await storage.deleteRecording(recordingId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete recording from database" });
      }

      // Delete the physical audio file
      const filePath = path.join(uploadsDir, recording.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({ message: "Recording deleted successfully" });
    } catch (error) {
      console.error("Recording deletion error:", error);
      res.status(500).json({ message: "Failed to delete recording" });
    }
  });

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

  // Recording Favorites API
  app.get('/api/favorites/recordings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getFavoriteRecordingsByUserId(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching recording favorites:", error);
      res.status(500).json({ message: "Failed to fetch recording favorites" });
    }
  });

  app.post('/api/favorites/recordings/:recordingId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recordingId = parseInt(req.params.recordingId);
      
      if (isNaN(recordingId)) {
        return res.status(400).json({ message: "Invalid recording ID" });
      }

      const isFavorited = await storage.isRecordingFavorited(userId, recordingId);
      if (isFavorited) {
        return res.status(409).json({ message: "Recording already in favorites" });
      }

      const favorite = await storage.addFavoriteRecording(userId, recordingId);
      res.json(favorite);
    } catch (error) {
      console.error("Error adding recording favorite:", error);
      res.status(500).json({ message: "Failed to add recording favorite" });
    }
  });

  app.delete('/api/favorites/recordings/:recordingId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recordingId = parseInt(req.params.recordingId);
      
      if (isNaN(recordingId)) {
        return res.status(400).json({ message: "Invalid recording ID" });
      }

      const removed = await storage.removeFavoriteRecording(userId, recordingId);
      if (!removed) {
        return res.status(404).json({ message: "Recording favorite not found" });
      }

      res.json({ message: "Recording favorite removed successfully" });
    } catch (error) {
      console.error("Error removing recording favorite:", error);
      res.status(500).json({ message: "Failed to remove recording favorite" });
    }
  });

  // Poem Favorites API
  app.get('/api/favorites/poems', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getFavoritePoemsByUserId(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching poem favorites:", error);
      res.status(500).json({ message: "Failed to fetch poem favorites" });
    }
  });

  app.post('/api/favorites/poems/:poemId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const poemId = parseInt(req.params.poemId);
      
      if (isNaN(poemId)) {
        return res.status(400).json({ message: "Invalid poem ID" });
      }

      const isFavorited = await storage.isPoemFavorited(userId, poemId);
      if (isFavorited) {
        return res.status(409).json({ message: "Poem already in favorites" });
      }

      const favorite = await storage.addFavoritePoem(userId, poemId);
      res.json(favorite);
    } catch (error) {
      console.error("Error adding poem favorite:", error);
      res.status(500).json({ message: "Failed to add poem favorite" });
    }
  });

  app.delete('/api/favorites/poems/:poemId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const poemId = parseInt(req.params.poemId);
      
      if (isNaN(poemId)) {
        return res.status(400).json({ message: "Invalid poem ID" });
      }

      const removed = await storage.removeFavoritePoem(userId, poemId);
      if (!removed) {
        return res.status(404).json({ message: "Poem favorite not found" });
      }

      res.json({ message: "Poem favorite removed successfully" });
    } catch (error) {
      console.error("Error removing poem favorite:", error);
      res.status(500).json({ message: "Failed to remove poem favorite" });
    }
  });

  // Poet Favorites API
  app.get('/api/favorites/poet', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorite = await storage.getFavoritePoetByUserId(userId);
      res.json(favorite || null);
    } catch (error) {
      console.error("Error fetching poet favorite:", error);
      res.status(500).json({ message: "Failed to fetch poet favorite" });
    }
  });

  app.post('/api/favorites/poet', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const isFavorited = await storage.isPoetFavorited(userId);
      if (isFavorited) {
        return res.status(409).json({ message: "Poet already in favorites" });
      }

      const favorite = await storage.addFavoritePoet(userId);
      res.json(favorite);
    } catch (error) {
      console.error("Error adding poet favorite:", error);
      res.status(500).json({ message: "Failed to add poet favorite" });
    }
  });

  app.delete('/api/favorites/poet', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const removed = await storage.removeFavoritePoet(userId);
      if (!removed) {
        return res.status(404).json({ message: "Poet favorite not found" });
      }

      res.json({ message: "Poet favorite removed successfully" });
    } catch (error) {
      console.error("Error removing poet favorite:", error);
      res.status(500).json({ message: "Failed to remove poet favorite" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
