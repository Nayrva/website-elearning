"use client"
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { UserDetailContext } from '@/context/UserDetailContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { PlusCircle, MoreVertical, Edit, Trash, Eye, Loader2Icon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


// Komponen Dialog untuk Tambah/Edit Kelas
const KelasDialog = ({ open, setOpen, refreshData, isEdit = false, initialData = {} }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit && initialData) {
            setName(initialData.name || '');
            setDescription(initialData.description || '');
        } else {
            setName('');
            setDescription('');
        }
    }, [isEdit, initialData, open]);

    const handleSubmit = async () => {
        if (!name) {
            toast.error("Nama kelas harus diisi.");
            return;
        }
        setLoading(true);
        try {
            if (isEdit) {
                await axios.put('/api/kelas', { cid: initialData.cid, name, description });
                toast.success("Kelas berhasil diperbarui.");
            } else {
                await axios.post('/api/kelas', { name, description });
                toast.success("Kelas baru berhasil dibuat.");
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
                    <DialogTitle>{isEdit ? 'Edit Kelas' : 'Buat Kelas Baru'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nama Kelas</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Matematika XII-A" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Deskripsi (Opsional)</label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi singkat tentang kelas ini..." />
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


// Komponen Utama Halaman Kelas
function KelasPage() {
    const [kelasList, setKelasList] = useState([]);
    const [loading, setLoading] = useState(true);
    const { userDetail } = useContext(UserDetailContext);
    const router = useRouter();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentKelas, setCurrentKelas] = useState(null);

    const fetchKelas = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/kelas');
            setKelasList(response.data);
        } catch (error) {
            toast.error("Gagal memuat daftar kelas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKelas();
    }, []);

    const handleAdd = () => {
        setIsEdit(false);
        setCurrentKelas(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (kelas) => {
        setIsEdit(true);
        setCurrentKelas(kelas);
        setIsDialogOpen(true);
    };

    const handleDelete = async (cid) => {
        if (!confirm("Apakah Anda yakin ingin menghapus kelas ini? Semua materi dan tugas terkait akan ikut terhapus.")) return;
        
        try {
            await axios.delete(`/api/kelas?cid=${cid}`);
            toast.success("Kelas berhasil dihapus.");
            fetchKelas();
        } catch (error) {
            toast.error("Gagal menghapus kelas.");
        }
    };

    const handleView = (cid) => {
        router.push(`/workspace/kelas/${cid}`);
    };

    const isTeacherOrAdmin = userDetail?.role === 'guru' || userDetail?.role === 'admin';

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Kelas</h1>
                {isTeacherOrAdmin && (
                    <Button onClick={handleAdd}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Tambah Kelas
                    </Button>
                )}
            </div>
            
            <KelasDialog 
                open={isDialogOpen} 
                setOpen={setIsDialogOpen} 
                refreshData={fetchKelas} 
                isEdit={isEdit} 
                initialData={currentKelas} 
            />

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
                </div>
            ) : kelasList.length === 0 ? (
                <p>Belum ada kelas yang dibuat.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {kelasList.map(kelas => (
                        <div key={kelas.cid} className="border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h2 className="text-lg font-bold mb-2">{kelas.name}</h2>
                                    {isTeacherOrAdmin && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(kelas)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(kelas.cid)} className="text-red-600"><Trash className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-3">{kelas.description || "Tidak ada deskripsi."}</p>
                            </div>
                            <Button variant="outline" className="mt-4 w-full" onClick={() => handleView(kelas.cid)}>
                                <Eye className="mr-2 h-4 w-4" /> Lihat Kelas
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default KelasPage;
