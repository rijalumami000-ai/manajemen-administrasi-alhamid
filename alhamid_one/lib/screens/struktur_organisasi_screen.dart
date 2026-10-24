import 'package:flutter/material.dart';
import 'struktur_lembaga_screen.dart';

class StrukturOrganisasiScreen extends StatelessWidget {
  final int initialIndex;
  const StrukturOrganisasiScreen({super.key, this.initialIndex = 0});

  @override
  Widget build(BuildContext context) {
    // 3: Madrasah Diniyah, 4: Panitia Semester
    final targetIndex = initialIndex == 1 ? 4 : 3;
    return StrukturLembagaScreen(initialTabIndex: targetIndex);
  }
}
