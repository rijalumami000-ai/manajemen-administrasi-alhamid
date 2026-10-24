import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
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

  Map<String, dynamic>? _data;
  String _wallpaperType = 'default';
  String? _wallpaperImagePath;

  // Voice note recording simulation
  bool _isRecordingAudio = false;
  int _recordingDuration = 0;
  Timer? _recordingTimer;
  bool _showSendButton = false;

  // Real voice note recording & playing
  final AudioRecorder _audioRecorder = AudioRecorder();
  AudioPlayer? _audioPlayer;
  int? _activePlayingMsgId;
  String? _localRecordingPath;

  // Voice note playing simulation
  final Map<int, bool> _playingVoiceNotes = {};
  final Map<int, double> _voiceNoteProgress = {};
  final Map<int, Timer?> _voiceNoteTimers = {};

  @override
  void initState() {
    super.initState();
    _loadInitialData();
    _loadWallpaperSettings();
    _messageController.addListener(_handleTextChange);
  }

  void _handleTextChange() {
    final text = _messageController.text;
    final showSend = text.isNotEmpty;
    if (showSend != _showSendButton) {
      setState(() {
        _showSendButton = showSend;
      });
    }
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _recordingTimer?.cancel();
    _voiceNoteTimers.forEach((_, timer) => timer?.cancel());
    _messageController.removeListener(_handleTextChange);
    _audioRecorder.dispose();
    _audioPlayer?.dispose();
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
      _data = dashboard;
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
    final isMe = msg['sender_id'] == _myGuruId;
    final bool isClassMustahiq = _myGuruId != null && _data?['kelasMustahiq']?['id'] == widget.kelasId;
    final bool canDeleteForEveryone = isMe || isClassMustahiq;

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
                leading: const Icon(Icons.delete_outline_rounded, color: Colors.blueAccent),
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
              if (canDeleteForEveryone)
                ListTile(
                  leading: const Icon(Icons.delete_forever_rounded, color: Colors.redAccent),
                  title: Text(
                    'Hapus untuk semua orang',
                    style: GoogleFonts.outfit(
                      color: Colors.redAccent,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  subtitle: Text(
                    'Menghapus pesan ini untuk semua anggota kelas.',
                    style: GoogleFonts.outfit(color: context.bodyColor, fontSize: 11),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    _deleteMessageForEveryone(msg['id']);
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

  String _formatDuration(int totalSeconds) {
    final minutes = (totalSeconds ~/ 60).toString().padLeft(2, '0');
    final seconds = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
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
            icon: Icon(Icons.palette_rounded, color: context.titleColor, size: 20),
            tooltip: 'Ganti Wallpaper/Tema',
            onPressed: _showWallpaperSelectionDialog,
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
      body: _buildWallpaperBackground(
        _isLoading
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
    final isDark = context.isDarkMode;
    final isSticker = text.startsWith('[sticker:') && text.endsWith(']');
    
    final Color textColor = isMe
        ? Colors.white
        : (isDark ? Colors.white : const Color(0xFF1E293B));

    final BoxDecoration bubbleDecoration = isSticker
        ? const BoxDecoration(color: Colors.transparent)
        : BoxDecoration(
            gradient: isMe
                ? const LinearGradient(
                    colors: [Color(0xFF10B981), Color(0xFF059669)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                : null,
            color: isMe
                ? null
                : (isDark ? const Color(0xFF1E293B).withOpacity(0.7) : Colors.white.withOpacity(0.85)),
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(16),
              topRight: const Radius.circular(16),
              bottomLeft: Radius.circular(isMe ? 16 : 4),
              bottomRight: Radius.circular(isMe ? 4 : 16),
            ),
            border: Border.all(
              color: isMe
                  ? const Color(0xFF10B981).withOpacity(0.3)
                  : (isDark ? Colors.white.withOpacity(0.08) : const Color(0xFFE2E8F0)),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.15 : 0.03),
                blurRadius: 6,
                offset: const Offset(0, 3),
              ),
            ],
          );

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.85),
        child: Row(
          mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
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
                      padding: const EdgeInsets.only(left: 6, bottom: 4),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            senderName,
                            style: GoogleFonts.outfit(
                              color: const Color(0xFF10B981),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (widget.mustahiqNama != null && senderName == widget.mustahiqNama) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFF10B981).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3), width: 0.8),
                              ),
                              child: Text(
                                'Wali Kelas',
                                style: GoogleFonts.outfit(
                                  color: const Color(0xFF059669),
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  
                  // Glass bubble wrapper
                  GestureDetector(
                    onLongPress: () => _showLongPressOptions(msg),
                    child: Container(
                      padding: isSticker
                          ? EdgeInsets.zero
                          : const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: bubbleDecoration,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _buildBubbleContent(msg['id'] ?? 0, text, textColor, isMe),
                          const SizedBox(height: 4),
                          Text(
                            timeStr,
                            style: GoogleFonts.outfit(
                              color: isMe
                                  ? (isSticker ? context.subTitleColor : Colors.white70)
                                  : context.subTitleColor,
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

  Widget _buildBubbleContent(int msgId, String text, Color textColor, bool isMe) {
    if (text.startsWith('[image:') && text.endsWith(']')) {
      final String path = text.substring(7, text.length - 1);
      final File file = File(path);
      if (file.existsSync()) {
        final bytes = file.readAsBytesSync();
        return GestureDetector(
          onTap: () => _openFullImagePreview(bytes),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.file(
              file,
              height: 200,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) =>
                  _buildImagePlaceholder(textColor, 'Gagal memuat gambar'),
            ),
          ),
        );
      } else {
        return _buildImagePlaceholder(textColor, 'Gambar Lokal (Tidak diunggah)');
      }
    } else if (text.startsWith('[image_base64:') && text.endsWith(']')) {
      final String base64Data = text.substring(14, text.length - 1);
      try {
        final Uint8List bytes = base64Decode(base64Data);
        return GestureDetector(
          onTap: () => _openFullImagePreview(bytes),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.memory(
              bytes,
              height: 200,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) =>
                  _buildImagePlaceholder(textColor, 'Gagal memuat gambar'),
            ),
          ),
        );
      } catch (_) {
        return _buildImagePlaceholder(textColor, 'Format gambar tidak valid');
      }
    } else if (text.startsWith('[sticker:') && text.endsWith(']')) {
      final String stickerName = text.substring(9, text.length - 1);
      return _buildStickerWidget(stickerName);
    } else if (text.startsWith('[voice_note:') && text.endsWith(']')) {
      final durationStr = text.substring(12, text.length - 1);
      final duration = int.tryParse(durationStr) ?? 3;
      return _buildVoiceNoteWidget(msgId, duration, null, textColor, isMe);
    } else if (text.startsWith('[voice_note_base64:') && text.endsWith(']')) {
      final String content = text.substring(19, text.length - 1);
      final parts = content.split(':');
      final duration = int.tryParse(parts[0]) ?? 3;
      final base64Data = parts.sublist(1).join(':');
      return _buildVoiceNoteWidget(msgId, duration, base64Data, textColor, isMe);
    }
    
    // Default text message
    return Text(
      text,
      style: GoogleFonts.outfit(
        color: textColor,
        fontSize: 14,
        height: 1.4,
      ),
    );
  }

  Widget _buildStickerWidget(String stickerName) {
    String url = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.webp';
    if (stickerName == 'heart_eyes') {
      url = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.webp';
    } else if (stickerName == 'laughing') {
      url = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp';
    } else if (stickerName == 'clapping') {
      url = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.webp';
    } else if (stickerName == 'cool') {
      url = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.webp';
    } else if (stickerName == 'mind_blown') {
      url = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.webp';
    } else if (stickerName == 'pray') {
      url = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.webp';
    } else if (stickerName == 'thinking') {
      url = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.webp';
    }

    return Image.network(
      url,
      width: 120,
      height: 120,
      fit: BoxFit.contain,
      errorBuilder: (context, error, stackTrace) =>
          const Icon(Icons.sticky_note_2_rounded, size: 64, color: Colors.grey),
    );
  }

  Widget _buildImagePlaceholder(Color textColor, String label) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.05),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.image_not_supported_rounded, color: textColor.withOpacity(0.6), size: 18),
          const SizedBox(width: 8),
          Text(
            label,
            style: GoogleFonts.outfit(color: textColor.withOpacity(0.8), fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildInputBar() {
    if (_isRecordingAudio) {
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
              const Icon(Icons.fiber_manual_record_rounded, color: Colors.redAccent, size: 18),
              const SizedBox(width: 8),
              Text(
                'Merekam VN... ${_formatDuration(_recordingDuration)}',
                style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 22),
                onPressed: _cancelRecording,
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: _sendVoiceNote,
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: Color(0xFF10B981),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.send_rounded, color: Colors.white, size: 18),
                ),
              ),
            ],
          ),
        ),
      );
    }

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
            IconButton(
              icon: Icon(Icons.sticky_note_2_outlined, color: context.subTitleColor, size: 22),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
              onPressed: _showStickerSheet,
            ),
            IconButton(
              icon: Icon(Icons.add_photo_alternate_outlined, color: context.subTitleColor, size: 22),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
              onPressed: _sendImage,
            ),
            const SizedBox(width: 8),
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
            GestureDetector(
              onTap: _showSendButton ? _sendMessage : _startRecording,
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
                    : Icon(
                        _showSendButton ? Icons.send_rounded : Icons.mic_none_rounded,
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

  Future<void> _deleteMessageForEveryone(int messageId) async {
    try {
      await _apiService.deleteChatMessageForEveryone(messageId);
      setState(() {
        _messages.removeWhere((msg) => msg['id'] == messageId);
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Pesan dihapus untuk semua orang',
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

  Widget _buildWallpaperBackground(Widget child) {
    if (_wallpaperType == 'color_emerald') {
      return Container(
        color: context.isDarkMode ? const Color(0xFF022C22) : const Color(0xFFECFDF5),
        child: child,
      );
    } else if (_wallpaperType == 'color_indigo') {
      return Container(
        color: context.isDarkMode ? const Color(0xFF172554) : const Color(0xFFEFF6FF),
        child: child,
      );
    } else if (_wallpaperType == 'color_slate') {
      return Container(
        color: context.isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
        child: child,
      );
    } else if (_wallpaperType == 'theme_sunset') {
      return Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: context.isDarkMode
                ? [const Color(0xFF3B0764), const Color(0xFF1E1B4B)]
                : [const Color(0xFFFAE8FF), const Color(0xFFFFEDD5)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: child,
      );
    } else if (_wallpaperType == 'theme_aurora') {
      return Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: context.isDarkMode
                ? [const Color(0xFF022C22), const Color(0xFF0F172A)]
                : [const Color(0xFFECFDF5), const Color(0xFFEFF6FF)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: child,
      );
    } else if (_wallpaperType == 'custom_image' && _wallpaperImagePath != null && _wallpaperImagePath!.isNotEmpty) {
      return Container(
        decoration: BoxDecoration(
          image: DecorationImage(
            image: FileImage(File(_wallpaperImagePath!)),
            fit: BoxFit.cover,
          ),
        ),
        child: child,
      );
    }
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: context.isDarkMode
              ? [const Color(0xFF0F172A), const Color(0xFF0D1527)]
              : [const Color(0xFFF8FAFC), const Color(0xFFF1F5F9)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: child,
    );
  }

  Future<void> _showWallpaperSelectionDialog() async {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: context.cardBg,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            'Pilih Tema Wallpaper',
            style: GoogleFonts.outfit(color: context.titleColor, fontWeight: FontWeight.bold, fontSize: 16),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildWallpaperOptionTile('Default Gradien', 'default', Icons.gradient_rounded, null),
                _buildWallpaperOptionTile('Sunset Glow (Gradien)', 'theme_sunset', Icons.sunny, const Color(0xFFD946EF)),
                _buildWallpaperOptionTile('Aurora Teal (Gradien)', 'theme_aurora', Icons.brightness_6_rounded, const Color(0xFF0D9488)),
                _buildWallpaperOptionTile('Emerald Green', 'color_emerald', Icons.circle_rounded, const Color(0xFF10B981)),
                _buildWallpaperOptionTile('Indigo Blue', 'color_indigo', Icons.circle_rounded, const Color(0xFF3B82F6)),
                _buildWallpaperOptionTile('Slate Grey', 'color_slate', Icons.circle_rounded, const Color(0xFF64748B)),
                const Divider(),
                _buildWallpaperOptionTile('Pilih dari Galeri', 'custom_gallery', Icons.photo_library_rounded, null),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildWallpaperOptionTile(String title, String value, IconData icon, Color? tintColor) {
    return ListTile(
      leading: Icon(icon, color: tintColor ?? context.titleColor.withOpacity(0.7), size: 22),
      title: Text(title, style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13, fontWeight: FontWeight.w500)),
      onTap: () {
        Navigator.pop(context);
        if (value == 'custom_gallery') {
          _pickWallpaperFromGallery();
        } else {
          _saveWallpaper(value, null);
        }
      },
    );
  }

  Future<void> _pickWallpaperFromGallery() async {
    try {
      final ImagePicker picker = ImagePicker();
      final XFile? image = await picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
        maxWidth: 1440,
        maxHeight: 2560,
      );
      if (image != null) {
        final Directory appDocDir = await getApplicationDocumentsDirectory();
        final String fileName = 'wallpaper_${widget.kelasId}${p.extension(image.path)}';
        final String localPath = p.join(appDocDir.path, fileName);
        
        final File localFile = await File(image.path).copy(localPath);
        _saveWallpaper('custom_image', localFile.path);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal memilih gambar: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  Future<void> _loadWallpaperSettings() async {
    try {
      const storage = FlutterSecureStorage();
      final type = await storage.read(key: 'chat_wallpaper_type_${widget.kelasId}');
      final path = await storage.read(key: 'chat_wallpaper_path_${widget.kelasId}');
      if (mounted) {
        setState(() {
          _wallpaperType = type ?? 'default';
          _wallpaperImagePath = path;
        });
      }
    } catch (_) {}
  }

  Future<void> _saveWallpaper(String type, String? path) async {
    try {
      const storage = FlutterSecureStorage();
      await storage.write(key: 'chat_wallpaper_type_${widget.kelasId}', value: type);
      if (path != null) {
        await storage.write(key: 'chat_wallpaper_path_${widget.kelasId}', value: path);
      } else {
        await storage.delete(key: 'chat_wallpaper_path_${widget.kelasId}');
      }
      setState(() {
        _wallpaperType = type;
        _wallpaperImagePath = path;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Wallpaper berhasil diubah!', style: GoogleFonts.outfit(color: Colors.white, fontSize: 13)),
            backgroundColor: const Color(0xFF10B981),
            duration: const Duration(seconds: 1),
          ),
        );
      }
    } catch (_) {}
  }

  Future<void> _sendImage() async {
    try {
      final ImagePicker picker = ImagePicker();
      final XFile? image = await picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 82,
        maxWidth: 2048,
        maxHeight: 2048,
      );
      if (image == null) return;

      setState(() {
        _isSending = true;
      });

      final bytes = await File(image.path).readAsBytes();
      final String base64Str = base64Encode(bytes);
      final text = '[image_base64:$base64Str]';

      final res = await _apiService.sendChatMessage(widget.kelasId, text);
      if (res['success'] == true) {
        await _fetchMessages();
        await _updateLastRead();
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal mengirim gambar: ${e.toString().replaceFirst('Exception: ', '')}'),
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

  void _openFullImagePreview(Uint8List bytes) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.black,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.close_rounded, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          body: Center(
            child: InteractiveViewer(
              clipBehavior: Clip.none,
              minScale: 1.0,
              maxScale: 4.0,
              child: Image.memory(bytes),
            ),
          ),
        ),
      ),
    );
  }

  void _showStickerSheet() {
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
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Kirim Stiker WhatsApp-Style',
                  style: GoogleFonts.outfit(color: context.titleColor, fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 180,
                  child: GridView.count(
                    crossAxisCount: 4,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    children: [
                      _buildStickerOption('thumbs_up', 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.webp', 'Sip'),
                      _buildStickerOption('heart_eyes', 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.webp', 'Love'),
                      _buildStickerOption('laughing', 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp', 'Wkwk'),
                      _buildStickerOption('clapping', 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.webp', 'Mantap'),
                      _buildStickerOption('cool', 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.webp', 'Keren'),
                      _buildStickerOption('mind_blown', 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.webp', 'Wow'),
                      _buildStickerOption('pray', 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.webp', 'Amin'),
                      _buildStickerOption('thinking', 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.webp', 'Hmm'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStickerOption(String name, String url, String label) {
    return GestureDetector(
      onTap: () {
        Navigator.pop(context);
        _sendSticker(name);
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Image.network(url, fit: BoxFit.contain),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.outfit(color: context.titleColor, fontSize: 10, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Future<void> _sendSticker(String stickerName) async {
    try {
      setState(() {
        _isSending = true;
      });
      final text = '[sticker:$stickerName]';
      final res = await _apiService.sendChatMessage(widget.kelasId, text);
      if (res['success'] == true) {
        await _fetchMessages();
        await _updateLastRead();
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal mengirim stiker: $e'),
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

  Widget _buildVoiceNoteWidget(int msgId, int durationSeconds, String? base64Data, Color textColor, bool isMe) {
    final isPlaying = _playingVoiceNotes[msgId] ?? false;
    final progress = _voiceNoteProgress[msgId] ?? 0.0;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          icon: Icon(
            isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
            color: textColor,
            size: 28,
          ),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
          onPressed: () => _toggleVoiceNote(msgId, durationSeconds, base64Data),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              SliderTheme(
                data: SliderThemeData(
                  trackHeight: 2,
                  thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 5),
                  overlayShape: const RoundSliderOverlayShape(overlayRadius: 10),
                  activeTrackColor: textColor,
                  inactiveTrackColor: textColor.withOpacity(0.3),
                  thumbColor: textColor,
                ),
                child: Slider(
                  value: progress,
                  onChanged: (val) {
                    setState(() {
                      _voiceNoteProgress[msgId] = val;
                    });
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _formatDuration((durationSeconds * progress).toInt()),
                      style: GoogleFonts.outfit(color: textColor.withOpacity(0.8), fontSize: 10),
                    ),
                    Text(
                      _formatDuration(durationSeconds),
                      style: GoogleFonts.outfit(color: textColor.withOpacity(0.8), fontSize: 10),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        Icon(Icons.mic_rounded, color: isMe ? Colors.white70 : const Color(0xFF10B981), size: 16),
      ],
    );
  }

  Future<void> _toggleVoiceNote(int msgId, int durationSeconds, String? base64Data) async {
    if (base64Data == null || base64Data.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Voice note ini tidak memiliki audio.')),
      );
      return;
    }

    final isCurrentlyPlaying = _activePlayingMsgId == msgId;

    if (isCurrentlyPlaying) {
      await _audioPlayer?.stop();
      setState(() {
        _activePlayingMsgId = null;
        _playingVoiceNotes[msgId] = false;
      });
    } else {
      if (_audioPlayer != null) {
        await _audioPlayer!.stop();
        if (_activePlayingMsgId != null) {
          setState(() {
            _playingVoiceNotes[_activePlayingMsgId!] = false;
          });
        }
      }

      setState(() {
        _activePlayingMsgId = msgId;
        _playingVoiceNotes[msgId] = true;
      });

      try {
        final tempDir = await getTemporaryDirectory();
        final file = File('${tempDir.path}/vn_play_$msgId.m4a');
        if (!await file.exists()) {
          await file.writeAsBytes(base64Decode(base64Data));
        }

        _audioPlayer ??= AudioPlayer();
        
        _audioPlayer!.onPositionChanged.listen((pos) {
          if (mounted && _activePlayingMsgId == msgId) {
            final double progress = pos.inMilliseconds / (durationSeconds * 1000);
            setState(() {
              _voiceNoteProgress[msgId] = progress.clamp(0.0, 1.0);
            });
          }
        });

        _audioPlayer!.onPlayerComplete.listen((_) {
          if (mounted && _activePlayingMsgId == msgId) {
            setState(() {
              _playingVoiceNotes[msgId] = false;
              _voiceNoteProgress[msgId] = 0.0;
              _activePlayingMsgId = null;
            });
          }
        });

        await _audioPlayer!.play(DeviceFileSource(file.path));
      } catch (e) {
        setState(() {
          _playingVoiceNotes[msgId] = false;
          _activePlayingMsgId = null;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Gagal memutar audio: $e'), backgroundColor: Colors.redAccent),
          );
        }
      }
    }
  }

  Future<void> _startRecording() async {
    try {
      if (await _audioRecorder.hasPermission()) {
        final tempDir = await getTemporaryDirectory();
        final path = p.join(tempDir.path, 'voice_note_${DateTime.now().millisecondsSinceEpoch}.m4a');
        _localRecordingPath = path;

        await _audioRecorder.start(
          const RecordConfig(encoder: AudioEncoder.aacLc, bitRate: 32000, sampleRate: 16000),
          path: path,
        );

        setState(() {
          _isRecordingAudio = true;
          _recordingDuration = 0;
        });

        _recordingTimer?.cancel();
        _recordingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
          setState(() {
            _recordingDuration++;
          });
        });
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Izin mikrofon diperlukan untuk merekam voice note.'),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Error starting recording: $e');
    }
  }

  Future<void> _cancelRecording() async {
    try {
      _recordingTimer?.cancel();
      await _audioRecorder.stop();
      if (_localRecordingPath != null) {
        final file = File(_localRecordingPath!);
        if (await file.exists()) {
          await file.delete();
        }
      }
    } catch (_) {}
    setState(() {
      _isRecordingAudio = false;
      _recordingDuration = 0;
      _localRecordingPath = null;
    });
  }

  Future<void> _sendVoiceNote() async {
    _recordingTimer?.cancel();
    final duration = _recordingDuration > 0 ? _recordingDuration : 1;
    
    setState(() {
      _isRecordingAudio = false;
      _recordingDuration = 0;
    });

    try {
      final path = await _audioRecorder.stop();
      if (path == null) return;

      final file = File(path);
      if (!await file.exists()) return;

      setState(() {
        _isSending = true;
      });

      final bytes = await file.readAsBytes();
      final base64Str = base64Encode(bytes);
      final text = '[voice_note_base64:$duration:$base64Str]';

      final res = await _apiService.sendChatMessage(widget.kelasId, text);
      if (res['success'] == true) {
        await _fetchMessages();
        await _updateLastRead();
        _scrollToBottom();
      }
      
      await file.delete();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal mengirim VN: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } finally {
      setState(() {
        _isSending = false;
        _localRecordingPath = null;
      });
    }
  }
}
