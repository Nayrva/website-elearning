import { db } from "@/config/db";
import { submissionsTable, usersTable, tasksTable, coursesTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

// Fungsi helper untuk memeriksa peran pengguna
async function getUserRole(userEmail) {
    if (!userEmail) return null;
    const user = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    return user.length > 0 ? user[0].role : null;
}

// GET: Mengambil data jawaban
export async function GET(req) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const userEmail = user.primaryEmailAddress.emailAddress;
    const role = await getUserRole(userEmail);
    const { searchParams } = new URL(req.url);

    try {
        if (role === 'siswa' && searchParams.get('student') === 'me') {
            // Siswa mengambil semua jawabannya
            const studentSubmissions = await db.select().from(submissionsTable).where(eq(submissionsTable.studentEmail, userEmail));
            return NextResponse.json(studentSubmissions);
        } else if (role === 'guru' || role === 'admin') {
            // Guru/Admin mengambil semua jawaban untuk tugas-tugas yang mereka buat
            const teacherCourses = await db.select({ cid: coursesTable.cid }).from(coursesTable).where(eq(coursesTable.userEmail, userEmail));
            const courseIds = teacherCourses.map(c => c.cid);
            if (courseIds.length === 0) return NextResponse.json([]);

            const teacherTasks = await db.select({ id: tasksTable.id }).from(tasksTable).where(inArray(tasksTable.courseId, courseIds));
            const taskIds = teacherTasks.map(t => t.id);
            if (taskIds.length === 0) return NextResponse.json([]);
            
            const submissions = await db.select().from(submissionsTable).where(inArray(submissionsTable.taskId, taskIds));
            return NextResponse.json(submissions);
        } else {
             return new NextResponse("Forbidden", { status: 403 });
        }
    } catch (error) {
        console.error("Gagal mengambil jawaban:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// POST: Mengunggah jawaban (hanya untuk siswa)
export async function POST(req) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const userEmail = user.primaryEmailAddress.emailAddress;
    const role = await getUserRole(userEmail);

    if (role !== 'siswa') {
        return new NextResponse("Forbidden: Hanya siswa yang dapat mengunggah jawaban", { status: 403 });
    }

    const { taskId, fileUrl } = await req.json();
    if (!taskId || !fileUrl) {
        return new NextResponse("ID Tugas dan URL File dibutuhkan", { status: 400 });
    }

    try {
        // Cek apakah sudah pernah submit
        const existingSubmission = await db.select().from(submissionsTable).where(and(eq(submissionsTable.taskId, taskId), eq(submissionsTable.studentEmail, userEmail)));
        if (existingSubmission.length > 0) {
            return new NextResponse("Anda sudah mengumpulkan jawaban untuk tugas ini", { status: 409 });
        }

        const newSubmission = await db.insert(submissionsTable).values({
            taskId,
            studentEmail: userEmail,
            fileUrl,
        }).returning();
        return NextResponse.json(newSubmission[0]);
    } catch (error) {
        console.error("Gagal mengunggah jawaban:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// PUT: Memberi nilai pada jawaban (hanya untuk guru)
export async function PUT(req) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const userEmail = user.primaryEmailAddress.emailAddress;
    const role = await getUserRole(userEmail);

    if (role !== 'guru' && role !== 'admin') {
        return new NextResponse("Forbidden: Hanya guru atau admin yang dapat memberi nilai", { status: 403 });
    }

    const { submissionId, grade } = await req.json();
    if (submissionId == null || grade == null) {
        return new NextResponse("ID Jawaban dan Nilai dibutuhkan", { status: 400 });
    }

    try {
        const updatedSubmission = await db.update(submissionsTable)
            .set({ grade })
            .where(eq(submissionsTable.id, submissionId))
            .returning();

        if (updatedSubmission.length === 0) {
            return new NextResponse("Jawaban tidak ditemukan", { status: 404 });
        }
        return NextResponse.json(updatedSubmission[0]);
    } catch (error) {
        console.error("Gagal menyimpan nilai:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}