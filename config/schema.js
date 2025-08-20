import { boolean, integer, json, pgTable, timestamp, varchar, text } from "drizzle-orm/pg-core";

// Tabel Pengguna (Tetap sama)
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  role: varchar({ length: 50 }).default('siswa').notNull(), // Pilihan: 'admin', 'guru', 'siswa'
});

// Tabel Kelas Baru
export const kelasTable = pgTable("kelas", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    cid: varchar().notNull().unique(), // Class ID unik
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    teacherEmail: varchar('teacherEmail').references(() => usersTable.email).notNull(),
});

// Tabel untuk menghubungkan siswa ke kelas
export const enrollmentsTable = pgTable("enrollments", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    kelasCid: varchar('kelasCid').references(() => kelasTable.cid).notNull(),
    studentEmail: varchar('studentEmail').references(() => usersTable.email).notNull(),
});

// Tabel Materi Baru
export const materiTable = pgTable("materi", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    fileUrl: varchar(),
    kelasCid: varchar('kelasCid').references(() => kelasTable.cid).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// Tabel Tugas (Diperbarui untuk terhubung ke kelas)
export const tasksTable = pgTable("tasks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  kelasCid: varchar('kelasCid').references(() => kelasTable.cid).notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  fileUrl: varchar(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  dueDate: timestamp('dueDate')
});

// Tabel Jawaban Tugas (Tetap sama)
export const submissionsTable = pgTable("submissions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  taskId: integer('taskId').references(()=>tasksTable.id).notNull(),
  studentEmail: varchar('studentEmail').references(()=>usersTable.email).notNull(),
  fileUrl: varchar().notNull(),
  submittedAt: timestamp('submittedAt').defaultNow().notNull(),
  grade:integer()
});

// Tabel Kuis (Diperbarui untuk terhubung ke kelas)
export const quizzesTable = pgTable("quizzes", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    kelasCid: varchar('kelasCid').references(() => kelasTable.cid).notNull(),
    title: varchar({ length: 255 }).notNull(),
    quizJson: json(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// Tabel Jawaban Kuis (Tetap sama)
export const quizSubmissionsTable = pgTable("quizSubmissions", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    quizId: integer('quizId').references(() => quizzesTable.id).notNull(),
    studentEmail: varchar('studentEmail').references(() => usersTable.email).notNull(),
    score: integer().notNull(),
    submittedAt: timestamp('submittedAt').defaultNow().notNull(),
});
