"use client"
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserDetailContext } from '@/context/UserDetailContext';
import { Users, UserCheck, User, BookOpen, ClipboardCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import WelcomeBanner from './_components/WelcomeBanner';
import { useRouter } from 'next/navigation';

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

function RecentItemCard({ title, items, onCardClick, loading }) {
    const router = useRouter();

    if (loading) {
        return (
            <div>
                <h2 className="text-2xl font-bold mb-4">{title}</h2>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
            </div>
        )
    }
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <div className="space-y-3">
                {items.length > 0 ? items.map(item => (
                    <div key={`${item.type}-${item.id}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onCardClick(item.type)}>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-gray-500">Kelas: {item.kelasName}</p>
                    </div>
                )) : <p className="text-gray-500">Tidak ada item terbaru.</p>}
            </div>
        </div>
    );
}


function Workspace() {
    const { userDetail } = useContext(UserDetailContext);
    const [adminStats, setAdminStats] = useState({ total: 0, guru: 0, siswa: 0 });
    const [guruStats, setGuruStats] = useState({ totalSiswa: 0, totalMateri: 0, totalTugasKuis: 0 });
    const [siswaData, setSiswaData] = useState({ materiTerbaru: [], tugasKuisTerbaru: [] });
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (userDetail) {
            setLoading(true);
            if (userDetail.role === 'admin') {
                axios.get('/api/admin/stats')
                    .then(res => setAdminStats(res.data))
                    .catch(err => console.error("Gagal mengambil statistik admin:", err))
                    .finally(() => setLoading(false));
            } else if (userDetail.role === 'guru') {
                axios.get('/api/guru/stats')
                    .then(res => setGuruStats(res.data))
                    .catch(err => console.error("Gagal mengambil statistik guru:", err))
                    .finally(() => setLoading(false));
            } else if (userDetail.role === 'siswa') {
                axios.get('/api/siswa/dashboard')
                    .then(res => setSiswaData(res.data))
                    .catch(err => console.error("Gagal mengambil data dashboard siswa:", err))
                    .finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        }
    }, [userDetail]);

    const handleCardClick = (type) => {
        if (type === 'task' || type === 'quiz') {
            router.push('/workspace/task');
        } else {
            router.push('/workspace/materi');
        }
    };


    const renderAdminDashboard = () => (
        <div className='mt-6'>
            <h2 className="text-2xl font-bold mb-4">Statistik </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Pengguna" value={adminStats.total} icon={<Users />} loading={loading} />
                <StatCard title="Total Guru" value={adminStats.guru} icon={<UserCheck />} loading={loading} />
                <StatCard title="Total Siswa" value={adminStats.siswa} icon={<User />} loading={loading} />
            </div>
        </div>
    );

    const renderGuruDashboard = () => (
        <div className='mt-6'>
            <h2 className="text-2xl font-bold mb-4">Statistik</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Siswa" value={guruStats.totalSiswa} icon={<Users />} loading={loading} />
                <StatCard title="Total Materi" value={guruStats.totalMateri} icon={<BookOpen />} loading={loading} />
                <StatCard title="Total Tugas/Kuis" value={guruStats.totalTugasKuis} icon={<ClipboardCheck />} loading={loading} />
            </div>
        </div>
    );

    const renderSiswaDashboard = () => (
        <div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-8'>
            <RecentItemCard title="Materi Terbaru" items={siswaData.materiTerbaru} onCardClick={() => router.push('/workspace/materi')} loading={loading} />
            <RecentItemCard title="Tugas/Kuis Terbaru" items={siswaData.tugasKuisTerbaru} onCardClick={handleCardClick} loading={loading} />
        </div>
    );

    return (
        <div>
            <WelcomeBanner />
            
            {!userDetail ? (
                 <Skeleton className="h-48 w-full mt-6" />
            ) : userDetail.role === 'admin' ? (
                renderAdminDashboard()
            ) : userDetail.role === 'guru' ? (
                renderGuruDashboard()
            ) : (
                renderSiswaDashboard()
            )}
        </div>
    );
}

export default Workspace;