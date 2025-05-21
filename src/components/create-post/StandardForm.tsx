import React from 'react';
import type { Prompt, ProjectFormValues } from '.';

interface StandardFormProps {
  isAnonymousSubmission: boolean;
  showHistory: boolean;
  toggleHistory: () => void;
  projectSettings: ProjectFormValues;
  categories: any[];
  isLoadingCategories: boolean;
  onRefreshCategories: () => void;
  prompts: Prompt[];
  handleProjectSave: (data: ProjectFormValues) => void;
  handlePromptSubmit: (data: any) => void;
  handleEditPrompt: (prompt: Prompt) => void;
  applyPromptExample: (example: any) => void;
  submitProject: () => void;
  isSubmitting: boolean;
  promptNumber: number;
  getModelLabel: (modelValue: string) => string;
}

const StandardForm: React.FC<StandardFormProps> = (props) => {
  // 実装は空でOK（現在はCreatePost.tsxで直接UIを構築しているため）
  return <div>標準投稿フォーム</div>;
};

export default StandardForm; 