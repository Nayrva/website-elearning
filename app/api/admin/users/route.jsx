import { db } from "@/config/db";
import { enrollmentsTable, usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { createClerkClient } from '@clerk/nextjs/server';
import { eq, asc, and } from "drizzle-orm";
import { NextResponse } from "next/server";

// Inisialisasi Clerk Client dengan Secret Key
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Fungsi helper untuk memeriksa apakah pengguna adalah admin
async function isAdmin(userEmail) {
    if (!userEmail) return false;
    const user = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    return user && user.length > 0 && user[0].role === 'admin';
}

// GET: Mengambil semua data pengguna
export async function GET(req) {
    const user = await currentUser();
    if (!user || !(await isAdmin(user.primaryEmailAddress.emailAddress))) {
        return new NextResponse("Forbidden: Akses ditolak", { status: 403 });
    }
    
    // Join dengan tabel enrollments untuk mendapatkan kelas siswa
    const allUsers = await db
        .select({
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            username: usersTable.username,
            role: usersTable.role,
            kelasCid: enrollmentsTable.kelasCid,
        })
        .from(usersTable)
        .leftJoin(enrollmentsTable, eq(usersTable.email, enrollmentsTable.studentEmail))
        .orderBy(asc(usersTable.id));
        
    return NextResponse.json(allUsers);
}

// POST: Membuat pengguna baru
export async function POST(req) {
    const user = await currentUser();
    if (!user || !(await isAdmin(user.primaryEmailAddress.emailAddress))) {
        return new NextResponse("Forbidden: Akses ditolak", { status: 403 });
    }

    const { name, email, username, password, role, kelasCid } = await req.json();

    if (!name || !email || !username || !password || !role) {
        return new NextResponse("Semua field wajib diisi", { status: 400 });
    }

    let createdClerkUser = null;
    try {
        // Langkah 1: Buat pengguna di Clerk
        createdClerkUser = await clerkClient.users.createUser({
            emailAddress: [email], // PERBAIKAN DI SINI
            username: username,
            password: password,
            firstName: name.split(' ')[0],
            lastName: name.split(' ').slice(1).join(' '),
        });

        // Langkah 2: Simpan detail pengguna di database lokal Anda
        const newUser = await db.insert(usersTable).values({
            name,
            email,
            username,
            role,
        }).returning();
        
        // Langkah 3: Jika kelas dipilih, daftarkan siswa ke kelas
        if (role === 'siswa' && kelasCid) {
            await db.insert(enrollmentsTable).values({
                kelasCid: kelasCid,
                studentEmail: email,
            });
        }

        return NextResponse.json(newUser[0], { status: 201 });
    } catch (error) {
        if (createdClerkUser) {
            await clerkClient.users.deleteUser(createdClerkUser.id);
        }
        
        console.error("GAGAL MEMBUAT PENGGUNA:", error);
        
        if (error.errors && Array.isArray(error.errors) && error.errors[0]) {
            return new NextResponse(error.errors[0].longMessage || error.errors[0].message, { status: 422 });
        }

        if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
            if (error.message.includes('users_email_unique')) {
                return new NextResponse("Email ini sudah digunakan.", { status: 409 });
            }
            if (error.message.includes('users_username_unique')) {
                return new NextResponse("Username ini sudah digunakan.", { status: 409 });
            }
        }

        return new NextResponse("Terjadi kesalahan internal.", { status: 500 });
    }
}


// PUT: Memperbarui pengguna
export async function PUT(req) {
    const user = await currentUser();
    if (!user || !(await isAdmin(user.primaryEmailAddress.emailAddress))) {
        return new NextResponse("Forbidden: Akses ditolak", { status: 403 });
    }

    const { id, name, username, role, kelasCid } = await req.json();

    if (!id || !name || !username || !role) {
        return new NextResponse("Semua field dibutuhkan", { status: 400 });
    }

    try {
        const existingUserArray = await db.select().from(usersTable).where(eq(usersTable.id, id));
        if (existingUserArray.length === 0) {
            return new NextResponse("Pengguna tidak ditemukan", { status: 404 });
        }
        const existingUser = existingUserArray[0];

        const clerkUsers = await clerkClient.users.getUserList({ emailAddress: [existingUser.email] });
        if (clerkUsers.length === 0) {
            return new NextResponse("Pengguna tidak ditemukan di sistem otentikasi.", { status: 404 });
        }
        const clerkUserId = clerkUsers[0].id;
        
        await clerkClient.users.updateUser(clerkUserId, {
            username: username,
            firstName: name.split(' ')[0],
            lastName: name.split(' ').slice(1).join(' '),
        });
        
        const updatedUser = await db.update(usersTable)
            .set({ name, username, role })
            .where(eq(usersTable.id, id))
            .returning();

        // Hapus pendaftaran lama dan buat yang baru jika ada perubahan
        await db.delete(enrollmentsTable).where(eq(enrollmentsTable.studentEmail, existingUser.email));
        if (role === 'siswa' && kelasCid) {
             await db.insert(enrollmentsTable).values({
                kelasCid: kelasCid,
                studentEmail: existingUser.email,
            });
        }

        return NextResponse.json(updatedUser[0]);
    } catch (error) {
        console.error("Gagal memperbarui pengguna:", error);
        const errorMessage = error.errors ? error.errors[0].longMessage : "Terjadi kesalahan internal.";
        return new NextResponse(errorMessage, { status: 500 });
    }
}

// DELETE: Menghapus pengguna
export async function DELETE(req) {
    const user = await currentUser();
    if (!user || !(await isAdmin(user.primaryEmailAddress.emailAddress))) {
        return new NextResponse("Forbidden: Akses ditolak", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id'));

    if (!id) return new NextResponse("ID pengguna dibutuhkan", { status: 400 });

    try {
        const userToDelete = await db.select().from(usersTable).where(eq(usersTable.id, id));
        if (userToDelete.length === 0) {
            return new NextResponse("Pengguna tidak ditemukan", { status: 404 });
        }
        
        const clerkUsers = await clerkClient.users.getUserList({ emailAddress: [userToDelete[0].email] });
        if (clerkUsers.length > 0) {
           await clerkClient.users.deleteUser(clerkUsers[0].id);
        }

        await db.delete(usersTable).where(eq(usersTable.id, id));
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Gagal menghapus pengguna:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}