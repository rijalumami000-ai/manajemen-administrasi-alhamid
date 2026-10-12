using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using System.Windows;
using Microsoft.Win32;

namespace AlHamidScannerSetup
{
    public partial class UninstallWindow : Window
    {
        private readonly string _installDir;

        public UninstallWindow()
        {
            InitializeComponent();
            _installDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
            TxtInstallLoc.Text = "Lokasi: " + _installDir;
        }

        private void BtnCancel_Click(object sender, RoutedEventArgs e)
        {
            Application.Current.Shutdown();
        }

        private async void BtnDoUninstall_Click(object sender, RoutedEventArgs e)
        {
            PanelConfirm.Visibility = Visibility.Collapsed;
            PanelProgress.Visibility = Visibility.Visible;

            try
            {
                await Task.Run(() => PerformUninstallation(_installDir));

                PanelProgress.Visibility = Visibility.Collapsed;
                PanelDone.Visibility = Visibility.Visible;
            }
            catch (Exception ex)
            {
                MessageBox.Show("Terjadi kesalahan saat menghapus aplikasi:\n" + ex.Message, "Kesalahan", MessageBoxButton.OK, MessageBoxImage.Error);
                Application.Current.Shutdown();
            }
        }

        private void PerformUninstallation(string installDir)
        {
            UpdateStatus("Menghapus pintasan Desktop...");
            string desktopLink = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Al-Hamid OMR Scanner.lnk");
            ShortcutHelper.DeleteShortcut(desktopLink);

            UpdateStatus("Menghapus pintasan Start Menu...");
            string startMenuDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "Al-Hamid Scanner");
            if (Directory.Exists(startMenuDir))
            {
                try { Directory.Delete(startMenuDir, true); } catch { }
            }

            UpdateStatus("Menghapus registrasi dari Windows Settings...");
            try
            {
                using var hklm = Registry.LocalMachine.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall", true);
                hklm?.DeleteSubKeyTree("AlHamidScanner", false);
            }
            catch { }

            try
            {
                using var hkcu = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall", true);
                hkcu?.DeleteSubKeyTree("AlHamidScanner", false);
            }
            catch { }

            UpdateStatus("Menghapus berkas aplikasi...");
            string currentExe = Environment.ProcessPath ?? "";

            // Delete all files except the running uninstaller
            if (Directory.Exists(installDir))
            {
                foreach (var file in Directory.GetFiles(installDir, "*", SearchOption.AllDirectories))
                {
                    if (string.Equals(file, currentExe, StringComparison.OrdinalIgnoreCase)) continue;
                    try { File.Delete(file); } catch { }
                }

                // Delete subdirectories
                foreach (var dir in Directory.GetDirectories(installDir))
                {
                    try { Directory.Delete(dir, true); } catch { }
                }
            }

            // Schedule self-delete of uninstall.exe and root folder via background cmd
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = $"/c timeout /t 2 /nobreak > nul & rmdir /s /q \"{installDir}\"",
                    WindowStyle = ProcessWindowStyle.Hidden,
                    CreateNoWindow = true,
                    UseShellExecute = false
                });
            }
            catch { }
        }

        private void UpdateStatus(string status)
        {
            Dispatcher.Invoke(() =>
            {
                TxtUninstallStatus.Text = status;
            });
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            Application.Current.Shutdown();
        }
    }
}
