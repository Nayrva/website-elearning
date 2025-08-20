import { db } from "@/config/db";
import { quizSubmissionsTable, usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

async function getUserRole(userEmail) {
    if (!userEmail) return null;
    const user = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    return user.length > 0 ? user[0].role : null;
}

// POST: Menyimpan hasil jawaban kuis
export async function POST(req) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const userEmail = user.primaryEmailAddress.emailAddress;
    const role = await getUserRole(userEmail);

    if (role !== 'siswa') {
        return new NextResponse("Forbidden: Hanya siswa yang dapat mengerjakan kuis", { status: 403 });
    }

    const { quizId, score } = await req.json();
    if (quizId == null || score == null) {
        return new NextResponse("Quiz ID dan Score dibutuhkan", { status: 400 });
    }

    try {
        // Cek apakah siswa sudah pernah mengerjakan kuis ini
        const existingSubmission = await db.select().from(quizSubmissionsTable)
            .where(and(eq(quizSubmissionsTable.quizId, quizId), eq(quizSubmissionsTable.studentEmail, userEmail)));

        if (existingSubmission.length > 0) {
            return new NextResponse("Anda sudah pernah mengerjakan kuis ini.", { status: 409 });
        }

        const newSubmission = await db.insert(quizSubmissionsTable).values({
            quizId,
            studentEmail: userEmail,
            score,
        }).returning();
        
        return NextResponse.json(newSubmission[0], { status: 201 });
    } catch (error) {
        console.error("Gagal menyimpan jawaban kuis:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
