using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Windows.Media.Imaging;
using AlHamidScanner.Models;
using OpenCvSharp;
using OpenCvSharp.WpfExtensions;
using ZXing;
using ZXing.Common;

namespace AlHamidScanner.Services
{
    public class OmrResult
    {
        public QrMetadata? Metadata { get; set; }
        public List<int?> Scores { get; set; } = new();
        public BitmapSource? AnnotatedImage { get; set; }
        public string DebugInfo { get; set; } = string.Empty;
        public int FilledCount => Scores.Count(s => s.HasValue);
        public int TotalDetected => Scores.Count;
        public double AverageScore => FilledCount > 0 ? Scores.Where(s => s.HasValue).Average(s => s!.Value) : 0;
    }

    public class OmrEngine
    {
        private static readonly int[] TensValues = { 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100 };

        public OmrResult ProcessScannedSheet(string imagePath, int studentCount = 28)
        {
            if (!File.Exists(imagePath))
                throw new FileNotFoundException("Berkas hasil scan tidak ditemukan: " + imagePath);

            using var src = Cv2.ImRead(imagePath, ImreadModes.Color);
            if (src.Empty())
                throw new InvalidOperationException("Gagal membuka gambar scan dengan OpenCV.");

            var result = new OmrResult();

            // 1. Scan QR Code for Metadata (Tahun Ajaran, Kelas, Mapel, Kategori)
            result.Metadata = ExtractQrMetadata(src);

            // 2. Grayscale & Binarization
            using var gray = new Mat();
            Cv2.CvtColor(src, gray, ColorConversionCodes.BGR2GRAY);

            int width = src.Width;
            int height = src.Height;

            // Darkness map: pixels with gray < 165
            using var binary = new Mat();
            Cv2.Threshold(gray, binary, 165, 255, ThresholdTypes.BinaryInv);

            // 3. Morphological extraction for pure vertical column lines (removes bubbles and text)
            int kernelVHeight = Math.Max(25, (int)(height * 0.035));
            using var kernelV = Cv2.GetStructuringElement(MorphShapes.Rect, new OpenCvSharp.Size(1, kernelVHeight));
            using var verticalLines = new Mat();
            Cv2.MorphologyEx(binary, verticalLines, MorphTypes.Open, kernelV);

            int sampleYStart = (int)(height * 0.25);
            int sampleYEnd = (int)(height * 0.85);
            int sampleH = Math.Max(1, sampleYEnd - sampleYStart);

            using var sampleRegion = new Mat(verticalLines, new Rect(0, sampleYStart, width, sampleH));
            using var vColSum = new Mat();
            Cv2.Reduce(sampleRegion, vColSum, ReduceDimension.Row, ReduceTypes.Avg, MatType.CV_32F);

            var vLines = new List<int>();
            var currV = new List<int>();
            for (int x = 0; x < width; x++)
            {
                float val = vColSum.At<float>(0, x);
                if (val > 40f) // > ~16% dark line
                {
                    currV.Add(x);
                }
                else if (currV.Count > 0)
                {
                    int avgX = (int)currV.Average();
                    // Ignore scanner glass edges near extreme borders
                    if (avgX >= (int)(width * 0.02) && avgX <= (int)(width * 0.98))
                    {
                        vLines.Add(avgX);
                    }
                    currV.Clear();
                }
            }
            if (currV.Count > 0)
            {
                int avgX = (int)currV.Average();
                if (avgX >= (int)(width * 0.02) && avgX <= (int)(width * 0.98))
                    vLines.Add(avgX);
            }

            // Fallback table geometry based on standard F4/A4 sheet layout
            int tableLeft = (int)(width * 0.040);
            int tableRight = (int)(width * 0.942);

            // Refine table outer boundaries from detected lines
            var leftCandidates = vLines.Where(x => x >= (int)(width * 0.025) && x <= (int)(width * 0.085)).ToList();
            if (leftCandidates.Count > 0)
                tableLeft = leftCandidates.OrderBy(x => Math.Abs(x - (int)(width * 0.040))).First();

            var rightCandidates = vLines.Where(x => x >= (int)(width * 0.880) && x <= (int)(width * 0.970)).ToList();
            if (rightCandidates.Count > 0)
                tableRight = rightCandidates.OrderBy(x => Math.Abs(x - (int)(width * 0.942))).Last();

            int tableW = Math.Max(100, tableRight - tableLeft);

            // STRICT GEOMETRIC BOUNDS FOR NILAI COLUMN:
            // nama column is 0..0.318 of tableW; Nilai column is 0.318..0.697 of tableW.
            // Under NO circumstance can xNilaiLeft drift leftward into the Nama column!
            double targetLeftRatio = 0.318;
            double targetRightRatio = 0.697;
            int expectedNilaiLeft = tableLeft + (int)(tableW * targetLeftRatio);
            int expectedNilaiRight = tableLeft + (int)(tableW * targetRightRatio);

            int xNilaiLeft = expectedNilaiLeft;
            int xNilaiRight = expectedNilaiRight;

            // Search for vertical divider between Nama and Nilai (within +/- 3.5% of tableW)
            var candLeft = vLines.Where(x => Math.Abs(x - expectedNilaiLeft) <= (int)(tableW * 0.035))
                                 .OrderBy(x => Math.Abs(x - expectedNilaiLeft)).ToList();
            if (candLeft.Count > 0)
                xNilaiLeft = candLeft[0];

            // Search for vertical divider between Nilai and Hadir (within +/- 3.5% of tableW)
            var candRight = vLines.Where(x => Math.Abs(x - expectedNilaiRight) <= (int)(tableW * 0.035))
                                  .OrderBy(x => Math.Abs(x - expectedNilaiRight)).ToList();
            if (candRight.Count > 0)
                xNilaiRight = candRight[0];

            // 4. Morphological extraction for pure horizontal row lines
            int kernelHWidth = Math.Max(30, (int)(width * 0.045));
            using var kernelH = Cv2.GetStructuringElement(MorphShapes.Rect, new OpenCvSharp.Size(kernelHWidth, 1));
            using var horizontalLines = new Mat();
            Cv2.MorphologyEx(binary, horizontalLines, MorphTypes.Open, kernelH);

            int regionTop = (int)(height * 0.18);
            int regionH = (int)(height * 0.80);
            using var tableRegion = new Mat(horizontalLines, new Rect(tableLeft, regionTop, tableW, regionH));
            using var hRowSum = new Mat();
            Cv2.Reduce(tableRegion, hRowSum, ReduceDimension.Column, ReduceTypes.Avg, MatType.CV_32F);

            var hLines = new List<int>();
            var currH = new List<int>();
            for (int y = 0; y < tableRegion.Height; y++)
            {
                float val = hRowSum.At<float>(y, 0);
                if (val > 40f)
                {
                    currH.Add(regionTop + y);
                }
                else if (currH.Count > 0)
                {
                    hLines.Add((int)currH.Average());
                    currH.Clear();
                }
            }
            if (currH.Count > 0)
                hLines.Add((int)currH.Average());

            // Calculate median row step dynamically adapted to image resolution
            int minStep = Math.Max(15, (int)(height * 0.016));
            int maxStep = Math.Max(40, (int)(height * 0.045));
            var steps = new List<int>();
            for (int i = 0; i < hLines.Count - 1; i++)
            {
                int diff = hLines[i + 1] - hLines[i];
                if (diff >= minStep && diff <= maxStep)
                    steps.Add(diff);
            }
            steps.Sort();
            double defaultRowHeight = height * 0.0268;
            double medianRowHeight = steps.Count > 0 ? steps[steps.Count / 2] : defaultRowHeight;

            int targetRows = Math.Min(studentCount, 30);
            int yTableEnd = (int)(height * 0.963);
            var endCandidates = hLines.Where(y => y >= (int)(height * 0.91) && y <= (int)(height * 0.98)).ToList();
            if (endCandidates.Count > 0)
                yTableEnd = endCandidates.Last();

            int yTableStart = yTableEnd - (int)(targetRows * medianRowHeight);
            double rowH = (double)(yTableEnd - yTableStart) / targetRows;

            // Dynamic bubble metrics radius
            int cellW = Math.Max(50, xNilaiRight - xNilaiLeft);
            int bubbleRadius = Math.Max(5, (int)(cellW * 0.026));
            int drawRadius = Math.Max(8, (int)(cellW * 0.038));

            // 5. Annotated Mat for visual display
            using var annotated = src.Clone();

            // Draw table boundaries in cyan
            Cv2.Rectangle(annotated, new Rect(tableLeft, yTableStart, tableW, yTableEnd - yTableStart), new Scalar(255, 200, 0), 1);
            Cv2.Line(annotated, new Point(xNilaiLeft, yTableStart), new Point(xNilaiLeft, yTableEnd), new Scalar(255, 100, 0), 2);
            Cv2.Line(annotated, new Point(xNilaiRight, yTableStart), new Point(xNilaiRight, yTableEnd), new Scalar(255, 100, 0), 2);

            result.DebugInfo = $"vLines: [{string.Join(", ", vLines)}], hLines: [{string.Join(", ", hLines)}], yStart: {yTableStart}, yEnd: {yTableEnd}, rowH: {rowH:F2}, cellW: {cellW}, xNilai: [{xNilaiLeft}, {xNilaiRight}]";

            for (int i = 0; i < targetRows; i++)
            {
                int cy = (int)(yTableStart + (i + 0.5) * rowH);

                // Sample 5 bubble
                int bx5 = xNilaiLeft + (int)(cellW * 0.954);
                var m5 = GetBubbleMetrics(gray, binary, bx5, cy, bubbleRadius);
                bool hasFive = m5.DarkRatio >= 0.22 || m5.MeanGray <= 205;

                // Sample 11 tens bubbles
                var tensMetrics = new List<(int val, int bx, double darkRatio, double meanGray)>();
                for (int bIdx = 0; bIdx < TensValues.Length; bIdx++)
                {
                    int bx = xNilaiLeft + (int)(cellW * (0.050 + bIdx * ((0.833 - 0.050) / 10.0)));
                    var m = GetBubbleMetrics(gray, binary, bx, cy, bubbleRadius);
                    tensMetrics.Add((TensValues[bIdx], bx, m.DarkRatio, m.MeanGray));
                }

                tensMetrics.Sort((a, b) => b.darkRatio.CompareTo(a.darkRatio));
                var bestTen = tensMetrics[0];
                var secondTen = tensMetrics[1];

                bool hasTen = bestTen.darkRatio >= 0.34 || (bestTen.darkRatio >= 0.28 && (bestTen.darkRatio - secondTen.darkRatio) >= 0.06);

                int? score = null;
                if (hasTen)
                {
                    if (bestTen.val == 100)
                        score = 100;
                    else
                        score = bestTen.val + (hasFive ? 5 : 0);
                }
                else if (hasFive)
                {
                    score = 5;
                }

                result.DebugInfo += $"\nRow {i + 1,2}: best={bestTen.val}(dr={bestTen.darkRatio:F3},mg={bestTen.meanGray:F0}) 2nd={secondTen.val}(dr={secondTen.darkRatio:F3}) 5=(dr={m5.DarkRatio:F3}) => hasTen={hasTen}, has5={hasFive}, score={score}";

                result.Scores.Add(score);

                // Visual Annotations on Preview Image
                // Highlight detected bubbles with bright green circle DIRECTLY in the Nilai column
                if (hasTen)
                {
                    Cv2.Circle(annotated, new Point(bestTen.bx, cy), drawRadius, new Scalar(0, 230, 0), 2);
                }
                if (hasFive && (bestTen.val != 100 || !hasTen))
                {
                    Cv2.Circle(annotated, new Point(bx5, cy), drawRadius, new Scalar(0, 230, 0), 2);
                }

                // Draw row divider in subtle gray
                int rowYLine = (int)(yTableStart + (i + 1) * rowH);
                Cv2.Line(annotated, new Point(tableLeft, rowYLine), new Point(tableRight, rowYLine), new Scalar(200, 200, 200), 1);

                // Draw score label text on the right
                if (score.HasValue)
                {
                    string txt = score.Value.ToString();
                    double fontScale = Math.Max(0.40, height / 2200.0);
                    Cv2.PutText(annotated, txt, new Point(tableRight - (int)(tableW * 0.065), cy + 4), HersheyFonts.HersheySimplex, fontScale, new Scalar(0, 160, 0), 2);
                }
            }

            result.AnnotatedImage = WriteableBitmapConverter.ToWriteableBitmap(annotated);
            return result;
        }

