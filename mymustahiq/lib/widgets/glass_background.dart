import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import '../services/theme_manager.dart';

class GlassBackground extends StatelessWidget {
  final Widget child;
  const GlassBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    if (context.isDarkMode) {
      // Keep existing dark theme background with simple green top glow
      return Container(
        color: context.scaffoldBg,
        child: Stack(
          children: [
            Positioned(
              top: -80,
              right: -80,
              child: Container(
                width: 280,
                height: 280,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF064E3B).withOpacity(0.12),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: -100,
              left: -100,
              child: Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFFD97706).withOpacity(0.04),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            child,
          ],
        ),
      );
    }

    // Premium Glassmorphism Background for Light Theme
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0xFFEBEFF5), // Slightly tinted soft blue-gray background
            Color(0xFFDCE2EC),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Ambient Glow Blob 1 (Emerald Green)
          Positioned(
            top: -40,
            left: -40,
            child: Container(
              width: 320,
              height: 320,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF10B981).withOpacity(0.22),
              ),
            ),
          ),
          // Ambient Glow Blob 2 (Royal Blue)
          Positioned(
            bottom: 120,
            right: -60,
            child: Container(
              width: 360,
              height: 360,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF3B82F6).withOpacity(0.20),
              ),
            ),
          ),
          // Ambient Glow Blob 3 (Hot Pink / Magenta)
          Positioned(
            top: 260,
            right: -30,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFEC4899).withOpacity(0.15),
              ),
            ),
          ),
          // Ambient Glow Blob 4 (Purple)
          Positioned(
            bottom: -50,
            left: -30,
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF8B5CF6).withOpacity(0.18),
              ),
            ),
          ),
          // Global Backdrop Blur Filter
          Positioned.fill(
            child: BackdropFilter(
              filter: ui.ImageFilter.blur(sigmaX: 75, sigmaY: 75),
              child: Container(
                color: Colors.white.withOpacity(0.12),
              ),
            ),
          ),
          child,
        ],
      ),
    );
  }
}
