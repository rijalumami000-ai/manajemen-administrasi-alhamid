import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Spin, Alert, Button } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { nilaiService } from '../services/nilaiService';
import './RaporPrint.scss';

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

  const getPredikat = (nilaiAngka) => {
    if (nilaiAngka === null || nilaiAngka === undefined) return '-';
    const n = Number(nilaiAngka);
    if (n >= 95) return 'Mumtaz';
    if (n >= 85) return 'Jayyid';
    if (n >= 75) return 'Mutawassith';
    return "Rodi'";
  };

  const regulerMapels = nilai.filter(n => n.mapel_jenis === 'Reguler');
  const muhafadzohAkbar = nilai.find(n => n.mapel_jenis === 'Muhafadzoh' && n.mapel_nama?.includes('Akbar'));
  const qiroatul = nilai.find(n => n.mapel_jenis?.includes('Qiroatul'));
  const taftisyul = nilai.find(n => n.mapel_jenis?.includes('Taftisyul'));
  const muhafadzohMini = nilai.filter(n => n.mapel_jenis === 'Muhafadzoh' && n.mapel_nama?.includes('Mini'));

  const handlePrint = () => {
    window.print();
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
            <h2>YAYASAN PONDOK PESANTREN AL-HAMID</h2>
            <h3>MADRASAH DINIYAH TAKMILIYAH AL-HAMID</h3>
            <p>Jl. Raya Cilangkap Baru RT.07/01 Cilangkap Cipayung Jakarta Timur 13870</p>
          </div>
          <hr />
          <h3 className="title-rapor">LEMBAR HASIL EVALUASI BELAJAR SANTRI (RAPOR)</h3>
          
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
                <td>NIS / NISM</td>
                <td>:</td>
                <td><b>{santri.nis}</b></td>
                
                <td>Semester</td>
                <td>:</td>
                <td><b>{semester}</b></td>
              </tr>
              <tr>
                <td>Wali Kelas</td>
                <td>:</td>
                <td><b>{kelas.mustahiq_nama || '-'}</b></td>
                
                <td>Tahun Ajaran</td>
                <td>:</td>
                <td><b>{tahun_ajaran}</b></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* NILAI TABLE */}
        <table className="nilai-table">
          <thead>
            <tr>
              <th rowSpan="2" width="5%">No</th>
              <th rowSpan="2" width="30%">Mata Pelajaran</th>
              <th rowSpan="2" width="20%" dir="rtl" className="arabic">المادة</th>
              <th rowSpan="2" width="10%">KKM</th>
              <th colSpan="2">Nilai</th>
            </tr>
            <tr>
              <th width="15%">Angka</th>
              <th width="20%">Predikat</th>
            </tr>
            <tr className="header-subheader">
              <th colSpan="6" style={{ textAlign: 'left', paddingLeft: '10px' }}>A. Ujian Tulis (الامتحان التحريري)</th>
            </tr>
          </thead>
          <tbody>
            {regulerMapels.map((item, idx) => (
              <tr key={item.id}>
                <td className="text-center">{idx + 1}</td>
                <td>{item.mapel_nama}</td>
                <td className="arabic text-right">{item.mapel_arab || ''}</td>
                <td className="text-center">60</td>
                <td className={`text-center ${item.nilai_angka < 51 ? 'nilai-merah' : ''}`}>
                  {item.nilai_angka}
                </td>
                <td className="text-center">{getPredikat(item.nilai_angka)}</td>
              </tr>
            ))}
            
            {/* JUMLAH */}
            <tr className="row-jumlah">
              <td colSpan="4" className="text-right pr-2"><b>Jumlah (المجموع)</b></td>
              <td className="text-center"><b>{statistik.total}</b></td>
              <td className="text-center"><b></b></td>
            </tr>
            <tr className="row-rata">
              <td colSpan="4" className="text-right pr-2"><b>Rata-rata (المعدل)</b></td>
              <td className="text-center"><b>{statistik.rata_rata}</b></td>
              <td className="text-center"><b>{getPredikat(statistik.rata_rata)}</b></td>
            </tr>
            <tr className="row-peringkat">
              <td colSpan="4" className="text-right pr-2"><b>Peringkat ke (الرتبة)</b></td>
              <td className="text-center"><b>{statistik.peringkat}</b></td>
              <td className="text-center">dari {statistik.jumlah_santri} santri</td>
            </tr>

            {/* B. UJIAN LISAN */}
            <tr className="header-subheader">
              <th colSpan="6" style={{ textAlign: 'left', paddingLeft: '10px' }}>B. Ujian Lisan (الامتحان الشفوي)</th>
            </tr>
            {muhafadzohAkbar && (
              <tr>
                <td className="text-center">1</td>
                <td>
                  Muhafadzoh<br/>
                  <small className="kitab-name">{kelas.muhafadzoh_nama || 'Imrithi'}</small>
                </td>
                <td className="arabic text-right">
                  المحافظة<br/>
                  <small>{kelas.muhafadzoh_arab || 'العمريطي'}</small>
                </td>
                <td className="text-center">-</td>
                <td className="text-center">{muhafadzohAkbar.nilai_angka || '-'}</td>
                <td className="text-center">{muhafadzohAkbar.predikat || getPredikat(muhafadzohAkbar.nilai_angka)}</td>
              </tr>
            )}
            {qiroatul && (
              <tr>
                <td className="text-center">{muhafadzohAkbar ? 2 : 1}</td>
                <td>
                  Qiroatul Kitab<br/>
                  <small className="kitab-name">{kelas.qiroatul_nama || '-'}</small>
                </td>
                <td className="arabic text-right">
                  قراءة الكتب<br/>
                  <small>{kelas.qiroatul_arab || '-'}</small>
                </td>
                <td className="text-center">-</td>
                <td className="text-center">{qiroatul.nilai_angka || '-'}</td>
                <td className="text-center">{qiroatul.predikat || getPredikat(qiroatul.nilai_angka)}</td>
              </tr>
            )}
            
            {/* C. TAFTISYUL KUTUB */}
            <tr className="header-subheader">
              <th colSpan="6" style={{ textAlign: 'left', paddingLeft: '10px' }}>C. Taftisyul Kutub (تفتيش الكتب)</th>
            </tr>
            {taftisyul && (
              <tr>
                <td className="text-center">1</td>
                <td>Taftisyul Kutub</td>
                <td className="arabic text-right">تفتيش الكتب</td>
                <td colSpan="3" className="text-center">{taftisyul.capaian || '-'}</td>
              </tr>
            )}

            {/* D. UJIAN MUHAFADZOH MINI */}
            {muhafadzohMini.length > 0 && (
              <>
                <tr className="header-subheader">
                  <th colSpan="6" style={{ textAlign: 'left', paddingLeft: '10px' }}>D. Ujian Muhafadzoh (امتحان المحافظة)</th>
                </tr>
                {muhafadzohMini.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="text-center">{idx + 1}</td>
                    <td>{item.mapel_nama}</td>
                    <td className="arabic text-right">{item.mapel_arab || ''}</td>
                    <td colSpan="3" className="text-center">{item.predikat || '-'}</td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>

        {/* BOTTOM SECTION (ABSENSI & KEPRIBADIAN) */}
        <div className="bottom-section">
          <div className="col-half">
            <table className="info-table-bordered">
              <thead>
                <tr>
                  <th colSpan="3">Kehadiran / الغياب</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Sakit (مريض)</td>
                  <td className="text-center" width="20%">{tambahan.sakit || 0}</td>
                  <td>Hari</td>
                </tr>
                <tr>
                  <td>Izin (استئذان)</td>
                  <td className="text-center">{tambahan.izin || 0}</td>
                  <td>Hari</td>
                </tr>
                <tr>
                  <td>Alpa (غائب)</td>
                  <td className="text-center">{tambahan.alpa || 0}</td>
                  <td>Hari</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="col-half">
            <table className="info-table-bordered">
              <thead>
                <tr>
                  <th colSpan="2">Kepribadian / الأخلاق</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Akhlaq (الأخلاق)</td>
                  <td className="text-center" width="30%"><b>{tambahan.akhlaq || '-'}</b></td>
                </tr>
                <tr>
                  <td>Kerajinan (النشاط)</td>
                  <td className="text-center"><b>{tambahan.keaktifan || '-'}</b></td>
                </tr>
                <tr>
                  <td>Kerapihan (النظافة)</td>
                  <td className="text-center"><b>{tambahan.kerapihan || '-'}</b></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CATATAN */}
        <div className="catatan-section">
          <b>Catatan Wali Kelas:</b>
          <div className="catatan-box">
            {tambahan.catatan || ''}
          </div>
        </div>

        {/* SIGNATURES */}
        <div className="signature-section">
          <div className="sig-box">
            <p>Mengetahui,<br/>Orang Tua / Wali Santri</p>
            <br/><br/><br/>
            <p>_____________________</p>
          </div>
          <div className="sig-box">
            <p>Jakarta, ..........................<br/>Wali Kelas {kelas.nama}</p>
            <br/><br/><br/>
            <p><b>{kelas.mustahiq_nama || '_____________________'}</b></p>
          </div>
          <div className="sig-box">
            <p>Mengetahui,<br/>Kepala Madrasah Diniyah</p>
            <br/><br/><br/>
            <p><b>Ahmad Fauzi</b></p>
          </div>
        </div>

      </div>
    </div>
  );
}