        private static (double DarkRatio, double MeanGray) GetBubbleMetrics(Mat gray, Mat binary, int cx, int cy, int r)
        {
            int x1 = Math.Max(0, cx - r);
            int x2 = Math.Min(gray.Width - 1, cx + r);
            int y1 = Math.Max(0, cy - r);
            int y2 = Math.Min(gray.Height - 1, cy + r);
            int rw = x2 - x1 + 1;
            int rh = y2 - y1 + 1;

            if (rw <= 0 || rh <= 0) return (0, 255);

            using var patchGray = new Mat(gray, new Rect(x1, y1, rw, rh));
            using var patchBin = new Mat(binary, new Rect(x1, y1, rw, rh));

            double meanGray = Cv2.Mean(patchGray).Val0;
            double darkRatio = Cv2.CountNonZero(patchBin) / (double)(rw * rh);

            return (darkRatio, meanGray);
        }

        public static QrMetadata? ExtractQrMetadataFromFile(string imagePath)
        {
            if (string.IsNullOrWhiteSpace(imagePath) || !File.Exists(imagePath)) return null;
            try
            {
                using var src = Cv2.ImRead(imagePath, ImreadModes.Color);
                if (src.Empty()) return null;
                return ExtractQrMetadata(src);
            }
            catch
            {
                return null;
            }
        }

