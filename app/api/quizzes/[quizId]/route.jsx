import { db } from "@/config/db";
import { quizzesTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET: Mengambil detail satu kuis berdasarkan ID
export async function GET(req, { params }) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { quizId } = params;

    try {
        const quiz = await db.select()
            .from(quizzesTable)
            .where(eq(quizzesTable.id, parseInt(quizId)));

        if (quiz.length === 0) {
            return new NextResponse("Quiz not found", { status: 404 });
        }
        
        return NextResponse.json(quiz[0]);
    } catch (error) {
        console.error("Gagal mengambil data kuis:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
