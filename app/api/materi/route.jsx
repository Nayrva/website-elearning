import { db } from "@/config/db";
import { materiTable, usersTable, kelasTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

async function getUserRole(userEmail) {
    if (!userEmail) return null;
    const user = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    return user.length > 0 ? user[0].role : null;
}

// GET: Mengambil daftar materi
export async function GET(req) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const materiWithKelasName = await db.select({
            id: materiTable.id,
            title: materiTable.title,
            description: materiTable.description,
            fileUrl: materiTable.fileUrl,
            createdAt: materiTable.createdAt,
            kelasName: kelasTable.name
        })
        .from(materiTable)
        .leftJoin(kelasTable, eq(materiTable.kelasCid, kelasTable.cid))
        .orderBy(desc(materiTable.id));

        return NextResponse.json(materiWithKelasName);

    } catch (error) {
        console.error("Gagal mengambil materi:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// POST: Membuat materi baru
export async function POST(req) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const userEmail = user.primaryEmailAddress.emailAddress;
    const role = await getUserRole(userEmail);

    if (role !== 'guru' && role !== 'admin') {
        return new NextResponse("Forbidden: Hanya guru atau admin yang dapat membuat materi", { status: 403 });
    }
    
    const { kelasCid, title, description, fileUrl } = await req.json();

    if (!kelasCid || !title) {
        return new NextResponse("Judul dan Kelas dibutuhkan", { status: 400 });
    }

    try {
        const newMateri = await db.insert(materiTable).values({
            kelasCid,
            title,
            description,
            fileUrl,
        }).returning();

        return NextResponse.json(newMateri[0]);
    } catch (error) {
        console.error("Gagal membuat materi:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// PUT: Memperbarui materi
export async function PUT(req) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const userEmail = user.primaryEmailAddress.emailAddress;
    const role = await getUserRole(userEmail);

    if (role !== 'guru' && role !== 'admin') {
        return new NextResponse("Forbidden: Hanya guru atau admin yang dapat memperbarui materi", { status: 403 });
    }

    const { id, kelasCid, title, description, fileUrl } = await req.json();

    if (!id || !kelasCid || !title) {
        return new NextResponse("ID, Judul dan Kelas dibutuhkan", { status: 400 });
    }

    try {
        const updatedMateri = await db.update(materiTable)
            .set({ kelasCid, title, description, fileUrl })
            .where(eq(materiTable.id, id))
            .returning();

        if (updatedMateri.length === 0) {
            return new NextResponse("Materi tidak ditemukan", { status: 404 });
        }
        return NextResponse.json(updatedMateri[0]);
    } catch (error) {
        console.error("Gagal memperbarui materi:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// DELETE: Menghapus materi
export async function DELETE(req) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });
    
    const userEmail = user.primaryEmailAddress.emailAddress;
    const role = await getUserRole(userEmail);

    if (role !== 'guru' && role !== 'admin') {
        return new NextResponse("Forbidden: Hanya guru atau admin yang dapat menghapus materi", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return new NextResponse("ID Materi dibutuhkan", { status: 400 });
    }

    try {
        await db.delete(materiTable).where(eq(materiTable.id, parseInt(id)));
        return new NextResponse(null, { status: 204 }); // No Content
    } catch (error) {
        console.error("Gagal menghapus materi:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}