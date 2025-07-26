import { boolean, integer, json, pgTable, timestamp, varchar, text } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  role: varchar({ length: 50 }).default('siswa').notNull(), // Pilihan: 'admin', 'guru', 'siswa'
});


export const coursesTable=pgTable("courses",{
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  cid:varchar().notNull().unique(),
  name:varchar(),
  description:varchar(),
  noOfChapters:integer().notNull(),
  includeVideo:boolean().default(false),
  level:varchar().notNull(),
  category:varchar(),
  courseJson:json(),
  bannerImageUrl:varchar().default(''),
  courseContent:json().default({}),
  userEmail:varchar('userEmail').references(()=>usersTable.email).notNull()
});

export const enrollCourseTable=pgTable('enrollCourse',{
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  cid:varchar('cid').references(()=>coursesTable.cid),
  userEmail:varchar('userEmail').references(()=>usersTable.email).notNull(),
  completedChapters:json()
});

export const tasksTable=pgTable("tasks",{
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseId:varchar('courseId').references(()=>coursesTable.cid).notNull(),
  title:varchar({ length: 255 }).notNull(),
  description: text(),
  fileUrl: varchar(),
  createdAt:timestamp('createdAt').defaultNow().notNull(),
  dueDate: timestamp('dueDate')
});

export const submissionsTable=pgTable("submissions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  taskId: integer('taskId').references(()=>tasksTable.id).notNull(),
  studentEmail: varchar('studentEmail').references(()=>usersTable.email).notNull(),
  fileUrl: varchar().notNull(),
  submittedAt: timestamp('submittedAt').defaultNow().notNull(),
  grade:integer()
});
