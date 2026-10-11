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
        public int? t { get; set; } // Tahun Ajaran ID
        public int? k { get; set; } // Kelas ID
        public int? m { get; set; } // Mapel ID
        public int? cat { get; set; } // Kategori ID
    }
}
