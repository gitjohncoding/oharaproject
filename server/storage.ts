import { poems, submissions, recordings, favoriteRecordings, favoritePoems, favoritePoet, users, type Poem, type Submission, type Recording, type FavoriteRecording, type FavoritePoem, type FavoritePoet, type User, type UpsertUser, type InsertPoem, type InsertSubmission, type InsertRecording, type InsertFavoriteRecording, type InsertFavoritePoem, type InsertFavoritePoet } from "@shared/schema";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Poems
  getPoems(): Promise<Poem[]>;
  getPoemBySlug(slug: string): Promise<Poem | undefined>;
  createPoem(poem: InsertPoem): Promise<Poem>;
  
  // Submissions
  getSubmissions(): Promise<Submission[]>;
  getSubmissionsByStatus(status: string): Promise<Submission[]>;
  getSubmissionByToken(token: string): Promise<Submission | undefined>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmissionStatus(id: number, status: string, reviewedAt?: Date): Promise<Submission | undefined>;
  
  // Recordings
  getRecordings(): Promise<Recording[]>;
  getRecordingsByPoemId(poemId: number): Promise<Recording[]>;
  createRecording(recording: InsertRecording): Promise<Recording>;
  deleteRecording(id: number): Promise<boolean>;
  
  // Recording Favorites
  getFavoriteRecordingsByUserId(userId: string): Promise<FavoriteRecording[]>;
  addFavoriteRecording(userId: string, recordingId: number): Promise<FavoriteRecording>;
  removeFavoriteRecording(userId: string, recordingId: number): Promise<boolean>;
  isRecordingFavorited(userId: string, recordingId: number): Promise<boolean>;
  
  // Poem Favorites
  getFavoritePoemsByUserId(userId: string): Promise<FavoritePoem[]>;
  addFavoritePoem(userId: string, poemId: number): Promise<FavoritePoem>;
  removeFavoritePoem(userId: string, poemId: number): Promise<boolean>;
  isPoemFavorited(userId: string, poemId: number): Promise<boolean>;
  
  // Poet Favorites
  getFavoritePoetByUserId(userId: string): Promise<FavoritePoet | undefined>;
  addFavoritePoet(userId: string): Promise<FavoritePoet>;
  removeFavoritePoet(userId: string): Promise<boolean>;
  isPoetFavorited(userId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private poems: Map<number, Poem>;
  private submissions: Map<number, Submission>;
  private recordings: Map<number, Recording>;
  private currentPoemId: number;
  private currentSubmissionId: number;
  private currentRecordingId: number;

  constructor() {
    this.poems = new Map();
    this.submissions = new Map();
    this.recordings = new Map();
    this.currentPoemId = 1;
    this.currentSubmissionId = 1;
    this.currentRecordingId = 1;
    
    // Initialize with the two poems
    this.initializePoems();
  }

  // User operations (stub methods for interface compliance)
  async getUser(id: string): Promise<User | undefined> {
    return undefined;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    throw new Error("MemStorage users not implemented");
  }

  private initializePoems() {
    const initialPoems: InsertPoem[] = [
      {
        title: "Having a Coke With You",
        slug: "having-a-coke-with-you",
        year: 1960,
        externalLink: "https://poets.org/poem/having-coke-you",
        context: "A love poem that captures an intimate moment of urban life"
      },
      {
        title: "Ave Maria",
        slug: "ave-maria",
        year: 1960,
        externalLink: "https://www.poetryfoundation.org/poems/42670/ave-maria",
        context: "A playful poem about movies, mothers, and growing up"
      }
    ];

    initialPoems.forEach(poem => {
      const id = this.currentPoemId++;
      this.poems.set(id, { ...poem, id });
    });
  }

  async getPoems(): Promise<Poem[]> {
    return Array.from(this.poems.values());
  }

  async getPoemBySlug(slug: string): Promise<Poem | undefined> {
    return Array.from(this.poems.values()).find(poem => poem.slug === slug);
  }

  async createPoem(insertPoem: InsertPoem): Promise<Poem> {
    const id = this.currentPoemId++;
    const poem: Poem = { ...insertPoem, id };
    this.poems.set(id, poem);
    return poem;
  }

  async getSubmissions(): Promise<Submission[]> {
    return Array.from(this.submissions.values());
  }

  async getSubmissionsByStatus(status: string): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(sub => sub.status === status);
  }

  async getSubmissionByToken(token: string): Promise<Submission | undefined> {
    return Array.from(this.submissions.values()).find(sub => sub.approvalToken === token);
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = this.currentSubmissionId++;
    const submission: Submission = {
      poemId: insertSubmission.poemId,
      readerName: insertSubmission.readerName,
      email: insertSubmission.email,
      location: insertSubmission.location || null,
      background: insertSubmission.background || null,
      interpretationNote: insertSubmission.interpretationNote || null,
      anonymous: insertSubmission.anonymous || false,
      fileName: insertSubmission.fileName,
      originalFileName: insertSubmission.originalFileName,
      fileSize: insertSubmission.fileSize,
      mimeType: insertSubmission.mimeType,
      approvalToken: insertSubmission.approvalToken,
      id,
      status: "pending",
      submittedAt: new Date(),
      reviewedAt: null
    };
    this.submissions.set(id, submission);
    return submission;
  }

  async updateSubmissionStatus(id: number, status: string, reviewedAt?: Date): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    if (!submission) return undefined;

    const updated: Submission = {
      ...submission,
      status,
      reviewedAt: reviewedAt || new Date()
    };
    this.submissions.set(id, updated);
    return updated;
  }

  async getRecordings(): Promise<Recording[]> {
    return Array.from(this.recordings.values());
  }

  async getRecordingsByPoemId(poemId: number): Promise<Recording[]> {
    return Array.from(this.recordings.values()).filter(rec => rec.poemId === poemId);
  }

  async createRecording(insertRecording: InsertRecording): Promise<Recording> {
    const id = this.currentRecordingId++;
    const recording: Recording = {
      poemId: insertRecording.poemId,
      submissionId: insertRecording.submissionId,
      readerName: insertRecording.readerName,
      location: insertRecording.location || null,
      background: insertRecording.background || null,
      interpretationNote: insertRecording.interpretationNote || null,
      anonymous: insertRecording.anonymous || false,
      fileName: insertRecording.fileName,
      originalFileName: insertRecording.originalFileName,
      fileSize: insertRecording.fileSize,
      mimeType: insertRecording.mimeType,
      id,
      approvedAt: new Date()
    };
    this.recordings.set(id, recording);
    return recording;
  }

  async deleteRecording(id: number): Promise<boolean> {
    return this.recordings.delete(id);
  }

  // Recording Favorites (stub methods for interface compliance)
  async getFavoriteRecordingsByUserId(userId: string): Promise<FavoriteRecording[]> {
    return [];
  }

  async addFavoriteRecording(userId: string, recordingId: number): Promise<FavoriteRecording> {
    throw new Error("MemStorage favorites not implemented");
  }

  async removeFavoriteRecording(userId: string, recordingId: number): Promise<boolean> {
    return false;
  }

  async isRecordingFavorited(userId: string, recordingId: number): Promise<boolean> {
    return false;
  }

  // Poem Favorites (stub methods)
  async getFavoritePoemsByUserId(userId: string): Promise<FavoritePoem[]> {
    return [];
  }

  async addFavoritePoem(userId: string, poemId: number): Promise<FavoritePoem> {
    throw new Error("MemStorage favorites not implemented");
  }

  async removeFavoritePoem(userId: string, poemId: number): Promise<boolean> {
    return false;
  }

  async isPoemFavorited(userId: string, poemId: number): Promise<boolean> {
    return false;
  }

  // Poet Favorites (stub methods)
  async getFavoritePoetByUserId(userId: string): Promise<FavoritePoet | undefined> {
    return undefined;
  }

  async addFavoritePoet(userId: string): Promise<FavoritePoet> {
    throw new Error("MemStorage favorites not implemented");
  }

  async removeFavoritePoet(userId: string): Promise<boolean> {
    return false;
  }

  async isPoetFavorited(userId: string): Promise<boolean> {
    return false;
  }
}

