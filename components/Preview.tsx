"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import mermaid from "mermaid";
import html2canvas from "html2canvas";
import { DiagramType } from "../types";
import { useTheme } from "./ThemeProvider";
import { DiagramParser } from "../utils/diagramParser";

interface PreviewProps {
  text: string;
  onExportPNG: () => void;
  onExportSVG: () => void;
}

// Function to fix text truncation issues in SVG
const fixTextTruncation = (svg: SVGElement) => {
  try {
    // Get current viewBox or calculate from content
    let viewBox = svg.getAttribute('viewBox');
    if (!viewBox) {
      const bbox = svg.getBBox();
      viewBox = `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`;
    }
    
    // Parse viewBox values
    const [x, y, width, height] = viewBox.split(' ').map(Number);
    
    // Add generous padding to prevent any cutoff
    const padding = 60;
    const newViewBox = `${x - padding} ${y - padding} ${width + padding * 2} ${height + padding * 2}`;
    
    // Update SVG attributes for better display
    svg.setAttribute('viewBox', newViewBox);
    svg.style.overflow = 'visible';
    
    // Fix subgraph styling if present
    const subgraphs = svg.querySelectorAll('.cluster');
    subgraphs.forEach((subgraph) => {
      const rect = subgraph.querySelector('rect');
      if (rect) {
        rect.setAttribute('fill', 'transparent');
        rect.setAttribute('stroke', 'var(--panel-border)');
        rect.setAttribute('stroke-width', '1');
      }
    });
    
    // Ensure all text elements are properly sized and positioned
    const textElements = svg.querySelectorAll('text, .nodeLabel, .edgeLabel');
    textElements.forEach((textEl) => {
      const element = textEl as SVGTextElement;
      element.style.fontSize = '14px';
      element.style.fontFamily = 'ui-monospace, monospace';
      element.setAttribute('dominant-baseline', 'middle');
      
      if (element.textContent && element.textContent.length > 12) {
        // For long text, ensure minimum node size
        const parentNode = element.closest('.node');
        if (parentNode) {
          const shapes = parentNode.querySelectorAll('rect, polygon, circle, ellipse');
          shapes.forEach((shape) => {
            if (shape.tagName === 'rect') {
              const minWidth = Math.max(140, element.textContent!.length * 9);
              const minHeight = Math.max(40, 30);
              shape.setAttribute('width', minWidth.toString());
              shape.setAttribute('height', minHeight.toString());
            }
          });
        }
      }
    });
    
    // Fix edge paths for better arrow positioning
    const edges = svg.querySelectorAll('.edgePath');
    edges.forEach((edge) => {
      const path = edge.querySelector('path');
      if (path) {
        path.setAttribute('stroke-width', '2');
        path.style.fill = 'none';
      }
    });
    
    // Ensure proper arrow markers
    const markers = svg.querySelectorAll('marker');
    markers.forEach((marker) => {
      marker.setAttribute('markerWidth', '10');
      marker.setAttribute('markerHeight', '10');
      marker.setAttribute('refX', '9');
      marker.setAttribute('refY', '3');
    });
    
  } catch (error) {
    console.warn('Failed to fix text truncation:', error);
  }
};

