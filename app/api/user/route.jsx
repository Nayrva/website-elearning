import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req){
    const {email,name}=await req.json();

    const users=await db.select().from(usersTable).where(eq(usersTable.email,email));

    if(users?.length==0){
        // Generate username dari email
        const username = email.split('@')[0];

        const result=await db.insert(usersTable).values({
            name:name,
            email:email,
            username: username,
            role:'siswa'
        }).returning();
        
        console.log(result);
        return NextResponse.json(result[0])
    }

    return NextResponse.json(users[0])
}