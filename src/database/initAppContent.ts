import db from '../../db';

export interface AppContentSeedItem {
  section: string;
  category: string;
  title: string;
  content: string;
  icon: string;
  order_index: number;
}

export async function initAppContentTable(): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS app_contents (
      id SERIAL PRIMARY KEY,
      section VARCHAR(50) NOT NULL, -- 'pusat_bantuan', 'tentang', 'pengembang'
      category VARCHAR(100),       -- e.g. 'Akademik', 'Kelasku', 'Administratif', 'Keuangan', 'Akun', 'Komunikasi'
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      icon VARCHAR(100) DEFAULT 'info',
      order_index INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_app_contents_section ON app_contents(section);
  `);

  // Check if initial seed is needed
  const countRes = await db.query('SELECT COUNT(*)::int AS cnt FROM app_contents');
  if (countRes.rows[0].cnt === 0) {
    const seedData: AppContentSeedItem[] = [
      // PUSAT BANTUAN - Navigasi & Home
      {
        section: 'pusat_bantuan',
        category: 'Navigasi & Home',
        title: 'Panduan Menu Utama & Pintasan (Home)',
        content: 'Halaman Home merupakan gerbang utama Alhamid One. Di sini Anda dapat mengakses pintasan cepat ke Akademik, Kelasku, Administratif, Akun, Chat, dan Notifikasi. Di bagian paling atas terdapat visual dinamis serta indikator sinyal jaringan real-time yang menunjukkan koneksi Wi-Fi, Seluler, atau Offline.',
        icon: 'home',
        order_index: 1
      },
      // PUSAT BANTUAN - Akademik
      {
        section: 'pusat_bantuan',
        category: 'Akademik',
        title: 'Melihat Jadwal Pelajaran & KBM Diniyah',
        content: 'Buka tab Akademik > Jadwal & Agenda Kegiatan. Pilih "Jadwal Pelajaran Diniyah" untuk melihat jadwal mengajar mingguan per kelas, nama guru pengampu, dan lokasi ruang kelas. Anda juga dapat melihat jadwal kajian kitab Romadhon serta jadwal imam dan bilal tarawih.',
        icon: 'calendar_month',
        order_index: 2
      },
      {
        section: 'pusat_bantuan',
        category: 'Akademik',
        title: 'Melihat Laporan Rapor & Rekapitulasi Nilai',
        content: 'Pada kluster Laporan & Rekapitulasi di tab Akademik, Anda dapat mengakses rekapitulasi nilai santri per mata pelajaran, riwayat absensi bulanan, buku kedisiplinan/pelanggaran, dan daftar juara kelas serta peraih piagam prestasi.',
        icon: 'analytics',
        order_index: 3
      },
      {
        section: 'pusat_bantuan',
        category: 'Akademik',
        title: 'Master Input Nilai Ujian & Absensi Santri',
        content: 'Bagi dewan asatidz yang bertugas, menu Master Input memudahkan penginputan nilai ujian tulis, ujian lisan, serta absensi harian KBM. Pilih kelas dan mata pelajaran, masukkan angka nilai atau centang kehadiran, lalu klik Simpan.',
        icon: 'edit_note',
        order_index: 4
      },
      // PUSAT BANTUAN - Kelasku & Setoran
      {
        section: 'pusat_bantuan',
        category: 'Kelasku & Setoran',
        title: 'Mencatat Setoran Hafalan & Nadzom Santri',
        content: 'Buka tab Kelasku > Setoran Hafalan. Pilih santri yang akan menyetorkan nadzom/kitab. Masukkan nomor bait awal dan bait akhir atau bab materi yang disetorkan. Pilih predikat kelancaran: Mumtaz (Sangat Lancar), Jayyid (Lancar), atau Maqbul (Cukup). Sistem otomatis menghitung persentase capaian target semester santri.',
        icon: 'auto_stories',
        order_index: 5
      },
      {
        section: 'pusat_bantuan',
        category: 'Kelasku & Setoran',
        title: 'Melihat Data Santri Binaan Mustahiq',
        content: 'Di tab Kelasku, Ustadz Mustahiq dapat melihat daftar seluruh santri yang berada dalam kelas binaannya, termasuk nomor kontak wali santri, informasi kamar asrama, dan rekapitulasi keaktifan belajar santri.',
        icon: 'groups',
        order_index: 6
      },
      // PUSAT BANTUAN - Administratif & Keuangan
      {
        section: 'pusat_bantuan',
        category: 'Administratif & Keuangan',
        title: 'Melihat Buku Induk Kesiswaan & Statistik Madin',
        content: 'Di tab Administratif, Anda dapat membuka menu Buku Induk untuk melihat profil lengkap santri, serta menu Statistik Siswa Madin untuk memantau grafik rasio gender, sebaran per tingkat, dan tren perkembangan santri antar tahun ajaran.',
        icon: 'badge',
        order_index: 7
      },
      {
        section: 'pusat_bantuan',
        category: 'Administratif & Keuangan',
        title: 'Memantau Administrasi Keuangan & SPP',
        content: 'Tab Keuangan & SPP kini terintegrasi langsung di dalam menu Administratif. Anda dapat mengecek status pembayaran SPP Makan dan SPP Madin santri per bulan, melihat total santri lunas atau menunggak, dan mencetak rekapitulasi keuangan.',
        icon: 'account_balance_wallet',
        order_index: 8
      },
      // PUSAT BANTUAN - Akun & Keamanan
      {
        section: 'pusat_bantuan',
        category: 'Akun & Keamanan',
        title: 'Mengatur Login Biometrik & Kunci Keamanan',
        content: 'Masuk ke tab Akun > Keamanan & Akses Masuk. Anda dapat mengaktifkan Login Sidik Jari (Biometrik), Verifikasi Wajah, mengatur PIN 6 digit, Kunci Pola, atau Sandi Cepat. Fitur ini melindungi data madrasah agar hanya dapat diakses oleh Anda di perangkat terpercaya.',
        icon: 'fingerprint',
        order_index: 9
      },
      {
        section: 'pusat_bantuan',
        category: 'Akun & Keamanan',
        title: 'Mengubah Foto Profil & Nada Dering Notifikasi',
        content: 'Pada tab Akun, Anda dapat memperbarui foto profil resmi ustadz dengan menekan ikon kamera pada kartu profil. Di kategori Preferensi & Layanan, Anda juga dapat memilih nada dering notifikasi KBM sesuai selera.',
        icon: 'manage_accounts',
        order_index: 10
      },

      // TENTANG
      {
        section: 'tentang',
        category: 'Profil Aplikasi',
        title: 'Alhamid One — Portal Ekosistem Pesantren Terpadu',
        content: 'Alhamid One adalah platform digital terintegrasi yang dikembangkan khusus untuk melayani seluruh kebutuhan tata kelola akademik, kesiswaan, administratif, dan komunikasi di Pondok Pesantren Al-Hamid Cinta Mulya. Aplikasi ini menjembatani tradisi keilmuan salafiyah dengan efisiensi teknologi modern.',
        icon: 'verified',
        order_index: 1
      },
      {
        section: 'tentang',
        category: 'Visi & Filosofi',
        title: 'Visi & Filosofi Digitalisasi Pesantren',
        content: 'Mewujudkan pesantren yang mandiri, tertib administrasi, akuntabel, dan transparan tanpa mengikis nilai-nilai ketawadluan dan adab santri. Setiap data hafalan, absensi, dan nilai dijaga dengan penuh amanah demi kemaslahatan pendidikan santri.',
        icon: 'lightbulb',
        order_index: 2
      },
      {
        section: 'tentang',
        category: 'Informasi Rilis',
        title: 'Versi & Lisensi Resmi',
        content: 'Versi Aplikasi: Alhamid One v1.4.2 (Production Release)\nBasis Data: Alhamid Secure Cloud Infrastructure\nHak Cipta © 2026 Pondok Pesantren Al-Hamid Cinta Mulya. Seluruh hak cipta dilindungi undang-undang.',
        icon: 'info',
        order_index: 3
      },

      // PENGEMBANG
      {
        section: 'pengembang',
        category: 'Studio Pengembang',
        title: 'Alhamid Studio Code',
        content: 'Alhamid Studio Code adalah unit pengembang rekayasa perangkat lunak dan teknologi digital internal di bawah naungan Pondok Pesantren Al-Hamid. Alhamid Studio Code berdedikasi menciptakan solusi teknologi yang berakhlak mulia, tangguh, dan elegan untuk kemajuan umat dan dunia pesantren.',
        icon: 'code',
        order_index: 1
      },
      {
        section: 'pengembang',
        category: 'Teknologi & Standar',
        title: 'Arsitektur & Tumpukan Teknologi',
        content: 'Aplikasi Alhamid One dibangun dengan standar rekayasa perangkat lunak modern:\n• Frontend Mobile: Flutter Native Engine dengan Material 3 & Fluid Micro-Interactions\n• Frontend Web: React.js, Tailwind CSS, & Vite Build System\n• Backend Server: Node.js Express RESTful Architecture\n• Database: PostgreSQL Relational Enterprise Engine\n• Keamanan: AES-256 Storage Encryption & Biometric Authentication Channels',
        icon: 'developer_mode',
        order_index: 2
      },
      {
        section: 'pengembang',
        category: 'Kontak & Kolaborasi',
        title: 'Kontak Tim Alhamid Studio Code',
        content: 'Untuk laporan kendala teknis, saran pengembangan, atau permohonan kerjasama sistem kepesantrenan, hubungi tim pengembang:\n• Email: developer@alhamid.ponpes.id\n• Web: alhamidcintamulya.my.id\n• Alamat: Komplek Pondok Pesantren Al-Hamid Cinta Mulya.',
        icon: 'contact_support',
        order_index: 3
      }
    ];

    for (const item of seedData) {
      await db.query(
        `INSERT INTO app_contents (section, category, title, content, icon, order_index, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [item.section, item.category, item.title, item.content, item.icon, item.order_index, true]
      );
    }
  }
}

const mod = { initAppContentTable };
module.exports = mod;
export default mod;
