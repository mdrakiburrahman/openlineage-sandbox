'use client';

import React, { useRef, useState } from 'react';
import { useThemeContext } from './ThemeProvider';
import { validateJsonl, parseLineageText, fetchLineageData } from '@/lib/parseLineage';
import { ParsedLineage } from '@/lib/types';
import {
  DatabaseArrowDown20Regular,
  ArrowUpload20Regular,
  CheckmarkCircle20Filled,
  ErrorCircle20Filled,
  Info20Regular,
} from '@fluentui/react-icons';

interface DataSourcePickerProps {
  onDataLoaded: (data: ParsedLineage) => void;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
}

const BLOB_URL =
  'https://rakirahman.blob.core.windows.net/public/datasets/openlineage-from-spark-demo-customer.json';

const DataSourcePicker = ({ onDataLoaded, onError, onLoading }: DataSourcePickerProps) => {
  const { isDark } = useThemeContext();
  const [mode, setMode] = useState<'choose' | 'upload' | null>('choose');
  const [uploadStatus, setUploadStatus] = useState<{
    state: 'idle' | 'validating' | 'valid' | 'invalid';
    fileName?: string;
    eventCount?: number;
    errors?: string[];
  }>({ state: 'idle' });
  const [parsedFromUpload, setParsedFromUpload] = useState<ParsedLineage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUseDefault = async () => {
    setMode(null);
    onLoading(true);
    try {
      const data = await fetchLineageData();
      onDataLoaded(data);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to load default data');
    } finally {
      onLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus({ state: 'validating', fileName: file.name });
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const validation = validateJsonl(text);
      if (validation.valid) {
        try {
          const parsed = parseLineageText(text);
          setParsedFromUpload(parsed);
          setUploadStatus({
            state: 'valid',
            fileName: file.name,
            eventCount: validation.eventCount,
          });
        } catch (err: unknown) {
          setUploadStatus({
            state: 'invalid',
            fileName: file.name,
            errors: [err instanceof Error ? err.message : 'Failed to parse lineage data'],
          });
        }
      } else {
        setUploadStatus({
          state: 'invalid',
          fileName: file.name,
          errors: validation.errors,
        });
      }
    };
    reader.onerror = () => {
      setUploadStatus({ state: 'invalid', fileName: file.name, errors: ['Failed to read file.'] });
    };
    reader.readAsText(file);
  };

  const handleUseUploaded = () => {
    if (parsedFromUpload) {
      setMode(null);
      onDataLoaded(parsedFromUpload);
    }
  };

  const cardBase: React.CSSProperties = {
    backgroundColor: isDark ? '#252423' : '#FFFFFF',
    border: `1px solid ${isDark ? '#323130' : '#EDEBE9'}`,
    borderRadius: '8px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: "'Segoe UI', sans-serif",
  };

  const cardHover = (e: React.MouseEvent, enter: boolean) => {
    const el = e.currentTarget as HTMLElement;
    if (enter) {
      el.style.borderColor = '#0078D4';
      el.style.boxShadow = isDark
        ? '0 0 0 1px #0078D4'
        : '0 0 0 1px #0078D4';
    } else {
      el.style.borderColor = isDark ? '#323130' : '#EDEBE9';
      el.style.boxShadow = 'none';
    }
  };

  if (mode === 'choose') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 96px)',
          padding: '48px 24px',
          fontFamily: "'Segoe UI', sans-serif",
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 600,
            color: isDark ? '#FAF9F8' : '#323130',
            marginBottom: '8px',
          }}
        >
          OpenLineage Visualizer
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: isDark ? '#A19F9D' : '#605E5C',
            marginBottom: '32px',
            textAlign: 'center',
            maxWidth: '500px',
            lineHeight: '1.5',
          }}
        >
          Choose a data source to get started. Load the built-in demo dataset or upload your own
          OpenLineage JSONL file.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            maxWidth: '640px',
            width: '100%',
          }}
        >
          {/* Default dataset card */}
          <div
            style={cardBase}
            onClick={handleUseDefault}
            onMouseEnter={(e) => cardHover(e, true)}
            onMouseLeave={(e) => cardHover(e, false)}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? 'rgba(0,120,212,0.15)' : 'rgba(0,120,212,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DatabaseArrowDown20Regular style={{ color: '#0078D4' }} />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 600, color: isDark ? '#FAF9F8' : '#323130' }}>
                Use Demo Dataset
              </span>
            </div>
            <p style={{ fontSize: '13px', color: isDark ? '#A19F9D' : '#605E5C', lineHeight: '1.5', margin: 0 }}>
              Load the built-in Spark ETL pipeline dataset with 4 CSV sources, transformation jobs,
              and column-level lineage.
            </p>
          </div>

          {/* Upload custom card */}
          <div
            style={cardBase}
            onClick={() => setMode('upload')}
            onMouseEnter={(e) => cardHover(e, true)}
            onMouseLeave={(e) => cardHover(e, false)}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? 'rgba(242,200,17,0.15)' : 'rgba(242,200,17,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowUpload20Regular style={{ color: '#F2C811' }} />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 600, color: isDark ? '#FAF9F8' : '#323130' }}>
                Upload Custom JSONL
              </span>
            </div>
            <p style={{ fontSize: '13px', color: isDark ? '#A19F9D' : '#605E5C', lineHeight: '1.5', margin: 0 }}>
              Upload your own OpenLineage JSONL file from your local filesystem. The file is parsed
              entirely in your browser.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'upload') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 96px)',
          padding: '48px 24px',
          fontFamily: "'Segoe UI', sans-serif",
        }}
      >
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: isDark ? '#FAF9F8' : '#323130',
            marginBottom: '8px',
          }}
        >
          Upload OpenLineage JSONL
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: isDark ? '#A19F9D' : '#605E5C',
            marginBottom: '24px',
            textAlign: 'center',
            maxWidth: '520px',
            lineHeight: '1.5',
          }}
        >
          Upload a file where each line is a valid OpenLineage JSON event. The file must contain{' '}
          <code style={{ fontSize: '12px', backgroundColor: isDark ? '#323130' : '#F3F2F1', padding: '1px 4px', borderRadius: '3px' }}>
            eventType
          </code>
          ,{' '}
          <code style={{ fontSize: '12px', backgroundColor: isDark ? '#323130' : '#F3F2F1', padding: '1px 4px', borderRadius: '3px' }}>
            job
          </code>
          , and{' '}
          <code style={{ fontSize: '12px', backgroundColor: isDark ? '#323130' : '#F3F2F1', padding: '1px 4px', borderRadius: '3px' }}>
            run
          </code>{' '}
          fields per line.
        </p>

        {/* Example steps */}
        <div
          style={{
            backgroundColor: isDark ? '#252423' : '#FFFFFF',
            border: `1px solid ${isDark ? '#323130' : '#EDEBE9'}`,
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '520px',
            width: '100%',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
              color: isDark ? '#A19F9D' : '#605E5C',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            <Info20Regular style={{ color: '#0078D4' }} />
            Need an example file?
          </div>
          <ol
            style={{
              fontSize: '13px',
              color: isDark ? '#D2D0CE' : '#323130',
              lineHeight: '1.8',
              paddingLeft: '20px',
              margin: 0,
            }}
          >
            <li>
              Download the sample JSONL from{' '}
              <a
                href={BLOB_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#0078D4', textDecoration: 'none', wordBreak: 'break-all' }}
              >
                Azure Blob Storage ↗
              </a>
            </li>
            <li>Save the file to your local filesystem</li>
            <li>Upload it below using the file picker</li>
          </ol>
        </div>

        {/* Upload area */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.jsonl,.txt"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files?.[0];
            if (file && fileInputRef.current) {
              const dt = new DataTransfer();
              dt.items.add(file);
              fileInputRef.current.files = dt.files;
              fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }}
          style={{
            maxWidth: '520px',
            width: '100%',
            padding: '32px',
            border: `2px dashed ${isDark ? '#484644' : '#C8C6C4'}`,
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDark ? '#201F1E' : '#FAF9F8',
            transition: 'border-color 0.15s',
            marginBottom: '16px',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#0078D4';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = isDark ? '#484644' : '#C8C6C4';
          }}
        >
          <ArrowUpload20Regular
            style={{ color: isDark ? '#A19F9D' : '#605E5C', marginBottom: '8px', width: '28px', height: '28px' }}
          />
          <div style={{ fontSize: '14px', color: isDark ? '#D2D0CE' : '#323130', fontWeight: 500 }}>
            Click to browse or drag & drop
          </div>
          <div style={{ fontSize: '12px', color: isDark ? '#605E5C' : '#A19F9D', marginTop: '4px' }}>
            .json, .jsonl, or .txt files
          </div>
        </div>

        {/* Validation status */}
        {uploadStatus.state === 'validating' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#A19F9D' : '#605E5C', fontSize: '13px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                border: `2px solid ${isDark ? '#323130' : '#EDEBE9'}`,
                borderTop: '2px solid #0078D4',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Validating {uploadStatus.fileName}…
          </div>
        )}

        {uploadStatus.state === 'valid' && (
          <div style={{ maxWidth: '520px', width: '100%' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#107C10',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '12px',
              }}
            >
              <CheckmarkCircle20Filled />
              {uploadStatus.fileName} — {uploadStatus.eventCount} valid events
            </div>
            <button
              onClick={handleUseUploaded}
              style={{
                width: '100%',
                padding: '10px 20px',
                backgroundColor: '#0078D4',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: "'Segoe UI', sans-serif",
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#106EBE';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#0078D4';
              }}
            >
              Visualize Lineage
            </button>
          </div>
        )}

        {uploadStatus.state === 'invalid' && (
          <div style={{ maxWidth: '520px', width: '100%' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#A4262C',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '8px',
              }}
            >
              <ErrorCircle20Filled />
              Validation failed for {uploadStatus.fileName}
            </div>
            <div
              style={{
                backgroundColor: isDark ? 'rgba(164,38,44,0.1)' : 'rgba(164,38,44,0.06)',
                border: `1px solid ${isDark ? '#5C2020' : '#FDE7E9'}`,
                borderRadius: '6px',
                padding: '12px',
              }}
            >
              {uploadStatus.errors?.map((err, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '12px',
                    color: isDark ? '#FF6B6B' : '#A4262C',
                    fontFamily: 'monospace',
                    padding: '2px 0',
                  }}
                >
                  {err}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => { setMode('choose'); setUploadStatus({ state: 'idle' }); setParsedFromUpload(null); }}
          style={{
            marginTop: '24px',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: isDark ? '#A19F9D' : '#605E5C',
            border: `1px solid ${isDark ? '#484644' : '#EDEBE9'}`,
            borderRadius: '6px',
            fontSize: '13px',
            fontFamily: "'Segoe UI', sans-serif",
            cursor: 'pointer',
          }}
        >
          ← Back to options
        </button>
      </div>
    );
  }

  return null;
};

export default DataSourcePicker;
