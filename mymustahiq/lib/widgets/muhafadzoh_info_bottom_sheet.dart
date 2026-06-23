import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class MuhafadzohInfoBottomSheet extends StatefulWidget {
  final int? tahunAjaranId;
  final String? semester;

  const MuhafadzohInfoBottomSheet({
    super.key,
    this.tahunAjaranId,
    this.semester,
  });

  static void show(BuildContext context, {int? tahunAjaranId, String? semester}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => MuhafadzohInfoBottomSheet(
        tahunAjaranId: tahunAjaranId,
        semester: semester,
      ),
    );
  }

  @override
  State<MuhafadzohInfoBottomSheet> createState() => _MuhafadzohInfoBottomSheetState();
}

class _MuhafadzohInfoBottomSheetState extends State<MuhafadzohInfoBottomSheet> {
  final ApiService _apiService = ApiService();
  late Future<List<dynamic>> _infoFuture;

  @override
  void initState() {
    super.initState();
    _infoFuture = _apiService.getMuhafadzohInfo(
      tahunAjaranId: widget.tahunAjaranId,
      semester: widget.semester,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;
    final bottomSheetBg = isDark ? const Color(0xFF111827) : Colors.white;
    final headingColor = isDark ? Colors.white : const Color(0xFF1E293B);
    final borderCol = isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.08);

    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: BoxDecoration(
        color: bottomSheetBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag Handle & Title
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.black12,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Ketentuan Nilai Muhafadzoh",
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: headingColor,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Informational Warning Banner
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(isDark ? 0.12 : 0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.blue.withOpacity(isDark ? 0.25 : 0.2),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_outline_rounded, color: Colors.blueAccent, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    "Tabel ini merupakan acuan ketentuan / kriteria nilai Ujian Muhafadzoh yang berlaku di Ponpes Al-Hamid. Data ini hanya bersifat informatif / administratif sebagai panduan pengisian nilai dan bukan merupakan aturan/rumusan perhitungan nilai baru.",
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      color: isDark ? Colors.blue[200] : Colors.blue[900],
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Content Table
          Expanded(
            child: FutureBuilder<List<dynamic>>(
              future: _infoFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator(color: Colors.orange));
                }
                if (snapshot.hasError) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 48),
                          const SizedBox(height: 12),
                          Text(
                            "Gagal memuat data",
                            style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: headingColor),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            snapshot.error.toString(),
                            textAlign: TextAlign.center,
                            style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                final list = snapshot.data ?? [];
                if (list.isEmpty) {
                  return const Center(child: Text("Tidak ada data ketentuan nilai."));
                }

                return SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.only(bottom: 24, left: 16, right: 16),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: borderCol),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        child: DataTable(
                          headingRowColor: MaterialStateProperty.all(
                            isDark ? const Color(0xFF1F2937) : const Color(0xFFF3F4F6),
                          ),
                          columnSpacing: 24,
                          horizontalMargin: 16,
                          columns: [
                            DataColumn(label: Text('Kelas', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: headingColor))),
                            DataColumn(label: Text('Kitab', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: headingColor))),
                            DataColumn(label: Text('Mumtaz', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF10B981)))),
                            DataColumn(label: Text('Jayyid', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: headingColor))),
                            DataColumn(label: Text('Mutawasith', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: headingColor))),
                            DataColumn(label: Text('Rodi\'', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.redAccent))),
                          ],
                          rows: list.map<DataRow>((item) {
                            final String kelas = item['kelas']?.toString() ?? '';
                            final String kitab = item['kitab']?.toString() ?? '';
                            final String mumtaz = item['mumtaz']?.toString() ?? '';
                            final String jayyid = item['jayyid']?.toString() ?? '';
                            final String mutawasith = item['mutawasith']?.toString() ?? '';
                            final String rodi = item['rodi']?.toString() ?? '';

                            final isArabic = (String text) => RegExp(r'[\u0600-\u06FF]').hasMatch(text);

                            Widget buildCellText(String text, {bool isMumtaz = false, bool isRodi = false}) {
                              final bool arabic = isArabic(text);
                              return Text(
                                text,
                                style: GoogleFonts.outfit(
                                  fontSize: arabic ? 16 : 13,
                                  fontWeight: (isMumtaz || isRodi || arabic) ? FontWeight.bold : FontWeight.normal,
                                  color: isMumtaz 
                                      ? const Color(0xFF10B981)
                                      : isRodi 
                                          ? Colors.redAccent 
                                          : (isDark ? Colors.white70 : Colors.black87),
                                ),
                              );
                            }

                            return DataRow(
                              cells: [
                                DataCell(Text(kelas, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: headingColor))),
                                DataCell(Text(kitab, style: GoogleFonts.outfit(color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF1E3A8A), fontWeight: FontWeight.w500))),
                                DataCell(buildCellText(mumtaz, isMumtaz: true)),
                                DataCell(buildCellText(jayyid)),
                                DataCell(buildCellText(mutawasith)),
                                DataCell(buildCellText(rodi, isRodi: true)),
                              ],
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
