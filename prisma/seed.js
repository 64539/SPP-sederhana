const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Memulai seeding database SPP...");

  // 1. Bersihkan data lama jika ada
  await prisma.pembayaran.deleteMany();
  await prisma.siswa.deleteMany();
  await prisma.akun.deleteMany();
  await prisma.kelas.deleteMany();
  await prisma.jurusan.deleteMany();
  await prisma.spp.deleteMany();

  // 2. Data Jurusan
  const rpl = await prisma.jurusan.create({
    data: { namaJurusan: "Rekayasa Perangkat Lunak (RPL)" },
  });
  const tkj = await prisma.jurusan.create({
    data: { namaJurusan: "Teknik Komputer & Jaringan (TKJ)" },
  });
  const dkv = await prisma.jurusan.create({
    data: { namaJurusan: "Desain Komunikasi Visual (DKV)" },
  });

  // 3. Data Kelas
  const k1 = await prisma.kelas.create({ data: { namaKelas: "XII RPL 1" } });
  const k2 = await prisma.kelas.create({ data: { namaKelas: "XII RPL 2" } });
  const k3 = await prisma.kelas.create({ data: { namaKelas: "XI TKJ 1" } });
  const k4 = await prisma.kelas.create({ data: { namaKelas: "X DKV 1" } });

  // 4. Data SPP
  const spp2024 = await prisma.spp.create({
    data: { tahun: 2024, nominal: 250000 },
  });
  const spp2025 = await prisma.spp.create({
    data: { tahun: 2025, nominal: 300000 },
  });

  // 5. Akun Admin
  const adminPass = await bcrypt.hash("admin123", 10);
  const admin = await prisma.akun.create({
    data: {
      username: "admin",
      password: adminPass,
      namaLengkap: "Pak Budi Santoso (Admin TU)",
      role: "ADMIN",
    },
  });

  // 6. Akun Petugas
  const petugasPass = await bcrypt.hash("petugas123", 10);
  const petugas = await prisma.akun.create({
    data: {
      username: "petugas",
      password: petugasPass,
      namaLengkap: "Ibu Sri Wahyuni (Petugas Kasir)",
      role: "PETUGAS",
    },
  });

  // 7. Akun Siswa 1 & Data Siswa
  const siswa1Pass = await bcrypt.hash("siswa123", 10);
  const akunSiswa1 = await prisma.akun.create({
    data: {
      username: "siswa",
      password: siswa1Pass,
      namaLengkap: "Ahmad Rizky Pratama",
      role: "SISWA",
    },
  });

  const siswa1 = await prisma.siswa.create({
    data: {
      nisn: "0051234567",
      nis: "20240101",
      nama: "Ahmad Rizky Pratama",
      alamat: "Jl. Merdeka No. 45, Kota",
      noTelp: "081234567890",
      akunId: akunSiswa1.id,
      kelasId: k1.id,
      jurusanId: rpl.id,
      sppId: spp2024.id,
    },
  });

  // 8. Akun Siswa 2 & Data Siswa
  const siswa2Pass = await bcrypt.hash("siswa456", 10);
  const akunSiswa2 = await prisma.akun.create({
    data: {
      username: "aisyah",
      password: siswa2Pass,
      namaLengkap: "Siti Nur Aisyah",
      role: "SISWA",
    },
  });

  const siswa2 = await prisma.siswa.create({
    data: {
      nisn: "0051234568",
      nis: "20240102",
      nama: "Siti Nur Aisyah",
      alamat: "Jl. Melati No. 12, Kota",
      noTelp: "085712345678",
      akunId: akunSiswa2.id,
      kelasId: k1.id,
      jurusanId: rpl.id,
      sppId: spp2024.id,
    },
  });

  // 9. Sample Pembayaran (Rizky bayar SPP Januari dan Februari 2024)
  await prisma.pembayaran.create({
    data: {
      siswaId: siswa1.id,
      bulanDibayar: "Januari",
      tahunDibayar: "2024",
      sppId: spp2024.id,
      nominal: 250000,
      petugasId: admin.id,
      tanggalBayar: new Date("2024-01-10T09:30:00Z"),
      keterangan: "Lunas - Diterima Admin",
    },
  });

  await prisma.pembayaran.create({
    data: {
      siswaId: siswa1.id,
      bulanDibayar: "Februari",
      tahunDibayar: "2024",
      sppId: spp2024.id,
      nominal: 250000,
      petugasId: petugas.id,
      tanggalBayar: new Date("2024-02-12T10:15:00Z"),
      keterangan: "Lunas - Diterima Petugas Kasir",
    },
  });

  console.log("Seeding selesai dengan sukses!");
  console.log("-----------------------------------------");
  console.log("Default Login:");
  console.log("Admin   -> User: admin    / Pass: admin123");
  console.log("Petugas -> User: petugas  / Pass: petugas123");
  console.log("Siswa   -> User: siswa    / Pass: siswa123");
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
