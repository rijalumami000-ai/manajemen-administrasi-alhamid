using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using AlHamidScanner.Models;

namespace AlHamidScanner.Services
{
    public class BulkSaveScoreItem
    {
        public int santri_id { get; set; }
        public int? nilai_angka { get; set; }
        public string? predikat { get; set; }
        public string? capaian { get; set; } = "Tam";
    }

    public class BulkSavePayload
    {
        public int tahun_ajaran_id { get; set; }
        public int kelas_id { get; set; }
        public int mata_pelajaran_id { get; set; }
        public int kategori_evaluasi_id { get; set; }
        public List<BulkSaveScoreItem> data { get; set; } = new();
    }

    public class ApiClient
    {
        private readonly HttpClient _http;
        private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

        public string BaseUrl { get; set; } = "https://alhamidcintamulya.my.id";
        public string AuthToken { get; set; } = string.Empty;

        public ApiClient()
        {
            _http = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(25)
            };
        }

        private HttpRequestMessage CreateRequest(HttpMethod method, string path)
        {
            var url = BaseUrl.TrimEnd('/') + (path.StartsWith('/') ? path : "/" + path);
            var req = new HttpRequestMessage(method, url);
            if (!string.IsNullOrWhiteSpace(AuthToken))
            {
                req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", AuthToken);
            }
            return req;
        }

        public async Task<List<TahunAjaran>> GetTahunAjaranListAsync()
        {
            try
            {
                using var req = CreateRequest(HttpMethod.Get, "/api/tahun-ajaran");
                using var res = await _http.SendAsync(req);
                res.EnsureSuccessStatusCode();
                var json = await res.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<List<TahunAjaran>>(json, JsonOpts) ?? new();
            }
            catch
            {
                return new();
            }
        }

        public async Task<List<Kelas>> GetKelasListAsync()
        {
            try
            {
                using var req = CreateRequest(HttpMethod.Get, "/api/kelas");
                using var res = await _http.SendAsync(req);
                res.EnsureSuccessStatusCode();
                var json = await res.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<List<Kelas>>(json, JsonOpts) ?? new();
            }
            catch
            {
                return new();
            }
        }

        public async Task<List<MataPelajaran>> GetMataPelajaranListAsync()
        {
            try
            {
                using var req = CreateRequest(HttpMethod.Get, "/api/mata-pelajaran");
                using var res = await _http.SendAsync(req);
                res.EnsureSuccessStatusCode();
                var json = await res.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<List<MataPelajaran>>(json, JsonOpts) ?? new();
            }
            catch
            {
                return new();
            }
        }

        public async Task<List<KategoriEvaluasi>> GetKategoriEvaluasiListAsync()
        {
            try
            {
                using var req = CreateRequest(HttpMethod.Get, "/api/kategori-nilai");
                using var res = await _http.SendAsync(req);
                res.EnsureSuccessStatusCode();
                var json = await res.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<List<KategoriEvaluasi>>(json, JsonOpts) ?? new();
            }
            catch
            {
                // Fallback to /api/nilai/kategori
                try
                {
                    using var req = CreateRequest(HttpMethod.Get, "/api/nilai/kategori");
                    using var res = await _http.SendAsync(req);
                    res.EnsureSuccessStatusCode();
                    var json = await res.Content.ReadAsStringAsync();
                    return JsonSerializer.Deserialize<List<KategoriEvaluasi>>(json, JsonOpts) ?? new();
                }
                catch
                {
                    return new();
                }
            }
        }

        public async Task<List<MapelTingkat>> GetMapelTingkatListAsync(int tahunAjaranId, int kategoriId)
        {
            try
            {
                using var req = CreateRequest(HttpMethod.Get, $"/api/nilai/mapel-tingkat?tahun_ajaran_id={tahunAjaranId}&kategori_evaluasi_id={kategoriId}");
                using var res = await _http.SendAsync(req);
                res.EnsureSuccessStatusCode();
                var json = await res.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<List<MapelTingkat>>(json, JsonOpts) ?? new();
            }
            catch
            {
                return new();
            }
        }

        public async Task<List<Santri>> GetSantriListAsync(int kelasId, int tahunAjaranId)
        {
            try
            {
                using var req = CreateRequest(HttpMethod.Get, $"/api/santri?kelas_id={kelasId}&tahun_ajaran_id={tahunAjaranId}");
                using var res = await _http.SendAsync(req);
                res.EnsureSuccessStatusCode();
                var json = await res.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<List<Santri>>(json, JsonOpts) ?? new();
            }
            catch
            {
                return new();
            }
        }

        public async Task<(bool Success, string Message)> SaveScoresBulkAsync(BulkSavePayload payload)
        {
            try
            {
                using var req = CreateRequest(HttpMethod.Post, "/api/nilai/santri/bulk");
                var jsonBody = JsonSerializer.Serialize(payload);
                req.Content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

                using var res = await _http.SendAsync(req);
                var resContent = await res.Content.ReadAsStringAsync();

                if (res.IsSuccessStatusCode)
                {
                    return (true, $"Alhamdulillah! Berhasil menyimpan {payload.data.Count} nilai santri ke database rapor.");
                }
                else
                {
                    return (false, $"Gagal menyimpan nilai ({res.StatusCode}): {resContent}");
                }
            }
            catch (Exception ex)
            {
                return (false, "Kesalahan koneksi ke server VPS: " + ex.Message);
            }
        }
    }
}
