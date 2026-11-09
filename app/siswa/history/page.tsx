"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SiswaHistoryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/siswa/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
      Mengalihkan ke Portal Pembayaran SPP...
    </div>
  );
}
