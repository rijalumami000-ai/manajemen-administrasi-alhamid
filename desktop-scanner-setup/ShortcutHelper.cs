using System;
using System.IO;

namespace AlHamidScannerSetup
{
    public static class ShortcutHelper
    {
        public static void CreateShortcut(string targetPath, string shortcutPath, string description, string iconPath)
        {
            try
            {
                Type? shellType = Type.GetTypeFromProgID("WScript.Shell");
                if (shellType == null) return;

                dynamic? shell = Activator.CreateInstance(shellType);
                if (shell == null) return;

                dynamic shortcut = shell.CreateShortcut(shortcutPath);
                shortcut.TargetPath = targetPath;
                shortcut.WorkingDirectory = Path.GetDirectoryName(targetPath);
                shortcut.Description = description;
                if (!string.IsNullOrEmpty(iconPath) && File.Exists(iconPath))
                {
                    shortcut.IconLocation = iconPath + ",0";
                }
                shortcut.Save();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Gagal membuat shortcut: " + ex.Message);
            }
        }

        public static void DeleteShortcut(string shortcutPath)
        {
            try
            {
                if (File.Exists(shortcutPath))
                {
                    File.Delete(shortcutPath);
                }
            }
            catch { }
        }
    }
}
