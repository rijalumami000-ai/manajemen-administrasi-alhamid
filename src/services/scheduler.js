const db = require('../../db');
const { getActiveTahunAjaran } = require('./tahunAjaranService');
const { sendNotification } = require('./notificationService');

let cron;
try {
  cron = require('node-cron');
} catch (e) {
  // Safe load if package is not yet fully installed synchronously
}

function startScheduler() {
  if (!cron) {
    try {
      cron = require('node-cron');
    } catch (e) {
      console.warn('⚠ node-cron package is not available.');
      return;
    }
  }

  // Schedule at 16:00 WIB daily
  cron.schedule('0 16 * * *', async () => {
    console.log('[Scheduler] Running daily notification task at 16:00 WIB...');
    try {
      await sendDailySchedules();
    } catch (err) {
      console.error('[Scheduler] Error in daily notification task:', err);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Jakarta"
  });
  console.log('[Scheduler] Daily notification task scheduled at 16:00 WIB');
}

async function sendDailySchedules() {
  const activeYear = await getActiveTahunAjaran();
  if (!activeYear) {
    console.log('[Scheduler] No active academic year found. Skipping.');
    return;
  }

  // Determine tonight's "malam" name
  // Sunday (0) -> Malam Senin, Monday (1) -> Malam Selasa, etc.
  const d = new Date();
  // Adjust to WIB timezone (GMT+7)
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const wibDate = new Date(utc + (3600000 * 7));
  
  const day = wibDate.getDay();
  const malamMap = [
    'Malam Senin', // Sunday -> Monday Eve
    'Malam Selasa', // Monday -> Tuesday Eve
    'Malam Rabu',   // Tuesday -> Wednesday Eve
    'Malam Kamis',  // Wednesday -> Thursday Eve
    'Malam Jumat',  // Thursday -> Friday Eve
    'Malam Sabtu',  // Friday -> Saturday Eve
    'Malam Ahad'    // Saturday -> Sunday Eve
  ];
  const upcomingMalam = malamMap[day];
  console.log(`[Scheduler] Current day index: ${day}. Upcoming malam: ${upcomingMalam}`);

  // Fetch teaching schedules for tonight
  const scheduleRes = await db.query(`
    SELECT j.guru_id, k.nama AS kelas_nama, mp.nama AS mata_pelajaran_nama, j.jam_ke
    FROM jadwal_pelajaran_harian j
    JOIN kelas k ON j.kelas_id = k.id
    JOIN mata_pelajaran mp ON j.mata_pelajaran_id = mp.id
    WHERE j.tahun_ajaran_id = $1 AND j.malam = $2
  `, [activeYear.id, upcomingMalam]);

  // Group schedules by teacher
  const teacherSchedules = {};
  for (const row of scheduleRes.rows) {
    if (!teacherSchedules[row.guru_id]) {
      teacherSchedules[row.guru_id] = [];
    }
    teacherSchedules[row.guru_id].push(row);
  }

  // Fetch mustahiq (homeroom) assignments for active year
  const mustahiqRes = await db.query(`
    SELECT kta.mustahiq_id, k.nama AS kelas_nama, k.id AS kelas_id
    FROM kelas_tahun_ajaran kta
    JOIN kelas k ON kta.kelas_id = k.id
    WHERE kta.tahun_ajaran_id = $1 AND kta.mustahiq_id IS NOT NULL
  `, [activeYear.id]);

  const mustahiqMap = {};
  for (const row of mustahiqRes.rows) {
    mustahiqMap[row.mustahiq_id] = row;
  }

  // Fetch all active teachers who have MyMustahiq accounts
  const guruRes = await db.query(`
    SELECT id, nama, jabatan_id
    FROM guru
    WHERE LOWER(status) = 'aktif' AND mymustahiq_username IS NOT NULL
  `);

  for (const guru of guruRes.rows) {
    const guruId = guru.id;
    let title = '';
    let body = '';
    let category = 'Akademik';

    const schedules = teacherSchedules[guruId] || [];
    const classBinaan = mustahiqMap[guruId];

    // 1. If teaching tonight
    if (schedules.length > 0) {
      title = 'Jadwal Mengajar Malam Ini';
      const scheduleDetails = schedules
        .sort((a, b) => a.jam_ke - b.jam_ke)
        .map(s => `Jam ke-${s.jam_ke} di ${s.kelas_nama} (${s.mata_pelajaran_nama})`)
        .join(', ');
      body = `Ustadz ${guru.nama}, jadwal mengajar Anda malam ini (${upcomingMalam}): ${scheduleDetails}.`;
    } 
    // 2. Else if they are a Mustahiq of a class
    else if (classBinaan) {
      // Find the schedule of their class tonight
      const classScheduleRes = await db.query(`
        SELECT mp.nama AS mata_pelajaran_nama, j.jam_ke, g.nama AS guru_nama
        FROM jadwal_pelajaran_harian j
        JOIN mata_pelajaran mp ON j.mata_pelajaran_id = mp.id
        LEFT JOIN guru g ON j.guru_id = g.id
        WHERE j.kelas_id = $1 AND j.tahun_ajaran_id = $2 AND j.malam = $3
        ORDER BY j.jam_ke
      `, [classBinaan.kelas_id, activeYear.id, upcomingMalam]);

      if (classScheduleRes.rows.length > 0) {
        title = 'Info Kelas Binaan Malam Ini';
        const scheduleDetails = classScheduleRes.rows
          .map(s => `Jam ke-${s.jam_ke}: ${s.mata_pelajaran_nama} oleh ${s.guru_nama || '-'}`)
          .join(', ');
        body = `Malam ini (${upcomingMalam}), kelas binaan Anda (${classBinaan.kelas_nama}) terjadwal KBM: ${scheduleDetails}.`;
      }
    }

    // Send notification if message body is constructed
    if (title && body) {
      await sendNotification({
        title,
        body,
        category,
        target: guruId
      });
    }
  }
}

module.exports = { startScheduler, sendDailySchedules };
