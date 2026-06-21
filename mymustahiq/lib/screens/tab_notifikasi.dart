import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/theme_manager.dart';

class TabNotifikasi extends StatefulWidget {
  const TabNotifikasi({super.key});

  @override
  State<TabNotifikasi> createState() => _TabNotifikasiState();
}

class _TabNotifikasiState extends State<TabNotifikasi> {
  final List<Map<String, dynamic>> _notifications = [
    {
      'id': 1,
      'title': 'Jadwal Pelajaran Malam Ini Diperbarui',
      'body': 'Jadwal pelajaran kelas Diniyah Ula 3 malam ini mengalami penyesuaian untuk mata pelajaran Fathul Qorib. Silakan cek menu jadwal mengajar di tab Kelasku untuk rincian ustadz pengganti.',
      'category': 'Akademik',
      'time': '2 jam yang lalu',
      'isRead': false,
      'color': const Color(0xFF10B981),
    },
    {
      'id': 2,
      'title': 'Rapat Evaluasi Asatidz & Guru',
      'body': 'Diberitahukan kepada seluruh ustadz/ustadzah Madrasah Diniyah Al-Hamid untuk menghadiri rapat koordinasi evaluasi bulanan yang akan diselenggarakan hari ini pukul 20.00 WIB di Aula Utama.',
      'category': 'Pengumuman',
      'time': 'Hari ini, 08:30 WIB',
      'isRead': false,
      'color': const Color(0xFFF59E0B),
    },
    {
      'id': 3,
      'title': 'Input Nilai Semester Ganjil Dibuka',
      'body': 'Portal pengisian nilai santri binaan untuk Ujian Tengah Semester (UTS) Ganjil sudah dapat diakses. Batas akhir pengisian nilai adalah tanggal 30 Juni 2026.',
      'category': 'Akademik',
      'time': 'Kemarin',
      'isRead': true,
      'color': const Color(0xFF10B981),
    },
    {
      'id': 4,
      'title': 'Pembaruan Aplikasi MyMustahiq v1.2',
      'body': 'Aplikasi Anda telah diperbarui ke versi v1.2. Pembaruan ini mencakup navigasi menu baru (Bottom Navbar), fitur ganti password langsung dari HP, login sidik jari (biometrik), dan perbaikan pemuatan foto santri.',
      'category': 'Sistem',
      'time': '3 hari yang lalu',
      'isRead': true,
      'color': const Color(0xFF3B82F6),
    },
    {
      'id': 5,
      'title': 'Mujahadah Malam Jum\'at Rutin',
      'body': 'Mengingatkan kembali bahwa KBM diliburkan setiap malam Jumat untuk pelaksanaan Mujahadah & Istighosah kubro seluruh santri dan asatidz di Masjid Al-Hamid mulai bakda Maghrib.',
      'category': 'Pengumuman',
      'time': '1 minggu yang lalu',
      'isRead': true,
      'color': const Color(0xFFF59E0B),
    },
  ];

  void _markAllAsRead() {
    setState(() {
      for (var notification in _notifications) {
        notification['isRead'] = true;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Semua notifikasi ditandai dibaca',
          style: GoogleFonts.outfit(color: Colors.white, fontSize: 13),
        ),
        backgroundColor: const Color(0xFF064E3B),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showNotificationDetail(Map<String, dynamic> notif) {
    setState(() {
      notif['isRead'] = true;
    });

    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          backgroundColor: context.cardBg,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(color: context.borderColor),
          ),
          child: Padding(
            padding: const EdgeInsets.all(22.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: notif['color'].withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        notif['category'].toUpperCase(),
                        style: GoogleFonts.outfit(
                          color: notif['color'],
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ),
                    Text(
                      notif['time'],
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  notif['title'],
                  style: GoogleFonts.outfit(
                    color: context.titleColor,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Divider(color: context.borderColor, height: 1),
                const SizedBox(height: 12),
                Text(
                  notif['body'],
                  style: GoogleFonts.outfit(
                    color: context.bodyColor,
                    fontSize: 13,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 24),
                Align(
                  alignment: Alignment.centerRight,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF064E3B),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Text(
                      'Tutup',
                      style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => !n['isRead']).length;

    return Column(
      children: [
        // Top action bar
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(
                    'Notifikasi',
                    style: GoogleFonts.outfit(
                      color: context.titleColor,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (unreadCount > 0) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.redAccent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '$unreadCount Baru',
                        style: GoogleFonts.outfit(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              if (unreadCount > 0)
                TextButton.icon(
                  onPressed: _markAllAsRead,
                  icon: const Icon(Icons.done_all_rounded, size: 16, color: Color(0xFF10B981)),
                  label: Text(
                    'Tandai dibaca',
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF10B981),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                ),
            ],
          ),
        ),

        // List
        Expanded(
          child: ListView.builder(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: _notifications.length,
            itemBuilder: (context, index) {
              final notif = _notifications[index];
              final isRead = notif['isRead'] as bool;
              
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                child: Card(
                  color: isRead 
                      ? context.cardBg 
                      : (context.isDarkMode ? const Color(0xFF1F2937).withOpacity(0.4) : const Color(0xFF10B981).withOpacity(0.08)),
                  margin: EdgeInsets.zero,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(
                      color: isRead
                          ? context.borderColor
                          : const Color(0xFF10B981).withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  elevation: 0,
                  child: InkWell(
                    onTap: () => _showNotificationDetail(notif),
                    borderRadius: BorderRadius.circular(16),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Left Indicator dot / icon
                          Column(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: isRead ? Colors.transparent : const Color(0xFF10B981),
                                  shape: BoxShape.circle,
                                  boxShadow: isRead
                                      ? null
                                      : [
                                          BoxShadow(
                                            color: const Color(0xFF10B981).withOpacity(0.5),
                                            blurRadius: 4,
                                            spreadRadius: 1,
                                          )
                                        ],
                                ),
                              ),
                              const SizedBox(height: 8),
                              Icon(
                                notif['category'] == 'Akademik'
                                    ? Icons.school_rounded
                                    : notif['category'] == 'Pengumuman'
                                        ? Icons.campaign_rounded
                                        : Icons.settings_suggest_rounded,
                                color: notif['color'].withOpacity(isRead ? 0.5 : 0.9),
                                size: 18,
                              ),
                            ],
                          ),
                          const SizedBox(width: 14),

                          // Text Content
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: notif['color'].withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        notif['category'].toUpperCase(),
                                        style: GoogleFonts.outfit(
                                          color: notif['color'],
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                          letterSpacing: 0.6,
                                        ),
                                      ),
                                    ),
                                    Text(
                                      notif['time'],
                                      style: GoogleFonts.outfit(
                                        color: context.subTitleColor,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  notif['title'],
                                  style: GoogleFonts.outfit(
                                    color: isRead ? context.subTitleColor : context.titleColor,
                                    fontSize: 13,
                                    fontWeight: isRead ? FontWeight.w500 : FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  notif['body'],
                                  style: GoogleFonts.outfit(
                                    color: context.bodyColor,
                                    fontSize: 11,
                                    height: 1.3,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