        public static QrMetadata? ExtractQrMetadata(Mat src)
        {
            try
            {
                // Crop top-right header region where QR code resides (x: 65%..100%, y: 0..25%)
                int qrRoiX = (int)(src.Width * 0.65);
                int qrRoiY = 0;
                int qrRoiW = src.Width - qrRoiX;
                int qrRoiH = (int)(src.Height * 0.25);

                using var qrRoi = new Mat(src, new Rect(qrRoiX, qrRoiY, qrRoiW, qrRoiH));
                using var qrGray = new Mat();
                Cv2.CvtColor(qrRoi, qrGray, ColorConversionCodes.BGR2GRAY);

                // Resize 3x with bicubic interpolation to sharpen blurred modules
                using var resized = new Mat();
                Cv2.Resize(qrGray, resized, new OpenCvSharp.Size(qrGray.Width * 3, qrGray.Height * 3), 0, 0, InterpolationFlags.Cubic);

                // Otsu binarization
                using var binImg = new Mat();
                Cv2.Threshold(resized, binImg, 0, 255, ThresholdTypes.Binary | ThresholdTypes.Otsu);

                // 1. Try OpenCV QRCodeDetector on enhanced binary
                using var qr = new QRCodeDetector();
                string decoded = qr.DetectAndDecode(binImg, out Point2f[] _);
                if (!string.IsNullOrWhiteSpace(decoded))
                {
                    return JsonSerializer.Deserialize<QrMetadata>(decoded);
                }

                // Try on resized gray
                decoded = qr.DetectAndDecode(resized, out Point2f[] _);
                if (!string.IsNullOrWhiteSpace(decoded))
                {
                    return JsonSerializer.Deserialize<QrMetadata>(decoded);
                }

                // 2. Fallback to ZXing.Net on binImg
                byte[] rawBytes = new byte[binImg.Width * binImg.Height];
                System.Runtime.InteropServices.Marshal.Copy(binImg.Data, rawBytes, 0, rawBytes.Length);

                var reader = new BarcodeReaderGeneric
                {
                    AutoRotate = true,
                    Options = new DecodingOptions
                    {
                        PossibleFormats = new List<BarcodeFormat> { BarcodeFormat.QR_CODE },
                        TryHarder = true
                    }
                };

                var lumSource = new PlanarYUVLuminanceSource(rawBytes, binImg.Width, binImg.Height, 0, 0, binImg.Width, binImg.Height, false);
                var zResult = reader.Decode(lumSource);
                if (zResult != null && !string.IsNullOrWhiteSpace(zResult.Text))
                {
                    return JsonSerializer.Deserialize<QrMetadata>(zResult.Text);
                }
            }
            catch
            {
                // Silently ignore QR errors, user can select via dropdowns
            }

            return null;
        }
    }
}
