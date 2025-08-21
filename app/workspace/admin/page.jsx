"use client"
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { UserDetailContext } from '../../../context/UserDetailContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { PlusCircle, MoreVertical, Edit, Trash, Eye, Loader2Icon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function UserDialog({ open, setOpen, refreshData, isEdit = false, initialData = {}, kelasList = [] }) {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setFormData(isEdit ? initialData : { role: 'siswa', kelasCid: '' });
    }, [initialData, isEdit, open]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!isEdit && !formData.password) {
            toast.error("Password harus diisi untuk pengguna baru.");
            return;
        }
        setLoading(true);
        try {
            if (isEdit) {
                await axios.put('/api/admin/users', formData);
                toast.success("Pengguna berhasil diperbarui.");
            } else {
                await axios.post('/api/admin/users', formData);
                toast.success("Pengguna baru berhasil ditambahkan.");
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
                    <DialogTitle>{isEdit ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Input placeholder="Nama Lengkap" value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} />
                    <Input placeholder="Email" type="email" value={formData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} disabled={isEdit} />
                    {!isEdit && <Input placeholder="Password" type="password" onChange={(e) => handleInputChange('password', e.target.value)} />}
                    <Input placeholder="Username" value={formData.username || ''} onChange={(e) => handleInputChange('username', e.target.value)} />
                    <Select onValueChange={(value) => handleInputChange('role', value)} value={formData.role}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="guru">Guru</SelectItem>
                            <SelectItem value="siswa">Siswa</SelectItem>
                        </SelectContent>
                    </Select>
                    {formData.role === 'siswa' && (
                        <Select onValueChange={(value) => handleInputChange('kelasCid', value)} value={formData.kelasCid}>
                            <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                            <SelectContent>
                                {kelasList.map(kelas => (
                                    <SelectItem key={kelas.cid} value={kelas.cid}>{kelas.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
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
}

function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [kelasList, setKelasList] = useState([]);
    const [loading, setLoading] = useState(true);
    const { userDetail } = useContext(UserDetailContext);
    const router = useRouter();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, kelasRes] = await Promise.all([
                axios.get('/api/admin/users'),
                axios.get('/api/kelas')
            ]);
            
            const fetchedUsers = usersRes.data;
            const fetchedKelas = kelasRes.data;

            const usersWithKelas = fetchedUsers.map(user => {
                const kelas = fetchedKelas.find(k => k.cid === user.kelasCid);
                return { ...user, kelasName: kelas ? kelas.name : 'N/A' };
            });

            setUsers(usersWithKelas);
            setKelasList(fetchedKelas);
        } catch (error) {
            toast.error("Gagal mengambil data.");
            console.error("Fetch Data Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userDetail && userDetail.role !== 'admin') {
            toast.error("Anda tidak memiliki akses ke halaman ini.");
            router.push('/workspace');
        } else if (userDetail) {
            fetchData();
        }
    }, [userDetail, router]);

    const handleAdd = () => {
        setIsEdit(false);
        setCurrentUser({});
        setIsDialogOpen(true);
    };

    const handleEdit = (user) => {
        setIsEdit(true);
        setCurrentUser(user);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) return;
        
        try {
            await axios.delete(`/api/admin/users?id=${id}`);
            toast.success("Pengguna berhasil dihapus.");
            fetchData();
        } catch (error) {
            toast.error("Gagal menghapus pengguna.");
        }
    };
    
    if (loading || !userDetail) {
        return (
             <div className="space-y-4">
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
                <Button onClick={handleAdd}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Tambah Pengguna
                </Button>
            </div>
            
            <UserDialog 
                open={isDialogOpen} 
                setOpen={setIsDialogOpen} 
                refreshData={fetchData} 
                isEdit={isEdit} 
                initialData={currentUser} 
                kelasList={kelasList}
            />

            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-secondary">
                        <tr>
                            <th className="p-4 font-medium">Nama</th>
                            <th className="p-4 font-medium">Username</th>
                            <th className="p-4 font-medium">Role</th>
                            <th className="p-4 font-medium">Kelas</th>
                            <th className="p-4 font-medium text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b last:border-none">
                                <td className="p-4">{user.name}</td>
                                <td className="p-4">{user.username}</td>
                                <td className="p-4">{user.role}</td>
                                <td className="p-4">{user.kelasName}</td>
                                <td className="p-4 text-right">
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => {}}><Eye className="mr-2 h-4 w-4" /> Lihat</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEdit(user)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-red-600"><Trash className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminPanel;