import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

// Fungsi helper untuk memeriksa apakah pengguna adalah admin
async function isAdmin(userEmail) {
    if (!userEmail) return false;
    const user = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    return user && user.length > 0 && user[0].role === 'admin';
}

// GET: Mengambil semua data pengguna (hanya untuk admin)
export async function GET(req) {
    const user = await currentUser();
    if (!user || !(await isAdmin(user.primaryEmailAddress.emailAddress))) {
        return new NextResponse("Forbidden: Akses ditolak", { status: 403 });
    }
    
    const allUsers = await db.select().from(usersTable).orderBy(asc(usersTable.id));
    return NextResponse.json(allUsers);
}

// PUT: Memperbarui peran pengguna (hanya untuk admin)
export async function PUT(req) {
    const user = await currentUser();
    if (!user || !(await isAdmin(user.primaryEmailAddress.emailAddress))) {
        return new NextResponse("Forbidden: Akses ditolak", { status: 403 });
    }

    const { email, role } = await req.json();

    // Validasi input
    if (!email || !role) {
        return new NextResponse("Email dan peran dibutuhkan", { status: 400 });
    }
    if (!['admin', 'guru', 'siswa'].includes(role)) {
        return new NextResponse("Peran tidak valid", { status: 400 });
    }

    try {
        const updatedUser = await db.update(usersTable)
            .set({ role })
            .where(eq(usersTable.email, email))
            .returning();

        if (updatedUser.length === 0) {
            return new NextResponse("Pengguna tidak ditemukan", { status: 404 });
        }

        return NextResponse.json(updatedUser[0]);
    } catch (error) {
        console.error("Gagal memperbarui peran:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}