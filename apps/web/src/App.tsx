import { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useOrgStore } from './store/orgStore.js';
import { layoutOrgChart } from './layout/elkLayout.js';
import { OrgUnitNode } from './components/OrgUnitNode.js';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { DetailPanel } from './components/DetailPanel.js';
import { CompareModal } from './components/CompareModal.js';
import { PrintModal } from './components/PrintModal.js';
import { RefreshCw } from 'lucide-react';

const nodeTypes = {
  orgUnitNode: OrgUnitNode
};

function OrgFlowCanvas() {
  const {
    orgUnits,
    positions,
    assignments,
    employees,
    initializeCurrentOrganization,
    undo,
    redo,
    selectedOrgCode,
    activeCompareVersion,
    compareReport
  } = useOrgStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isLayouting, setIsLayouting] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const { fitView, setCenter, getNodes } = useReactFlow();

  // 1. Initial Load Current Organization from API / Baseline
  useEffect(() => {
    initializeCurrentOrganization();
  }, [initializeCurrentOrganization]);

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

  // 3. Search -> Focus Canvas Animation Handler
  const handleFocusNode = useCallback((orgCode: string) => {
    const currentNodes = getNodes();
    const targetNode = currentNodes.find(n => n.id === orgCode);
    if (targetNode) {
      const x = targetNode.position.x + (targetNode.style?.width ? Number(targetNode.style.width) / 2 : 180);
      const y = targetNode.position.y + 100;
      setCenter(x, y, { zoom: 1.0, duration: 600 });
    }
  }, [getNodes, setCenter]);

  const handleFitOverview = useCallback(() => {
    fitView({ padding: 0.15, duration: 500 });
  }, [fitView]);

  const handleFocusSelected = useCallback(() => {
    if (selectedOrgCode) {
      handleFocusNode(selectedOrgCode);
    }
  }, [selectedOrgCode, handleFocusNode]);

  // 4. Global Keyboard Shortcuts (Undo/Redo)
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
    <div className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden text-slate-800">
      {/* Light Clean Header */}
      <Header
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenPrint={() => setIsPrintOpen(true)}
        onFitOverview={handleFitOverview}
        onFocusSelected={handleFocusSelected}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Collapsible Left Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onFocusNode={handleFocusNode}
        />

        {/* Center Canvas */}
        <main className="flex-1 relative bg-slate-50/80">
          {isLayouting && (
            <div className="absolute top-4 left-4 z-20 px-3.5 py-2 bg-white/95 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl flex items-center gap-2 shadow-md backdrop-blur-xs">
              <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>Organizing Hierarchy Layout...</span>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            minZoom={0.15}
            maxZoom={2.0}
            defaultViewport={{ x: 100, y: 40, zoom: 0.75 }}
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#cbd5e1" />
            <Controls className="!bg-white !border-slate-200 !text-slate-700 !shadow-sm [&>button]:!border-slate-100 [&>button]:!bg-white [&>button:hover]:!bg-slate-50" />
            <MiniMap
              className="!bg-white/95 !border !border-slate-200 !rounded-2xl !overflow-hidden shadow-md"
              nodeColor={() => '#10b981'}
              maskColor="rgba(241, 245, 249, 0.7)"
            />
          </ReactFlow>
        </main>

        {/* Right Detail Inspector Panel */}
        <DetailPanel onFocusNode={handleFocusNode} />
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

export function App() {
  return (
    <ReactFlowProvider>
      <OrgFlowCanvas />
    </ReactFlowProvider>
  );
}