using System;
using System.IO;
using System.Linq;
using System.Windows;

namespace AlHamidScannerSetup
{
    public partial class App : Application
    {
        private void Application_Startup(object sender, StartupEventArgs e)
        {
            string exeName = Path.GetFileName(Environment.ProcessPath ?? "").ToLower();
            bool isUninstall = e.Args.Any(a => a.Equals("/uninstall", StringComparison.OrdinalIgnoreCase) || a.Equals("-uninstall", StringComparison.OrdinalIgnoreCase)) ||
                               exeName.Contains("uninstall");

            if (isUninstall)
            {
                var uninstallerWindow = new UninstallWindow();
                uninstallerWindow.Show();
            }
            else
            {
                var mainWindow = new MainWindow();
                mainWindow.Show();
            }
        }
    }
}
