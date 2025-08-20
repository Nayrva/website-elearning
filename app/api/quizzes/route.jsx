import { db } from "@/config/db";
import { quizzesTable, kelasTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET: Mengambil semua kuis beserta nama kelasnya
export async function GET(req) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    try {
        // Mengambil semua kuis dan menggabungkannya dengan tabel kelas untuk mendapatkan nama kelas
        const quizList = await db.select({
            id: quizzesTable.id,
            title: quizzesTable.title,
            createdAt: quizzesTable.createdAt,
            kelasName: kelasTable.name // Mengambil nama dari tabel kelas
        })
        .from(quizzesTable)
        .leftJoin(kelasTable, eq(quizzesTable.kelasCid, kelasTable.cid))
        .orderBy(desc(quizzesTable.id));
        
        return NextResponse.json(quizList);
    } catch (error) {
        console.error("Gagal mengambil data kuis:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
