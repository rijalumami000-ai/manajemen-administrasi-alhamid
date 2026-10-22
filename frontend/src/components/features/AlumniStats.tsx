import React from 'react';
import { GraduationCap, BookOpen, Award, UserX } from 'lucide-react';
import { AlumniItem } from '../../types/alumni';
import './AlumniStats.scss';

export interface AlumniStatsProps {
  alumni: AlumniItem[];
}

export function AlumniStats({ alumni }: AlumniStatsProps) {
  const totalDiniyah = alumni.filter(a => a.tipe === 'alumni').length;
  const totalMts = alumni.filter(a => a.tipe === 'lulus_mts').length;
  const totalAliyah = alumni.filter(a => a.tipe === 'lulus_aliyah').length;
  const totalPindah = alumni.filter(a => a.tipe === 'pindah').length;

  return (
    <div className="premium-alumni-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
      {/* Alumni Diniyah */}
      <div className="alumni-stat-card card-green">
        <div className="card-glow-effect"></div>
        <div className="stat-content">
          <span className="stat-label">Alumni Diniyah</span>
          <h2 className="stat-number">{totalDiniyah}</h2>
          <span className="stat-desc">Lulus Madrasah Diniyah</span>
        </div>
        <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
          <GraduationCap size={24} />
        </div>
      </div>

      {/* Lulus MTs */}
      <div className="alumni-stat-card card-blue">
        <div className="card-glow-effect"></div>
        <div className="stat-content">
          <span className="stat-label">Lulusan MTs</span>
          <h2 className="stat-number">{totalMts}</h2>
          <span className="stat-desc">Lulus Formal Kelas 3 MTs</span>
        </div>
        <div className="stat-icon-wrapper" style={{ background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7' }}>
          <BookOpen size={24} />
        </div>
      </div>

      {/* Lulus Aliyah */}
      <div className="alumni-stat-card card-gold">
        <div className="card-glow-effect"></div>
        <div className="stat-content">
          <span className="stat-label">Lulusan Aliyah</span>
          <h2 className="stat-number">{totalAliyah}</h2>
          <span className="stat-desc">Lulus Formal Kelas 3 Aliyah</span>
        </div>
        <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
          <Award size={24} />
        </div>
      </div>

      {/* Pindah / Mutasi */}
      <div className="alumni-stat-card card-orange">
        <div className="card-glow-effect"></div>
        <div className="stat-content">
          <span className="stat-label">Pindah / Mutasi</span>
          <h2 className="stat-number">{totalPindah}</h2>
          <span className="stat-desc">Mutasi / Pindah Keluar</span>
        </div>
        <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
          <UserX size={24} />
        </div>
      </div>
    </div>
  );
}

export default AlumniStats;
