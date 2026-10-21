import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { nilaiService } from '../services/nilaiService';
import { terbilangIndonesia, terbilangArab, predikatToArab, getPredikat, toArabicNumerals } from '../utils/terbilang';
import { LoadingState } from '../components/common/LoadingState';
import { SmartAlert } from '../components/ui/SmartAlert';
import { RaporData, RaporNilaiItem } from '../types/rapor';
import './RaporPrint.scss';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Helper: remove all decimals (bulatkan)
const cleanNumber = (val: any): string => {
  if (val === null || val === undefined) return '-';
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return String(Math.round(num));
};

// Helper: get current date in Indonesian format
const getFormattedDate = (): string => {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('id-ID', options);
};

export function RaporPrint() {
  const { tahun_ajaran_id, kelas_id, kategori_id, santri_id } = useParams<{
    tahun_ajaran_id: string;
    kelas_id: string;
    kategori_id: string;
    santri_id: string;
  }>();
  const navigate = useNavigate();

  const [data, setData] = useState<RaporData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Slider State
  const [santriList, setSantriList] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        if (santri_id === 'all') {
          const listRes = await (nilaiService as any).fetchRaporData({
            tahun_ajaran_id,
            kelas_id,
            kategori_evaluasi_id: kategori_id
          });
          if (Array.isArray(listRes) && listRes.length > 0) {
            setSantriList(listRes);
            setCurrentIndex(0);
            const res = await (nilaiService as any).fetchCetakRapor(tahun_ajaran_id, kelas_id, kategori_id, listRes[0].santri_id);
            setData(res);
          } else {
            setError('Tidak ada data santri untuk kelas ini.');
          }
        } else {
          const res = await (nilaiService as any).fetchCetakRapor(tahun_ajaran_id, kelas_id, kategori_id, santri_id);
          setData(res);
        }
      } catch (err: any) {
        console.error('RaporPrint fetchInitialData error:', err);
        setError('Gagal memuat data rapor. Pastikan semua parameter valid. Detail: ' + (err.message || err));
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [tahun_ajaran_id, kelas_id, kategori_id, santri_id]);

  useEffect(() => {
    const fetchNewRapor = async () => {
      if (santri_id !== 'all' || santriList.length === 0) return;

      const targetSantriId = santriList[currentIndex].santri_id;
      if (data && data.santri?.nis === santriList[currentIndex].nis) return;

      try {
        setLoading(true);
        const res = await (nilaiService as any).fetchCetakRapor(tahun_ajaran_id, kelas_id, kategori_id, targetSantriId);
        setData(res);
      } catch (err) {
        setError('Gagal memuat data rapor.');
      } finally {
        setLoading(false);
      }
    };
    fetchNewRapor();
  }, [currentIndex, santriList]);

  if (loading) return <LoadingState message="Memuat data rapor..." />;
  if (error) return <div style={{ padding: '50px' }}><SmartAlert type="error" message={error} /></div>;
  if (!data) return <div style={{ padding: '50px' }}><SmartAlert type="warning" message="Data rapor tidak ditemukan" /></div>;

  const santri = data.santri || {};
  const kelas = data.kelas || {};
  const tahun_ajaran = data.tahun_ajaran || '-';
  const semester = data.semester || '-';
  const nilai: RaporNilaiItem[] = Array.isArray(data.nilai) ? data.nilai : [];
  const tambahan = data.tambahan || {};
  const statistik = data.statistik || { peringkat: '-', total: 0, rata_rata: 0, jumlah_santri: 0 };

  const regulerMapels = nilai.filter(n => n.mapel_jenis === 'Reguler');
  const muhafadzohAkbar = nilai.find(n => n.mapel_jenis === 'Muhafadzoh' && n.mapel_nama?.includes('Akbar'));
  const qiroatul = nilai.find(n => n.mapel_jenis === 'Qiroah');
  const taftisyul = nilai.find(n => n.mapel_jenis === 'Taftisy');

  const handlePrint = () => {
    window.print();
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < santriList.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Helper: get the display values for Angka/Huruf columns based on jenis
  const getAngkaDisplay = (item: RaporNilaiItem, jenis: string): string | number => {
    if (jenis === 'tulis' || jenis === 'qiroah') {
      return item.nilai_angka !== null && item.nilai_angka !== undefined ? Math.round(Number(item.nilai_angka)) : '-';
    }
    if (jenis === 'muhafadzoh') {
      const pred = item.predikat || getPredikat(Number(item.nilai_angka));
      if (pred === 'Mumtaz') return 100;
      if (pred === 'Jayyid') return 80;
      if (pred === 'Mutawassith') return 60;
      if (pred === "Rodi'") return 40;
      return 0;
    }
    if (jenis === 'taftisy') {
      const val = item.capaian || '-';
      if (val === 'Tam') return 100;
      return 0;
    }
    return '-';
  };

  const getHurufDisplay = (item: RaporNilaiItem, jenis: string): string => {
    if (jenis === 'tulis') return terbilangIndonesia(item.nilai_angka);
    if (jenis === 'muhafadzoh') {
      const pred = item.predikat || getPredikat(Number(item.nilai_angka));
      return pred && pred !== '-' ? pred : '-';
    }
    if (jenis === 'qiroah') return terbilangIndonesia(item.nilai_angka);
    if (jenis === 'taftisy') return item.capaian || '-';
    return '-';
  };

  // Arabic side helpers
  const getArabAngkaDisplay = (item: RaporNilaiItem, jenis: string): string => {
    const angka = getAngkaDisplay(item, jenis);
    return toArabicNumerals(angka);
  };

  const getArabHurufDisplay = (item: RaporNilaiItem, jenis: string): string => {
    if (jenis === 'tulis') return terbilangArab(item.nilai_angka);
    if (jenis === 'muhafadzoh') {
      const pred = item.predikat || getPredikat(Number(item.nilai_angka));
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

  const getKepribadianText = (val?: string): string => {
    if (val === 'A') return 'Sangat Baik';
    if (val === 'B') return 'Baik';
    if (val === 'C') return 'Cukup';
    if (val === 'D') return 'Kurang';
    return '-';
  };

  return (
    <div className="rapor-print-container">
      {/* FLOATING ACTION DOCK (OPTION A LIQUID GLASS) */}
      <div className="print-controls no-print">
        <button type="button" className="btn-print-nav back-dock-btn" onClick={handleBack} title="Kembali ke Rekap Nilai">
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </button>

        <button type="button" className="btn-print-action primary" onClick={handlePrint}>
          <Printer size={16} />
          <span>Cetak Dokumen Rapor (F4)</span>
        </button>

        {santri_id === 'all' && santriList.length > 0 && (
          <div className="slider-nav">
            <button 
              type="button" 
              className="btn-print-nav" 
              onClick={handlePrev} 
              disabled={currentIndex === 0}
              title="Santri Sebelumnya"
            >
              <ChevronLeft size={16} />
              <span>Sebelumnya</span>
            </button>
            <span className="slider-counter">
              Santri ke-<strong>{currentIndex + 1}</strong> dari <strong>{santriList.length}</strong>
            </span>
            <button 
              type="button" 
              className="btn-print-nav" 
              onClick={handleNext} 
              disabled={currentIndex === santriList.length - 1}
              title="Santri Selanjutnya"
            >
              <span>Selanjutnya</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
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
                <td><b>{santri.nis || santri.nomor_induk || '-'}</b></td>

                <td>Semester</td>
                <td>:</td>
                <td><b>{semester}</b></td>
              </tr>
              <tr>
                <td>Mustahiq</td>
                <td>:</td>
                <td><b>{kelas.mustahiq_nama || kelas.wali_kelas || '-'}</b></td>

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
            {/* Main header */}
            <tr>
              <th rowSpan={2} width="4%" className="side-indonesia">No.</th>
              <th rowSpan={2} width="20%" className="side-indonesia">Mata Pelajaran</th>
              <th colSpan={2} className="side-indonesia">Hasil Ujian</th>
              <th colSpan={2} className="side-arab arabic">نتائج التمرين</th>
              <th rowSpan={2} width="20%" className="side-arab arabic">الفنون</th>
              <th rowSpan={2} width="4%" className="side-arab arabic">الرقم</th>
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
              <th colSpan={4} className="text-left pl-2 side-indonesia">A. Ujian Tulis</th>
              <th colSpan={4} className="text-right pr-2 side-arab arabic">الكتابة</th>
            </tr>
            {regulerMapels.map((item, idx) => (
              <tr key={item.mapel_id || item.id || idx}>
                <td className="text-center">{idx + 1}</td>
                <td>{item.mapel_nama}</td>
                <td className={`text-center ${Number(item.nilai_angka) <= 50 ? 'nilai-merah' : ''}`}>
                  {getAngkaDisplay(item, 'tulis')}
                </td>
                <td className={`text-center huruf-col ${Number(item.nilai_angka) <= 50 ? 'nilai-merah' : ''}`}>{getHurufDisplay(item, 'tulis')}</td>
                <td className={`text-center arabic huruf-col ${Number(item.nilai_angka) <= 50 ? 'nilai-merah' : ''}`} style={{ fontSize: '18px' }}>{getArabHurufDisplay(item, 'tulis')}</td>
                <td className={`text-center arabic ${Number(item.nilai_angka) <= 50 ? 'nilai-merah' : ''}`}>{getArabAngkaDisplay(item, 'tulis')}</td>
                <td className="arabic text-right">{item.mapel_arab || item.mapel_nama_arab || ''}</td>
                <td className="text-center arabic">{toArabicNumerals(idx + 1)}</td>
              </tr>
            ))}

            {/* B. MUHAFADZOH */}
            <tr className="header-subheader">
              <th colSpan={4} className="text-left pl-2 side-indonesia">B. Muhafadzoh</th>
              <th colSpan={4} className="text-right pr-2 side-arab arabic">المحافظة</th>
            </tr>
            {muhafadzohAkbar && (() => {
              const muhafadzohVal = Number(getAngkaDisplay(muhafadzohAkbar, 'muhafadzoh'));
              const isMerah = muhafadzohVal < 60;
              return (
                <tr>
                  <td className="text-center">1</td>
                  <td>
                    <span className="kitab-name">{kelas.muhafadzoh_nama || 'Imrithi'}</span>
                  </td>
                  <td colSpan={2} className={`text-center huruf-col ${isMerah ? 'nilai-merah' : ''}`}>
                    {muhafadzohAkbar.predikat || '-'}
                  </td>
                  <td colSpan={2} className={`text-center arabic huruf-col ${isMerah ? 'nilai-merah' : ''}`} style={{ fontSize: '18px' }}>
                    {getArabHurufDisplay(muhafadzohAkbar, 'muhafadzoh')}
                  </td>
                  <td className="arabic text-right">
                    <span className="kitab-name">{kelas.muhafadzoh_arab || 'العمريطي'}</span>
                  </td>
                  <td className="text-center arabic">{toArabicNumerals(1)}</td>
                </tr>
              );
            })()}

            {/* C. QIROATUL KITAB */}
            <tr className="header-subheader">
              <th colSpan={4} className="text-left pl-2 side-indonesia">C. Qiroatul Kitab</th>
              <th colSpan={4} className="text-right pr-2 side-arab arabic">قرائة الكتب</th>
            </tr>
            {qiroatul && (
              <tr>
                <td className="text-center">1</td>
                <td>
                  <span className="kitab-name">{kelas.qiroatul_nama || '-'}</span>
                </td>
                <td className={`text-center ${Number(qiroatul.nilai_angka) <= 50 ? 'nilai-merah' : ''}`}>
                  {getAngkaDisplay(qiroatul, 'qiroah')}
                </td>
                <td className={`text-center huruf-col ${Number(qiroatul.nilai_angka) <= 50 ? 'nilai-merah' : ''}`}>{getHurufDisplay(qiroatul, 'qiroah')}</td>
                <td className={`text-center arabic huruf-col ${Number(qiroatul.nilai_angka) <= 50 ? 'nilai-merah' : ''}`} style={{ fontSize: '18px' }}>{getArabHurufDisplay(qiroatul, 'qiroah')}</td>
                <td className={`text-center arabic ${Number(qiroatul.nilai_angka) <= 50 ? 'nilai-merah' : ''}`}>{getArabAngkaDisplay(qiroatul, 'qiroah')}</td>
                <td className="arabic text-right">
                  <span className="kitab-name">{kelas.qiroatul_arab || '-'}</span>
                </td>
                <td className="text-center arabic">{toArabicNumerals(1)}</td>
              </tr>
            )}

            {/* D. TAFTISYUL KUTUB */}
            <tr className="header-subheader">
              <th colSpan={4} className="text-left pl-2 side-indonesia">D. Taftisyul Kutub</th>
              <th colSpan={4} className="text-right pr-2 side-arab arabic">تفتيش الكتب</th>
            </tr>
            {taftisyul && (() => {
              const taftisyVal = Number(getAngkaDisplay(taftisyul, 'taftisy'));
              const isMerah = taftisyVal === 0;
              return (
                <tr>
                  <td className="text-center">1</td>
                  <td>
                    <span className="kitab-name">Taftisyul Kutub</span>
                  </td>
                  <td colSpan={2} className={`text-center huruf-col ${isMerah ? 'nilai-merah' : ''}`}>
                    {taftisyul.capaian || '-'}
                  </td>
                  <td colSpan={2} className={`text-center arabic huruf-col ${isMerah ? 'nilai-merah' : ''}`} style={{ fontSize: '18px' }}>
                    {getArabHurufDisplay(taftisyul, 'taftisy')}
                  </td>
                  <td className="arabic text-right">
                    <span className="kitab-name">تفتيش الكتب</span>
                  </td>
                  <td className="text-center arabic">{toArabicNumerals(1)}</td>
                </tr>
              );
            })()}

            {/* JUMLAH / RATA-RATA / PERINGKAT — di bawah semua section */}
            <tr className="row-jumlah">
              <td colSpan={2} className="text-left pl-2"><b>Jumlah</b></td>
              <td className="text-center"><b>{cleanNumber(statistik.total)}</b></td>
              <td className="text-center huruf-col"><b>{terbilangIndonesia(statistik.total)}</b></td>
              <td className="text-center arabic huruf-col" style={{ fontSize: '18px' }}><b>{terbilangArab(statistik.total)}</b></td>
              <td className="text-center arabic"><b>{toArabicNumerals(cleanNumber(statistik.total))}</b></td>
              <td colSpan={2} className="text-right arabic pr-2"><b>المجموع</b></td>
            </tr>
            <tr className="row-rata">
              <td colSpan={2} className="text-left pl-2"><b>Rata-rata</b></td>
              <td className="text-center"><b>{cleanNumber(statistik.rata_rata)}</b></td>
              <td className="text-center huruf-col"><b>{terbilangIndonesia(cleanNumber(statistik.rata_rata))}</b></td>
              <td className="text-center arabic huruf-col" style={{ fontSize: '18px' }}><b>{terbilangArab(cleanNumber(statistik.rata_rata))}</b></td>
              <td className="text-center arabic"><b>{toArabicNumerals(cleanNumber(statistik.rata_rata))}</b></td>
              <td colSpan={2} className="text-right arabic pr-2"><b>المعدل</b></td>
            </tr>
            <tr className="row-peringkat">
              <td colSpan={4} className="text-center"><b>Peringkat ke {statistik.peringkat} dari {statistik.jumlah_santri} santri</b></td>
              <td colSpan={4} className="text-center arabic" dir="rtl"><b>الرتبة {toArabicNumerals(statistik.peringkat)} من {toArabicNumerals(statistik.jumlah_santri)} طلاب</b></td>
            </tr>
          </tbody>
        </table>

        {/* BOTTOM SECTION (ABSENSI & KEPRIBADIAN) */}
        <table className="info-table-bordered" style={{ marginTop: '10px' }}>
          <thead>
            <tr>
              <th colSpan={3} width="50%">Absensi / الغياب</th>
              <th colSpan={3} width="50%">Kepribadian / الأخلاق</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td width="20%">Sakit (مريض)</td>
              <td className="text-center" width="15%">{tambahan.sakit || 0}</td>
              <td width="15%">Hari</td>
              <td width="20%">Akhlaq (الأخلاق)</td>
              <td className="text-center" width="10%"><b>{tambahan.akhlaq || '-'}</b></td>
              <td className="text-left pl-2" width="20%">{getKepribadianText(tambahan.akhlaq)}</td>
            </tr>
            <tr>
              <td>Izin (استئذان)</td>
              <td className="text-center">{tambahan.izin || 0}</td>
              <td>Hari</td>
              <td>Keaktifan (النشاط)</td>
              <td className="text-center"><b>{tambahan.keaktifan || '-'}</b></td>
              <td className="text-left pl-2">{getKepribadianText(tambahan.keaktifan)}</td>
            </tr>
            <tr>
              <td>Alpa (غائب)</td>
              <td className="text-center">{tambahan.alpa || 0}</td>
              <td>Hari</td>
              <td>Kerapihan (النظافة)</td>
              <td className="text-center"><b>{tambahan.kerapihan || '-'}</b></td>
              <td className="text-left pl-2" width="20%">{getKepribadianText(tambahan.kerapihan)}</td>
            </tr>
          </tbody>
        </table>

        {/* CATATAN & KENAIKAN KELAS */}
        <div className="catatan-section" style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: semester?.toLowerCase().includes('genap') ? 2 : 1, display: 'flex', alignItems: 'stretch', flexDirection: 'column' }}>
            <div className="catatan-box" style={{ flex: 1, width: '100%', minHeight: '25px', padding: '4px 6px', border: '1px solid #000', display: 'flex', gap: '8px' }}>
              <b style={{ whiteSpace: 'nowrap' }}>Catatan Mustahiq:</b>
              <span>{tambahan.catatan || ''}</span>
            </div>
          </div>
          {semester?.toLowerCase().includes('genap') && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', flexDirection: 'column' }}>
              <div className="catatan-box" style={{ flex: 1, width: '100%', minHeight: '25px', padding: '4px 6px', border: '1px solid #000', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <b style={{ whiteSpace: 'nowrap' }}>Naik ke kelas:</b>
                <b>{tambahan.keputusan_kenaikan || ''}</b>
              </div>
            </div>
          )}
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
