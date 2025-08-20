"use client"

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { UserDetailContext } from '../../../context/UserDetailContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileText, CheckCircle, Loader2Icon, Download, Sparkle, PlusCircle, ClipboardCheck, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

// =====================================================================
// Komponen Dialog untuk Generate Kuis AI
// =====================================================================
function AddNewQuizDialog({ children, kelasList, refreshData }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        topic: '',
        numQuestions: 5,
        difficulty: 'Moderate',
        kelasCid: ''
    });
    const [isOpen, setIsOpen] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const onGenerate = async () => {
        if (!formData.topic || !formData.kelasCid) {
            toast.error("Topik kuis dan kelas harus dipilih.");
            return;
        }
        setLoading(true);
        try {
            await axios.post('/api/generate-quiz', formData);
            toast.success('Kuis berhasil dibuat!');
            refreshData();
            setIsOpen(false); // Tutup dialog setelah berhasil
        } catch (e) {
            toast.error("Gagal membuat kuis. Coba lagi.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Buat Kuis Baru dengan AI</DialogTitle>
                    <DialogDescription>
                        Isi detail di bawah ini untuk membuat kuis secara otomatis.
                    </DialogDescription>
                </DialogHeader>
                <div className='flex flex-col gap-4 mt-3'>
                    <div>
                        <label>Pilih Kelas</label>
                        <Select onValueChange={(value) => handleInputChange('kelasCid', value)}>
                            <SelectTrigger><SelectValue placeholder="Pilih kelas untuk kuis ini" /></SelectTrigger>
                            <SelectContent>
                                {kelasList.map(kelas => <SelectItem key={kelas.cid} value={kelas.cid}>{kelas.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label>Topik Kuis</label>
                        <Input placeholder="Contoh: Sejarah Kemerdekaan Indonesia"
                            onChange={(e) => handleInputChange('topic', e.target.value)} />
                    </div>
                    <div>
                        <label>Jumlah Pertanyaan</label>
                        <Input type="number" defaultValue={5}
                            onChange={(e) => handleInputChange('numQuestions', parseInt(e.target.value))} />
                    </div>
                    <div>
                        <label>Tingkat Kesulitan</label>
                        <Select onValueChange={(value) => handleInputChange('difficulty', value)} defaultValue="Moderate">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Beginner">Beginner</SelectItem>
                                <SelectItem value="Moderate">Moderate</SelectItem>
                                <SelectItem value="Advanced">Advanced</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className='mt-5'>
                        <Button className={'w-full'} onClick={onGenerate} disabled={loading}>
                            {loading ? <Loader2Icon className='animate-spin' /> : <Sparkle />} Generate Kuis
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// =====================================================================
// Komponen Form untuk Membuat Tugas Manual
// =====================================================================
const CreateTaskForm = ({ kelasList, refreshData, setActiveTab }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [kelasCid, setKelasCid] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !kelasCid) {
            toast.error('Judul dan Kelas harus diisi.');
            return;
        }
        setIsSubmitting(true);
        try {
            const fileUrl = file ? `/uploads/tasks/${file.name}` : null;

            await axios.post('/api/tasks', { title, description, kelasCid, dueDate, fileUrl });
            toast.success('Tugas berhasil dibuat!');
            refreshData();
            setActiveTab('list');
        } catch (error) {
            toast.error(error.response?.data || 'Gagal membuat tugas.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 border rounded-lg bg-secondary space-y-4 max-w-2xl animate-in fade-in-50">
            <h2 className="text-2xl font-semibold">Detail Tugas Manual</h2>
            <div>
                <label className="block text-sm font-medium mb-1">Untuk Kelas</label>
                <Select onValueChange={setKelasCid} value={kelasCid}>
                    <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                    <SelectContent>
                        {kelasList.map(kelas => <SelectItem key={kelas.cid} value={kelas.cid}>{kelas.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Judul Tugas</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Laporan Praktikum Bab 1" />
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
            <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                    {isSubmitting ? <Loader2Icon className="animate-spin" /> : <Upload size={18} />}
                    Buat Tugas
                </Button>
                <Button type="button" variant="outline" onClick={() => setActiveTab('list')}>Batal</Button>
            </div>
        </form>
    );
};

// =====================================================================
// Komponen Card untuk menampilkan Tugas atau Kuis
// =====================================================================
const AssignmentCard = ({ item,userRole }) => {
    const router = useRouter();
    const isQuiz = item.type === 'quiz';
    const icon = isQuiz ? <FileText className="h-5 w-5 text-purple-500" /> : <ClipboardCheck className="h-5 w-5 text-blue-500" />;
    const badgeText = isQuiz ? 'Kuis' : 'Tugas';
    const badgeClass = isQuiz ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';

    const handleAction = () => {
        if (isQuiz) {
            router.push(`/workspace/quiz/${item.id}`);
        } else {
            // Logika untuk tugas manual (misal: buka halaman detail tugas)
            toast.info("Halaman detail tugas belum diimplementasikan.");
        }
    };

     // Teks tombol dinamis berdasarkan peran pengguna
    const buttonText = userRole === 'siswa' ? (isQuiz ? 'Kerjakan Kuis' : 'Lihat Tugas') : 'Lihat Jawaban';

    return (
        <div className="border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        {icon}
                        <h3 className="text-lg font-bold">{item.title}</h3>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeClass}`}>{badgeText}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Kelas: {item.kelasName || 'N/A'}</p>
                <p className="text-sm text-gray-500">Dibuat pada: {new Date(item.createdAt).toLocaleDateString('id-ID')}</p>
                {item.dueDate && <p className="text-sm text-red-500 mt-1">Batas Waktu: {new Date(item.dueDate).toLocaleDateString('id-ID')}</p>}
            </div>
            <div className="mt-4 flex gap-2">
                <Button 
                    variant={isQuiz && userRole === 'siswa' ? 'default' : 'outline'} 
                    size="sm" 
                    className="w-full" 
                    onClick={handleAction}
                >
                    {isQuiz && userRole === 'siswa' && <Edit className="mr-2 h-4 w-4" />}
                    {buttonText}
                </Button>
            </div>
        </div>
    );
};

// =====================================================================
// Komponen Utama Halaman
// =====================================================================
function TaskPage() {
    const { userDetail } = useContext(UserDetailContext);
    const [activeTab, setActiveTab] = useState('list');
    const [kelasList, setKelasList] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Hanya jalankan fetchData jika userDetail sudah terisi
        if (userDetail) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const [kelasRes, tasksRes, quizzesRes] = await Promise.all([
                        axios.get('/api/kelas'),
                        axios.get('/api/tasks'),
                        axios.get('/api/quizzes')
                    ]);
                    setKelasList(kelasRes.data);
                    setTasks(tasksRes.data);
                    setQuizzes(quizzesRes.data);
                } catch (error) {
                    toast.error("Gagal memuat data.");
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [userDetail]);

    // Perbaikan: Tampilkan loading state sampai userDetail (termasuk role) benar-benar ada.
    if (!userDetail) {
        return (
            <div>
                <h1 className="text-3xl font-bold mb-6">Tugas & Kuis</h1>
                <Skeleton className="h-12 w-1/3 mb-6" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    const isTeacherOrAdmin = userDetail.role === 'guru' || userDetail.role === 'admin';
    const combinedList = [...tasks.map(t => ({ ...t, type: 'task' })), ...quizzes.map(q => ({ ...q, type: 'quiz' }))]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Tugas & Kuis</h1>
            
            {isTeacherOrAdmin && (
                <div className="mb-6 flex flex-wrap gap-4 border-b pb-4">
                    <Button variant={activeTab === 'list' ? 'default' : 'outline'} onClick={() => setActiveTab('list')}>Daftar Tugas & Kuis</Button>
                    <Button variant={activeTab === 'createTask' ? 'default' : 'outline'} onClick={() => setActiveTab('createTask')}>Buat Tugas Manual</Button>
                    <AddNewQuizDialog kelasList={kelasList} refreshData={() => { if (userDetail) fetchData(); }}>
                        <Button variant="outline"><Sparkle className="mr-2 h-4 w-4" /> Buat Kuis dengan AI</Button>
                    </AddNewQuizDialog>
                </div>
            )}

            <div>
                {activeTab === 'list' && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Daftar Semua Tugas dan Kuis</h2>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
                            </div>
                        ) : combinedList.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                <p className="text-gray-500">Belum ada tugas atau kuis yang dibuat.</p>
                                {isTeacherOrAdmin && <p className="text-sm text-gray-400 mt-2">Gunakan tombol di atas untuk memulai.</p>}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {combinedList.map(item => (
                                    <AssignmentCard key={`${item.type}-${item.id}`} item={item} userRole={userDetail.role} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'createTask' && isTeacherOrAdmin && (
                    <CreateTaskForm kelasList={kelasList} refreshData={() => { if (userDetail) fetchData(); }} setActiveTab={setActiveTab} />
                )}
            </div>
        </div>
    );
}

export default TaskPage;
