/**
 * BEM UNDIP Survey Analytics & Visualization Platform
 * Milestone 3: Theming & Visual Craftsmanship Studio
 * Feature 22 & 23: Apache ECharts Interactive Vector/Canvas Renderer
 */

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ColumnProfile } from '../../types/survey';
import { ThemeConfig, DimensionalityMode } from '../../types/theming';
import { generateEChartsOption } from '../../core/theming/echartsOptions';

export interface EChartsRendererProps {
  column: ColumnProfile;
  theme: ThemeConfig;
  dimensionality: DimensionalityMode;
  height?: number | string;
  className?: string;
  onChartReady?: (instance: echarts.ECharts) => void;
}

export const EChartsRenderer: React.FC<EChartsRendererProps> = ({
  column,
  theme,
  dimensionality,
  height = 360,
  className = '',
  onChartReady,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize ECharts with canvas renderer for high-DPI export compatibility
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(containerRef.current, undefined, {
        renderer: 'canvas',
      });
      if (onChartReady) {
        onChartReady(chartInstanceRef.current);
      }
    }

    const chart = chartInstanceRef.current;
    const option = generateEChartsOption(column, theme, dimensionality);

    // Set options with notMerge=true to cleanly switch chart types and dimensionality
    chart.setOption(option, true);

    // Setup ResizeObserver for responsive fluidity
    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [column, theme, dimensionality, onChartReady]);

  // Clean up instance on component unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full relative ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        minHeight: '280px',
      }}
    />
  );
};

export default EChartsRenderer;
