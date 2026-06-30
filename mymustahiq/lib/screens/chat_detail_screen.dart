import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class ChatDetailScreen extends StatefulWidget {
  final int kelasId;
  final String kelasNama;
  final String? mustahiqFotoUrl;
  final String? mustahiqNoHp;
  final String? mustahiqNama;

  const ChatDetailScreen({
    super.key,
    required this.kelasId,
    required this.kelasNama,
    this.mustahiqFotoUrl,
    this.mustahiqNoHp,
    this.mustahiqNama,
  });

  @override
  State<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen> {
  final ApiService _apiService = ApiService();
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _messageController = TextEditingController();
  
  bool _isLoading = true;
  bool _isSending = false;
  String? _errorMessage;
  
  List<dynamic> _messages = [];
  int? _myGuruId;
  Timer? _pollingTimer;
  bool _isPollingActive = false;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _scrollController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _updateLastRead() async {
    try {
      const storage = FlutterSecureStorage();
      await storage.write(
        key: 'chat_room_last_read_${widget.kelasId}',
        value: DateTime.now().toIso8601String(),
      );
    } catch (_) {}
  }

  Future<void> _loadInitialData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // 1. Fetch current user info to distinguish "my" messages
      final dashboard = await _apiService.getDashboard();
      _myGuruId = dashboard['guruInfo']?['id'];

      // 2. Fetch initial messages
      await _fetchMessages();
      await _updateLastRead();
      
      setState(() {
        _isLoading = false;
      });

      // Scroll to bottom after rendering
      _scrollToBottom(immediate: true);

      // 3. Start background polling
      _startPolling();
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (!_isPollingActive && mounted) {
        _fetchMessagesSilent();
      }
    });
  }

  Future<void> _fetchMessages() async {
    final list = await _apiService.getChatMessages(widget.kelasId);
    setState(() {
      _messages = list;
    });
  }

  Future<void> _fetchMessagesSilent() async {
    _isPollingActive = true;
    try {
      final list = await _apiService.getChatMessages(widget.kelasId);
      if (list.length != _messages.length && mounted) {
        setState(() {
          _messages = list;
        });
        await _updateLastRead();
        _scrollToBottom();
      }
    } catch (_) {
      // Ignore background fetch errors
    } finally {
      _isPollingActive = false;
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isSending) return;

    _messageController.clear();
    setState(() {
      _isSending = true;
    });

    try {
      final res = await _apiService.sendChatMessage(widget.kelasId, text);
      if (res['success'] == true) {
        // Optimistic refresh
        await _fetchMessages();
        await _updateLastRead();
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal mengirim pesan: ${e.toString().replaceFirst('Exception: ', '')}'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSending = false;
        });
      }
    }
  }

  void _scrollToBottom({bool immediate = false}) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        if (immediate) {
          _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
        } else {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      }
    });
  }

  Future<void> _deleteMessageForSelf(int messageId) async {
    try {
      await _apiService.deleteChatMessageForSelf(messageId);
      setState(() {
        _messages.removeWhere((msg) => msg['id'] == messageId);
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Pesan dihapus untuk Anda',
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
            content: Text('Gagal menghapus pesan: ${e.toString().replaceFirst('Exception: ', '')}'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  void _showLongPressOptions(dynamic msg) {
    showModalBottomSheet(
      context: context,
      backgroundColor: context.cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent),
                title: Text(
                  'Hapus untuk saya',
                  style: GoogleFonts.outfit(
                    color: context.titleColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                subtitle: Text(
                  'Menghapus pesan ini dari riwayat Anda.',
                  style: GoogleFonts.outfit(color: context.bodyColor, fontSize: 11),
                ),
                onTap: () {
                  Navigator.pop(context);
                  _deleteMessageForSelf(msg['id']);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  String _formatMsgHour(dynamic dateStr) {
    if (dateStr == null) return '';
    final parsed = DateTime.tryParse(dateStr.toString());
    if (parsed == null) return '';
    final local = parsed.toLocal();
    final hours = local.hour.toString().padLeft(2, '0');
    final mins = local.minute.toString().padLeft(2, '0');
    return '$hours:$mins';
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
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: const Color(0xFF10B981).withOpacity(0.3),
                  width: 1.2,
                ),
              ),
              child: ClipOval(
                child: (widget.kelasId < 0)
                    ? Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.domain_verification_rounded,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      )
                    : (widget.mustahiqFotoUrl != null && widget.mustahiqFotoUrl!.isNotEmpty)
                        ? Image.network(
                            _apiService.getFullImageUrl(widget.mustahiqFotoUrl!),
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) =>
                                _buildDefaultClassIcon(context),
                          )
                        : _buildDefaultClassIcon(context),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.kelasId < 0 ? widget.kelasNama : 'Kelas ${widget.kelasNama}',
                    style: GoogleFonts.outfit(
                      color: context.titleColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    widget.kelasId < 0 ? 'Grup Guru' : 'Diskusi Wali Kelas & Munawib',
                    style: GoogleFonts.outfit(
                      color: context.subTitleColor,
                      fontSize: 9,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          if (widget.mustahiqNoHp != null &&
              widget.mustahiqNoHp!.isNotEmpty &&
              widget.mustahiqNoHp != '-')
            IconButton(
              icon: const Icon(Icons.chat_rounded, color: Color(0xFF10B981), size: 22),
              tooltip: 'WhatsApp Wali Kelas',
              onPressed: () => _launchWhatsApp(widget.mustahiqNoHp!, widget.mustahiqNama ?? ''),
            ),
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: context.titleColor),
            onPressed: () async {
              await _fetchMessages();
              _scrollToBottom();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : _errorMessage != null
              ? _buildErrorWidget()
              : Column(
                  children: [
                    // Chat messages list
                    Expanded(
                      child: _messages.isEmpty
                          ? _buildEmptyState()
                          : ListView.builder(
                              controller: _scrollController,
                              physics: const BouncingScrollPhysics(),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                              itemCount: _messages.length,
                              itemBuilder: (context, index) {
                                final msg = _messages[index];
                                final isMe = msg['sender_id'] == _myGuruId;
                                final senderName = msg['sender_name'] ?? 'Ustadz';
                                final messageText = msg['message'] ?? '';
                                final timeStr = _formatMsgHour(msg['created_at']);

                                return _buildMessageBubble(msg, isMe, senderName, messageText, timeStr);
                              },
                            ),
                    ),
                    
                    // Input Bar (Glassmorphic)
                    _buildInputBar(),
                  ],
                ),
    );
  }

  Widget _buildMessageBubble(
    dynamic msg,
    bool isMe,
    String senderName,
    String text,
    String timeStr,
  ) {
    // Bubble design - premium Glassmorphic tints
    final Color bubbleBg = isMe
        ? (context.isDarkMode
            ? const Color(0xFF047857).withOpacity(0.4)
            : const Color(0xFF10B981).withOpacity(0.20))
        : (context.isDarkMode
            ? const Color(0xFF1E293B).withOpacity(0.45)
            : Colors.white.withOpacity(0.65));

    final Color bubbleBorderColor = isMe
        ? const Color(0xFF10B981).withOpacity(0.3)
        : Colors.white.withOpacity(0.7);

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.85),
        child: Row(
          mainAxisAlignment: isMe ? MainAxisAlignment.end : Alignment.centerLeft,
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!isMe) ...[
              Container(
                width: 28,
                height: 28,
                margin: const EdgeInsets.only(top: 14), // Align with bubble below name
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: const Color(0xFF10B981).withOpacity(0.2),
                    width: 1,
                  ),
                ),
                child: ClipOval(
                  child: (msg['sender_foto_url'] != null && msg['sender_foto_url'].toString().isNotEmpty)
                      ? Image.network(
                          _apiService.getFullImageUrl(msg['sender_foto_url']),
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) =>
                              _buildDefaultUserIcon(context),
                        )
                      : _buildDefaultUserIcon(context),
                ),
              ),
              const SizedBox(width: 8),
            ],
            Flexible(
              child: Column(
                crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Sender name (only for others)
                  if (!isMe)
                    Padding(
                      padding: const EdgeInsets.only(left: 6, bottom: 3),
                      child: Text(
                        senderName,
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF10B981),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  
                  // Glass bubble wrapper
                  GestureDetector(
                    onLongPress: () => _showLongPressOptions(msg),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: bubbleBg,
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(16),
                          topRight: const Radius.circular(16),
                          bottomLeft: Radius.circular(isMe ? 16 : 0),
                          bottomRight: Radius.circular(isMe ? 0 : 16),
                        ),
                        border: Border.all(color: bubbleBorderColor, width: 1.2),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(context.isDarkMode ? 0.2 : 0.02),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            text,
                            style: GoogleFonts.outfit(
                              color: context.titleColor,
                              fontSize: 14,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            timeStr,
                            style: GoogleFonts.outfit(
                              color: context.subTitleColor,
                              fontSize: 9,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: context.cardBg,
        border: Border(
          top: BorderSide(color: context.borderColor, width: 1.2),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(context.isDarkMode ? 0.3 : 0.02),
            blurRadius: 15,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: context.inputBg,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: context.borderColor, width: 1.2),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: TextField(
                  controller: _messageController,
                  maxLines: 4,
                  minLines: 1,
                  style: GoogleFonts.outfit(color: context.titleColor, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Tulis pesan diskusikan...',
                    hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 13),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Send button
            GestureDetector(
              onTap: _sendMessage,
              child: Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  color: Color(0xFF10B981),
                  shape: BoxShape.circle,
                ),
                child: _isSending
                    ? const Padding(
                        padding: EdgeInsets.all(12.0),
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Icon(
                        Icons.send_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 48),
            const SizedBox(height: 16),
            Text(
              'Gagal memuat pesan',
              style: GoogleFonts.outfit(color: context.titleColor, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ?? '',
              style: GoogleFonts.outfit(color: context.bodyColor, fontSize: 13),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadInitialData,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text('Coba Lagi', style: GoogleFonts.outfit(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.forum_outlined, color: Color(0xFF10B981), size: 36),
            ),
            const SizedBox(height: 16),
            Text(
              'Ruang Obrolan Baru',
              style: GoogleFonts.outfit(color: context.titleColor, fontSize: 15, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              'Kirim pesan pertama untuk memulai diskusi dengan guru lain di kelas ini.',
              style: GoogleFonts.outfit(color: context.bodyColor, fontSize: 12),
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
          size: 18,
        ),
      ),
    );
  }

  Widget _buildDefaultUserIcon(BuildContext context) {
    return Container(
      color: context.isDarkMode ? Colors.white10 : Colors.black12,
      child: Center(
        child: Icon(
          Icons.person_rounded,
          color: context.subTitleColor,
          size: 16,
        ),
      ),
    );
  }

  void _launchWhatsApp(String number, String name) async {
    if (number.isEmpty || number == '-') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Nomor HP tidak tersedia.',
            style: GoogleFonts.outfit(color: Colors.white, fontSize: 13),
          ),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    String formatted = number.replaceAll(RegExp(r'\D'), ''); // Only digits
    if (formatted.startsWith('0')) {
      formatted = '62${formatted.substring(1)}';
    } else if (formatted.startsWith('8')) {
      formatted = '62$formatted';
    }

    final url = Uri.parse('whatsapp://send?phone=$formatted');
    final webUrl = Uri.parse('https://wa.me/$formatted');
    try {
      final launched = await launchUrl(url, mode: LaunchMode.externalApplication);
      if (!launched) {
        await launchUrl(webUrl, mode: LaunchMode.externalApplication);
      }
    } catch (_) {
      try {
        await launchUrl(webUrl, mode: LaunchMode.externalApplication);
      } catch (err) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Gagal membuka WhatsApp. Pastikan aplikasi terinstall.',
                style: GoogleFonts.outfit(color: Colors.white, fontSize: 13),
              ),
              backgroundColor: Colors.redAccent,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
        }
      }
    }
  }
}
