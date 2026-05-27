import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Spin, Alert, Button } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { nilaiService } from '../services/nilaiService';
import { terbilangIndonesia, terbilangArab, predikatToArab, getPredikat, toArabicNumerals } from '../utils/terbilang';
import './RaporPrint.scss';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Helper: remove all decimals (bulatkan)
const cleanNumber = (val) => {
  if (val === null || val === undefined) return '-';
  const num = Number(val);
  if (isNaN(num)) return val;
  return String(Math.round(num));
};

// Helper: get current date in Indonesian format
const getFormattedDate = () => {
  const date = new Date();
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('id-ID', options);
};

export function RaporPrint() {
  const { tahun_ajaran_id, kelas_id, kategori_id, santri_id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await nilaiService.fetchCetakRapor(tahun_ajaran_id, kelas_id, kategori_id, santri_id);
        setData(res);
      } catch (err) {
        setError('Gagal memuat data rapor. Pastikan semua parameter valid.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tahun_ajaran_id, kelas_id, kategori_id, santri_id]);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}><Spin size="large" /></div>;
  if (error) return <div style={{ padding: '50px' }}><Alert type="error" message={error} /></div>;
  if (!data) return <div style={{ padding: '50px' }}><Alert type="warning" message="Data rapor tidak ditemukan" /></div>;

  const { santri, kelas, tahun_ajaran, semester, nilai, tambahan, statistik } = data;

  const regulerMapels = nilai.filter(n => n.mapel_jenis === 'Reguler');
  const muhafadzohAkbar = nilai.find(n => n.mapel_jenis === 'Muhafadzoh' && n.mapel_nama?.includes('Akbar'));
  const qiroatul = nilai.find(n => n.mapel_jenis === 'Qiroah');
  const taftisyul = nilai.find(n => n.mapel_jenis === 'Taftisy');

  const handlePrint = () => {
    window.print();
  };

  // Helper: get the display values for Angka/Huruf columns based on jenis
  const getAngkaDisplay = (item, jenis) => {
    if (jenis === 'tulis') return cleanNumber(item.nilai_angka);
    if (jenis === 'muhafadzoh') return item.predikat || getPredikat(item.nilai_angka);
    if (jenis === 'qiroah') return cleanNumber(item.nilai_angka);
    if (jenis === 'taftisy') return item.capaian || '-';
    return '-';
  };

  const getHurufDisplay = (item, jenis) => {
    if (jenis === 'tulis') return terbilangIndonesia(item.nilai_angka);
    if (jenis === 'muhafadzoh') {
      const pred = item.predikat || getPredikat(item.nilai_angka);
      return pred && pred !== '-' ? pred : '-';
    }
    if (jenis === 'qiroah') return terbilangIndonesia(item.nilai_angka);
    if (jenis === 'taftisy') return item.capaian || '-';
    return '-';
  };

  // Arabic side helpers
  const getArabAngkaDisplay = (item, jenis) => {
    if (jenis === 'tulis') return item.nilai_angka != null ? toArabicNumerals(cleanNumber(item.nilai_angka)) : '-';
    if (jenis === 'muhafadzoh') {
      const pred = item.predikat || getPredikat(item.nilai_angka);
      return predikatToArab(pred);
    }
    if (jenis === 'qiroah') return item.nilai_angka != null ? toArabicNumerals(cleanNumber(item.nilai_angka)) : '-';
    if (jenis === 'taftisy') {
      const val = item.capaian || '-';
      if (val === 'Tam') return 'تام';
      if (val === 'Naqish') return 'ناقص';
      return val;
    }
    return '-';
  };

  const getArabHurufDisplay = (item, jenis) => {
    if (jenis === 'tulis') return terbilangArab(item.nilai_angka);
    if (jenis === 'muhafadzoh') {
      const pred = item.predikat || getPredikat(item.nilai_angka);
      return predikatToArab(pred);
    }
    if (jenis === 'qiroah') return terbilangArab(item.nilai_angka);
    if (jenis === 'taftisy') {
      const val = item.capaian || '-';
      if (val === 'Tam') return 'تام';
      if (val === 'Naqish') return 'ناقص';
      return val;
    }
    return '-';
  };

  return (
    <div className="rapor-print-container">
      <div className="print-controls">
        <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          Cetak Rapor
        </Button>
      </div>
      
      <div className="rapor-page" id="rapor-page">
        {/* HEADER */}
        <div className="rapor-header">
          <div className="kop-surat">
            {data.settings?.rapor_kop_logo_url && (
              <img 
                src={`${API_BASE}${data.settings.rapor_kop_logo_url}`} 
                alt="Logo Pesantren" 
                className="kop-logo" 
              />
            )}
            <div className="kop-teks">
              <h1 className="arabic" style={{ fontSize: `${data.settings?.rapor_kop_size_1 || 24}px` }}>
                {data.settings?.rapor_kop_baris_1 || 'مؤسسة معهد الحامد الإسلامي'}
              </h1>
              <h2 style={{ fontSize: `${data.settings?.rapor_kop_size_2 || 18}px` }}>
                {data.settings?.rapor_kop_baris_2 || 'YAYASAN PONDOK PESANTREN AL-HAMID'}
              </h2>
              <h3 style={{ fontSize: `${data.settings?.rapor_kop_size_3 || 20}px` }}>
                {data.settings?.rapor_kop_baris_3 || 'MADRASAH DINIYAH TAKMILIYAH AL-HAMID'}
              </h3>
            </div>
          </div>
          <div className="kop-alamat" style={{ fontSize: `${data.settings?.rapor_kop_size_4 || 14}px` }}>
            {data.settings?.rapor_kop_baris_4 || 'Jl. Raya Cilangkap Baru RT.07/01 Cilangkap Cipayung Jakarta Timur 13870'}
          </div>
          <h3 className="title-rapor">LAPORAN HASIL BELAJAR</h3>
          
          <table className="info-table">
            <tbody>
              <tr>
                <td width="20%">Nama Santri</td>
                <td width="1%">:</td>
                <td width="29%"><b>{santri.nama}</b></td>
                
                <td width="20%">Kelas</td>
                <td width="1%">:</td>
                <td width="29%"><b>{kelas.nama}</b></td>
              </tr>
              <tr>
                <td>Nomor Induk</td>
                <td>:</td>
                <td><b>{santri.nis}</b></td>
                
                <td>Semester</td>
                <td>:</td>
                <td><b>{semester}</b></td>
              </tr>
              <tr>
                <td>Mustahiq</td>
                <td>:</td>
                <td><b>{kelas.mustahiq_nama || '-'}</b></td>
                
                <td>Tahun Ajaran</td>
                <td>:</td>
                <td><b>{tahun_ajaran}</b></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* NILAI TABLE - TWO-SIDED LAYOUT */}
        <table className="nilai-table rapor-dual">
          <thead>
            {/* Top header row removed */}
            {/* Main header */}
            <tr>
              <th rowSpan="2" width="4%" className="side-indonesia">No.</th>
              <th rowSpan="2" width="20%" className="side-indonesia">Mata Pelajaran</th>
              <th colSpan="2" className="side-indonesia">Hasil Ujian</th>
              <th colSpan="2" className="side-arab arabic">تنائج التمرين</th>
              <th rowSpan="2" width="20%" className="side-arab arabic">الفنون</th>
              <th rowSpan="2" width="4%" className="side-arab arabic">الرقم</th>
            </tr>
            {/* Sub header — الرقم dulu baru اللفظ */}
            <tr>
              <th width="10%" className="side-indonesia">Angka</th>
              <th width="16%" className="side-indonesia">Huruf</th>
              <th width="16%" className="side-arab arabic">اللفظ</th>
              <th width="10%" className="side-arab arabic">الرقم</th>
            </tr>
          </thead>
          <tbody>
            {/* A. UJIAN TULIS */}
            <tr className="header-subheader">
              <th colSpan="4" className="text-left pl-2 side-indonesia">A. Ujian Tulis</th>
              <th colSpan="4" className="text-right pr-2 side-arab arabic">الكتابة</th>
            </tr>
            {regulerMapels.map((item, idx) => (
              <tr key={item.id}>
                <td className="text-center">{idx + 1}</td>
                <td>{item.mapel_nama}</td>
                <td className={`text-center ${item.nilai_angka < 51 ? 'nilai-merah' : ''}`}>
                  {getAngkaDisplay(item, 'tulis')}
                </td>
                <td className="text-center huruf-col">{getHurufDisplay(item, 'tulis')}</td>
                {/* Arab side: اللفظ first (left), then الرقم (right) because we read LTR in HTML but visually RTL */}
                <td className="text-center arabic huruf-col">{getArabHurufDisplay(item, 'tulis')}</td>
                <td className="text-center arabic">{getArabAngkaDisplay(item, 'tulis')}</td>
                <td className="arabic text-right">{item.mapel_arab || ''}</td>
                <td className="text-center arabic">{toArabicNumerals(idx + 1)}</td>
              </tr>
            ))}

            {/* B. MUHAFADZOH */}
            <tr className="header-subheader">
              <th colSpan="4" className="text-left pl-2 side-indonesia">B. Muhafadzoh</th>
              <th colSpan="4" className="text-right pr-2 side-arab arabic">المحافظة</th>
            </tr>
            {muhafadzohAkbar && (
              <tr>
                <td className="text-center">1</td>
                <td>
                  Muhafadzoh<br/>
                  <small className="kitab-name">{kelas.muhafadzoh_nama || 'Imrithi'}</small>
                </td>
                <td colSpan="2" className="text-center">
                  {getAngkaDisplay(muhafadzohAkbar, 'muhafadzoh')}
                </td>
                <td colSpan="2" className="text-center arabic">
                  {getArabAngkaDisplay(muhafadzohAkbar, 'muhafadzoh')}
                </td>
                <td className="arabic text-right">
                  المحافظة<br/>
                  <small>{kelas.muhafadzoh_arab || 'العمريطي'}</small>
                </td>
                <td className="text-center arabic">{toArabicNumerals(1)}</td>
              </tr>
            )}

            {/* C. QIROATUL KITAB */}
            <tr className="header-subheader">
              <th colSpan="4" className="text-left pl-2 side-indonesia">C. Qiroatul Kitab</th>
              <th colSpan="4" className="text-right pr-2 side-arab arabic">قرائة الكتب</th>
            </tr>
            {qiroatul && (
              <tr>
                <td className="text-center">1</td>
                <td>
                  Qiroatul Kitab<br/>
                  <small className="kitab-name">{kelas.qiroatul_nama || '-'}</small>
                </td>
                <td className="text-center">
                  {getAngkaDisplay(qiroatul, 'qiroah')}
                </td>
                <td className="text-center huruf-col">{getHurufDisplay(qiroatul, 'qiroah')}</td>
                <td className="text-center arabic huruf-col">{getArabHurufDisplay(qiroatul, 'qiroah')}</td>
                <td className="text-center arabic">{getArabAngkaDisplay(qiroatul, 'qiroah')}</td>
                <td className="arabic text-right">
                  قراءة الكتب<br/>
                  <small>{kelas.qiroatul_arab || '-'}</small>
                </td>
                <td className="text-center arabic">{toArabicNumerals(1)}</td>
              </tr>
            )}

            {/* D. TAFTISYUL KUTUB */}
            <tr className="header-subheader">
              <th colSpan="4" className="text-left pl-2 side-indonesia">D. Taftisyul Kutub</th>
              <th colSpan="4" className="text-right pr-2 side-arab arabic">تفتيش الكتب</th>
            </tr>
            {taftisyul && (
              <tr>
                <td className="text-center">1</td>
                <td>Taftisyul Kutub</td>
                <td colSpan="2" className="text-center">
                  {getAngkaDisplay(taftisyul, 'taftisy')}
                </td>
                <td colSpan="2" className="text-center arabic">
                  {getArabAngkaDisplay(taftisyul, 'taftisy')}
                </td>
                <td className="arabic text-right">تفتيش الكتب</td>
                <td className="text-center arabic">{toArabicNumerals(1)}</td>
              </tr>
            )}

            {/* JUMLAH / RATA-RATA / PERINGKAT — di bawah semua section */}
            <tr className="row-jumlah">
              <td colSpan="2" className="text-right pr-2"><b>Jumlah</b></td>
              <td className="text-center"><b>{cleanNumber(statistik.total)}</b></td>
              <td className="text-center huruf-col"><b>{terbilangIndonesia(statistik.total)}</b></td>
              <td className="text-center arabic"><b>{toArabicNumerals(cleanNumber(statistik.total))}</b></td>
              <td className="text-center arabic huruf-col"><b>{terbilangArab(statistik.total)}</b></td>
              <td colSpan="2" className="text-right arabic pr-2"><b>المجموع</b></td>
            </tr>
            <tr className="row-rata">
              <td colSpan="2" className="text-right pr-2"><b>Rata-rata</b></td>
              <td className="text-center"><b>{cleanNumber(statistik.rata_rata)}</b></td>
              <td className="text-center"></td>
              <td className="text-center arabic"></td>
              <td className="text-center arabic"><b>{toArabicNumerals(cleanNumber(statistik.rata_rata))}</b></td>
              <td colSpan="2" className="text-right arabic pr-2"><b>المعدل</b></td>
            </tr>
            <tr className="row-peringkat">
              <td colSpan="2" className="text-right pr-2"><b>Peringkat ke</b></td>
              <td className="text-center"><b>{statistik.peringkat}</b></td>
              <td className="text-center">dari {statistik.jumlah_santri} santri</td>
              <td className="text-center arabic">من {toArabicNumerals(statistik.jumlah_santri)}</td>
              <td className="text-center arabic"><b>{toArabicNumerals(statistik.peringkat)}</b></td>
              <td colSpan="2" className="text-right arabic pr-2"><b>الرتبة</b></td>
            </tr>
          </tbody>
        </table>

        {/* BOTTOM SECTION (ABSENSI & KEPRIBADIAN) */}
        <table className="info-table-bordered" style={{ marginTop: '10px' }}>
          <thead>
            <tr>
              <th colSpan="3" width="50%">Kehadiran / الغياب</th>
              <th colSpan="2" width="50%">Kepribadian / الأخلاق</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td width="30%">Sakit (مريض)</td>
              <td className="text-center" width="10%">{tambahan.sakit || 0}</td>
              <td width="10%">Hari</td>
              <td width="30%">Akhlaq (الأخلاق)</td>
              <td className="text-center" width="20%"><b>{tambahan.akhlaq || '-'}</b></td>
            </tr>
            <tr>
              <td>Izin (استئذان)</td>
              <td className="text-center">{tambahan.izin || 0}</td>
              <td>Hari</td>
              <td>Kerajinan (النشاط)</td>
              <td className="text-center"><b>{tambahan.keaktifan || '-'}</b></td>
            </tr>
            <tr>
              <td>Alpa (غائب)</td>
              <td className="text-center">{tambahan.alpa || 0}</td>
              <td>Hari</td>
              <td>Kerapihan (النظافة)</td>
              <td className="text-center"><b>{tambahan.kerapihan || '-'}</b></td>
            </tr>
          </tbody>
        </table>

        {/* CATATAN */}
        <div className="catatan-section">
          <div className="catatan-box">
            <b>Catatan Mustahiq:</b> {tambahan.catatan || ''}
          </div>
        </div>

        <div className="date-section" style={{ textAlign: 'left', marginTop: '2px', fontSize: '13px', marginBottom: '-5px' }}>
          Cintamulya, {getFormattedDate()}
        </div>

        {/* SIGNATURES */}
        <div className="signature-section">
          <div className="sig-box">
            <p><br/>Orang Tua / Wali Santri</p>
            <div className="ttd-area"></div>
            <p style={{ margin: '5px 0' }}>_____________________</p>
          </div>
          <div className="sig-box">
            <p>Mengetahui,<br/>Mustahiq {kelas.nama}</p>
            <div className="ttd-area">
              {kelas.mustahiq_ttd_url && (
                <img src={`${API_BASE}${kelas.mustahiq_ttd_url}`} alt="TTD Mustahiq" className="ttd-img" />
              )}
            </div>
            <p style={{ margin: '5px 0' }}><b>{kelas.mustahiq_nama || '_____________________'}</b></p>
          </div>
          <div className="sig-box">
            <p><br/>Kepala Madrasah Diniyah</p>
            <div className="ttd-area">
              {data.settings?.rapor_kepala_madrasah_ttd_url && (
                <img src={`${API_BASE}${data.settings.rapor_kepala_madrasah_ttd_url}`} alt="TTD Kepala Madrasah" className="ttd-img" />
              )}
            </div>
            <p style={{ margin: '5px 0' }}><b>Ust. Muhson Satibi</b></p>
          </div>
        </div>
      </div>
    </div>
  );
}
