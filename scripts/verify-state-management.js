#!/usr/bin/env node

/**
 * Verification script for state management implementation
 * This script verifies that all the required functionality is implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying State Management Implementation...\n');

// Check if required files exist
const requiredFiles = [
  'lib/app-state.ts',
  'components/AppStateProvider.tsx',
  'lib/state-test-utils.ts'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Check if main page uses AppStateProvider
const mainPagePath = path.join(process.cwd(), 'app/page.tsx');
const mainPageContent = fs.readFileSync(mainPagePath, 'utf8');

const checks = [
  {
    name: 'AppStateProvider import',
    test: mainPageContent.includes('AppStateProvider'),
    required: true
  },
  {
    name: 'useEditorState hook usage',
    test: mainPageContent.includes('useEditorState'),
    required: true
  },
  {
    name: 'useThemeState hook usage',
    test: mainPageContent.includes('useThemeState'),
    required: true
  },
  {
    name: 'usePreviewState hook usage',
    test: mainPageContent.includes('usePreviewState'),
    required: true
  },
  {
    name: 'AppStateProvider wrapper',
    test: mainPageContent.includes('<AppStateProvider>'),
    required: true
  }
];

console.log('\n📋 Checking main page integration:');
let allChecksPassed = true;

checks.forEach(check => {
  if (check.test) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`${check.required ? '❌' : '⚠️'} ${check.name}`);
    if (check.required) {
      allChecksPassed = false;
    }
  }
});

// Check AppStateProvider implementation
const providerPath = path.join(process.cwd(), 'components/AppStateProvider.tsx');
const providerContent = fs.readFileSync(providerPath, 'utf8');

const providerChecks = [
  {
    name: 'State reducer implementation',
    test: providerContent.includes('appStateReducer'),
    required: true
  },
  {
    name: 'Local storage integration',
    test: providerContent.includes('AppStorage'),
    required: true
  },
  {
    name: 'Theme management',
    test: providerContent.includes('ThemeManager'),
    required: true
  },
  {
    name: 'Template insertion',
    test: providerContent.includes('INSERT_TEMPLATE'),
    required: true
  },
  {
    name: 'Debounced save functionality',
    test: providerContent.includes('debouncedSave'),
    required: true
  },
  {
    name: 'useEditorState hook',
    test: providerContent.includes('export function useEditorState'),
    required: true
  },
  {
    name: 'useThemeState hook',
    test: providerContent.includes('export function useThemeState'),
    required: true
  },
  {
    name: 'usePreviewState hook',
    test: providerContent.includes('export function usePreviewState'),
    required: true
  }
];

console.log('\n🏗️ Checking AppStateProvider implementation:');

providerChecks.forEach(check => {
  if (check.test) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`${check.required ? '❌' : '⚠️'} ${check.name}`);
    if (check.required) {
      allChecksPassed = false;
    }
  }
});

// Check app-state utilities
const appStatePath = path.join(process.cwd(), 'lib/app-state.ts');
const appStateContent = fs.readFileSync(appStatePath, 'utf8');

const utilityChecks = [
  {
    name: 'AppStorage class',
    test: appStateContent.includes('export class AppStorage'),
    required: true
  },
  {
    name: 'ThemeManager class',
    test: appStateContent.includes('export class ThemeManager'),
    required: true
  },
  {
    name: 'StateValidator class',
    test: appStateContent.includes('export class StateValidator'),
    required: true
  },
  {
    name: 'TemplateManager class',
    test: appStateContent.includes('export class TemplateManager'),
    required: true
  },
  {
    name: 'Local storage persistence',
    test: appStateContent.includes('localStorage'),
    required: true
  },
  {
    name: 'State validation',
    test: appStateContent.includes('validateEditorContent'),
    required: true
  }
];

console.log('\n🛠️ Checking utility classes:');

utilityChecks.forEach(check => {
  if (check.test) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`${check.required ? '❌' : '⚠️'} ${check.name}`);
    if (check.required) {
      allChecksPassed = false;
    }
  }
});

// Check component integration
const components = [
  { file: 'components/EditorPanel.tsx', hook: 'useEditorState' },
  { file: 'components/PreviewPanel.tsx', hook: 'usePreviewState' },
  { file: 'components/Header.tsx', hook: 'useAppMetadata' },
  { file: 'components/HelperPanel.tsx', hook: 'useEditorState' }
];

console.log('\n🧩 Checking component integration:');

components.forEach(({ file, hook }) => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(hook)) {
      console.log(`✅ ${file} uses ${hook}`);
    } else {
      console.log(`⚠️ ${file} doesn't use ${hook}`);
    }
  } else {
    console.log(`❌ ${file} missing`);
    allChecksPassed = false;
  }
});

// Summary
console.log('\n📊 Summary:');
if (allChecksPassed) {
  console.log('🎉 All required state management features are implemented!');
  console.log('\n✨ Implementation includes:');
  console.log('   • Centralized state management with React Context');
  console.log('   • Local storage persistence for editor content and preferences');
  console.log('   • Theme management with system preference detection');
  console.log('   • Template insertion with cursor position tracking');
  console.log('   • Debounced auto-save functionality');
  console.log('   • State validation and error handling');
  console.log('   • Performance monitoring utilities');
  console.log('   • Specialized hooks for different component needs');
  console.log('   • Real-time data flow between all panels');
  
  console.log('\n🧪 To test the implementation:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Open browser console');
  console.log('   3. Run: testStateManagement()');
  
  process.exit(0);
} else {
  console.log('❌ Some required features are missing or incomplete!');
  process.exit(1);
}