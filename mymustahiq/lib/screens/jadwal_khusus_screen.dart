import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/theme_manager.dart';

class JadwalKhususScreen extends StatefulWidget {
  final int initialTabIndex; // 0 for Balagh Romadhon, 1 for Imam Tarawih & Bilal
  const JadwalKhususScreen({
    super.key,
    this.initialTabIndex = 0,
  });

  @override
  State<JadwalKhususScreen> createState() => _JadwalKhususScreenState();
}

class _JadwalKhususScreenState extends State<JadwalKhususScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedFaseRamadhan = 'Semua';

  final List<Map<String, dynamic>> _kajianBalaghList = [
    {
      'kitab': 'Shohih Al-Bukhari (Mukhtashor)',
      'mualif': 'Imam Abu Abdillah Muhammad bin Ismail Al-Bukhari',
      'pengampu': 'K.H. Musthofa Bisri (Pengasuh)',
      'waktu': 'Ba\'da Shubuh - 07.30 WIB',
      'tempat': 'Masjid Jami\' Al-Hamid',
      'target': 'Khatam 20 Ramadhan',
      'peserta': 'Seluruh Santri & Alumni',
      'badgeColor': const Color(0xFF10B981),
    },
    {
      'kitab': 'Mukhtashor Ibni Abi Jamroh',
      'mualif': 'Imam Ibnu Abi Jamroh Al-Andalusi',
      'pengampu': 'K.H. Ahmad Dahlan, Lc',
      'waktu': 'Ba\'da Ashar - Menjelang Maghrib',
      'tempat': 'Aula Utama Pondok Putri & Putra',
      'target': 'Khatam 17 Ramadhan (Nuzulul Qur\'an)',
      'peserta': 'Santri Wustho & Ulya',
      'badgeColor': const Color(0xFF3B82F6),
    },
    {
      'kitab': 'Kifayatul Atqiya\' wa Minhajul Ashfiya\'',
      'mualif': 'Sayyid Bakri bin Muhammad Syatha Ad-Dimyathi',
      'pengampu': 'Ust. M. Syukron, M.Ag',
      'waktu': 'Ba\'da Tarawih - 22.00 WIB',
      'tempat': 'Musholla As-Salam (Komplek Barat)',
      'target': 'Khatam 21 Ramadhan',
      'peserta': 'Khusus Santri Kelas 3 & Ulya',
      'badgeColor': const Color(0xFF8B5CF6),
    },
    {
      'kitab': 'Risalatul Mu\'awanah wal Mudzakarah',
      'mualif': 'Al-Habib Abdullah bin Alawi Al-Haddad',
      'pengampu': 'Ust. Nurul Huda, S.Pd.I',
      'waktu': '09.00 - 11.00 WIB (Pagi)',
      'tempat': 'Gedung Madrasah Lt. 2',
      'target': 'Khatam 15 Ramadhan',
      'peserta': 'Santri Sifir & Ibtidaiyah',
      'badgeColor': const Color(0xFFF59E0B),
    },
    {
      'kitab': 'Bidayatul Hidayah (Bab Adab & Ubudiyah)',
      'mualif': 'Hujjatul Islam Imam Al-Ghazali',
      'pengampu': 'Ust. Farhan Azis & Dewan Asatidz',
      'waktu': '13.30 - 15.00 WIB (Siang)',
      'tempat': 'Teras Ndalem Pengasuh',
      'target': 'Khatam 18 Ramadhan',
      'peserta': 'Santri Baru & Kader Da\'i',
      'badgeColor': const Color(0xFFEC4899),
    },
  ];

  final List<Map<String, dynamic>> _tarawihList = [
    {
      'malam': 1,
      'hijriah': '1 Ramadhan 1446 H',
      'fase': '10 Pertama (Rahmah)',
      'imam': 'K.H. Musthofa Bisri',
      'bilal': 'Ust. Rifqi Maulana',
      'juz': 'Juz 1 (Al-Baqarah 1-141)',
      'tempat': 'Masjid Jami\' Al-Hamid',
    },
    {
      'malam': 2,
      'hijriah': '2 Ramadhan 1446 H',
      'fase': '10 Pertama (Rahmah)',
      'imam': 'Ust. M. Syukron, M.Ag',
      'bilal': 'Ust. Ahmad Wildan',
      'juz': 'Juz 2 (Al-Baqarah 142-252)',
      'tempat': 'Masjid Jami\' Al-Hamid',
    },
    {
      'malam': 3,
      'hijriah': '3 Ramadhan 1446 H',
      'fase': '10 Pertama (Rahmah)',
      'imam': 'Ust. Nurul Huda, S.Pd.I',
      'bilal': 'Ust. Farhan Azis',
      'juz': 'Juz 3 (Al-Baqarah 253 - Ali \'Imran 92)',
      'tempat': 'Masjid Jami\' Al-Hamid',
    },
    {
      'malam': 15,
      'hijriah': '15 Ramadhan 1446 H',
      'fase': '10 Kedua (Maghfirah)',
      'imam': 'K.H. Ahmad Dahlan, Lc',
      'bilal': 'Ust. Zidni Ilman',
      'juz': 'Juz 15 (Al-Isra\' 1 - Al-Kahf 74)',
      'tempat': 'Masjid Jami\' Al-Hamid (Mulai Doa Qunut)',
    },
    {
      'malam': 21,
      'hijriah': '21 Ramadhan 1446 H',
      'fase': '10 Terakhir (Itqun Minan Nar)',
      'imam': 'K.H. Musthofa Bisri',
      'bilal': 'Ust. Rifqi Maulana',
      'juz': 'Juz 21 (Al-\'Ankabut 46 - Al-Ahzab 30) + Qiyamul Lail',
      'tempat': 'Masjid Jami\' Al-Hamid',
    },
    {
      'malam': 27,
      'hijriah': '27 Ramadhan 1446 H',
      'fase': '10 Terakhir (Itqun Minan Nar)',
      'imam': 'K.H. Musthofa Bisri & Para Hufadz',
      'bilal': 'Ust. M. Syukron',
      'juz': 'Juz 27 (Adz-Dzariyat 31 - Al-Hadid 29) + Khataman Tarawih',
      'tempat': 'Masjid Jami\' Al-Hamid',
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 2,
      vsync: this,
      initialIndex: widget.initialTabIndex,
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0D1527) : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.titleColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Jadwal Khusus & Romadhon",
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontWeight: FontWeight.bold,
            fontSize: 17,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF10B981),
          indicatorWeight: 3,
          labelColor: const Color(0xFF10B981),
          unselectedLabelColor: context.subTitleColor,
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13),
          unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w500, fontSize: 13),
          tabs: const [
            Tab(
              icon: Icon(Icons.menu_book_rounded, size: 18),
              text: "Kajian Balagh Romadhon",
            ),
            Tab(
              icon: Icon(Icons.mosque_rounded, size: 18),
              text: "Imam Tarawih & Bilal",
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildBalaghTab(context, isDark),
          _buildTarawihTab(context, isDark),
        ],
      ),
    );
  }

  Widget _buildBalaghTab(BuildContext context, bool isDark) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Banner Ramadhan
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isDark
                    ? [const Color(0xFF065F46), const Color(0xFF0F172A)]
                    : [const Color(0xFFECFDF5), const Color(0xFFD1FAE5)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: const Color(0xFF10B981).withOpacity(0.3),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.18),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.nights_stay_rounded, color: Color(0xFF10B981), size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Kajian Kilatan Balagh Romadhon",
                        style: GoogleFonts.outfit(
                          color: isDark ? Colors.white : const Color(0xFF065F46),
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Khataman Kitab Salaf bersama Masyayikh & Dewan Asatidz Pondok Pesantren Al-Hamid.",
                        style: GoogleFonts.outfit(
                          color: isDark ? Colors.white70 : const Color(0xFF047857),
                          fontSize: 11,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          Text(
            "DAFTAR KITAB & JADWAL PENGAJIAN",
            style: GoogleFonts.outfit(
              color: context.subTitleColor,
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 12),

          ..._kajianBalaghList.map((item) => _buildBalaghCard(item, isDark)),
        ],
      ),
    );
  }

  Widget _buildTarawihTab(BuildContext context, bool isDark) {
    final filtered = _tarawihList.where((item) {
      if (_selectedFaseRamadhan == 'Semua') return true;
      return item['fase'] == _selectedFaseRamadhan;
    }).toList();

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Filter Fase
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                'Semua',
                '10 Pertama (Rahmah)',
                '10 Kedua (Maghfirah)',
                '10 Terakhir (Itqun Minan Nar)',
              ].map((fase) {
                final isSelected = _selectedFaseRamadhan == fase;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(fase, style: GoogleFonts.outfit(fontSize: 12)),
                    selected: isSelected,
                    onSelected: (val) => setState(() => _selectedFaseRamadhan = fase),
                    selectedColor: const Color(0xFF10B981).withOpacity(0.18),
                    labelStyle: GoogleFonts.outfit(
                      color: isSelected ? const Color(0xFF10B981) : context.subTitleColor,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    backgroundColor: isDark ? const Color(0xFF131C2E) : Colors.white,
                    side: BorderSide(
                      color: isSelected
                          ? const Color(0xFF10B981)
                          : (isDark ? Colors.white12 : Colors.black12),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 18),

          Text(
            "JADWAL PETUGAS SHOLAT ISYA', TARAWIH & WITIR",
            style: GoogleFonts.outfit(
              color: context.subTitleColor,
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 12),

          ...filtered.map((item) => _buildTarawihCard(item, isDark)),
        ],
      ),
    );
  }

  Widget _buildBalaghCard(Map<String, dynamic> item, bool isDark) {
    final Color badgeCol = item['badgeColor'] as Color;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.06),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: badgeCol.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  item['target'],
                  style: GoogleFonts.outfit(
                    color: badgeCol,
                    fontWeight: FontWeight.bold,
                    fontSize: 10,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                item['peserta'],
                style: GoogleFonts.outfit(
                  color: context.subTitleColor,
                  fontSize: 11,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            item['kitab'],
            style: GoogleFonts.outfit(
              color: context.titleColor,
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
          Text(
            "Karya: ${item['mualif']}",
            style: GoogleFonts.outfit(
              color: context.subTitleColor,
              fontSize: 11,
              fontStyle: FontStyle.italic,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.02) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.person_pin_rounded, color: Color(0xFF10B981), size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        "Qori': ${item['pengampu']}",
                        style: GoogleFonts.outfit(
                          color: context.titleColor,
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(Icons.access_time_rounded, color: context.subTitleColor, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        item['waktu'],
                        style: GoogleFonts.outfit(
                          color: context.subTitleColor,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.place_rounded, color: context.subTitleColor, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        item['tempat'],
                        style: GoogleFonts.outfit(
                          color: context.subTitleColor,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTarawihCard(Map<String, dynamic> item, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.06),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF10B981), Color(0xFF059669)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  "${item['malam']}",
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Malam ke-${item['malam']} Ramadhan",
                      style: GoogleFonts.outfit(
                        color: context.titleColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      "${item['hijriah']} • ${item['fase']}",
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.02) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.person_rounded, color: Color(0xFF10B981), size: 16),
                    const SizedBox(width: 8),
                    Text("Imam: ", style: GoogleFonts.outfit(fontSize: 12, color: context.subTitleColor)),
                    Expanded(
                      child: Text(
                        item['imam'],
                        style: GoogleFonts.outfit(
                          color: context.titleColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.record_voice_over_rounded, color: Color(0xFF3B82F6), size: 16),
                    const SizedBox(width: 8),
                    Text("Bilal: ", style: GoogleFonts.outfit(fontSize: 12, color: context.subTitleColor)),
                    Expanded(
                      child: Text(
                        item['bilal'],
                        style: GoogleFonts.outfit(
                          color: context.titleColor,
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.menu_book_rounded, color: Color(0xFFF59E0B), size: 16),
                    const SizedBox(width: 8),
                    Text("Tilawah: ", style: GoogleFonts.outfit(fontSize: 12, color: context.subTitleColor)),
                    Expanded(
                      child: Text(
                        item['juz'],
                        style: GoogleFonts.outfit(
                          color: context.subTitleColor,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
