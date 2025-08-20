"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Hash } from 'lucide-react';

function KelasDetailPage() {
    const { cid } = useParams();
    const [kelas, setKelas] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (cid) {
            const fetchKelasDetails = async () => {
                setLoading(true);
                try {
                    // Anda perlu membuat API endpoint ini
                    // const kelasRes = await axios.get(`/api/kelas/${cid}`);
                    // const studentsRes = await axios.get(`/api/enrollments?kelasCid=${cid}`);
                    // setKelas(kelasRes.data);
                    // setStudents(studentsRes.data);

                    // Data dummy untuk sementara
                    setKelas({ cid: cid, name: 'Matematika XII-A', description: 'Kelas untuk persiapan ujian nasional.' });
                    setStudents([
                        { id: 1, name: 'Budi Santoso', email: 'budi.s@email.com' },
                        { id: 2, name: 'Citra Lestari', email: 'citra.l@email.com' },
                        { id: 3, name: 'Dewi Anggraini', email: 'dewi.a@email.com' },
                    ]);

                } catch (error) {
                    toast.error("Gagal memuat detail kelas.");
                } finally {
                    setLoading(false);
                }
            };
            fetchKelasDetails();
        }
    }, [cid]);

    if (loading) {
        return (
            <div>
                <Skeleton className="h-10 w-1/2 mb-4" />
                <Skeleton className="h-6 w-3/4 mb-8" />
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        );
    }

    if (!kelas) {
        return <p>Kelas tidak ditemukan.</p>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold">{kelas.name}</h1>
            <p className="text-gray-500 mt-1 mb-6">{kelas.description}</p>

            <h2 className="text-2xl font-semibold mb-4">Daftar Siswa</h2>
            <div className="border rounded-lg">
                <div className="divide-y">
                    {students.length > 0 ? students.map(student => (
                        <div key={student.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="font-medium">{student.name}</p>
                                    <p className="text-sm text-gray-500">{student.email}</p>
                                </div>
                            </div>
                            {/* Tombol untuk mengeluarkan siswa bisa ditambahkan di sini */}
                        </div>
                    )) : (
                        <p className="p-4 text-gray-500">Belum ada siswa yang terdaftar di kelas ini.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default KelasDetailPage;
