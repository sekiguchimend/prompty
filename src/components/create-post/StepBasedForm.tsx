import React from 'react';
import type { Prompt, ProjectFormValues } from '.';
import StepNavigation from './StepNavigation';
import StepContentRenderer from './StepContentRenderer';

interface StepBasedFormProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<number>;
  projectSettings: ProjectFormValues;
  setProjectSettings: React.Dispatch<React.SetStateAction<ProjectFormValues>>;
  categories: any[];
  isLoadingCategories: boolean;
  onRefreshCategories: () => void;
  prompts: Prompt[];
  handlePromptSubmit: (data: any) => void;
  handleEditPrompt: (prompt: Prompt) => void;
  promptNumber: number;
  getModelLabel: (modelValue: string) => string;
  markStepAsCompleted: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep?: (step: number) => void;
  submitProject: () => void;
  isSubmitting: boolean;
}

const StepBasedForm: React.FC<StepBasedFormProps> = (props) => {
  return (
    <div className="w-full">
      {/* ステップ進行状況と操作ボタン */}
      <StepNavigation 
        currentStep={props.currentStep}
        totalSteps={props.totalSteps}
        completedSteps={props.completedSteps}
        goToNextStep={props.goToNextStep}
        goToPreviousStep={props.goToPreviousStep}
        goToStep={props.goToStep}
      />
      
      {/* ステップコンテンツ */}
      <div className="my-8">
        <StepContentRenderer 
          currentStep={props.currentStep}
          totalSteps={props.totalSteps}
          completedSteps={props.completedSteps}
          projectSettings={props.projectSettings}
          setProjectSettings={props.setProjectSettings}
          categories={props.categories}
          isLoadingCategories={props.isLoadingCategories}
          onRefreshCategories={props.onRefreshCategories}
          prompts={props.prompts}
          handlePromptSubmit={props.handlePromptSubmit}
          handleEditPrompt={props.handleEditPrompt}
          promptNumber={props.promptNumber}
          getModelLabel={props.getModelLabel}
          markStepAsCompleted={props.markStepAsCompleted}
          goToNextStep={props.goToNextStep}
          submitProject={props.submitProject}
          isSubmitting={props.isSubmitting}
        />
      </div>
    </div>
  );
};

export default StepBasedForm; 