import { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useOrgStore } from './store/orgStore.js';
import { layoutOrgChart } from './layout/elkLayout.js';
import { OrgUnitNode } from './components/OrgUnitNode.js';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { CompareModal } from './components/CompareModal.js';
import { PrintModal } from './components/PrintModal.js';
import { RefreshCw } from 'lucide-react';

const nodeTypes = {
  orgUnitNode: OrgUnitNode
};

export function App() {
  const {
    orgUnits,
    positions,
    assignments,
    employees,
    initializeBaseline,
    undo,
    redo,
    activeCompareVersion,
    compareReport
  } = useOrgStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isLayouting, setIsLayouting] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // 1. Initial Load Baseline
  useEffect(() => {
    initializeBaseline();
  }, [initializeBaseline]);

  // 2. Compute ELK Layout whenever data changes
  const applyLayout = useCallback(async () => {
    if (orgUnits.length === 0) return;
    setIsLayouting(true);
    try {
      const layouted = await layoutOrgChart(orgUnits, positions, assignments, employees);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
    } catch (err) {
      console.error('[App] ELK Layout failed', err);
    } finally {
      setIsLayouting(false);
    }
  }, [orgUnits, positions, assignments, employees, setNodes, setEdges]);

  useEffect(() => {
    applyLayout();
  }, [applyLayout]);

  // 3. Global Keyboard Shortcuts (Undo/Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* Header Bar */}
      <Header
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenPrint={() => setIsPrintOpen(true)}
      />

      {/* Main Workspace: Sidebar + Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar />

        {/* Center Canvas */}
        <main className="flex-1 relative bg-slate-950">
          {isLayouting && (
            <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-slate-900/90 border border-slate-700 text-xs font-semibold text-emerald-400 rounded-lg flex items-center gap-2 shadow-xl backdrop-blur-md">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Recalculating ELK Hierarchy Layout...
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            minZoom={0.2}
            maxZoom={2.0}
            defaultViewport={{ x: 150, y: 50, zoom: 0.7 }}
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#334155" />
            <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300 [&>button]:!border-slate-800 [&>button]:!bg-slate-900 [&>button:hover]:!bg-slate-800" />
            <MiniMap
              className="!bg-slate-900 !border !border-slate-800 !rounded-xl !overflow-hidden shadow-2xl"
              nodeColor={() => '#10b981'}
              maskColor="rgba(15, 23, 42, 0.7)"
            />
          </ReactFlow>
        </main>
      </div>

      {/* Modals */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        baseVersionName={activeCompareVersion || 'Baseline'}
        targetVersionName="Current Working Draft"
        diff={compareReport}
      />

      <PrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
      />
    </div>
  );
}
