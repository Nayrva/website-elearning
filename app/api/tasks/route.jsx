import { db } from "@/config/db";
import { tasksTable, usersTable, enrollCourseTable, coursesTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

// Fungsi helper untuk memeriksa peran pengguna
async function getUserRole(userEmail) {
    if (!userEmail) return null;
    const user = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    return user.length > 0 ? user[0].role : null;
}

// GET: Mengambil daftar tugas
export async function GET(req) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const userEmail = user.primaryEmailAddress.emailAddress;
    const role = await getUserRole(userEmail);

    try {
        if (role === 'guru' || role === 'admin') {
            // Guru/Admin melihat semua tugas dari kursus yang mereka buat
            const teacherCourses = await db.select({ cid: coursesTable.cid }).from(coursesTable).where(eq(coursesTable.userEmail, userEmail));
            const courseIds = teacherCourses.map(c => c.cid);
            
            if (courseIds.length === 0) {
                return NextResponse.json([]);
            }

            const tasks = await db.select().from(tasksTable).where(inArray(tasksTable.courseId, courseIds));
            return NextResponse.json(tasks);

        } else if (role === 'siswa') {
            // Siswa melihat tugas dari kursus yang mereka ikuti
            const enrolledCourses = await db.select({ cid: enrollCourseTable.cid }).from(enrollCourseTable).where(eq(enrollCourseTable.userEmail, userEmail));
            const courseIds = enrolledCourses.map(ec => ec.cid);
            
            if (courseIds.length === 0) {
                return NextResponse.json([]);
            }

            const tasks = await db.select().from(tasksTable).where(inArray(tasksTable.courseId, courseIds));
            return NextResponse.json(tasks);
        } else {
            return new NextResponse("Forbidden", { status: 403 });
        }
    } catch (error) {
        console.error("Gagal mengambil tugas:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// POST: Membuat tugas baru (hanya untuk guru)
export async function POST(req) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const userEmail = user.primaryEmailAddress.emailAddress;
    const role = await getUserRole(userEmail);

    if (role !== 'guru' && role !== 'admin') {
        return new NextResponse("Forbidden: Hanya guru atau admin yang dapat membuat tugas", { status: 403 });
    }
    
    const { courseId, title, description, fileUrl, dueDate } = await req.json();

    if (!courseId || !title) {
        return new NextResponse("Judul dan ID Kursus dibutuhkan", { status: 400 });
    }

    try {
        const newTask = await db.insert(tasksTable).values({
            courseId,
            title,
            description,
            fileUrl,
            dueDate: dueDate ? new Date(dueDate) : null
        }).returning();

        return NextResponse.json(newTask[0]);
    } catch (error) {
        console.error("Gagal membuat tugas:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}