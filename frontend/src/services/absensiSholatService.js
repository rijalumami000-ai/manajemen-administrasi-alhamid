import { apiGet, apiPost } from './apiClient';

export const absensiSholatService = {
  registerFace: (santriId, faceDescriptor) => 
    apiPost('/absensi-sholat/register-face', { santriId, faceDescriptor }),
    
  scanFace: (faceDescriptor, sholat) => 
    apiPost('/absensi-sholat/scan', { faceDescriptor, sholat }),
    
  registerPalm: (santriId, palmDescriptor) => 
    apiPost('/absensi-sholat/register-palm', { santriId, palmDescriptor }),
    
  scanPalm: (palmDescriptor, sholat) => 
    apiPost('/absensi-sholat/scan', { palmDescriptor, sholat }),
    
  getTodayAttendance: () => 
    apiGet('/absensi-sholat/today'),
    
  getAttendanceRecap: (startDate, endDate, kelasId, sholat, jenisKelamin, kamarId, status, tahunAjaranId, semester) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (kelasId) params.append('kelasId', kelasId);
    if (sholat) params.append('sholat', sholat);
    if (jenisKelamin) params.append('jenisKelamin', jenisKelamin);
    if (kamarId) params.append('kamarId', kamarId);
    if (status) params.append('status', status);
    if (tahunAjaranId) params.append('tahunAjaranId', tahunAjaranId);
    if (semester) params.append('semester', semester);
    return apiGet(`/absensi-sholat/rekap?${params.toString()}`);
  },
  
  getUnattendedSantri: (sholat, date) => 
    apiGet(`/absensi-sholat/unattended?sholat=${sholat}&date=${date}`),
    
  recordManualAttendance: (santriId, sholat, status, keterangan = null) => 
    apiPost('/absensi-sholat/manual', { santriId, sholat, status, keterangan })
};
