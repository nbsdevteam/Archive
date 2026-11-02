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
import type { AuditLogEntry } from "./types";
import { formatAuditTimestamp, groupLogsForTree, humanizeAction } from "./utils";
import "./activity.css";

export interface AuditLogsTreeViewTranslator {
  (key: string, options?: { defaultValue?: string; [key: string]: unknown }): string;
}

export interface AuditLogsTreeViewProps {
  logs: AuditLogEntry[];
  loading?: boolean;
  error?: string | null;
  t: AuditLogsTreeViewTranslator;
  groupBy: "document" | "action";
}

/** Single "label: value" row for timeline-style display. */
interface LabelValueRow {
  label: string;
  value: string;
}

interface ActivityFlowNodeData {
  kind: "group" | "log";
  title: string;
  /** Optional single label for group nodes (e.g. "Document", "Action"). */
  label?: string;
  /** For log nodes: full set of label+value rows (Action, User, Document, Timestamp) to match timeline. */
  rows?: LabelValueRow[];
  subtitle?: string;
  metadata?: string | null;
  count?: number;
  [key: string]: unknown;
}

/** Renders a tree node: group = one "label: value" + count; log = full label grid (Action, User, Document, Timestamp). */
const ActivityFlowNode = memo(({ data }: NodeProps) => {
  const nodeData = data as ActivityFlowNodeData;
  const isGroup = nodeData.kind === "group";
  const hasLabel = Boolean(nodeData.label);
  const hasRows = Array.isArray(nodeData.rows) && nodeData.rows.length > 0;

  return (
    <div className={`activity-flow-node ${isGroup ? "activity-flow-node-group" : "activity-flow-node-log"}`}>
      {hasRows ? (
        <div className="activity-timeline-label-grid">
          {nodeData.rows!.map((row, i) => (
            <div key={i} className="activity-flow-node-label-row">
              <span className="activity-timeline-label-key">{row.label}: </span>
              <span className="activity-timeline-label-value">{row.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="activity-flow-node-title">
            {hasLabel ? (
              <>
                <span className="activity-timeline-label-key">{nodeData.label}: </span>
                <span className="activity-timeline-label-value">{nodeData.title}</span>
              </>
            ) : (
              nodeData.title
            )}
          </div>
          {typeof nodeData.count === "number" && <div className="activity-flow-node-count">{nodeData.count} events</div>}
          {nodeData.subtitle && <div className="activity-flow-node-subtitle">{nodeData.subtitle}</div>}
        </>
      )}
      {nodeData.metadata && <div className="activity-flow-node-metadata">{nodeData.metadata}</div>}
    </div>
  );
});
ActivityFlowNode.displayName = "ActivityFlowNode";

const nodeTypes = { activityNode: ActivityFlowNode };

/** React Flow tree view for audit logs grouped by document or action. */
const AuditLogsTreeViewComponent = ({
  logs,
  loading = false,
  error = null,
  t,
  groupBy,
}: AuditLogsTreeViewProps) => {
  if (loading) return <div className="text-muted small">{t("common.loading", { defaultValue: "Loading..." })}</div>;
  if (error) return <div className="alert alert-danger mb-0">{error}</div>;
  if (logs.length === 0) return <p className="text-muted mb-0">{t("activity.noData", { defaultValue: "No activity found." })}</p>;

  const grouped = useMemo(() => groupLogsForTree(logs, groupBy), [logs, groupBy]);
  const keys = useMemo(() => Object.keys(grouped).sort((a, b) => a.localeCompare(b)), [grouped]);

  const flowData = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const groupX = 80;
    const logX = 460;
    /** Vertical gap between log cards; must fit card height (4 rows + optional metadata + padding) to avoid overlap. */
    const logVerticalSpacing = 180;
    const groupSectionGap = 80;
    let cursorY = 40;

    keys.forEach((key, groupIndex) => {
      const groupLogs = grouped[key] ?? [];
      const groupHeight = Math.max(groupLogs.length, 1) * logVerticalSpacing;
      const groupNodeY = cursorY + Math.max(groupHeight / 2 - 60, 0);
      const groupNodeId = `group-${groupIndex}`;

      const groupLabel =
        groupBy === "document"
          ? t("activity.columns.document", { defaultValue: "Document" })
          : t("activity.columns.action", { defaultValue: "Action" });
      nodes.push({
        id: groupNodeId,
        type: "activityNode",
        position: { x: groupX, y: groupNodeY },
        sourcePosition: Position.Right,
        draggable: false,
        selectable: false,
        data: { kind: "group", label: groupLabel, title: key, count: groupLogs.length } as ActivityFlowNodeData,
      });

      groupLogs.forEach((log, logIndex) => {
        const logNodeId = `log-${groupIndex}-${log.id}`;
        const actionLabel = t(`activity.actions.${log.action}`, { defaultValue: humanizeAction(String(log.action)) });
        const rows: LabelValueRow[] = [
          { label: t("activity.columns.action", { defaultValue: "Action" }), value: actionLabel },
          { label: t("activity.columns.user", { defaultValue: "User" }), value: log.user_name || "–" },
          {
            label: t("activity.columns.document", { defaultValue: "Document" }),
            value: log.document_title || `#${log.document_id ?? "N/A"}`,
          },
          {
            label: t("activity.columns.timestamp", { defaultValue: "Timestamp" }),
            value: formatAuditTimestamp(log.timestamp),
          },
        ];
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
            rows,
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
  }, [grouped, keys, groupBy, t]);

  return (
    <div className="activity-tree-flow-wrap">
      <ReactFlow
        nodes={flowData.nodes}
        edges={flowData.edges}
        nodeTypes={nodeTypes}
        fitView
        onlyRenderVisibleElements
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

const AuditLogsTreeView = memo(AuditLogsTreeViewComponent, arePropsEqual);
export default AuditLogsTreeView;
