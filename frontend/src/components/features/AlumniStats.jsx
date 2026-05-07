export function AlumniStats({ alumni }) {
  const totalAlumni = alumni.length;
  const latestYear = alumni.length > 0 ? Math.max(...alumni.map(a => a.tahun_lulus)) : '-';
  const workingAlumni = alumni.filter(a => a.pekerjaan).length;

  return (
    <div className="alumni-stats">
      <div className="stat-card-alumni">
        <h3>Total Alumni</h3>
        <p className="number">{totalAlumni}</p>
      </div>
      <div className="stat-card-alumni">
        <h3>Tahun Terbaru</h3>
        <p className="number">{latestYear}</p>
      </div>
      <div className="stat-card-alumni">
        <h3>Bekerja</h3>
        <p className="number">{workingAlumni}</p>
      </div>
    </div>
  );
}
