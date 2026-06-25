import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';
import '../services/network_service.dart';
import '../widgets/offline_widget.dart';
import 'chat_detail_screen.dart';

class ChatRoomsScreen extends StatefulWidget {
  const ChatRoomsScreen({super.key});

  @override
  State<ChatRoomsScreen> createState() => _ChatRoomsScreenState();
}

class _ChatRoomsScreenState extends State<ChatRoomsScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  String? _errorMessage;
  List<dynamic> _rooms = [];
  Map<int, bool> _unreadMap = {};

  @override
  void initState() {
    super.initState();
    _fetchRooms();
  }

  Future<void> _fetchRooms() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    if (!NetworkService().isOnline) {
      setState(() {
        _errorMessage = 'NO_INTERNET';
        _isLoading = false;
      });
      return;
    }

    try {
      final dashboard = await _apiService.getDashboard();
      final currentGuruId = dashboard['user']?['guru_id'] ?? dashboard['user']?['id'];

      final data = await _apiService.getChatRooms();
      final rooms = data['rooms'] ?? [];

      const storage = FlutterSecureStorage();
      final Map<int, bool> unreadMap = {};

      for (var room in rooms) {
        final kelasId = room['kelas_id'];
        final lastMsg = room['last_message'];
        bool isUnread = false;

        if (lastMsg != null) {
          final senderId = lastMsg['sender_id'];
          if (senderId != currentGuruId) {
            final lastMsgTimeStr = lastMsg['created_at'];
            if (lastMsgTimeStr != null) {
              final lastMsgTime = DateTime.tryParse(lastMsgTimeStr.toString());
              if (lastMsgTime != null) {
                final lastReadStr = await storage.read(key: 'chat_room_last_read_$kelasId');
                if (lastReadStr == null) {
                  isUnread = true;
                } else {
                  final lastRead = DateTime.tryParse(lastReadStr);
                  if (lastRead == null || lastMsgTime.isAfter(lastRead)) {
                    isUnread = true;
                  }
                }
              }
            }
          }
        }
        unreadMap[kelasId] = isUnread;
      }

      setState(() {
        _rooms = rooms;
        _unreadMap = unreadMap;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  String _formatMessageTime(dynamic dateStr) {
    if (dateStr == null) return '';
    final parsed = DateTime.tryParse(dateStr.toString());
    if (parsed == null) return '';
    final local = parsed.toLocal();
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final messageDay = DateTime(local.year, local.month, local.day);
    final difference = today.difference(messageDay).inDays;

    final hours = local.hour.toString().padLeft(2, '0');
    final mins = local.minute.toString().padLeft(2, '0');

    if (difference == 0) {
      return '$hours:$mins';
    } else if (difference == 1) {
      return 'Kemarin';
    } else {
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      return '${local.day} ${months[local.month - 1]}';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: context.isDarkMode ? const Color(0xFF0D1527) : Colors.white.withOpacity(0.45),
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.titleColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Ruang Obrolan Kelas',
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: context.titleColor),
            onPressed: _fetchRooms,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : _errorMessage != null
              ? _buildErrorWidget()
              : _rooms.isEmpty
                  ? _buildEmptyWidget()
                  : RefreshIndicator(
                      onRefresh: _fetchRooms,
                      color: const Color(0xFF10B981),
                      child: ListView.builder(
                        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        itemCount: _rooms.length,
                        itemBuilder: (context, index) {
                          final room = _rooms[index];
                          final kelasId = room['kelas_id'];
                          final kelasNama = room['kelas_nama'] ?? 'Kelas';
                          final roles = room['roles'] as List<dynamic>? ?? [];
                          final lastMsg = room['last_message'];
                          
                          // Format roles label
                          String roleText = '';
                          if (kelasId < 0) {
                            roleText = 'Grup Guru';
                          } else {
                            final List<String> roleLabels = [];
                            if (roles.contains('mustahiq')) {
                              roleLabels.add('Wali Kelas');
                            }
                            if (roles.contains('munawib')) {
                              roleLabels.add('Guru Mapel');
                            }
                            roleText = roleLabels.join(' & ');
                          }

                          return Container(
                            margin: const EdgeInsets.only(bottom: 14),
                            decoration: BoxDecoration(
                              color: context.cardBg,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: context.borderColor, width: 1.2),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(context.isDarkMode ? 0.25 : 0.03),
                                  blurRadius: 15,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Material(
                              color: Colors.transparent,
                              borderRadius: BorderRadius.circular(20),
                              child: InkWell(
                                onTap: () async {
                                  await Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => ChatDetailScreen(
                                        kelasId: kelasId,
                                        kelasNama: kelasNama,
                                      ),
                                    ),
                                  );
                                  // Refresh last message when returning
                                  _fetchRooms();
                                },
                                borderRadius: BorderRadius.circular(20),
                                child: Padding(
                                  padding: const EdgeInsets.all(16.0),
                                  child: Row(
                                    children: [
                                      // Class avatar (Mustahiq's photo or class icon)
                                      Container(
                                        width: 50,
                                        height: 50,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: const Color(0xFF10B981).withOpacity(0.3),
                                            width: 1.5,
                                          ),
                                        ),
                                        child: ClipOval(
                                          child: (kelasId < 0)
                                              ? Container(
                                                  decoration: BoxDecoration(
                                                    gradient: LinearGradient(
                                                      colors: context.isDarkMode
                                                          ? [const Color(0xFF8B5CF6), const Color(0xFF6D28D9)]
                                                          : [const Color(0xFFC084FC), const Color(0xFF8B5CF6)],
                                                      begin: Alignment.topLeft,
                                                      end: Alignment.bottomRight,
                                                    ),
                                                  ),
                                                  child: const Center(
                                                    child: Icon(
                                                      Icons.domain_verification_rounded,
                                                      color: Colors.white,
                                                      size: 26,
                                                    ),
                                                  ),
                                                )
                                              : (room['mustahiq_foto_url'] != null && room['mustahiq_foto_url'].toString().isNotEmpty)
                                                  ? Image.network(
                                                      _apiService.getFullImageUrl(room['mustahiq_foto_url']),
                                                      fit: BoxFit.cover,
                                                      errorBuilder: (context, error, stackTrace) =>
                                                          _buildDefaultClassIcon(context),
                                                    )
                                                  : _buildDefaultClassIcon(context),
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      // Info
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Expanded(
                                                  child: Text(
                                                    '${kelasId < 0 ? "" : "Kelas "}$kelasNama',
                                                    style: GoogleFonts.outfit(
                                                      color: context.titleColor,
                                                      fontSize: 16,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ),
                                                if (lastMsg != null)
                                                  Text(
                                                    _formatMessageTime(lastMsg['created_at']),
                                                    style: GoogleFonts.outfit(
                                                      color: context.subTitleColor,
                                                      fontSize: 11,
                                                    ),
                                                  ),
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            Row(
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: (kelasId < 0 ? const Color(0xFF8B5CF6) : const Color(0xFF10B981)).withOpacity(0.12),
                                                    borderRadius: BorderRadius.circular(6),
                                                  ),
                                                  child: Text(
                                                    roleText,
                                                    style: GoogleFonts.outfit(
                                                      color: kelasId < 0 ? const Color(0xFF8B5CF6) : const Color(0xFF059669),
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            Text(
                                              lastMsg != null
                                                  ? '${lastMsg['sender_name']}: ${lastMsg['message']}'
                                                  : 'Belum ada obrolan.',
                                              style: GoogleFonts.outfit(
                                                color: lastMsg != null ? context.bodyColor : context.subTitleColor,
                                                fontSize: 13,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      if (_unreadMap[kelasId] == true)
                                        Container(
                                          margin: const EdgeInsets.only(right: 8),
                                          width: 8,
                                          height: 8,
                                          decoration: const BoxDecoration(
                                            color: Colors.redAccent,
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                      Icon(
                                        Icons.chevron_right_rounded,
                                        color: context.subTitleColor.withOpacity(0.6),
                                        size: 20,
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
    );
  }

  Widget _buildErrorWidget() {
    if (_errorMessage == 'NO_INTERNET') {
      return OfflineWidget(onRetry: _fetchRooms);
    }
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 48),
            const SizedBox(height: 16),
            Text(
              'Gagal memuat daftar chat',
              style: GoogleFonts.outfit(color: context.titleColor, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ?? '',
              style: GoogleFonts.outfit(color: context.bodyColor, fontSize: 13),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _fetchRooms,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Coba Lagi'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF10B981), size: 48),
            ),
            const SizedBox(height: 20),
            Text(
              'Tidak Ada Ruang Obrolan',
              style: GoogleFonts.outfit(color: context.titleColor, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Anda tidak terdaftar sebagai Wali Kelas atau mengajar di kelas manapun untuk Tahun Ajaran aktif.',
              style: GoogleFonts.outfit(color: context.bodyColor, fontSize: 13),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDefaultClassIcon(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: context.isDarkMode
              ? [const Color(0xFF064E3B), const Color(0xFF047857)]
              : [const Color(0xFF10B981).withOpacity(0.2), const Color(0xFF059669).withOpacity(0.35)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Icon(
          Icons.groups_rounded,
          color: context.isDarkMode ? const Color(0xFF34D399) : const Color(0xFF059669),
          size: 26,
        ),
      ),
    );
  }
}
