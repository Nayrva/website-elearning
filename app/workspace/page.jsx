"use client"
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserDetailContext } from '@/context/UserDetailContext'; // Impor context
import { Users, UserCheck, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import WelcomeBanner from './_components/WelcomeBanner';


function StatCard({ title, value, icon, loading }) {
    if (loading) {
        return <Skeleton className="h-28 w-full" />;
    }
    return (
        <div className="p-6 border rounded-lg shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-primary/10 text-primary rounded-full">
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
}

function Workspace() {
    const { userDetail } = useContext(UserDetailContext); // Dapatkan detail pengguna dari context
    const [stats, setStats] = useState({ total: 0, guru: 0, siswa: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Hanya panggil API jika userDetail sudah ada DAN perannya adalah 'admin'
        if (userDetail && userDetail.role === 'admin') {
            const fetchStats = async () => {
                try {
                    const response = await axios.get('/api/admin/stats'); 
                    setStats(response.data);
                } catch (error) {
                    console.error("Gagal mengambil statistik:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchStats();
        } else if (userDetail) {
            // Jika bukan admin, langsung set loading ke false
            setLoading(false);
        }
    }, [userDetail]); // Tambahkan userDetail sebagai dependency

    return (
        <div>
            {/* Tampilkan banner selamat datang untuk semua pengguna */}
            <WelcomeBanner />

            {/* Tampilkan bagian statistik HANYA untuk admin */}
            {userDetail?.role === 'admin' && (
                <div className='mt-6'>
                    <h2 className="text-2xl font-bold mb-4">Statistik Pengguna</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Total Pengguna" value={stats.total} icon={<Users />} loading={loading} />
                        <StatCard title="Total Guru" value={stats.guru} icon={<UserCheck />} loading={loading} />
                        <StatCard title="Total Siswa" value={stats.siswa} icon={<User />} loading={loading} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default Workspace;
