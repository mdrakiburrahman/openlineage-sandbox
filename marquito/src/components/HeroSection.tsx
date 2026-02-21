'use client';

import { useThemeContext } from './ThemeProvider';
import { ParsedLineage } from '@/lib/types';
import {
  Database20Regular,
  TaskListSquareLtr20Regular,
  Timeline20Regular,
  BranchFork20Regular,
} from '@fluentui/react-icons';

interface HeroSectionProps {
  data: ParsedLineage;
}

const HeroSection = ({ data }: HeroSectionProps) => {
  const { isDark } = useThemeContext();
  const { stats } = data;

  const statCards = [
    { label: 'Events', value: stats.totalEvents, icon: <Timeline20Regular />, color: '#0078D4' },
    { label: 'Jobs', value: stats.totalJobs, icon: <TaskListSquareLtr20Regular />, color: '#F2C811' },
    { label: 'Datasets', value: stats.totalDatasets, icon: <Database20Regular />, color: '#107C10' },
    { label: 'Column Lineage Edges', value: stats.columnLineageCount, icon: <BranchFork20Regular />, color: '#D83B01' },
  ];

  return (
    <section style={{ padding: '48px 24px 32px', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 600,
            color: isDark ? '#FAF9F8' : '#323130',
            fontFamily: "'Segoe UI', sans-serif",
            marginBottom: '8px',
          }}
        >
          OpenLineage Visualizer
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: isDark ? '#A19F9D' : '#605E5C',
            fontFamily: "'Segoe UI', sans-serif",
            maxWidth: '720px',
            lineHeight: '1.5',
          }}
        >
          Explore data lineage from a Spark ETL pipeline. This page parses{' '}
          <a
            href="https://openlineage.io"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#0078D4', textDecoration: 'none' }}
          >
            OpenLineage
          </a>{' '}
          events to visualize table-level and column-level lineage, jobs, datasets, and event history
          — all from a single JSON file.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              backgroundColor: isDark ? '#252423' : '#FFFFFF',
              border: `1px solid ${isDark ? '#323130' : '#EDEBE9'}`,
              borderRadius: '8px',
              padding: '20px',
              borderLeft: `3px solid ${card.color}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                color: isDark ? '#A19F9D' : '#605E5C',
                fontSize: '12px',
                fontFamily: "'Segoe UI', sans-serif",
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <span style={{ color: card.color }}>{card.icon}</span>
              {card.label}
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 600,
                color: isDark ? '#FAF9F8' : '#323130',
                fontFamily: "'Segoe UI', sans-serif",
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: '11px',
          color: isDark ? '#605E5C' : '#A19F9D',
          fontFamily: "'Segoe UI', sans-serif",
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#107C10',
          }}
        />
        Data loaded from Azure Blob Storage
      </div>
    </section>
  );
};

export default HeroSection;
