import { db } from '@/config/db';
import { quizzesTable, usersTable } from '@/config/schema';
import { currentUser } from '@clerk/nextjs/server';
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

// Di sinilah Anda meletakkan prompt template
const PROMPT = `Buatkan kuis pilihan ganda berdasarkan topik, jumlah soal, dan tingkat kesulitan yang diberikan oleh pengguna. Pastikan setiap pertanyaan memiliki 4 pilihan jawaban dan satu jawaban yang benar. Berikan respons hanya dalam format JSON yang valid.

Skema JSON yang harus diikuti:
{
  "quiz": {
    "title": "string (Judul kuis berdasarkan topik)",
    "difficulty": "string (Tingkat kesulitan: Beginner, Moderate, Advanced)",
    "questions": [
      {
        "question_text": "string (Teks pertanyaan)",
        "options": [
          "string (Pilihan A)",
          "string (Pilihan B)",
          "string (Pilihan C)",
          "string (Pilihan D)"
        ],
        "correct_answer": "string (Teks jawaban yang benar, harus sama persis dengan salah satu dari options)"
      }
    ]
  }
}

Input Pengguna:
`;

// Inisialisasi Google Generative AI
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

// Fungsi helper untuk memeriksa peran pengguna
async function getUserRole(userEmail) {
    if (!userEmail) return null;
    const user = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    return user.length > 0 ? user[0].role : null;
}

export async function POST(req) {
    const user = await currentUser();
    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
    const role = await getUserRole(userEmail);

    if (role !== 'guru' && role !== 'admin') {
        return new NextResponse("Forbidden: Hanya guru atau admin yang dapat membuat kuis", { status: 403 });
    }

    const { quizId, topic, numQuestions, difficulty, kelasCid } = await req.json();
    
    // Gabungkan template prompt dengan input dari form
    const finalPrompt = `${PROMPT}
    Topik: ${topic}
    Jumlah Pertanyaan: ${numQuestions}
    Tingkat Kesulitan: ${difficulty}
    `;

    try {
        const model = 'gemini-2.0-flash';
        const generationConfig = {
            responseMimeType: 'text/plain',
        };
        const contents = [{
            role: 'user',
            parts: [{ text: finalPrompt }],
        }];

        const response = await ai.models.generateContent({
            model,
            generationConfig,
            contents,
        });

        if (!response.candidates || response.candidates.length === 0) {
            console.error("API response did not return any candidates.", response);
            return new NextResponse("Gagal membuat konten kuis dari AI.", { status: 500 });
        }

        const rawText = response.candidates[0].content.parts[0].text;
         const cleanedJsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const quizJson = JSON.parse(cleanedJsonString);

        // Simpan kuis ke database
        const newQuiz = await db.insert(quizzesTable).values({
            kelasCid: kelasCid, // Pastikan Anda mengirim ini dari frontend
            title: quizJson.quiz.title,
            quizJson: quizJson,
        }).returning();

        return NextResponse.json(newQuiz[0], { status: 201 });

    } catch (error) {
        console.error("Error generating quiz:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
