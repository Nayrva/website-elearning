"use client"

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { UserDetailContext } from '../../../context/UserDetailContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, CheckCircle, Loader2Icon, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

// Komponen Utama Halaman Task
function TaskPage() {
  const { userDetail } = useContext(UserDetailContext);
  const userRole = userDetail?.role;

  if (!userRole) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold mb-6"><Skeleton className="h-10 w-1/3" /></h1>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Tugas</h1>
      
      {userRole === 'siswa' && <StudentView />}
      {(userRole === 'guru' || userRole === 'admin') && <TeacherView />}
    </div>
  );
}

// =====================================================================
// Tampilan untuk Guru dan Admin
// =====================================================================
const TeacherView = () => {
    const [courses, setCourses] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('submissions');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [coursesRes, tasksRes, submissionsRes] = await Promise.all([
                axios.get('/api/courses'), // Mengambil kursus yang dibuat oleh guru
                axios.get('/api/tasks'),
                axios.get('/api/submissions')
            ]);
            setCourses(coursesRes.data);
            setTasks(tasksRes.data);
            setSubmissions(submissionsRes.data);
        } catch (error) {
            toast.error('Gagal memuat data.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Skeleton className="h-64 w-full" />;
    }

    return (
        <div className="space-y-8">
            <div className="flex border-b">
                <button onClick={() => setActiveTab('submissions')} className={`py-2 px-4 ${activeTab === 'submissions' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Lihat Jawaban</button>
                <button onClick={() => setActiveTab('create')} className={`py-2 px-4 ${activeTab === 'create' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Buat Tugas Baru</button>
            </div>

            {activeTab === 'create' ? <CreateTaskForm courses={courses} refreshData={fetchData} /> : <SubmissionsList tasks={tasks} submissions={submissions} refreshData={fetchData} />}
        </div>
    );
};

// Form untuk Membuat Tugas Baru
const CreateTaskForm = ({ courses, refreshData }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [courseId, setCourseId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !courseId) {
            toast.error('Judul dan Mata Pelajaran harus diisi.');
            return;
        }
        setIsSubmitting(true);
        try {
            // TODO: Implementasikan logika upload file ke cloud storage
            const fileUrl = file ? `/uploads/tasks/${file.name}` : null;

            await axios.post('/api/tasks', { title, description, courseId, dueDate, fileUrl });
            toast.success('Tugas berhasil dibuat!');
            // Reset form
            setTitle(''); setDescription(''); setCourseId(''); setDueDate(''); setFile(null);
            refreshData();
        } catch (error) {
            toast.error(error.response?.data || 'Gagal membuat tugas.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 border rounded-lg bg-secondary space-y-4 max-w-2xl animate-in fade-in-50">
            <h2 className="text-2xl font-semibold">Detail Tugas</h2>
            <div>
                <label className="block text-sm font-medium mb-1">Untuk Mata Pelajaran</label>
                <Select onValueChange={setCourseId} value={courseId}>
                    <SelectTrigger><SelectValue placeholder="Pilih mata pelajaran" /></SelectTrigger>
                    <SelectContent>
                        {courses.map(course => <SelectItem key={course.cid} value={course.cid}>{course.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Judul</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Tugas 1" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Deskripsi / Instruksi</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Jelaskan instruksi tugas..." />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Batas Waktu (Opsional)</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Unggah File Soal (Opsional)</label>
                <Input type="file" onChange={(e) => setFile(e.target.files[0])} />
            </div>
            <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                {isSubmitting ? <Loader2Icon className="animate-spin" /> : <Upload size={18} />}
                Buat Tugas
            </Button>
        </form>
    );
};

// Daftar Jawaban yang Masuk
const SubmissionsList = ({ tasks, submissions, refreshData }) => {
    const [grade, setGrade] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveGrade = async (submissionId) => {
        if (!grade || grade < 0 || grade > 100) {
            toast.error('Nilai harus antara 0 dan 100.');
            return;
        }
        setIsSaving(true);
        try {
            await axios.put('/api/submissions', { submissionId, grade: parseInt(grade) });
            toast.success('Nilai berhasil disimpan!');
            setGrade('');
            refreshData();
        } catch (error) {
            toast.error(error.response?.data || 'Gagal menyimpan nilai.');
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="space-y-4 animate-in fade-in-50">
            {tasks.length === 0 && <p>Anda belum membuat tugas apapun.</p>}
            {tasks.map(task => (
                <div key={task.id} className="p-4 border rounded-lg">
                    <h3 className="font-bold text-lg">{task.title}</h3>
                    <div className="mt-2 space-y-2">
                        {submissions.filter(s => s.taskId === task.id).length === 0 && <p className="text-sm text-gray-500">Belum ada jawaban yang masuk.</p>}
                        {submissions.filter(s => s.taskId === task.id).map(sub => (
                             <div key={sub.id} className="p-3 bg-secondary rounded-md flex flex-wrap justify-between items-center gap-2">
                                <div>
                                    <p className="font-semibold">{sub.studentEmail}</p>
                                    <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Download size={14} /> Lihat Jawaban</a>
                                </div>
                                {sub.grade !== null ? (
                                    <p className="font-bold text-lg">Nilai: {sub.grade}</p>
                                ) : (
                                   <Dialog>
                                       <DialogTrigger asChild><Button variant="outline">Beri Nilai</Button></DialogTrigger>
                                       <DialogContent>
                                           <DialogHeader><DialogTitle>Beri Nilai untuk {sub.studentEmail}</DialogTitle></DialogHeader>
                                           <div className="space-y-4 py-4">
                                                <p>Tugas: <span className="font-semibold">{task.title}</span></p>
                                                <Input type="number" placeholder="Masukkan nilai (0-100)" onChange={(e) => setGrade(e.target.value)} />
                                                <Button onClick={() => handleSaveGrade(sub.id)} disabled={isSaving} className="w-full">
                                                    {isSaving ? <Loader2Icon className="animate-spin" /> : 'Simpan Nilai'}
                                                </Button>
                                           </div>
                                       </DialogContent>
                                   </Dialog>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};


// =====================================================================
// Tampilan untuk Siswa
// =====================================================================
const StudentView = () => {
    const [tasks, setTasks] = useState([]);
    const [mySubmissions, setMySubmissions] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tasksRes, submissionsRes] = await Promise.all([
                axios.get('/api/tasks'),
                axios.get('/api/submissions?student=me')
            ]);
            setTasks(tasksRes.data);
            const submissionsMap = submissionsRes.data.reduce((acc, sub) => {
                acc[sub.taskId] = sub;
                return acc;
            }, {});
            setMySubmissions(submissionsMap);
        } catch (error) {
            toast.error('Gagal memuat daftar tugas.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return [1,2,3].map(i => <Skeleton key={i} className="h-32 w-full mb-4" />)
    }

    return (
        <div className="space-y-6">
            {tasks.length === 0 && <p>Belum ada tugas yang tersedia.</p>}
            {tasks.map(task => (
                <TaskCard key={task.id} task={task} submission={mySubmissions[task.id]} refreshData={fetchData} />
            ))}
        </div>
    );
};

// Kartu Tugas untuk Siswa
const TaskCard = ({ task, submission, refreshData }) => {
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!file) {
            toast.error('Silakan pilih file jawaban terlebih dahulu.');
            return;
        }
        setIsSubmitting(true);
        try {
            // TODO: Implementasikan logika upload file dan kirim ke API
            const fileUrl = `/uploads/submissions/${file.name}`;
            await axios.post('/api/submissions', { taskId: task.id, fileUrl });
            toast.success('Jawaban berhasil diunggah!');
            refreshData();
        } catch (error) {
            toast.error(error.response?.data || 'Gagal mengunggah jawaban.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isSubmitted = !!submission;
    const isGraded = isSubmitted && submission.grade !== null;

    return (
        <div className="p-6 border rounded-lg transition-all hover:shadow-md">
            <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h3 className="text-xl font-bold">{task.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{task.courseId}</p> {/* Ganti dengan nama kursus jika perlu join tabel */}
                    <p className="mb-4">{task.description}</p>
                    {task.fileUrl && <a href={task.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 mb-4"><Download size={16} /> Unduh Soal</a>}
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium">Batas Waktu</p>
                    <p className="text-sm text-gray-600">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t">
                {isGraded ? (
                    <div className="text-center">
                        <p className="text-lg">Nilai Anda:</p>
                        <p className="text-4xl font-bold text-primary">{submission.grade}</p>
                    </div>
                ) : isSubmitted ? (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle size={20} />
                        <p className="font-semibold">Jawaban sudah diunggah. Menunggu dinilai.</p>
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center gap-4">
                        <Input type="file" onChange={(e) => setFile(e.target.files[0])} className="flex-grow" />
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2">
                           {isSubmitting ? <Loader2Icon className="animate-spin" /> : <Upload size={18} />}
                            Unggah Jawaban
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskPage;