import React, { useMemo, useState, useRef, useEffect } from "react";

export interface ChartDataPoint {
  label: string;
  value: number;
}

interface ChartProps {
  data: ChartDataPoint[];
  type?: "line" | "area" | "bar";
  height?: number;
  color?: string;
  gridLines?: boolean;
  title?: string;
  subtitle?: string;
}

export const Chart: React.FC<ChartProps> = ({
  data,
  type = "area",
  height = 280,
  color = "#6366f1", // Indigo 500
  gridLines = true,
  title,
  subtitle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(500);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Update container width dynamically to ensure responsiveness
  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = (entries: ResizeObserverEntry[]) => {
      if (!entries || entries.length === 0) return;
      setContainerWidth(entries[0].contentRect.width);
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Constants for Chart Margins within the SVG viewBox
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const graphWidth = Math.max(containerWidth - margin.left - margin.right, 50);
  const graphHeight = Math.max(height - margin.top - margin.bottom, 50);

  // Computations for scales
  const { maxVal, minVal, yTicks } = useMemo(() => {
    if (data.length === 0) return { maxVal: 100, minVal: 0, yTicks: [0, 50, 100] };
    const values = data.map((d) => d.value);
    const max = Math.max(...values, 10); // default at least to 10
    const min = 0; // standard floor
    
    // Create 5 Y-Axis ticks
    const diff = max - min;
    const step = Math.ceil(diff / 4);
    const ticks = Array.from({ length: 5 }).map((_, i) => min + step * i);
    
    return { maxVal: min + step * 4, minVal: min, yTicks: ticks };
  }, [data]);

  // Map data to SVG coordinates
  const points = useMemo(() => {
    if (data.length === 0) return [];
    
    return data.map((d, index) => {
      // X-coord: spaced evenly
      const x = margin.left + (index / Math.max(data.length - 1, 1)) * graphWidth;
      // Y-coord: inverted (0 is at top)
      const ratio = maxVal === minVal ? 0.5 : (d.value - minVal) / (maxVal - minVal);
      const y = margin.top + graphHeight - ratio * graphHeight;
      return { x, y, value: d.value, label: d.label };
    });
  }, [data, maxVal, minVal, graphWidth, graphHeight, margin.left, margin.top]);

  // Generate SVG Path for Area / Line charts
  const pathD = useMemo(() => {
    if (points.length < 2) return "";
    
    // Draw straight line path or smooth bezier path
    return points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      
      // Control points for smooth bezier curve
      const prev = points[i - 1];
      const cpX1 = prev.x + (p.x - prev.x) / 3;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (2 * (p.x - prev.x)) / 3;
      const cpY2 = p.y;
      
      return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
    }, "");
  }, [points]);

  // Area path (closed loop at the bottom)
  const areaD = useMemo(() => {
    if (points.length < 2 || !pathD) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${pathD} L ${last.x} ${margin.top + graphHeight} L ${first.x} ${margin.top + graphHeight} Z`;
  }, [points, pathD, margin.top, graphHeight]);

  // Tooltip tracking handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (points.length === 0) return;
    
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    
    // Find closest index based on X coordinate
    let closestIndex = 0;
    let minDistance = Infinity;
    
    points.forEach((p, idx) => {
      const dist = Math.abs(p.x - mouseX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    const activePoint = points[closestIndex];
    setHoveredIndex(closestIndex);
    
    // Calculate global container coordinates for tooltip box
    setTooltipPos({
      x: activePoint.x,
      y: activePoint.y - 12
    });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div 
      ref={containerRef} 
      className="diws-card" 
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        width: "100%",
        padding: "1.5rem",
        position: "relative",
        userSelect: "none"
      }}
    >
      {/* Header Info */}
      {(title || subtitle) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {title && <h4 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>{title}</h4>}
          {subtitle && <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{subtitle}</span>}
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        width="100%"
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ overflow: "visible", cursor: "crosshair" }}
      >
        <defs>
          {/* Gradient for area fill */}
          <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
          {/* Subtle glow filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Y Axis Grid Lines & Labels */}
        {yTicks.map((tick, idx) => {
          const ratio = maxVal === minVal ? 0.5 : (tick - minVal) / (maxVal - minVal);
          const y = margin.top + graphHeight - ratio * graphHeight;

          return (
            <g key={`y-axis-${idx}`}>
              {gridLines && (
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + graphWidth}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              )}
              <text
                x={margin.left - 12}
                y={y + 4}
                textAnchor="end"
                fill="var(--text-muted)"
                fontSize={11}
              >
                {tick.toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {data.map((d, index) => {
          // Space out labels dynamically to avoid collision on small widths
          const skipFactor = Math.ceil(data.length / (containerWidth / 60));
          if (index % skipFactor !== 0 && index !== data.length - 1) return null;

          const x = margin.left + (index / Math.max(data.length - 1, 1)) * graphWidth;
          return (
            <text
              key={`x-axis-${index}`}
              x={x}
              y={margin.top + graphHeight + 20}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize={11}
            >
              {d.label}
            </text>
          );
        })}

        {/* Line / Area Chart Mode */}
        {points.length > 1 && (type === "line" || type === "area") && (
          <>
            {type === "area" && (
              <path
                d={areaD}
                fill="url(#chartAreaGradient)"
                style={{ transition: "d 0.3s ease-in-out" }}
              />
            )}
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: "d 0.3s ease-in-out" }}
            />
          </>
        )}

        {/* Bar Chart Mode */}
        {type === "bar" && (
          points.map((p, index) => {
            const barWidth = Math.max((graphWidth / points.length) * 0.7, 4);
            const barX = p.x - barWidth / 2;
            const barY = p.y;
            const barHeight = margin.top + graphHeight - p.y;
            const isHovered = hoveredIndex === index;

            return (
              <rect
                key={`bar-${index}`}
                x={barX}
                y={barY}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx={Math.min(barWidth / 3, 4)}
                fill={isHovered ? color : `${color}dd`}
                opacity={hoveredIndex === null || isHovered ? 1 : 0.65}
                style={{ transition: "all 0.2s" }}
              />
            );
          })
        )}

        {/* Active hovered point indicators */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <g>
            {/* Vertical Guide Line */}
            <line
              x1={points[hoveredIndex].x}
              y1={margin.top}
              x2={points[hoveredIndex].x}
              y2={margin.top + graphHeight}
              stroke={color}
              strokeWidth={1}
              strokeOpacity={0.4}
              strokeDasharray="2 2"
            />
            {/* Guide point circle */}
            <circle
              cx={points[hoveredIndex].x}
              cy={points[hoveredIndex].y}
              r={6}
              fill={color}
              stroke="var(--bg-color)"
              strokeWidth={2.5}
              style={{ filter: "url(#glow)" }}
            />
          </g>
        )}
      </svg>

      {/* Tooltip Overlay */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          style={{
            position: "absolute",
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: "translate(-50%, -100%)",
            backgroundColor: "rgba(2, 6, 23, 0.95)",
            border: `1px solid ${color}`,
            borderRadius: "6px",
            padding: "0.5rem 0.75rem",
            pointerEvents: "none",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            gap: "0.125rem",
            zIndex: 10,
            transition: "left 0.1s ease-out, top 0.1s ease-out",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {data[hoveredIndex].label}
          </span>
          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-main)", whiteSpace: "nowrap" }}>
            {data[hoveredIndex].value.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};
