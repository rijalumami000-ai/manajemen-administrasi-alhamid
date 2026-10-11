using System.Text.Json.Serialization;

namespace AlHamidScanner.Models
{
    public class TahunAjaran
    {
        public int Id { get; set; }
        public string Kode { get; set; } = string.Empty;
        public string? Nama { get; set; }
        public bool IsActive { get; set; }

        public override string ToString() => Kode;
    }

    public class Kelas
    {
        public int Id { get; set; }
        public string Nama { get; set; } = string.Empty;
        public string? Tingkat { get; set; }

        public override string ToString() => Nama;
    }

    public class MataPelajaran
    {
        public int Id { get; set; }
        public string Nama { get; set; } = string.Empty;
        public string? Kode { get; set; }

        public override string ToString() => Nama;
    }

    public class KategoriEvaluasi
    {
        public int Id { get; set; }
        public string Nama { get; set; } = string.Empty;

        public override string ToString() => Nama;
    }

    public class Santri
    {
        public int Id { get; set; }
        public string Nis { get; set; } = string.Empty;
        public string Nama { get; set; } = string.Empty;
    }

    public class StudentScoreItem
    {
        public int No { get; set; }
        public int SantriId { get; set; }
        public string Nis { get; set; } = string.Empty;
        public string Nama { get; set; } = string.Empty;
        public string Nilai { get; set; } = string.Empty;
        public bool IsFilled => !string.IsNullOrWhiteSpace(Nilai) && Nilai != "-";
    }

    public class QrMetadata
    {
        [JsonPropertyName("t")]
        public object? t_raw { get; set; }

        [JsonPropertyName("k")]
        public object? k_raw { get; set; }

        [JsonPropertyName("m")]
        public object? m_raw { get; set; }

        [JsonPropertyName("cat")]
        public object? cat_raw { get; set; }

        [JsonIgnore]
        public int? t => int.TryParse(t_raw?.ToString(), out int val) ? val : null;

        [JsonIgnore]
        public int? k => int.TryParse(k_raw?.ToString(), out int val) ? val : null;

        [JsonIgnore]
        public int? m => int.TryParse(m_raw?.ToString(), out int val) ? val : null;

        [JsonIgnore]
        public int? cat => int.TryParse(cat_raw?.ToString(), out int val) ? val : null;
    }
}
