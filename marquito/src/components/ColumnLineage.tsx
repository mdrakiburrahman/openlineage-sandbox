'use client';

import React, { useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  Position,
  MarkerType,
  Handle,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { useThemeContext } from './ThemeProvider';
import { ParsedLineage, ColumnLineageEdge, ParsedDataset } from '@/lib/types';

interface ColumnLineageProps {
  data: ParsedLineage;
}

// Custom node: a dataset "card" with columns listed inside
function ColumnDatasetNode({ data }: NodeProps) {
  const nodeData = data as {
    label: string;
    columns: string[];
    highlightedColumns: string[];
    isDark: boolean;
    accentColor: string;
  };
  const { isDark } = nodeData;

  return (
    <div
      style={{
        backgroundColor: isDark ? '#252423' : '#FFFFFF',
        border: `1px solid ${isDark ? '#484644' : '#EDEBE9'}`,
        borderLeft: `3px solid ${nodeData.accentColor}`,
        borderRadius: '6px',
        minWidth: '200px',
        fontFamily: "'Segoe UI', sans-serif",
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${isDark ? '#323130' : '#EDEBE9'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill={nodeData.accentColor}>
          <path d="M8 1C4.5 1 2 2.1 2 3.5v9C2 13.9 4.5 15 8 15s6-1.1 6-2.5v-9C14 2.1 11.5 1 8 1zm0 1.5c3 0 4.5.8 4.5 1S11 4.5 8 4.5 3.5 3.7 3.5 3.5 5 2.5 8 2.5z" />
        </svg>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: isDark ? '#FAF9F8' : '#323130',
          }}
          title={nodeData.label}
        >
          {nodeData.label}
        </span>
      </div>
      <div style={{ padding: '4px 0' }}>
        {nodeData.columns.map((col) => {
          const isHighlighted = nodeData.highlightedColumns.includes(col);
          return (
            <div
              key={col}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 12px',
                fontSize: '11px',
                fontFamily: "monospace, 'Segoe UI'",
                color: isHighlighted
                  ? isDark
                    ? '#FAF9F8'
                    : '#323130'
                  : isDark
                    ? '#A19F9D'
                    : '#605E5C',
                backgroundColor: isHighlighted
                  ? isDark
                    ? 'rgba(0,120,212,0.15)'
                    : 'rgba(0,120,212,0.08)'
                  : 'transparent',
                position: 'relative',
              }}
            >
              <Handle
                type="target"
                position={Position.Left}
                id={`${nodeData.label}::${col}::target`}
                style={{
                  background: isHighlighted ? '#0078D4' : isDark ? '#484644' : '#C8C6C4',
                  border: 'none',
                  width: 6,
                  height: 6,
                  left: -3,
                }}
              />
              <span style={{ marginLeft: '4px' }}>{col}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={`${nodeData.label}::${col}::source`}
                style={{
                  background: isHighlighted ? '#0078D4' : isDark ? '#484644' : '#C8C6C4',
                  border: 'none',
                  width: 6,
                  height: 6,
                  right: -3,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

const nodeTypes = { columnDataset: ColumnDatasetNode };

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 200 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 220, height: (node.data.columns as string[]).length * 24 + 50 });
  });
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });
  dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const pos = g.node(node.id);
      return { ...node, position: { x: pos.x - 110, y: pos.y - ((node.data.columns as string[]).length * 24 + 50) / 2 } };
    }),
    edges,
  };
}

