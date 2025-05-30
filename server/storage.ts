import { poems, submissions, recordings, users, type Poem, type Submission, type Recording, type User, type UpsertUser, type InsertPoem, type InsertSubmission, type InsertRecording } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
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
  
  // Users (for authentication)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
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

  // Poem operations
  async getPoems(): Promise<Poem[]> {
    return await db.select().from(poems);
  }

  async getPoemBySlug(slug: string): Promise<Poem | undefined> {
    const [poem] = await db.select().from(poems).where(eq(poems.slug, slug));
    return poem;
  }

  async createPoem(insertPoem: InsertPoem): Promise<Poem> {
    const [poem] = await db.insert(poems).values(insertPoem).returning();
    return poem;
  }

  // Submission operations
  async getSubmissions(): Promise<Submission[]> {
    return await db.select().from(submissions);
  }

  async getSubmissionsByStatus(status: string): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.status, status));
  }

  async getSubmissionByToken(token: string): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.approvalToken, token));
    return submission;
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const [submission] = await db.insert(submissions).values(insertSubmission).returning();
    return submission;
  }

  async updateSubmissionStatus(id: number, status: string, reviewedAt?: Date): Promise<Submission | undefined> {
    const [submission] = await db
      .update(submissions)
      .set({ status, reviewedAt: reviewedAt || new Date() })
      .where(eq(submissions.id, id))
      .returning();
    return submission;
  }

  // Recording operations
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
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();