export default function Preview({ text, onExportPNG, onExportSVG }: PreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedType, setDetectedType] = useState<DiagramType | 'mixed' | 'unknown'>('unknown');
  const mermaidRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'base',
      securityLevel: 'loose',
      maxTextSize: 90000,
      maxEdges: 200,
      themeVariables: {
        primaryColor: theme === 'dark' ? '#59c2ff' : '#55b4d4',
        primaryTextColor: theme === 'dark' ? '#bfbdb6' : '#5c6166',
        primaryBorderColor: theme === 'dark' ? '#3e4b59' : '#d9dce1',
        lineColor: theme === 'dark' ? '#707a8c' : '#828c99',
        secondaryColor: theme === 'dark' ? '#1f2430' : '#ffffff',
        tertiaryColor: theme === 'dark' ? '#2d3640' : '#e7eaed',
        background: theme === 'dark' ? '#0d1017' : '#fafafa',
        mainBkg: theme === 'dark' ? '#1f2430' : '#ffffff',
        secondBkg: theme === 'dark' ? '#2d3640' : '#e7eaed',
        tertiaryBkg: theme === 'dark' ? '#3e4b59' : '#d9dce1'
      },
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis',
        padding: 40,
        nodeSpacing: 80,
        rankSpacing: 100,
        diagramPadding: 30,
        wrappingWidth: 200
      },
      class: {
        useMaxWidth: false,
        htmlLabels: true,
      },
      gantt: {
        useMaxWidth: false
      }
    });
  }, [theme]);

  useEffect(() => {
    if (!text.trim() || !mermaidRef.current) return;
    
    const renderDiagram = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Parse the input text using our unified parser
        const parsed = DiagramParser.parse(text);
        setDetectedType(parsed.type);
        
        // If there are parsing errors, show them
        if (parsed.hasErrors) {
          setError(`Syntax errors:\n${parsed.errors.join('\n')}`);
          setIsLoading(false);
          return;
        }
        
        // Clear previous content
        mermaidRef.current!.innerHTML = '';
        
        // Create unique ID for this render
        const id = `mermaid-${Date.now()}`;
        
        // Render using the generated Mermaid syntax
        const { svg } = await mermaid.render(id, parsed.mermaidSyntax);
        mermaidRef.current!.innerHTML = svg;
        
        // Post-process to fix text truncation issues
        const svgElement = mermaidRef.current!.querySelector('svg');
        if (svgElement) {
          fixTextTruncation(svgElement);
        }
        
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        setError(`Rendering error: ${err.message || 'Failed to render diagram. Please check your syntax.'}`);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(renderDiagram, 300); // Debounce rendering
    return () => clearTimeout(timeoutId);
  }, [text, theme]);

  const handleExportPNG = async () => {
    if (!mermaidRef.current) return;
    
    const diagramContainer = mermaidRef.current;
    if (!diagramContainer) return;

    try {
      // Use html2canvas for reliable screenshot capture
      const canvas = await html2canvas(diagramContainer, {
        backgroundColor: theme === 'dark' ? '#0d1017' : '#fafafa',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: diagramContainer.scrollWidth,
        height: diagramContainer.scrollHeight
      });
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `cooluml-${detectedType}-diagram.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
      
      onExportPNG();
    } catch (error) {
      console.error('HTML2Canvas PNG export failed, trying SVG method:', error);
      
      // Fallback to direct SVG conversion
      try {
        const svg = mermaidRef.current.querySelector('svg');
        if (!svg) {
          console.error('No SVG found for export');
          return;
        }
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `cooluml-${detectedType}-diagram.svg`;
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
        console.warn('Exported as SVG instead of PNG due to conversion error');
      } catch (svgError) {
        console.error('Both PNG and SVG export failed:', svgError);
      }
    }
  };

  const handleExportSVG = () => {
    if (!mermaidRef.current) return;
    
    const svg = mermaidRef.current.querySelector('svg');
    if (!svg) return;

    try {
      // Clone and prepare SVG for export
      const clonedSvg = svg.cloneNode(true) as SVGElement;
      
      // Ensure proper SVG attributes
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      
      // Add background if needed
      const bbox = svg.getBBox();
      const width = bbox.width + 40;
      const height = bbox.height + 40;
      
      clonedSvg.setAttribute('width', width.toString());
      clonedSvg.setAttribute('height', height.toString());
      clonedSvg.setAttribute('viewBox', `${bbox.x - 20} ${bbox.y - 20} ${width} ${height}`);
      
      // Add background rectangle
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', (bbox.x - 20).toString());
      rect.setAttribute('y', (bbox.y - 20).toString());
      rect.setAttribute('width', width.toString());
      rect.setAttribute('height', height.toString());
      rect.setAttribute('fill', theme === 'dark' ? '#0d1017' : '#fafafa');
      clonedSvg.insertBefore(rect, clonedSvg.firstChild);
      
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `cooluml-${diagramType}-diagram.svg`;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
      onExportSVG();
    } catch (error) {
      console.error('SVG export failed:', error);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          Preview {detectedType !== 'unknown' && `(${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)})`}
        </div>
        <div className="panel-actions">
          <button 
            className="icon-btn" 
            title="Export as PNG" 
            onClick={handleExportPNG}
            disabled={!text.trim() || !!error || isLoading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
          </button>
          <button 
            className="icon-btn" 
            title="Export as SVG" 
            onClick={handleExportSVG}
            disabled={!text.trim() || !!error || isLoading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="panel-body">
        <div className="preview">
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="loading-spinner"
            />
          )}
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="error-message"
            >
              <strong>Syntax Error:</strong><br />
              {error}
            </motion.div>
          )}
          
          {!text.trim() && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ 
                color: 'var(--muted)', 
                textAlign: 'center',
                fontStyle: 'italic'
              }}
            >
              Start typing in the editor to see your diagram here...
            </motion.div>
          )}
          
          <motion.div
            ref={mermaidRef}
            className="diagram-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: error || isLoading ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}