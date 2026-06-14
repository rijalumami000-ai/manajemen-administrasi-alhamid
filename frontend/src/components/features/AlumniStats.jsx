import { GraduationCap, Calendar, Briefcase } from 'lucide-react';
import './AlumniStats.scss';

export function AlumniStats({ alumni }) {
  const totalAlumni = alumni.length;
  const latestYear = alumni.length > 0 ? Math.max(...alumni.map(a => a.tahun_lulus)) : '-';
  const workingAlumni = alumni.filter(a => a.pekerjaan).length;

  return (
    <div className="premium-alumni-stats">
      {/* Total Alumni Card */}
      <div className="alumni-stat-card card-gold">
        <div className="card-glow-effect"></div>
        <div className="stat-content">
          <span className="stat-label">Total Alumni</span>
          <h2 className="stat-number">{totalAlumni}</h2>
          <span className="stat-desc">Santri Lulusan Terdata</span>
        </div>
        <div className="stat-icon-wrapper">
          <GraduationCap size={24} />
        </div>
      </div>

      {/* Tahun Terbaru Card */}
      <div className="alumni-stat-card card-blue">
        <div className="card-glow-effect"></div>
        <div className="stat-content">
          <span className="stat-label">Kelulusan Terbaru</span>
          <h2 className="stat-number">{latestYear}</h2>
          <span className="stat-desc">Tahun Ajaran Terakhir</span>
        </div>
        <div className="stat-icon-wrapper">
          <Calendar size={24} />
        </div>
      </div>

      {/* Bekerja Card */}
      <div className="alumni-stat-card card-green">
        <div className="card-glow-effect"></div>
        <div className="stat-content">
          <span className="stat-label">Terserap Kerja</span>
          <h2 className="stat-number">{workingAlumni}</h2>
          <span className="stat-desc">Alumni Berkarir / Bekerja</span>
        </div>
        <div className="stat-icon-wrapper">
          <Briefcase size={24} />
        </div>
      </div>
    </div>
  );
}
