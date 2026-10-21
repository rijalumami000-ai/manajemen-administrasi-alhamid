import React from 'react';
import { StrukturKepesantrenan } from './StrukturKepesantrenan';

export interface StrukturOrganisasiProps {
  defaultTab?: string;
}

export function StrukturOrganisasi({ defaultTab = 'madrasah_diniyah' }: StrukturOrganisasiProps) {
  return <StrukturKepesantrenan defaultTab={defaultTab} />;
}

export default StrukturOrganisasi;
