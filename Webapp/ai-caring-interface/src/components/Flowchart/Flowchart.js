import React from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

// Custom Node Types
const StartNode = ({ data }) => (
  <div style={{ padding: 10, border: "2px solid #4caf50", borderRadius: 5, background: "#e8f5e9" }}>
    <strong>{data.label}</strong>
  </div>
);

const SensorNode = ({ data }) => (
  <div style={{ padding: 10, border: "2px solid #1976d2", borderRadius: 5, background: "#e3f2fd" }}>
    <strong>Sensor:</strong>
    <p>{data.label}</p>
  </div>
);

const ActivityNode = ({ data }) => (
  <div style={{ padding: 10, border: "2px solid #ff9800", borderRadius: 5, background: "#fff3e0" }}>
    <strong>Activity:</strong>
    <p>{data.label}</p>
  </div>
);

const EndNode = ({ data }) => (
  <div style={{ padding: 10, border: "2px solid #f44336", borderRadius: 5, background: "#ffebee" }}>
    <strong>{data.label}</strong>
  </div>
);

// Node Types Mapping
const nodeTypes = {
  start: StartNode,
  sensor: SensorNode,
  activity: ActivityNode,
  end: EndNode,
};

const Flowchart = ({ nodes = [], edges = [] }) => {
  if (nodes.length === 0) {
    return <div style={{ textAlign: "center", padding: "20px" }}>No data to display</div>;
  }

  return (
    <div style={{ width: "100%", height: "60vh", border: "1px solid #ddd", borderRadius: "8px" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges.map((edge) => ({
          ...edge,
          markerEnd: "url(#custom-arrow)", // Reference to custom marker
          style: { stroke: "#1976d2", strokeWidth: 2 },
        }))}
        nodeTypes={nodeTypes}
        fitView
        defaultZoom={1.2}
        snapToGrid
        proOptions={{ hideAttribution: true }}
      >
        <svg>
          <defs>
            <marker
              id="custom-arrow"
              markerWidth="10"
              markerHeight="10"
              refX="10"
              refY="5"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 Z" fill="#1976d2" />
            </marker>
          </defs>
        </svg>

        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.type === "start") return "#4caf50";
            if (n.type === "sensor") return "#1976d2";
            if (n.type === "activity") return "#ff9800";
            if (n.type === "end") return "#f44336";
            return "#999";
          }}
          nodeColor={(n) => {
            if (n.type === "start") return "#e8f5e9";
            if (n.type === "sensor") return "#e3f2fd";
            if (n.type === "activity") return "#fff3e0";
            if (n.type === "end") return "#ffebee";
            return "#eee";
          }}
          nodeBorderRadius={2}
        />
        <Controls />
        <Background color="#f0f0f0" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default Flowchart;
