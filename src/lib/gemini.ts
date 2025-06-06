import { z } from 'zod';
import JSZip from 'jszip';

// Claude-only types - remove all Gemini references
export interface CodeGenerationRequest {
  prompt: string;
  model?: string;
  language?: 'ja' | 'en';
  preserveExisting?: boolean;
  targetFramework?: string;
}

export interface CodeGenerationResponse {
  files: Record<string, string>;
  description: string;
  instructions?: string;
  framework: string;
  language: string;
  styling: string;
  usedModel?: string;
  preservedFeatures?: string[];
  improvements?: string[];
  warnings?: string[];
}

// Claude models only
export const AVAILABLE_MODELS = [
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'claude-3-sonnet-20240229', 
  'claude-3-opus-20240229'
] as const;

export interface CodeImprovementOptions {
  preserveStructure: boolean;
  preserveStyles: boolean;
  preserveFunctionality: boolean;
  enhanceOnly: boolean;
  targetAreas?: string[];
}

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Claude API call function
async function callApi(endpoint: string, data: any): Promise<any> {
  const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error (${response.status}):`, errorText);
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

// Generate code using Claude only
export async function generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
  console.log('🚀 Generating code with Claude:', {
    model: request.model || 'claude-3-7-sonnet-20250219',
    language: request.language || 'ja',
    framework: request.targetFramework || 'react'
  });

  try {
    const response = await callApi('/generate-code', {
      prompt: request.prompt,
      model: request.model || 'claude-3-7-sonnet-20250219',
      language: request.language || 'ja'
    });

    return response;
  } catch (error) {
    console.error('❌ Code generation failed:', error);
    throw error;
  }
}

// Improve code using Claude only
export async function improveCode(
  originalCode: string,
  improvementRequest: string,
  framework: string = 'react',
  model: string = 'claude-3-7-sonnet-20250219',
  language: 'ja' | 'en' = 'ja',
  options: CodeImprovementOptions = {
    preserveStructure: true,
    preserveStyles: true,
    preserveFunctionality: true,
    enhanceOnly: true
  }
): Promise<CodeGenerationResponse> {
  console.log('🔧 Improving code with Claude:', {
    model,
    language,
    framework,
    options
  });

  try {
    const response = await callApi('/improve-code-enhanced', {
      originalCode,
      improvementRequest,
      framework,
      model,
      language
    });

    return response;
  } catch (error) {
    console.error('❌ Code improvement failed:', error);
    throw error;
  }
}

// Code analysis function
function analyzeCodeStructure(code: string): {
  functions: string[];
  classes: string[];
  cssClasses: string[];
  htmlElements: string[];
  eventListeners: string[];
  variables: string[];
} {
  const result = {
    functions: [] as string[],
    classes: [] as string[],
    cssClasses: [] as string[],
    htmlElements: [] as string[],
    eventListeners: [] as string[],
    variables: [] as string[]
  };

  // Extract JavaScript functions
  const funcMatches = Array.from(code.matchAll(/(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|\w+))/g));
  for (const match of funcMatches) {
    const funcName = match[1] || match[2];
    if (funcName) result.functions.push(funcName);
  }

  // Extract CSS classes
  const cssMatches = Array.from(code.matchAll(/\.([a-zA-Z][\w-]*)/g));
  for (const match of cssMatches) {
    if (!result.cssClasses.includes(match[1])) {
      result.cssClasses.push(match[1]);
    }
  }

  // Extract HTML elements
  const htmlMatches = Array.from(code.matchAll(/<(\w+)/g));
  for (const match of htmlMatches) {
    if (!result.htmlElements.includes(match[1])) {
      result.htmlElements.push(match[1]);
    }
  }

  // Extract event listeners
  const eventMatches = Array.from(code.matchAll(/addEventListener\(['"](\w+)['"]/g));
  for (const match of eventMatches) {
    if (!result.eventListeners.includes(match[1])) {
      result.eventListeners.push(match[1]);
    }
  }

  return result;
}

// Explain code using Claude
export const explainCode = async (code: string, language: 'ja' | 'en' = 'ja'): Promise<string> => {
  console.log('📖 Explaining code with Claude...');
  
  try {
    // Use Claude to explain the code
    const prompt = language === 'ja' 
      ? `以下のコードを分析して、機能と構造を日本語で説明してください：\n\n${code}`
      : `Please analyze and explain the functionality and structure of the following code:\n\n${code}`;

    const response = await callApi('/generate-code', {
      prompt,
      model: 'claude-3-7-sonnet-20250219',
      language
    });

    return response.description || 'コードの説明を生成できませんでした。';
  } catch (error) {
    console.error('❌ Code explanation failed:', error);
    return language === 'ja' 
      ? 'コードの説明中にエラーが発生しました。'
      : 'An error occurred while explaining the code.';
  }
};

// Project management functions
export const saveProject = (project: {
  title: string;
  description: string;
  prompt: string;
  files: Record<string, string>;
  framework: string;
  language: string;
  styling: string;
}): string => {
  const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const projectData = {
    ...project,
    id: projectId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    model: 'claude-3-7-sonnet-20250219'
  };

  try {
    const existingProjects = JSON.parse(localStorage.getItem('claude_projects') || '[]');
    existingProjects.push(projectData);
    localStorage.setItem('claude_projects', JSON.stringify(existingProjects));
    
    console.log('💾 Project saved:', projectId);
    return projectId;
  } catch (error) {
    console.error('❌ Failed to save project:', error);
    throw new Error('プロジェクトの保存に失敗しました');
  }
};

export const loadProjects = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem('claude_projects') || '[]');
  } catch (error) {
    console.error('❌ Failed to load projects:', error);
    return [];
  }
};

export const deleteProject = (projectId: string): boolean => {
  try {
    const projects = loadProjects();
    const filteredProjects = projects.filter(p => p.id !== projectId);
    localStorage.setItem('claude_projects', JSON.stringify(filteredProjects));
    
    console.log('🗑️ Project deleted:', projectId);
    return true;
  } catch (error) {
    console.error('❌ Failed to delete project:', error);
    return false;
  }
};

// Code export functions
export const downloadCode = async (files: Record<string, string>, projectName: string = 'claude-generated-app'): Promise<void> => {
  try {
    // Create a zip file with all the files
    const zip = new JSZip();
    
    Object.entries(files).forEach(([filename, content]) => {
      zip.file(filename, content);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    
    // Download the zip file
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${projectName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('📥 Code downloaded:', projectName);
  } catch (error) {
    console.error('❌ Download failed:', error);
    throw new Error('コードのダウンロードに失敗しました');
  }
};

export const copyCode = async (files: Record<string, string>): Promise<void> => {
  try {
    let combinedCode = '';
    
    Object.entries(files).forEach(([filename, content]) => {
      combinedCode += `// === ${filename} ===\n${content}\n\n`;
    });

    await navigator.clipboard.writeText(combinedCode);
    console.log('📋 Code copied to clipboard');
  } catch (error) {
    console.error('❌ Copy failed:', error);
    throw new Error('コードのコピーに失敗しました');
  }
};

// Framework detection
export const detectFramework = (files: Record<string, string>): string => {
  const allContent = Object.values(files).join('\n').toLowerCase();
  
  if (allContent.includes('react') || allContent.includes('jsx') || allContent.includes('usestate')) {
    return 'react';
  } else if (allContent.includes('vue') || allContent.includes('v-if') || allContent.includes('v-for')) {
    return 'vue';
  } else if (allContent.includes('angular') || allContent.includes('component') || allContent.includes('injectable')) {
    return 'angular';
  } else if (allContent.includes('svelte') || allContent.includes('$:')) {
    return 'svelte';
  } else {
    return 'vanilla';
  }
};