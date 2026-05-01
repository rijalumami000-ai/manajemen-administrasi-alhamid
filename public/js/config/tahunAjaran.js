const tahunAjaranCodes = [
  '2016-2017',
  '2017-2018',
  '2018-2019',
  '2019-2020',
  '2020-2021',
  '2021-2022',
  '2022-2023',
  '2023-2024',
  '2024-2025',
  '2025-2026',
  '2026-2027',
  '2027-2028',
  '2028-2029',
  '2029-2030',
];

export const DEFAULT_TAHUN_AJARAN_LIST = tahunAjaranCodes.map((kode, index) => {
  const [tahunMulai, tahunSelesai] = kode.split('-').map(Number);

  return {
    id: index + 1,
    kode,
    tahun_mulai: tahunMulai,
    tahun_selesai: tahunSelesai,
    status: kode === '2025-2026' ? 'berjalan' : 'arsip',
    is_active: kode === '2025-2026',
    jumlah_santri: 0,
  };
});