const ColumnLineage = ({ data }: ColumnLineageProps) => {
  const { isDark } = useThemeContext();
  const [hoveredField, setHoveredField] = useState<string | null>(null);

  // Build the column lineage graph
  const { initialNodes, initialEdges, connectedFields } = useMemo(() => {
    // Collect datasets that participate in column lineage
    const dsInLineage = new Set<string>();
    for (const edge of data.columnLineageEdges) {
      dsInLineage.add(edge.sourceDataset);
      dsInLineage.add(edge.targetDataset);
    }

    // Gather datasets with their columns
    const dsColumnsMap = new Map<string, { ds: ParsedDataset; columns: Set<string> }>();

    for (const ds of data.datasets) {
      const key = `${ds.namespace}::${ds.name}`;
      if (!dsInLineage.has(key)) continue;
      if (!dsColumnsMap.has(key)) {
        dsColumnsMap.set(key, { ds, columns: new Set(ds.schema.map((f) => f.name)) });
      }
    }

    // Ensure all columns from lineage edges are included
    for (const edge of data.columnLineageEdges) {
      const srcEntry = dsColumnsMap.get(edge.sourceDataset);
      if (srcEntry) srcEntry.columns.add(edge.sourceField);
      const tgtEntry = dsColumnsMap.get(edge.targetDataset);
      if (tgtEntry) tgtEntry.columns.add(edge.targetField);
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    for (const [key, { ds, columns }] of dsColumnsMap) {
      const colArr = Array.from(columns);
      const roleColors: Record<string, string> = {
        source: '#0078D4',
        intermediate: '#F2C811',
        target: '#107C10',
      };

      nodes.push({
        id: key,
        type: 'columnDataset',
        position: { x: 0, y: 0 },
        data: {
          label: ds.shortName,
          columns: colArr,
          highlightedColumns: [] as string[],
          isDark,
          accentColor: roleColors[ds.role] || '#0078D4',
        },
      });
    }

    // Build column-level edges
    for (const clEdge of data.columnLineageEdges) {
      const edgeId = `${clEdge.sourceDataset}::${clEdge.sourceField}->${clEdge.targetDataset}::${clEdge.targetField}`;
      edges.push({
        id: edgeId,
        source: clEdge.sourceDataset,
        sourceHandle: `${dsColumnsMap.get(clEdge.sourceDataset)?.ds.shortName}::${clEdge.sourceField}::source`,
        target: clEdge.targetDataset,
        targetHandle: `${dsColumnsMap.get(clEdge.targetDataset)?.ds.shortName}::${clEdge.targetField}::target`,
        animated: false,
        style: { stroke: isDark ? '#484644' : '#C8C6C4', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: isDark ? '#484644' : '#C8C6C4', width: 10, height: 10 },
        label: clEdge.transformationSubtype !== 'UNKNOWN' ? clEdge.transformationSubtype : undefined,
        labelStyle: { fontSize: 9, fill: isDark ? '#A19F9D' : '#605E5C', fontFamily: "'Segoe UI', sans-serif" },
        labelBgStyle: { fill: isDark ? '#201F1E' : '#FAF9F8', fillOpacity: 0.9 },
      });
    }

    // Determine connected fields (for highlighting)
    const connected = new Set<string>();
    for (const edge of data.columnLineageEdges) {
      connected.add(`${edge.sourceDataset}::${edge.sourceField}`);
      connected.add(`${edge.targetDataset}::${edge.targetField}`);
    }

    return { initialNodes: nodes, initialEdges: edges, connectedFields: connected };
  }, [data, isDark]);

  // Update highlighted columns
  const nodesWithHighlights = useMemo(() => {
    return initialNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        highlightedColumns: (node.data.columns as string[]).filter((col: string) =>
          connectedFields.has(`${node.id}::${col}`)
        ),
      },
    }));
  }, [initialNodes, connectedFields]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(nodesWithHighlights, initialEdges),
    [nodesWithHighlights, initialEdges]
  );

  return (
    <section style={{ padding: '0 24px 32px', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: isDark ? '#FAF9F8' : '#323130',
              fontFamily: "'Segoe UI', sans-serif",
            }}
          >
            Column-Level Lineage
          </h2>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#FFFFFF',
              backgroundColor: '#D83B01',
              padding: '2px 8px',
              borderRadius: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Featured
          </span>
        </div>
        <p style={{ fontSize: '13px', color: isDark ? '#A19F9D' : '#605E5C', fontFamily: "'Segoe UI', sans-serif", maxWidth: '720px', lineHeight: '1.5' }}>
          Track individual columns as they flow through transformations across datasets. Each edge
          represents a column-to-column data flow with its transformation type (e.g., IDENTITY,
          INDIRECT). Highlighted columns participate in the lineage graph.
        </p>
      </div>
      <div
        style={{
          height: '600px',
          backgroundColor: isDark ? '#201F1E' : '#FAF9F8',
          border: `1px solid ${isDark ? '#323130' : '#EDEBE9'}`,
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <ReactFlow
          nodes={layoutedNodes}
          edges={layoutedEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color={isDark ? '#323130' : '#EDEBE9'} gap={20} size={1} />
          <Controls
            showInteractive={false}
            style={{
              backgroundColor: isDark ? '#252423' : '#FFFFFF',
              border: `1px solid ${isDark ? '#484644' : '#EDEBE9'}`,
              borderRadius: '4px',
            }}
          />
        </ReactFlow>
      </div>
    </section>
  );
};

export default ColumnLineage;
