"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { DiagramType, UMLTemplate } from "../types";
import Header from "./Header";
import Editor from "./Editor";
import Preview from "./Preview";

const defaultClassContent = `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
        +eat()
    }
    
    class Dog {
        +String breed
        +bark()
    }
    
    Animal <|-- Dog`;

const defaultUsecaseContent = `graph LR
    User((User))
    Admin((Admin))
    System{{System}}
    
    Login["Login"]
    ViewProfile["View Profile"]
    ManageUsers["Manage Users"]
    GenerateReports["Generate Reports"]
    
    User --> Login
    User --> ViewProfile
    Admin --> Login
    Admin --> ManageUsers
    Admin --> GenerateReports
    
    Login --> System
    ViewProfile --> System
    ManageUsers --> System
    GenerateReports --> System`;

export default function CoolUML() {
  const [diagramType, setDiagramType] = useState<DiagramType>('class');
  const [text, setText] = useState(defaultClassContent);

  const handleDiagramTypeChange = useCallback((type: DiagramType) => {
    setDiagramType(type);
    // Switch to default content for the new type
    setText(type === 'class' ? defaultClassContent : defaultUsecaseContent);
  }, []);

  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
  }, []);

  const handleClearEditor = useCallback(() => {
    setText('');
  }, []);

  const handleLoadTemplate = useCallback((template: UMLTemplate) => {
    setText(template.content);
  }, []);

  const handleExportPNG = useCallback(() => {
    console.log('Exported PNG');
  }, []);

  const handleExportSVG = useCallback(() => {
    console.log('Exported SVG');
  }, []);

  return (
    <>
      <Header />
      
      <motion.main 
        className="cooluml-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="left">
          <Editor
            text={text}
            onTextChange={handleTextChange}
            diagramType={diagramType}
            onDiagramTypeChange={handleDiagramTypeChange}
            onClearEditor={handleClearEditor}
            onLoadTemplate={handleLoadTemplate}
          />
        </div>
        
        <div className="right">
          <Preview
            text={text}
            diagramType={diagramType}
            onExportPNG={handleExportPNG}
            onExportSVG={handleExportSVG}
          />
        </div>
      </motion.main>
    </>
  );
}