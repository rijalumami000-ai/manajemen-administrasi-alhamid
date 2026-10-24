import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';
import '../services/network_service.dart';
import '../widgets/offline_widget.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final ApiService _apiService = ApiService();
  
  bool _isLoading = true;
  String? _errorMessage;
  List<dynamic> _notifications = [];

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    if (!NetworkService().isOnline) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'NO_INTERNET';
      });
      return;
    }

    try {
      final list = await _apiService.getNotifications();
      setState(() {
        _notifications = list;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      await _apiService.markNotificationsAsRead();
      setState(() {
        for (var n in _notifications) {
          n['is_read'] = true;
        }
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Semua notifikasi ditandai dibaca',
              style: GoogleFonts.outfit(color: Colors.white, fontSize: 13),
            ),
            backgroundColor: const Color(0xFF10B981),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Gagal menandai semua notifikasi: ${e.toString().replaceFirst('Exception: ', '')}',
              style: GoogleFonts.outfit(color: Colors.white, fontSize: 13),
            ),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  Future<void> _deleteNotificationSingle(int id) async {
    try {
      await _apiService.deleteNotification(id);
      setState(() {
        _notifications.removeWhere((n) => n['id'] == id);
      });
    } catch (e) {
      _fetchNotifications();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal menghapus notifikasi: ${e.toString().replaceFirst('Exception: ', '')}'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  Future<void> _clearAllNotifications() async {
    try {
      await _apiService.clearAllNotifications();
      setState(() {
        _notifications.clear();
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Semua riwayat notifikasi berhasil dihapus',
              style: GoogleFonts.outfit(color: Colors.white, fontSize: 13),
            ),
            backgroundColor: const Color(0xFF10B981),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal menghapus riwayat: ${e.toString().replaceFirst('Exception: ', '')}'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  Future<bool?> _showDeleteConfirmDialog(dynamic notif) async {
    return await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: context.cardBg,
        title: Text('Hapus Notifikasi?', style: GoogleFonts.outfit(color: context.titleColor, fontWeight: FontWeight.bold)),
        content: Text('Apakah Anda yakin ingin menghapus notifikasi ini?', style: GoogleFonts.outfit(color: context.bodyColor)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Batal', style: GoogleFonts.outfit(color: context.subTitleColor)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Hapus', style: GoogleFonts.outfit(color: Colors.redAccent, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Future<void> _showClearAllConfirmDialog() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: context.cardBg,
        title: Text('Hapus Semua Riwayat?', style: GoogleFonts.outfit(color: context.titleColor, fontWeight: FontWeight.bold)),
        content: Text('Apakah Anda yakin ingin menghapus seluruh riwayat notifikasi Anda? Tindakan ini tidak dapat dibatalkan.', style: GoogleFonts.outfit(color: context.bodyColor)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Batal', style: GoogleFonts.outfit(color: context.subTitleColor)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Hapus Semua', style: GoogleFonts.outfit(color: Colors.redAccent, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    if (confirm == true) {
      _clearAllNotifications();
    }
  }

  Future<void> _showNotificationDetail(dynamic notif) async {
    final notifId = notif['id'];
    final wasUnread = notif['is_read'] == false;
    
    if (wasUnread) {
      try {
        await _apiService.markNotificationAsReadSingle(notifId);
        setState(() {
          notif['is_read'] = true;
        });
      } catch (_) {}
    }

    if (!mounted) return;

    final categoryColor = _getCategoryColor(notif['category'] ?? '');

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
                        color: categoryColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        (notif['category'] ?? 'INFO').toUpperCase(),
                        style: GoogleFonts.outfit(
                          color: categoryColor,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ),
                    Text(
                      _formatDate(notif['created_at']),
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  notif['title'] ?? '',
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
                  notif['body'] ?? '',
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
                      backgroundColor: const Color(0xFF10B981),
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

  Color _getCategoryColor(String cat) {
    switch (cat.toLowerCase()) {
      case 'akademik':
        return const Color(0xFF10B981);
      case 'pengumuman':
        return const Color(0xFFF59E0B);
      case 'sistem':
        return const Color(0xFF3B82F6);
      default:
        return const Color(0xFFEC4899); // Pink default to match the new style
    }
  }

  String _formatDate(dynamic dateStr) {
    if (dateStr == null) return '';
    final parsed = DateTime.tryParse(dateStr.toString());
    if (parsed == null) return dateStr.toString();
    final local = parsed.toLocal();
    final hours = local.hour.toString().padLeft(2, '0');
    final mins = local.minute.toString().padLeft(2, '0');
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return "$hours:$mins, ${local.day} ${months[local.month - 1]} ${local.year}";
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => n['is_read'] == false).length;

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: context.isDarkMode ? const Color(0xFF0D1527) : Colors.white.withOpacity(0.45),
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.titleColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Notifikasi',
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        actions: [
          if (_notifications.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep_rounded, color: Colors.redAccent, size: 22),
              tooltip: 'Hapus Semua',
              onPressed: _showClearAllConfirmDialog,
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
                padding: const EdgeInsets.symmetric(horizontal: 14),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : _errorMessage != null
              ? _buildErrorWidget()
              : _notifications.isEmpty
                  ? _buildEmptyWidget()
                  : RefreshIndicator(
                      onRefresh: _fetchNotifications,
                      color: const Color(0xFF10B981),
                      child: ListView.builder(
                        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: _notifications.length,
                        itemBuilder: (context, index) {
                          final notif = _notifications[index];
                          final isRead = notif['is_read'] == true;
                          final color = _getCategoryColor(notif['category'] ?? '');

                          return Dismissible(
                            key: Key(notif['id'].toString()),
                            direction: DismissDirection.endToStart,
                            background: Container(
                              alignment: Alignment.centerRight,
                              padding: const EdgeInsets.only(right: 20),
                              decoration: BoxDecoration(
                                color: Colors.redAccent.withOpacity(0.9),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Icon(Icons.delete_outline_rounded, color: Colors.white),
                            ),
                            confirmDismiss: (direction) async {
                              return await _showDeleteConfirmDialog(notif);
                            },
                            onDismissed: (direction) {
                              _deleteNotificationSingle(notif['id']);
                            },
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: Card(
                                color: isRead
                                    ? context.cardBg
                                    : (context.isDarkMode
                                        ? const Color(0xFF1F2937).withOpacity(0.4)
                                        : const Color(0xFF10B981).withOpacity(0.08)),
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
                                              (notif['category'] ?? '').toString().toLowerCase() == 'akademik'
                                                  ? Icons.school_rounded
                                                  : (notif['category'] ?? '').toString().toLowerCase() == 'pengumuman'
                                                      ? Icons.campaign_rounded
                                                      : Icons.settings_suggest_rounded,
                                              color: color.withOpacity(isRead ? 0.5 : 0.9),
                                              size: 18,
                                            ),
                                          ],
                                        ),
                                        const SizedBox(width: 14),
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
                                                      color: color.withOpacity(0.12),
                                                      borderRadius: BorderRadius.circular(6),
                                                    ),
                                                    child: Text(
                                                      (notif['category'] ?? 'INFO').toString().toUpperCase(),
                                                      style: GoogleFonts.outfit(
                                                        color: color,
                                                        fontSize: 9,
                                                        fontWeight: FontWeight.bold,
                                                        letterSpacing: 0.6,
                                                      ),
                                                    ),
                                                  ),
                                                  Text(
                                                    _formatDate(notif['created_at']),
                                                    style: GoogleFonts.outfit(
                                                      color: context.subTitleColor,
                                                      fontSize: 10,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 8),
                                              Text(
                                                notif['title'] ?? '',
                                                style: GoogleFonts.outfit(
                                                  color: isRead ? context.subTitleColor : context.titleColor,
                                                  fontSize: 13,
                                                  fontWeight: isRead ? FontWeight.w500 : FontWeight.bold,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                notif['body'] ?? '',
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
                            ),
                          );
                        },
                      ),
                    ),
    );
  }

  Widget _buildErrorWidget() {
    if (_errorMessage == 'NO_INTERNET') {
      return OfflineWidget(onRetry: _fetchNotifications);
    }
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, color: Colors.amber, size: 48),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(color: context.titleColor, fontSize: 15),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _fetchNotifications,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
              ),
              child: Text('Coba Lagi', style: GoogleFonts.outfit(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.notifications_none_rounded, color: context.subTitleColor.withOpacity(0.3), size: 64),
          const SizedBox(height: 16),
          Text(
            "Tidak ada notifikasi baru.",
            style: GoogleFonts.outfit(
              color: context.bodyColor,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}
