'use client';

import { useEffect, useState } from 'react';
import { fetchLineageData } from '@/lib/parseLineage';
import { ParsedLineage } from '@/lib/types';
import HeroSection from '@/components/HeroSection';
import TableLineage from '@/components/TableLineage';
import ColumnLineage from '@/components/ColumnLineage';
import JobsTable from '@/components/JobsTable';
import DatasetsTable from '@/components/DatasetsTable';
import EventsTimeline from '@/components/EventsTimeline';
import { useThemeContext } from '@/components/ThemeProvider';

export default function Home() {
  const [data, setData] = useState<ParsedLineage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useThemeContext();

  useEffect(() => {
    fetchLineageData()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 96px)',
          fontFamily: "'Segoe UI', sans-serif",
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            border: `3px solid ${isDark ? '#323130' : '#EDEBE9'}`,
            borderTop: '3px solid #0078D4',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '14px', color: isDark ? '#A19F9D' : '#605E5C' }}>
          Loading OpenLineage data from Azure Blob Storage…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 96px)',
          fontFamily: "'Segoe UI', sans-serif",
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '16px', color: '#A4262C', fontWeight: 600 }}>Failed to load data</span>
        <span style={{ fontSize: '13px', color: isDark ? '#A19F9D' : '#605E5C' }}>{error}</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ paddingBottom: '32px' }}>
      <HeroSection data={data} />
      <TableLineage data={data} />
      <ColumnLineage data={data} />
      <JobsTable data={data} />
      <DatasetsTable data={data} />
      <EventsTimeline data={data} />
    </div>
  );
}
