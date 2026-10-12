using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using Microsoft.Win32;
using AlHamidScanner.Models;
using AlHamidScanner.Services;

namespace AlHamidScanner
{
    public partial class MainWindow : Window
    {
        private readonly ApiClient _apiClient = new();
        private readonly OmrEngine _omrEngine = new();

        private List<TahunAjaran> _taList = new();
        private List<Kelas> _kelasList = new();
        private List<KategoriEvaluasi> _katList = new();
        private List<MataPelajaran> _allMapelList = new();
        private List<MataPelajaran> _activeMapelList = new();

        private ObservableCollection<StudentScoreItem> _studentScores = new();
        private string? _currentImagePath;

        public MainWindow()
        {
            InitializeComponent();
            DgResults.ItemsSource = _studentScores;
            Loaded += MainWindow_Loaded;
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            TxtStatusLog.Text = "Menghubungkan ke server VPS dan memuat data master...";
            await LoadMasterDataAsync();
        }

        private async Task LoadMasterDataAsync()
        {
            try
            {
                var taTask = _apiClient.GetTahunAjaranListAsync();
                var kelasTask = _apiClient.GetKelasListAsync();
                var katTask = _apiClient.GetKategoriEvaluasiListAsync();
                var mapelTask = _apiClient.GetMataPelajaranListAsync();

                await Task.WhenAll(taTask, kelasTask, katTask, mapelTask);

                _taList = await taTask;
                _kelasList = await kelasTask;
                _katList = await katTask;
                _allMapelList = await mapelTask;

                CmbTahunAjaran.ItemsSource = _taList;
                if (_taList.Count > 0)
                {
                    var active = _taList.FirstOrDefault(t => t.IsActive) ?? _taList[0];
                    CmbTahunAjaran.SelectedValue = active.Id;
                }

                CmbKelas.ItemsSource = _kelasList;
                if (_kelasList.Count > 0) CmbKelas.SelectedValue = _kelasList[0].Id;

                CmbKategori.ItemsSource = _katList;
                if (_katList.Count > 0) CmbKategori.SelectedValue = _katList[0].Id;

                await UpdateActiveMapelListAsync();
                await RefreshStudentListAsync();

                TxtVpsStatus.Text = "VPS Terhubung (Online)";
                VpsStatusBadge.Background = new SolidColorBrush(Color.FromRgb(6, 78, 59)); // Emerald dark
                TxtStatusLog.Text = "Siap. Silakan buka berkas lembar nilai santri.";
            }
            catch (Exception ex)
            {
                TxtVpsStatus.Text = "Mode Offline / Standalone";
                VpsStatusBadge.Background = new SolidColorBrush(Color.FromRgb(153, 27, 27)); // Red dark
                TxtStatusLog.Text = "Peringatan koneksi server: " + ex.Message;
            }
        }

        private async void CmbTahunAjaran_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            await UpdateActiveMapelListAsync();
            await RefreshStudentListAsync();
        }

