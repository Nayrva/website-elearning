import { db } from "@/config/db";
import { usersTable, materiTable, tasksTable, quizzesTable, enrollmentsTable, kelasTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, count, and, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

async function getUserRole(userEmail) {
    if (!userEmail) return null;
    const user = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    return user.length > 0 ? user[0].role : null;
}

export async function GET(req) {
    const user = await currentUser();
    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
    const role = await getUserRole(userEmail);

    if (role !== 'guru') {
        return new NextResponse("Forbidden: Hanya guru yang dapat mengakses statistik ini", { status: 403 });
    }

    try {
        // Get kelas owned by the teacher
        const teacherKelas = await db.select({ cid: kelasTable.cid }).from(kelasTable).where(eq(kelasTable.teacherEmail, userEmail));
        const kelasCids = teacherKelas.map(k => k.cid);

        if (kelasCids.length === 0) {
            return NextResponse.json({
                totalSiswa: 0,
                totalMateri: 0,
                totalTugasKuis: 0,
            });
        }

        const totalSiswa = await db.select({ value: count() }).from(enrollmentsTable).where(inArray(enrollmentsTable.kelasCid, kelasCids));
        const totalMateri = await db.select({ value: count() }).from(materiTable).where(inArray(materiTable.kelasCid, kelasCids));
        const totalTugas = await db.select({ value: count() }).from(tasksTable).where(inArray(tasksTable.kelasCid, kelasCids));
        const totalKuis = await db.select({ value: count() }).from(quizzesTable).where(inArray(quizzesTable.kelasCid, kelasCids));

        return NextResponse.json({
            totalSiswa: totalSiswa[0].value,
            totalMateri: totalMateri[0].value,
            totalTugasKuis: totalTugas[0].value + totalKuis[0].value,
        });
    } catch (error) {
        console.error("Gagal mengambil statistik guru:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}