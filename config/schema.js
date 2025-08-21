import { boolean, integer, json, pgTable, timestamp, varchar, text } from "drizzle-orm/pg-core";

// Tabel Pengguna (Diperbarui)
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  username: varchar({ length: 100 }).unique(),
  role: varchar({ length: 50 }).default('siswa').notNull(), 
});

// Tabel Kelas
export const kelasTable = pgTable("kelas", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    cid: varchar().notNull().unique(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    teacherEmail: varchar('teacherEmail').references(() => usersTable.email).notNull(),
});

// Tabel Pendaftaran Siswa di Kelas (Diperbarui)
export const enrollmentsTable = pgTable("enrollments", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    kelasCid: varchar('kelasCid').references(() => kelasTable.cid, { onDelete: 'cascade' }).notNull(),
    studentEmail: varchar('studentEmail').references(() => usersTable.email, { onDelete: 'cascade' }).notNull(),
});

// Tabel Materi (Diperbarui)
export const materiTable = pgTable("materi", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    fileUrl: varchar(),
    kelasCid: varchar('kelasCid').references(() => kelasTable.cid, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// Tabel Tugas (Diperbarui)
export const tasksTable = pgTable("tasks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  kelasCid: varchar('kelasCid').references(() => kelasTable.cid, { onDelete: 'cascade' }).notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  fileUrl: varchar(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  dueDate: timestamp('dueDate')
});

// Tabel Jawaban Tugas (Diperbarui)
export const submissionsTable = pgTable("submissions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  taskId: integer('taskId').references(()=>tasksTable.id, { onDelete: 'cascade' }).notNull(),
  studentEmail: varchar('studentEmail').references(()=>usersTable.email, { onDelete: 'cascade' }).notNull(),
  fileUrl: varchar().notNull(),
  submittedAt: timestamp('submittedAt').defaultNow().notNull(),
  grade:integer()
});

// Tabel Kuis (Diperbarui)
export const quizzesTable = pgTable("quizzes", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    kelasCid: varchar('kelasCid').references(() => kelasTable.cid, { onDelete: 'cascade' }).notNull(),
    title: varchar({ length: 255 }).notNull(),
    quizJson: json(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// Tabel Jawaban Kuis (Diperbarui)
export const quizSubmissionsTable = pgTable("quizSubmissions", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    quizId: integer('quizId').references(() => quizzesTable.id, { onDelete: 'cascade' }).notNull(),
    studentEmail: varchar('studentEmail').references(() => usersTable.email, { onDelete: 'cascade' }).notNull(),
    score: integer().notNull(),
    submittedAt: timestamp('submittedAt').defaultNow().notNull(),
});