"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Loader2Icon, CheckCircle, XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"


function QuizPage() {
    const { quizId } = useParams();
    const router = useRouter();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        if (quizId) {
            const fetchQuiz = async () => {
                setLoading(true);
                try {
                    const response = await axios.get(`/api/quizzes/${quizId}`);
                    setQuiz(response.data);
                } catch (error) {
                    toast.error("Gagal memuat kuis.");
                    router.push('/workspace/task');
                } finally {
                    setLoading(false);
                }
            };
            fetchQuiz();
        }
    }, [quizId, router]);

    const handleAnswerChange = (questionIndex, option) => {
        setSelectedAnswers(prev => ({ ...prev, [questionIndex]: option }));
    };

    const handleSubmit = async () => {
        const totalQuestions = quiz.quizJson.quiz.questions.length;
        if (Object.keys(selectedAnswers).length !== totalQuestions) {
            toast.warning("Harap jawab semua pertanyaan.");
            return;
        }

        setIsSubmitting(true);
        let correctAnswers = 0;
        quiz.quizJson.quiz.questions.forEach((q, index) => {
            if (selectedAnswers[index] === q.correct_answer) {
                correctAnswers++;
            }
        });

        const score = Math.round((correctAnswers / totalQuestions) * 100);

        try {
            await axios.post('/api/quiz-submissions', { quizId: quiz.id, score });
            setResult({ score, correctAnswers, totalQuestions });
            toast.success("Kuis berhasil dikumpulkan!");
        } catch (error) {
            toast.error(error.response?.data || "Gagal mengirimkan jawaban.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div>
                <Skeleton className="h-10 w-1/2 mb-6" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }
    
    if (result) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Hasil Kuis</CardTitle>
                        <CardDescription>{quiz.title}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-5xl font-bold text-primary">{result.score}</p>
                        <p className="text-gray-600">Anda menjawab {result.correctAnswers} dari {result.totalQuestions} pertanyaan dengan benar.</p>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={() => router.push('/workspace/task')}>Kembali ke Daftar Tugas</Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
            <p className="text-gray-500 mb-6">Jawab semua pertanyaan di bawah ini.</p>
            
            <div className="space-y-6">
                {quiz.quizJson.quiz.questions.map((q, qIndex) => (
                    <Card key={qIndex}>
                        <CardHeader>
                            <CardTitle>Pertanyaan {qIndex + 1}</CardTitle>
                            <CardDescription>{q.question_text}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup onValueChange={(value) => handleAnswerChange(qIndex, value)}>
                                {q.options.map((option, oIndex) => (
                                    <div key={oIndex} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
                                        <RadioGroupItem value={option} id={`q${qIndex}o${oIndex}`} />
                                        <Label htmlFor={`q${qIndex}o${oIndex}`}>{option}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Button onClick={handleSubmit} disabled={isSubmitting} className="mt-8 w-full md:w-auto">
                {isSubmitting ? <Loader2Icon className="animate-spin mr-2" /> : null}
                Kumpulkan Jawaban
            </Button>
        </div>
    );
}

export default QuizPage;
