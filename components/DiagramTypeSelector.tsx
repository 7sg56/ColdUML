"use client";

import { useState, useRef, useEffect } from "react";
import { DiagramType } from "../types";

interface DiagramTypeSelectorProps {
  currentType: DiagramType;
  onTypeChange: (type: DiagramType) => void;
}

export default function DiagramTypeSelector({ currentType, onTypeChange }: DiagramTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { value: 'class' as DiagramType, label: 'Class Diagram', icon: '📊' },
    { value: 'usecase' as DiagramType, label: 'Use Case Diagram', icon: '👥' }
  ];

  const currentOption = options.find(opt => opt.value === currentType) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (type: DiagramType) => {
    onTypeChange(type);
    setIsOpen(false);
  };

  return (
    <div className="diagram-type-selector" ref={dropdownRef}>
      <button
        className="diagram-type-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="diagram-type-icon">{currentOption.icon}</span>
        <span className="diagram-type-label">{currentOption.label}</span>
        <svg 
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      
      {isOpen && (
        <div className="diagram-type-dropdown">
          {options.map((option) => (
            <button
              key={option.value}
              className={`diagram-type-option ${option.value === currentType ? 'active' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              <span className="diagram-type-icon">{option.icon}</span>
              <span className="diagram-type-label">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}