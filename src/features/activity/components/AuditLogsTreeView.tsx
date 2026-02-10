import { memo, useMemo } from "react";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { AuditLogEntry } from "../types/auditLogs.types";
import { formatAuditTimestamp, groupLogsForTree, humanizeAction } from "../utils/activity.utils";

interface Translator {
  (key: string, options?: { defaultValue?: string; [key: string]: unknown }): string;
}

interface AuditLogsTreeViewProps {
  logs: AuditLogEntry[];
  loading?: boolean;
  error?: string | null;
  t: Translator;
  groupBy: "document" | "action";
}

interface ActivityFlowNodeData {
  kind: "group" | "log";
  title: string;
  subtitle?: string;
  metadata?: string | null;
  count?: number;
  [key: string]: unknown;
}

/**
 * Shared flow node renderer for both group and log nodes.
 */
const ActivityFlowNode = memo(({ data }: NodeProps) => {
  const nodeData = data as ActivityFlowNodeData;
  const isGroup = nodeData.kind === "group";
  return (
    <div className={`activity-flow-node ${isGroup ? "activity-flow-node-group" : "activity-flow-node-log"}`}>
      <div className="activity-flow-node-title">{nodeData.title}</div>
      {typeof nodeData.count === "number" && (
        <div className="activity-flow-node-count">{nodeData.count} events</div>
      )}
      {nodeData.subtitle && <div className="activity-flow-node-subtitle">{nodeData.subtitle}</div>}
      {nodeData.metadata && <div className="activity-flow-node-metadata">{nodeData.metadata}</div>}
    </div>
  );
});
ActivityFlowNode.displayName = "ActivityFlowNode";

const nodeTypes = { activityNode: ActivityFlowNode };

/**
 * React Flow renderer for grouped activity tree view.
 */
const AuditLogsTreeViewComponent = ({
  logs,
  loading = false,
  error = null,
  t,
  groupBy,
}: AuditLogsTreeViewProps) => {
  if (loading) {
    return <div className="text-muted small">{t("common.loading", { defaultValue: "Loading..." })}</div>;
  }

  if (error) {
    return <div className="alert alert-danger mb-0">{error}</div>;
  }

  if (logs.length === 0) {
    return <p className="text-muted mb-0">{t("activity.noData", { defaultValue: "No activity found." })}</p>;
  }

  const grouped = useMemo(() => groupLogsForTree(logs, groupBy), [logs, groupBy]);
  const keys = useMemo(
    () => Object.keys(grouped).sort((left, right) => left.localeCompare(right)),
    [grouped]
  );

  const flowData = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const groupX = 80;
    const logX = 460;
    const logVerticalSpacing = 120;
    const groupSectionGap = 80;
    let cursorY = 40;

    keys.forEach((key, groupIndex) => {
      const groupLogs = grouped[key] ?? [];
      const groupHeight = Math.max(groupLogs.length, 1) * logVerticalSpacing;
      const groupNodeY = cursorY + Math.max(groupHeight / 2 - 60, 0);
      const groupNodeId = `group-${groupIndex}`;

      nodes.push({
        id: groupNodeId,
        type: "activityNode",
        position: { x: groupX, y: groupNodeY },
        sourcePosition: Position.Right,
        draggable: false,
        selectable: false,
        data: {
          kind: "group",
          title: key,
          count: groupLogs.length,
        } as ActivityFlowNodeData,
      });

      groupLogs.forEach((log, logIndex) => {
        const logNodeId = `log-${groupIndex}-${log.id}`;
        const actionLabel = t(`activity.actions.${log.action}`, {
          defaultValue: humanizeAction(String(log.action)),
        });
        const subtitle = `${actionLabel} • ${log.user_name || "–"} • ${formatAuditTimestamp(log.timestamp)}`;

        nodes.push({
          id: logNodeId,
          type: "activityNode",
          position: { x: logX, y: cursorY + logIndex * logVerticalSpacing },
          targetPosition: Position.Left,
          draggable: false,
          selectable: false,
          data: {
            kind: "log",
            title: log.document_title || `#${log.document_id ?? "N/A"}`,
            subtitle,
            metadata: log.metadata,
          } as ActivityFlowNodeData,
        });

        edges.push({
          id: `edge-${groupNodeId}-${logNodeId}`,
          source: groupNodeId,
          target: logNodeId,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed },
          animated: false,
        });
      });

      cursorY += groupHeight + groupSectionGap;
    });

    return { nodes, edges };
  }, [grouped, keys, t]);

  return (
    <div className="activity-tree-flow-wrap">
      <ReactFlow
        nodes={flowData.nodes}
        edges={flowData.edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        className="activity-tree-flow"
      >
        <Background gap={16} size={1} />
        <MiniMap pannable zoomable />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

const arePropsEqual = (prev: AuditLogsTreeViewProps, next: AuditLogsTreeViewProps) =>
  prev.logs === next.logs &&
  prev.loading === next.loading &&
  prev.error === next.error &&
  prev.t === next.t &&
  prev.groupBy === next.groupBy;

export const AuditLogsTreeView = memo(AuditLogsTreeViewComponent, arePropsEqual);
