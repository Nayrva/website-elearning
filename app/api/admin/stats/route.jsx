import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, count } from "drizzle-orm";
import { NextResponse } from "next/server";

// Fungsi helper untuk memeriksa apakah pengguna adalah admin
async function isAdmin(userEmail) {
    if (!userEmail) return false;
    const user = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    return user && user.length > 0 && user[0].role === 'admin';
}

export async function GET(req) {
    const user = await currentUser();
    if (!user || !(await isAdmin(user.primaryEmailAddress.emailAddress))) {
        return new NextResponse("Forbidden: Akses ditolak", { status: 403 });
    }

    try {
        const totalUsers = await db.select({ value: count() }).from(usersTable);
        const totalGuru = await db.select({ value: count() }).from(usersTable).where(eq(usersTable.role, 'guru'));
        const totalSiswa = await db.select({ value: count() }).from(usersTable).where(eq(usersTable.role, 'siswa'));

        return NextResponse.json({
            total: totalUsers[0].value,
            guru: totalGuru[0].value,
            siswa: totalSiswa[0].value,
        });
    } catch (error) {
        console.error("Gagal mengambil statistik:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