        private async void CmbKelas_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            await UpdateActiveMapelListAsync();
            await RefreshStudentListAsync();
        }

        private async void CmbKategori_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            await UpdateActiveMapelListAsync();
        }

        private void FilterSelection_Changed(object sender, SelectionChangedEventArgs e)
        {
            // Mata Pelajaran selection changed
        }

        private async Task UpdateActiveMapelListAsync(int? selectMapelId = null)
        {
            if (CmbTahunAjaran.SelectedValue is not int taId ||
                CmbKategori.SelectedValue is not int katId ||
                CmbKelas.SelectedItem is not Kelas k)
            {
                _activeMapelList = _allMapelList.ToList();
                CmbMapel.ItemsSource = _activeMapelList;
                if (_activeMapelList.Count > 0 && CmbMapel.SelectedIndex < 0) CmbMapel.SelectedIndex = 0;
                return;
            }

            try
            {
                var mapelTingkat = await _apiClient.GetMapelTingkatListAsync(taId, katId);
                var activeIds = mapelTingkat
                    .Where(mt => mt.TingkatInt == k.TingkatInt)
                    .Select(mt => mt.MataPelajaranId)
                    .ToHashSet();

                var filtered = _allMapelList.Where(m =>
                    activeIds.Contains(m.Id) &&
                    m.Jenis != "Muhafadzoh" &&
                    m.Jenis != "Qiroah" &&
                    m.Jenis != "Taftisy" &&
                    !(m.Nama ?? "").ToLower().Contains("muhafadzoh") &&
                    !(m.Nama ?? "").ToLower().Contains("qiroat") &&
                    !(m.Nama ?? "").ToLower().Contains("taftisy")
                ).ToList();

                _activeMapelList = filtered;
                CmbMapel.ItemsSource = _activeMapelList;

                if (selectMapelId.HasValue && _activeMapelList.Any(m => m.Id == selectMapelId.Value))
                {
                    CmbMapel.SelectedValue = selectMapelId.Value;
                }
                else if (_activeMapelList.Count > 0)
                {
                    CmbMapel.SelectedValue = _activeMapelList[0].Id;
                }
            }
            catch
            {
                _activeMapelList = _allMapelList.ToList();
                CmbMapel.ItemsSource = _activeMapelList;
            }
        }

        private async Task RefreshStudentListAsync()
        {
            if (CmbKelas.SelectedItem is not Kelas k || CmbTahunAjaran.SelectedItem is not TahunAjaran ta)
                return;

            TxtStatusLog.Text = $"Mengambil daftar santri Kelas {k.Nama}...";
            var santriList = await _apiClient.GetSantriListAsync(k.Id, ta.Id);

            _studentScores.Clear();
            for (int i = 0; i < santriList.Count; i++)
            {
                var s = santriList[i];
                _studentScores.Add(new StudentScoreItem
                {
                    No = i + 1,
                    SantriId = s.Id,
                    Nis = s.Nis,
                    Nama = s.Nama,
                    Nilai = "-"
                });
            }

            UpdateStats();
            TxtStatusLog.Text = $"Daftar santri Kelas {k.Nama} siap ({santriList.Count} santri).";
        }

        private void BtnBrowseScan_Click(object sender, RoutedEventArgs e)
        {
            var dlg = new OpenFileDialog
            {
                Title = "Pilih Berkas Lembar OMR Hasil Scan",
                Filter = "Berkas Gambar Hasil Scan (*.jpg;*.jpeg;*.png;*.bmp;*.tif)|*.jpg;*.jpeg;*.png;*.bmp;*.tif|Semua Berkas (*.*)|*.*"
            };

            if (dlg.ShowDialog() == true)
            {
                _currentImagePath = dlg.FileName;
                ProcessCurrentScan();
            }
        }

        private void BtnScanEpson_Click(object sender, RoutedEventArgs e)
        {
            MessageBox.Show(
                "Untuk pemindaian langsung dari Scanner Epson flatbed L3250:\n\n" +
                "1. Letakkan lembar ujian menghadap ke bawah pada kaca scanner Epson.\n" +
                "2. Jalankan Epson Scan / Windows Fax & Scan ke format JPG resolusi 300 DPI.\n" +
                "3. Klik 'Buka Berkas Scan' untuk memuat gambar hasil scan tersebut.",
                "Petunjuk Scanner Flatbed Epson",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
        }

        private void BtnReanalyze_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrWhiteSpace(_currentImagePath) || !File.Exists(_currentImagePath))
            {
                MessageBox.Show("Belum ada berkas scan yang dipilih.", "Pemberitahuan", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }
            ProcessCurrentScan();
        }

        private async void ProcessCurrentScan()
        {
            if (string.IsNullOrWhiteSpace(_currentImagePath) || !File.Exists(_currentImagePath)) return;

            try
            {
                TxtStatusLog.Text = "Membaca QR Code lembar ujian...";

                // 1. Extract QR metadata FIRST to match class and load exact student roster
                var meta = OmrEngine.ExtractQrMetadataFromFile(_currentImagePath);
                if (meta != null)
                {
                    bool matched = false;

                    if (meta.t.HasValue && _taList.Any(t => t.Id == meta.t.Value))
                    {
                        CmbTahunAjaran.SelectedValue = meta.t.Value;
                        matched = true;
                    }
                    if (meta.cat.HasValue && _katList.Any(c => c.Id == meta.cat.Value))
                    {
                        CmbKategori.SelectedValue = meta.cat.Value;
                        matched = true;
                    }
                    if (meta.k.HasValue && _kelasList.Any(c => c.Id == meta.k.Value))
                    {
                        CmbKelas.SelectedValue = meta.k.Value;
                        matched = true;
                    }

                    // Update active subjects for this class and select the mapel
                    await UpdateActiveMapelListAsync(meta.m);

                    if (matched)
                    {
                        TxtQrStatus.Text = "QR Code Terbaca (Auto-Sync)";
                        QrBadge.Background = new SolidColorBrush(Color.FromRgb(220, 252, 231)); // Emerald light
                        TxtQrStatus.Foreground = new SolidColorBrush(Color.FromRgb(22, 163, 74));
                    }
                }
                else
                {
                    TxtQrStatus.Text = "QR Code Manual / Tidak Terdeteksi";
                    QrBadge.Background = new SolidColorBrush(Color.FromRgb(254, 243, 199)); // Amber light
                    TxtQrStatus.Foreground = new SolidColorBrush(Color.FromRgb(217, 119, 6));
                }

                // Ensure student list for the selected class is fetched from VPS
                await RefreshStudentListAsync();

                // 2. Process OMR Sheet with the EXACT student count for this class
                TxtStatusLog.Text = $"Menganalisis lembar OMR ({_studentScores.Count} santri)...";
                int expectedCount = _studentScores.Count > 0 ? _studentScores.Count : 28;
                var omrResult = _omrEngine.ProcessScannedSheet(_currentImagePath, expectedCount);

                // 2. Map detected scores to the students in order
                for (int i = 0; i < omrResult.Scores.Count; i++)
                {
                    var score = omrResult.Scores[i];
                    string scoreStr = score.HasValue ? score.Value.ToString() : "-";

                    if (i < _studentScores.Count)
                    {
                        _studentScores[i].Nilai = scoreStr;
                    }
                    else
                    {
                        // Add row if sheet has more entries than current roster
                        _studentScores.Add(new StudentScoreItem
                        {
                            No = i + 1,
                            SantriId = 0,
                            Nis = "-",
                            Nama = $"Santri Baris ke-{i + 1}",
                            Nilai = scoreStr
                        });
                    }
                }

                // 3. Display preview image with detection annotations
                ImgPreview.Source = omrResult.AnnotatedImage;
                TxtImagePlaceholder.Visibility = Visibility.Collapsed;

                UpdateStats();
                BtnSaveToServer.IsEnabled = _studentScores.Any(s => s.IsFilled);

                TxtStatusLog.Text = $"Analisis selesai! Terdeteksi {omrResult.FilledCount} dari {_studentScores.Count} santri (Rata-rata: {omrResult.AverageScore:F1}).";
            }
            catch (Exception ex)
            {
                MessageBox.Show("Gagal memproses lembar scan: " + ex.Message, "Kesalahan OMR", MessageBoxButton.OK, MessageBoxImage.Error);
                TxtStatusLog.Text = "Terjadi kesalahan saat pemindaian: " + ex.Message;
            }
        }

        private void TxtNilai_TextChanged(object sender, TextChangedEventArgs e)
        {
            UpdateStats();
        }

        private void UpdateStats()
        {
            int total = _studentScores.Count;
            int filled = _studentScores.Count(s => s.IsFilled);
            int unfilled = total - filled;

            TxtTotalSantri.Text = total.ToString();
            TxtFilledSantri.Text = filled.ToString();
            TxtUnfilledSantri.Text = unfilled.ToString();

            var scoresWithVal = _studentScores
                .Where(s => int.TryParse(s.Nilai, out _))
                .Select(s => int.Parse(s.Nilai))
                .ToList();

            TxtAverageScore.Text = scoresWithVal.Count > 0 ? (scoresWithVal.Average()).ToString("F1") : "-";
            BtnSaveToServer.IsEnabled = filled > 0;
        }

        private async void BtnSaveToServer_Click(object sender, RoutedEventArgs e)
        {
            if (CmbKelas.SelectedItem is not Kelas k ||
                CmbTahunAjaran.SelectedItem is not TahunAjaran ta ||
                CmbKategori.SelectedItem is not KategoriEvaluasi cat ||
                CmbMapel.SelectedItem is not MataPelajaran m)
            {
                MessageBox.Show("Pastikan Tahun Ajaran, Kelas, Kategori, dan Mata Pelajaran telah dipilih.", "Peringatan", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            var filledItems = _studentScores.Where(s => s.IsFilled && s.SantriId > 0).ToList();
            if (filledItems.Count == 0)
            {
                MessageBox.Show("Tidak ada nilai santri valid yang dapat disimpan.", "Perhatian", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            var confirm = MessageBox.Show(
                $"Kirim nilai {filledItems.Count} santri untuk:\n" +
                $"• Kelas: {k.Nama}\n" +
                $"• Mapel: {m.Nama}\n" +
                $"• Kategori: {cat.Nama}\n" +
                $"• Tahun Ajaran: {ta.Kode}\n\n" +
                $"Lanjutkan penyimpanan ke database rapor di VPS?",
                "Konfirmasi Penyimpanan Nilai",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question);

            if (confirm != MessageBoxResult.Yes) return;

            BtnSaveToServer.IsEnabled = false;
            TxtStatusLog.Text = "Mengirim nilai ke server VPS...";

            var payload = new BulkSavePayload
            {
                tahun_ajaran_id = ta.Id,
                kelas_id = k.Id,
                mata_pelajaran_id = m.Id,
                kategori_evaluasi_id = cat.Id,
                data = filledItems.Select(s => new BulkSaveScoreItem
                {
                    santri_id = s.SantriId,
                    nilai_angka = int.TryParse(s.Nilai, out int n) ? n : null,
                    predikat = null,
                    capaian = "Tam"
                }).ToList()
            };

            var (success, msg) = await _apiClient.SaveScoresBulkAsync(payload);

            BtnSaveToServer.IsEnabled = true;
            TxtStatusLog.Text = msg;

            if (success)
            {
                MessageBox.Show(msg, "Sukses Menyimpan Nilai", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            else
            {
                MessageBox.Show(msg, "Gagal Menyimpan Nilai", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }
}