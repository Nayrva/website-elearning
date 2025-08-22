"use client"
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { UserDetailContext } from '@/context/UserDetailContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { PlusCircle, MoreVertical, Edit, Trash, Eye, Loader2Icon, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const MateriDialog = ({ open, setOpen, refreshData, isEdit = false, initialData = {}, kelasList = [] }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [kelasCid, setKelasCid] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit && initialData) {
            setTitle(initialData.title || '');
            setDescription(initialData.description || '');
            setKelasCid(initialData.kelasCid || '');
        } else {
            setTitle('');
            setDescription('');
            setKelasCid('');
        }
    }, [isEdit, initialData, open]);

    const handleSubmit = async () => {
        if (!title || !kelasCid) {
            toast.error("Judul materi dan kelas harus diisi.");
            return;
        }
        setLoading(true);
        try {
            // Placeholder for file upload logic
            const fileUrl = file ? `/uploads/materi/${file.name}` : (initialData.fileUrl || null);

            const payload = { title, description, kelasCid, fileUrl };

            if (isEdit) {
                await axios.put('/api/materi', { id: initialData.id, ...payload });
                toast.success("Materi berhasil diperbarui.");
            } else {
                await axios.post('/api/materi', payload);
                toast.success("Materi baru berhasil ditambahkan.");
            }
            refreshData();
            setOpen(false);
        } catch (error) {
            toast.error(error.response?.data || "Terjadi kesalahan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Materi' : 'Tambah Materi Baru'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Judul Materi</label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Pengenalan Aljabar" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Deskripsi (Opsional)</label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi singkat tentang materi ini..." />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Kelas</label>
                        <Select onValueChange={setKelasCid} value={kelasCid}>
                            <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                            <SelectContent>
                                {kelasList.map(kelas => <SelectItem key={kelas.cid} value={kelas.cid}>{kelas.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">File Materi (Opsional)</label>
                        <Input type="file" onChange={(e) => setFile(e.target.files[0])} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? <Loader2Icon className="animate-spin" /> : 'Simpan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

function MateriPage() {
    const [materiList, setMateriList] = useState([]);
    const [kelasList, setKelasList] = useState([]);
    const [loading, setLoading] = useState(true);
    const { userDetail } = useContext(UserDetailContext);
    const router = useRouter();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentMateri, setCurrentMateri] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [materiRes, kelasRes] = await Promise.all([
                axios.get('/api/materi'),
                axios.get('/api/kelas')
            ]);
            setMateriList(materiRes.data);
            setKelasList(kelasRes.data);
        } catch (error) {
            toast.error("Gagal memuat data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(userDetail) {
            fetchData();
        }
    }, [userDetail]);

    const handleAdd = () => {
        setIsEdit(false);
        setCurrentMateri(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (materi) => {
        const kelas = kelasList.find(k => k.name === materi.kelasName);
        setIsEdit(true);
        setCurrentMateri({...materi, kelasCid: kelas ? kelas.cid : ''});
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Apakah Anda yakin ingin menghapus materi ini?")) return;
        
        try {
            await axios.delete(`/api/materi?id=${id}`);
            toast.success("Materi berhasil dihapus.");
            fetchData();
        } catch (error) {
            toast.error("Gagal menghapus materi.");
        }
    };
    
    const handleView = (materi) => {
        // You can navigate to a detailed view page or open a modal
        alert(`Judul: ${materi.title}\nDeskripsi: ${materi.description}\nKelas: ${materi.kelasName}`);
    };

    const isTeacherOrAdmin = userDetail?.role === 'guru' || userDetail?.role === 'admin';

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Materi</h1>
                {isTeacherOrAdmin && (
                    <Button onClick={handleAdd}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Tambah Materi
                    </Button>
                )}
            </div>
            
            <MateriDialog 
                open={isDialogOpen} 
                setOpen={setIsDialogOpen} 
                refreshData={fetchData} 
                isEdit={isEdit} 
                initialData={currentMateri} 
                kelasList={kelasList}
            />

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
                </div>
            ) : materiList.length === 0 ? (
                <p>Belum ada materi yang ditambahkan.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {materiList.map(materi => (
                        <div key={materi.id} className="border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h2 className="text-lg font-bold mb-2">{materi.title}</h2>
                                     {isTeacherOrAdmin && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(materi)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(materi.id)} className="text-red-600"><Trash className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mb-2">Kelas: {materi.kelasName}</p>
                                <p className="text-sm text-gray-600 line-clamp-3">{materi.description || "Tidak ada deskripsi."}</p>
                            </div>
                            <Button variant="outline" className="mt-4 w-full" onClick={() => handleView(materi)}>
                                <Eye className="mr-2 h-4 w-4" /> Lihat Materi
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MateriPage;