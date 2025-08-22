import { db } from "@/config/db";
import { quizzesTable, kelasTable, usersTable, enrollmentsTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, desc, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

async function getUserRole(userEmail) {
    if (!userEmail) return null;
    const user = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    return user.length > 0 ? user[0].role : null;
}

// GET: Mengambil semua kuis beserta nama kelasnya
export async function GET(req) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const userEmail = user.primaryEmailAddress.emailAddress;
    const role = await getUserRole(userEmail);

    try {
        let quizList;

        if (role === 'guru') {
            const teacherKelas = await db.select({ cid: kelasTable.cid }).from(kelasTable).where(eq(kelasTable.teacherEmail, userEmail));
            const kelasCids = teacherKelas.map(k => k.cid);
            if (kelasCids.length === 0) return NextResponse.json([]);
            quizList = await db.select({
                id: quizzesTable.id,
                title: quizzesTable.title,
                createdAt: quizzesTable.createdAt,
                kelasName: kelasTable.name
            })
            .from(quizzesTable)
            .leftJoin(kelasTable, eq(quizzesTable.kelasCid, kelasTable.cid))
            .where(inArray(quizzesTable.kelasCid, kelasCids))
            .orderBy(desc(quizzesTable.id));
        } else if (role === 'siswa') {
            const studentEnrollments = await db.select({ kelasCid: enrollmentsTable.kelasCid }).from(enrollmentsTable).where(eq(enrollmentsTable.studentEmail, userEmail));
            const kelasCids = studentEnrollments.map(e => e.kelasCid);
            if (kelasCids.length === 0) return NextResponse.json([]);
            quizList = await db.select({
                id: quizzesTable.id,
                title: quizzesTable.title,
                createdAt: quizzesTable.createdAt,
                kelasName: kelasTable.name
            })
            .from(quizzesTable)
            .leftJoin(kelasTable, eq(quizzesTable.kelasCid, kelasTable.cid))
            .where(inArray(quizzesTable.kelasCid, kelasCids))
            .orderBy(desc(quizzesTable.id));
        } else { // admin
            quizList = await db.select({
                id: quizzesTable.id,
                title: quizzesTable.title,
                createdAt: quizzesTable.createdAt,
                kelasName: kelasTable.name
            })
            .from(quizzesTable)
            .leftJoin(kelasTable, eq(quizzesTable.kelasCid, kelasTable.cid))
            .orderBy(desc(quizzesTable.id));
        }

        return NextResponse.json(quizList);
    } catch (error) {
        console.error("Gagal mengambil data kuis:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}