import { db } from "./db";
import { eq, and } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getPoems(): Promise<Poem[]> {
    return await db.select().from(poems);
  }

  async getPoemBySlug(slug: string): Promise<Poem | undefined> {
    const [poem] = await db.select().from(poems).where(eq(poems.slug, slug));
    return poem || undefined;
  }

  async createPoem(insertPoem: InsertPoem): Promise<Poem> {
    const [poem] = await db.insert(poems).values(insertPoem).returning();
    return poem;
  }

  async getSubmissions(): Promise<Submission[]> {
    return await db.select().from(submissions);
  }

  async getSubmissionsByStatus(status: string): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.status, status));
  }

  async getSubmissionByToken(token: string): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.approvalToken, token));
    return submission || undefined;
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const [submission] = await db.insert(submissions).values(insertSubmission).returning();
    return submission;
  }

  async updateSubmissionStatus(id: number, status: string, reviewedAt?: Date): Promise<Submission | undefined> {
    const [submission] = await db
      .update(submissions)
      .set({ status, reviewedAt })
      .where(eq(submissions.id, id))
      .returning();
    return submission || undefined;
  }

  async getRecordings(): Promise<Recording[]> {
    return await db.select().from(recordings);
  }

  async getRecordingsByPoemId(poemId: number): Promise<Recording[]> {
    return await db.select().from(recordings).where(eq(recordings.poemId, poemId));
  }

  async createRecording(insertRecording: InsertRecording): Promise<Recording> {
    const [recording] = await db.insert(recordings).values(insertRecording).returning();
    return recording;
  }

  async deleteRecording(id: number): Promise<boolean> {
    const result = await db.delete(recordings).where(eq(recordings.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Recording Favorites
  async getFavoriteRecordingsByUserId(userId: string): Promise<FavoriteRecording[]> {
    return await db.select().from(favoriteRecordings).where(eq(favoriteRecordings.userId, userId));
  }

  async addFavoriteRecording(userId: string, recordingId: number): Promise<FavoriteRecording> {
    const [favorite] = await db.insert(favoriteRecordings).values({ userId, recordingId }).returning();
    return favorite;
  }

  async removeFavoriteRecording(userId: string, recordingId: number): Promise<boolean> {
    const result = await db.delete(favoriteRecordings).where(
      and(eq(favoriteRecordings.userId, userId), eq(favoriteRecordings.recordingId, recordingId))
    );
    return (result.rowCount || 0) > 0;
  }

  async isRecordingFavorited(userId: string, recordingId: number): Promise<boolean> {
    const [favorite] = await db.select().from(favoriteRecordings).where(
      and(eq(favoriteRecordings.userId, userId), eq(favoriteRecordings.recordingId, recordingId))
    );
    return !!favorite;
  }

  // Poem Favorites
  async getFavoritePoemsByUserId(userId: string): Promise<FavoritePoem[]> {
    return await db.select().from(favoritePoems).where(eq(favoritePoems.userId, userId));
  }

  async addFavoritePoem(userId: string, poemId: number): Promise<FavoritePoem> {
    const [favorite] = await db.insert(favoritePoems).values({ userId, poemId }).returning();
    return favorite;
  }

  async removeFavoritePoem(userId: string, poemId: number): Promise<boolean> {
    const result = await db.delete(favoritePoems).where(
      and(eq(favoritePoems.userId, userId), eq(favoritePoems.poemId, poemId))
    );
    return (result.rowCount || 0) > 0;
  }

  async isPoemFavorited(userId: string, poemId: number): Promise<boolean> {
    const [favorite] = await db.select().from(favoritePoems).where(
      and(eq(favoritePoems.userId, userId), eq(favoritePoems.poemId, poemId))
    );
    return !!favorite;
  }

  // Poet Favorites
  async getFavoritePoetByUserId(userId: string): Promise<FavoritePoet | undefined> {
    const [favorite] = await db.select().from(favoritePoet).where(eq(favoritePoet.userId, userId));
    return favorite;
  }

  async addFavoritePoet(userId: string): Promise<FavoritePoet> {
    const [favorite] = await db.insert(favoritePoet).values({ userId }).returning();
    return favorite;
  }

  async removeFavoritePoet(userId: string): Promise<boolean> {
    const result = await db.delete(favoritePoet).where(eq(favoritePoet.userId, userId));
    return (result.rowCount || 0) > 0;
  }

  async isPoetFavorited(userId: string): Promise<boolean> {
    const [favorite] = await db.select().from(favoritePoet).where(eq(favoritePoet.userId, userId));
    return !!favorite;
  }
}

export const storage = new DatabaseStorage();
