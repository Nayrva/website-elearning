import { db } from "@/config/db";
import { usersTable, materiTable, tasksTable, quizzesTable, enrollmentsTable, kelasTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and, inArray, desc, limit } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req) {
    const user = await currentUser();
    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;

    try {
        const studentEnrollments = await db.select({ kelasCid: enrollmentsTable.kelasCid }).from(enrollmentsTable).where(eq(enrollmentsTable.studentEmail, userEmail));
        const kelasCids = studentEnrollments.map(e => e.kelasCid);

        if (kelasCids.length === 0) {
            return NextResponse.json({
                materiTerbaru: [],
                tugasKuisTerbaru: [],
            });
        }

        const materiTerbaru = await db.select({
            id: materiTable.id,
            title: materiTable.title,
            kelasName: kelasTable.name,
            createdAt: materiTable.createdAt
        })
        .from(materiTable)
        .leftJoin(kelasTable, eq(materiTable.kelasCid, kelasTable.cid))
        .where(inArray(materiTable.kelasCid, kelasCids))
        .orderBy(desc(materiTable.createdAt))
        .limit(5);

        const tugasTerbaru = await db.select({
            id: tasksTable.id,
            title: tasksTable.title,
            kelasName: kelasTable.name,
            createdAt: tasksTable.createdAt,
            type: 'task'
        })
        .from(tasksTable)
        .leftJoin(kelasTable, eq(tasksTable.kelasCid, kelasTable.cid))
        .where(inArray(tasksTable.kelasCid, kelasCids))
        .orderBy(desc(tasksTable.createdAt))
        .limit(5);

        const kuisTerbaru = await db.select({
            id: quizzesTable.id,
            title: quizzesTable.title,
            kelasName: kelasTable.name,
            createdAt: quizzesTable.createdAt,
            type: 'quiz'
        })
        .from(quizzesTable)
        .leftJoin(kelasTable, eq(quizzesTable.kelasCid, kelasTable.cid))
        .where(inArray(quizzesTable.kelasCid, kelasCids))
        .orderBy(desc(quizzesTable.createdAt))
        .limit(5);
        
        const tugasKuisTerbaru = [...tugasTerbaru, ...kuisTerbaru]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        return NextResponse.json({
            materiTerbaru,
            tugasKuisTerbaru,
        });

    } catch (error) {
        console.error("Gagal mengambil data dashboard siswa:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}