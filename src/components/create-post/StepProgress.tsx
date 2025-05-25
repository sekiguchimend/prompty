import React from 'react';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<number>;
}

const StepProgress: React.FC<StepProgressProps> = ({ currentStep, totalSteps, completedSteps }) => {
  return (
    <div className="mb-8">
      <div className="w-full bg-gray-200 h-2 rounded-full">
        <div 
          className="bg-green-500 h-2 rounded-full"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default StepProgress; 