import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const poems = pgTable("poems", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  year: integer("year").notNull(),
  externalLink: text("external_link").notNull(),
  context: text("context").notNull(),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  poemId: integer("poem_id").notNull(),
  readerName: text("reader_name").notNull(),
  email: text("email").notNull(),
  location: text("location"),
  background: text("background"),
  interpretationNote: text("interpretation_note"),
  anonymous: boolean("anonymous").default(false),
  fileName: text("file_name").notNull(),
  originalFileName: text("original_file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  approvalToken: text("approval_token").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const recordings = pgTable("recordings", {
  id: serial("id").primaryKey(),
  poemId: integer("poem_id").notNull(),
  submissionId: integer("submission_id").notNull(),
  readerName: text("reader_name").notNull(),
  location: text("location"),
  background: text("background"),
  interpretationNote: text("interpretation_note"),
  anonymous: boolean("anonymous").default(false),
  fileName: text("file_name").notNull(),
  originalFileName: text("original_file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  approvedAt: timestamp("approved_at").defaultNow(),
});

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for admin authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPoemSchema = createInsertSchema(poems).omit({
  id: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  status: true,
  submittedAt: true,
  reviewedAt: true,
}).extend({
  poemSlug: z.string(),
  location: z.string().optional().transform(val => val || undefined),
  background: z.string().optional().transform(val => val || undefined),
  interpretationNote: z.string().optional().transform(val => val || undefined),
  anonymous: z.coerce.boolean(),
});

export const insertRecordingSchema = createInsertSchema(recordings).omit({
  id: true,
  approvedAt: true,
});

export type Poem = typeof poems.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type Recording = typeof recordings.$inferSelect;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertPoem = z.infer<typeof insertPoemSchema>;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type InsertRecording = z.infer<typeof insertRecordingSchema>;
