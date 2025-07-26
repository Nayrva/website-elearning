"use client"
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { UserDetailContext } from '../../../context/UserDetailContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { userDetail } = useContext(UserDetailContext);
    const router = useRouter();

    // Proteksi di sisi klien
    useEffect(() => {
        if (userDetail && userDetail.role !== 'admin') {
            toast.error("Anda tidak memiliki akses ke halaman ini.");
            router.push('/workspace');
        } else if (userDetail) {
            fetchUsers();
        }
    }, [userDetail, router]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/admin/users');
            setUsers(response.data);
        } catch (error) {
            toast.error("Gagal mengambil data pengguna.");
            console.error("Gagal mengambil data pengguna:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (email, role) => {
        const originalUsers = [...users];
        // Optimistic UI update
        setUsers(users.map(u => u.email === email ? { ...u, role } : u));
        try {
            await axios.put('/api/admin/users', { email, role });
            toast.success(`Peran untuk ${email} berhasil diubah menjadi ${role}.`);
        } catch (error) {
            // Rollback jika gagal
            setUsers(originalUsers);
            toast.error("Gagal mengubah peran.");
            console.error("Gagal mengubah peran:", error);
        }
    };
    
    if (loading || !userDetail) {
        return (
             <div className="space-y-4">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Admin Panel - Manajemen Pengguna</h1>
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-secondary">
                        <tr>
                            <th className="p-4 font-medium">Nama</th>
                            <th className="p-4 font-medium">Email</th>
                            <th className="p-4 font-medium">Peran</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b last:border-none">
                                <td className="p-4">{user.name}</td>
                                <td className="p-4">{user.email}</td>
                                <td className="p-4">
                                    <Select value={user.role} onValueChange={(value) => handleRoleChange(user.email, value)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="guru">Guru</SelectItem>
                                            <SelectItem value="siswa">Siswa</SelectItem>
                                        </SelectContent>
                                    </Select>
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