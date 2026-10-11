using System;
using System.IO;
using System.Text;
using System.Windows;
using AlHamidScanner.Services;

namespace AlHamidScanner;

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        if (e.Args.Length >= 2 && e.Args[0] == "--test")
        {
            string imagePath = e.Args[1];
            var sb = new StringBuilder();
            try
            {
                var engine = new OmrEngine();
                var res = engine.ProcessScannedSheet(imagePath, 28);
                sb.AppendLine($"[TEST SUCCESS] Total: {res.TotalDetected}, Filled: {res.FilledCount}, Avg: {res.AverageScore:F1}");
                sb.AppendLine($"QR Metadata: raw_t={res.Metadata?.t_raw}, raw_k={res.Metadata?.k_raw}, raw_m={res.Metadata?.m_raw}, raw_cat={res.Metadata?.cat_raw}");
                sb.AppendLine($"Parsed: t={res.Metadata?.t}, k={res.Metadata?.k}, m={res.Metadata?.m}, cat={res.Metadata?.cat}");
                sb.AppendLine(res.DebugInfo);
                for (int i = 0; i < res.Scores.Count; i++)
                {
                    sb.AppendLine($"Row {i + 1,2}: {(res.Scores[i].HasValue ? res.Scores[i]!.Value.ToString() : "-"),3}");
                }
            }
            catch (Exception ex)
            {
                sb.AppendLine("[TEST ERROR] " + ex.Message);
            }

            File.WriteAllText("desktop-scanner/test_output.txt", sb.ToString());
            Shutdown(0);
        }
    }
}
