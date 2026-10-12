using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Threading.Tasks;
using System.Windows;
using Microsoft.Win32;

namespace AlHamidScannerSetup
{
    public partial class MainWindow : Window
    {
        private string _targetDir = string.Empty;

        public MainWindow()
        {
            InitializeComponent();
            string programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
            TxtInstallPath.Text = Path.Combine(programFiles, "Al-Hamid Scanner");
        }

        private void BtnBrowse_Click(object sender, RoutedEventArgs e)
        {
            var dlg = new OpenFolderDialog
            {
                Title = "Pilih Folder Tujuan Pemasangan Al-Hamid Scanner",
                InitialDirectory = TxtInstallPath.Text
            };

            if (dlg.ShowDialog() == true)
            {
                TxtInstallPath.Text = dlg.FolderName;
            }
        }

        private void BtnCancel_Click(object sender, RoutedEventArgs e)
        {
            var res = MessageBox.Show(
                "Apakah Anda yakin ingin membatalkan penginstalan?",
                "Konfirmasi Batal",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question);

            if (res == MessageBoxResult.Yes)
            {
                Application.Current.Shutdown();
            }
        }

        private async void BtnInstall_Click(object sender, RoutedEventArgs e)
        {
            string target = TxtInstallPath.Text.Trim();
            if (string.IsNullOrWhiteSpace(target))
            {
                MessageBox.Show("Silakan tentukan folder tujuan pemasangan.", "Peringatan", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            _targetDir = target;
            bool createDesktop = ChkDesktopShortcut.IsChecked == true;
            bool createStartMenu = ChkStartMenuShortcut.IsChecked == true;

            PanelStep1.Visibility = Visibility.Collapsed;
            PanelStep2.Visibility = Visibility.Visible;

            try
            {
                await Task.Run(() => PerformInstallation(target, createDesktop, createStartMenu));

                PanelStep2.Visibility = Visibility.Collapsed;
                PanelStep3.Visibility = Visibility.Visible;
            }
            catch (Exception ex)
            {
                MessageBox.Show("Terjadi kesalahan saat penginstalan:\n" + ex.Message, "Gagal Menginstal", MessageBoxButton.OK, MessageBoxImage.Error);
                PanelStep2.Visibility = Visibility.Collapsed;
                PanelStep1.Visibility = Visibility.Visible;
            }
        }

        private void PerformInstallation(string targetDir, bool createDesktop, bool createStartMenu)
        {
            UpdateProgress("Menyiapkan folder instalasi...", 5);
            Directory.CreateDirectory(targetDir);

            UpdateProgress("Membuka paket instalasi...", 10);
            var assembly = Assembly.GetExecutingAssembly();
            using var stream = assembly.GetManifestResourceStream("payload.zip");
            if (stream == null)
            {
                throw new InvalidOperationException("Berkas payload instalasi tidak ditemukan di dalam berkas setup.");
            }

            using var archive = new ZipArchive(stream, ZipArchiveMode.Read);
            int total = archive.Entries.Count;
            int count = 0;

            foreach (var entry in archive.Entries)
            {
                count++;
                if (string.IsNullOrEmpty(entry.Name) && entry.FullName.EndsWith("/"))
                {
                    string dirPath = Path.Combine(targetDir, entry.FullName);
                    Directory.CreateDirectory(dirPath);
                    continue;
                }

                string destinationPath = Path.Combine(targetDir, entry.FullName);
                string? parentDir = Path.GetDirectoryName(destinationPath);
                if (!string.IsNullOrEmpty(parentDir))
                {
                    Directory.CreateDirectory(parentDir);
                }

                entry.ExtractToFile(destinationPath, true);

                int pct = 15 + (int)((count / (double)total) * 65);
                UpdateProgress($"Mengekstrak {entry.Name}...", pct);
            }

            // Copy self as Uninstall.exe
            UpdateProgress("Memasang program pencopotan (Uninstaller)...", 82);
            string currentExe = Environment.ProcessPath ?? "";
            string uninstallerPath = Path.Combine(targetDir, "Uninstall.exe");
            if (File.Exists(currentExe))
            {
                File.Copy(currentExe, uninstallerPath, true);
            }

            // Create Shortcuts
            string appExe = Path.Combine(targetDir, "AlHamidScanner.exe");
            string iconPath = Path.Combine(targetDir, "app_icon.ico");

            if (createDesktop)
            {
                UpdateProgress("Membuat pintasan Desktop...", 88);
                string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string linkPath = Path.Combine(desktopPath, "Al-Hamid OMR Scanner.lnk");
                ShortcutHelper.CreateShortcut(appExe, linkPath, "Al-Hamid OMR Scanner Desktop", iconPath);
            }

            if (createStartMenu)
            {
                UpdateProgress("Membuat menu di Start Menu...", 92);
                string startMenuPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "Al-Hamid Scanner");
                Directory.CreateDirectory(startMenuPath);
                string linkPath = Path.Combine(startMenuPath, "Al-Hamid OMR Scanner.lnk");
                ShortcutHelper.CreateShortcut(appExe, linkPath, "Al-Hamid OMR Scanner Desktop", iconPath);

                string uninstallLink = Path.Combine(startMenuPath, "Copot Pemasangan.lnk");
                ShortcutHelper.CreateShortcut(uninstallerPath, uninstallLink, "Copot Pemasangan Al-Hamid OMR Scanner", iconPath);
            }

            // Register in Windows Add or Remove Programs
            UpdateProgress("Mendaftarkan aplikasi ke sistem Windows...", 96);
            RegisterUninstaller(targetDir, appExe, uninstallerPath);

            UpdateProgress("Pemasangan selesai!", 100);
        }

        private void RegisterUninstaller(string targetDir, string appExe, string uninstallerPath)
        {
            try
            {
                RegistryKey? baseKey = null;
                try
                {
                    baseKey = Registry.LocalMachine.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall", true);
                }
                catch { }

                baseKey ??= Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall");
                if (baseKey == null) return;

                using var subKey = baseKey.CreateSubKey("AlHamidScanner");
                if (subKey != null)
                {
                    subKey.SetValue("DisplayName", "Al-Hamid OMR Scanner");
                    subKey.SetValue("DisplayIcon", $"{appExe},0");
                    subKey.SetValue("DisplayVersion", "1.0.0");
                    subKey.SetValue("Publisher", "Madrasah Diniyah Al-Hamid Cintamulya");
                    subKey.SetValue("UninstallString", $"\"{uninstallerPath}\" /uninstall");
                    subKey.SetValue("InstallLocation", targetDir);
                    subKey.SetValue("InstallDate", DateTime.Now.ToString("yyyyMMdd"));
                    subKey.SetValue("EstimatedSize", 260000); // ~260 MB in KB
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine("Gagal registrasi uninstaller: " + ex.Message);
            }
        }

        private void UpdateProgress(string status, int pct)
        {
            Dispatcher.Invoke(() =>
            {
                TxtProgressStatus.Text = status;
                ProgressBarInstall.Value = pct;
            });
        }

        private void BtnFinish_Click(object sender, RoutedEventArgs e)
        {
            if (ChkLaunchApp.IsChecked == true && !string.IsNullOrEmpty(_targetDir))
            {
                string appExe = Path.Combine(_targetDir, "AlHamidScanner.exe");
                if (File.Exists(appExe))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = appExe,
                        WorkingDirectory = _targetDir,
                        UseShellExecute = true
                    });
                }
            }
            Application.Current.Shutdown();
        }
    }
}
