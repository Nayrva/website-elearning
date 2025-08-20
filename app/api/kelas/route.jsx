import { db } from "@/config/db";
import { kelasTable, usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';

// Fungsi helper untuk memeriksa peran pengguna
async function getUserRole(userEmail) {
    if (!userEmail) return null;
    const user = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    return user.length > 0 ? user[0].role : null;
}

// GET: Mengambil semua kelas
export async function GET(req) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const kelasList = await db.select().from(kelasTable).orderBy(desc(kelasTable.id));
        return NextResponse.json(kelasList);
    } catch (error) {
        console.error("Gagal mengambil data kelas:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// POST: Membuat kelas baru
export async function POST(req) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const userEmail = user.primaryEmailAddress.emailAddress;
    const role = await getUserRole(userEmail);

    if (role !== 'guru' && role !== 'admin') {
        return new NextResponse("Forbidden: Hanya guru atau admin yang dapat membuat kelas", { status: 403 });
    }

    const { name, description } = await req.json();
    if (!name) {
        return new NextResponse("Nama kelas dibutuhkan", { status: 400 });
    }

    try {
        const newKelas = await db.insert(kelasTable).values({
            cid: uuidv4(),
            name,
            description,
            teacherEmail: userEmail,
        }).returning();
        return NextResponse.json(newKelas[0], { status: 201 });
    } catch (error) {
        console.error("Gagal membuat kelas:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// PUT: Memperbarui kelas
export async function PUT(req) {
     const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });
    
    const { cid, name, description } = await req.json();
    if (!cid || !name) {
        return new NextResponse("ID dan Nama kelas dibutuhkan", { status: 400 });
    }

    try {
        const updatedKelas = await db.update(kelasTable).set({
            name,
            description
        }).where(eq(kelasTable.cid, cid)).returning();

        if(updatedKelas.length === 0) {
            return new NextResponse("Kelas tidak ditemukan", { status: 404 });
        }
        return NextResponse.json(updatedKelas[0]);
    } catch (error) {
         console.error("Gagal memperbarui kelas:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// DELETE: Menghapus kelas
export async function DELETE(req) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const cid = searchParams.get('cid');

    if (!cid) {
        return new NextResponse("ID kelas dibutuhkan", { status: 400 });
    }

    try {
        // Di dunia nyata, Anda mungkin ingin memeriksa apakah guru yang menghapus adalah pemilik kelas
        await db.delete(kelasTable).where(eq(kelasTable.cid, cid));
        return new NextResponse(null, { status: 204 }); // No Content
    } catch (error) {
        console.error("Gagal menghapus kelas:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
