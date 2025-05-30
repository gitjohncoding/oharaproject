import { poems, submissions, recordings, type Poem, type Submission, type Recording, type InsertPoem, type InsertSubmission, type InsertRecording } from "@shared/schema";

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
      ...insertSubmission,
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
      ...insertRecording,
      id,
      approvedAt: new Date()
    };
    this.recordings.set(id, recording);
    return recording;
  }

  async deleteRecording(id: number): Promise<boolean> {
    return this.recordings.delete(id);
  }
}

export const storage = new MemStorage();
