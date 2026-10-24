import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:path_provider/path_provider.dart';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:share_plus/share_plus.dart';
import '../services/theme_manager.dart';

class PdfViewerScreen extends StatefulWidget {
  final String pdfUrl;
  final String title;
  final String? noSurat;

  const PdfViewerScreen({
    super.key,
    required this.pdfUrl,
    required this.title,
    this.noSurat,
  });

  @override
  State<PdfViewerScreen> createState() => _PdfViewerScreenState();
}

class _PdfViewerScreenState extends State<PdfViewerScreen> {
  final Completer<PDFViewController> _controller = Completer<PDFViewController>();
  String? _localPath;
  bool _isLoading = true;
  double _downloadProgress = 0.0;
  String? _errorMessage;
  int _totalPages = 0;
  int _currentPage = 0;
  bool _isReady = false;

  @override
  void initState() {
    super.initState();
    _downloadAndOpenPdf();
  }

  String _getFullUrl() {
    if (widget.pdfUrl.startsWith('http://') || widget.pdfUrl.startsWith('https://')) {
      return widget.pdfUrl;
    }
    return 'https://alhamidcintamulya.my.id${widget.pdfUrl.startsWith('/') ? '' : '/'}${widget.pdfUrl}';
  }

  Future<void> _downloadAndOpenPdf() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _downloadProgress = 0.0;
    });

    try {
      final fullUrl = _getFullUrl();
      final dir = await getTemporaryDirectory();
      
      // Generate clean filename
      final uri = Uri.parse(fullUrl);
      String fileName = uri.pathSegments.isNotEmpty ? uri.pathSegments.last : 'dokumen.pdf';
      if (!fileName.toLowerCase().endsWith('.pdf')) {
        fileName = '$fileName.pdf';
      }
      final file = File('${dir.path}/$fileName');

      // Check if file already exists with non-zero size
      if (await file.exists() && (await file.length()) > 1024) {
        if (mounted) {
          setState(() {
            _localPath = file.path;
            _isLoading = false;
          });
        }
        return;
      }

      final dio = Dio();
      dio.httpClientAdapter = IOHttpClientAdapter()
        ..createHttpClient = () {
          final client = HttpClient();
          client.badCertificateCallback = (X509Certificate cert, String host, int port) => true;
          return client;
        };

      await dio.download(
        fullUrl,
        file.path,
        onReceiveProgress: (received, total) {
          if (total > 0 && mounted) {
            setState(() {
              _downloadProgress = received / total;
            });
          }
        },
      );

      if (mounted) {
        setState(() {
          _localPath = file.path;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = "Gagal mengunduh dokumen PDF: ${e.toString()}";
        });
      }
    }
  }

  void _shareDocument() {
    if (_localPath != null && File(_localPath!).existsSync()) {
      Share.shareXFiles(
        [XFile(_localPath!)],
        text: widget.title,
        subject: widget.title,
      );
    } else {
      Share.share(
        '${widget.title}\n\nDokumen: ${_getFullUrl()}',
        subject: widget.title,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF131C2E) : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.titleColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.outfit(
                color: context.titleColor,
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
            if (widget.noSurat != null && widget.noSurat!.isNotEmpty)
              Text(
                widget.noSurat!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.sourceCodePro(
                  color: context.subTitleColor,
                  fontSize: 10,
                ),
              ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.share_rounded, color: context.titleColor, size: 20),
            tooltip: "Bagikan PDF",
            onPressed: _shareDocument,
          ),
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: context.titleColor, size: 20),
            tooltip: "Muat Ulang",
            onPressed: _downloadAndOpenPdf,
          ),
        ],
      ),
      body: Stack(
        children: [
          if (_isLoading)
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444).withOpacity(0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const CircularProgressIndicator(
                      color: Color(0xFFEF4444),
                      strokeWidth: 3,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    "Menyiapkan Dokumen PDF...",
                    style: GoogleFonts.outfit(
                      color: context.titleColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _downloadProgress > 0
                        ? "${(_downloadProgress * 100).toInt()}% terunduh"
                        : "Mengunduh file dari server...",
                    style: GoogleFonts.outfit(
                      color: context.subTitleColor,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            )
          else if (_errorMessage != null)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.error_outline_rounded, color: Colors.red, size: 40),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      "Gagal Membuka Dokumen",
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: context.titleColor,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _errorMessage!,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton.icon(
                      onPressed: _downloadAndOpenPdf,
                      icon: const Icon(Icons.refresh_rounded, size: 18),
                      label: const Text("Coba Unduh Ulang"),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEF4444),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
              ),
            )
          else if (_localPath != null)
            PDFView(
              filePath: _localPath,
              enableSwipe: true,
              swipeHorizontal: false,
              autoSpacing: true,
              pageFling: false,
              pageSnap: false,
              fitPolicy: FitPolicy.BOTH,
              backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
              onRender: (pages) {
                if (mounted) {
                  setState(() {
                    _totalPages = pages ?? 0;
                    _isReady = true;
                  });
                }
              },
              onError: (error) {
                if (mounted) {
                  setState(() {
                    _errorMessage = error.toString();
                  });
                }
              },
              onPageError: (page, error) {
                if (mounted) {
                  setState(() {
                    _errorMessage = 'Hal $page: ${error.toString()}';
                  });
                }
              },
              onViewCreated: (PDFViewController controller) {
                if (!_controller.isCompleted) {
                  _controller.complete(controller);
                }
              },
              onPageChanged: (int? page, int? total) {
                if (mounted) {
                  setState(() {
                    _currentPage = page ?? 0;
                  });
                }
              },
            ),

          // Floating Page indicator at bottom
          if (_isReady && _totalPages > 0)
            Positioned(
              bottom: 20,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.75),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      GestureDetector(
                        onTap: () async {
                          if (_currentPage > 0) {
                            final c = await _controller.future;
                            await c.setPage(_currentPage - 1);
                          }
                        },
                        child: const Icon(Icons.chevron_left_rounded, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        "${_currentPage + 1} / $_totalPages",
                        style: GoogleFonts.outfit(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () async {
                          if (_currentPage < _totalPages - 1) {
                            final c = await _controller.future;
                            await c.setPage(_currentPage + 1);
                          }
                        },
                        child: const Icon(Icons.chevron_right_rounded, color: Colors.white, size: 20),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
