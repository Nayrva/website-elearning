import { db } from "@/config/db";
import { tasksTable, usersTable, enrollmentsTable, kelasTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and, inArray, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

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
    
    try {
        // Mengambil semua tugas dan menggabungkannya dengan tabel kelas
        const tasksWithClassName = await db.select({
            id: tasksTable.id,
            title: tasksTable.title,
            description: tasksTable.description,
            dueDate: tasksTable.dueDate,
            createdAt: tasksTable.createdAt,
            kelasName: kelasTable.name
        })
        .from(tasksTable)
        .leftJoin(kelasTable, eq(tasksTable.kelasCid, kelasTable.cid))
        .orderBy(desc(tasksTable.id));

        return NextResponse.json(tasksWithClassName);

    } catch (error) {
        console.error("Gagal mengambil tugas:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// POST: Membuat tugas baru
export async function POST(req) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const userEmail = user.primaryEmailAddress.emailAddress;
    const role = await getUserRole(userEmail);

    if (role !== 'guru' && role !== 'admin') {
        return new NextResponse("Forbidden: Hanya guru atau admin yang dapat membuat tugas", { status: 403 });
    }
    
    const { kelasCid, title, description, fileUrl, dueDate } = await req.json();

    if (!kelasCid || !title) {
        return new NextResponse("Judul dan Kelas dibutuhkan", { status: 400 });
    }

    try {
        const newTask = await db.insert(tasksTable).values({
            kelasCid,
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
