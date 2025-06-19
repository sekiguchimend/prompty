import React, { useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Input } from "../../components/ui/input";


// 利用可能なAIモデルのリスト
export const AI_MODELS = [
  { value: "claude-4-sonnet", label: "promptyAI Sonnet" },
  { value: "claude-sonnet-4", label: "promptyAI Sonnet 4" },
] as const;

interface ModelSelectorProps {
  control: any;
  onModelChange: (value: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  control,
  onModelChange
}) => {
  return (
    <>
      <FormField
        control={control}
        name="aiModel"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-base font-medium">AIモデル</FormLabel>
            <FormControl>
              <Input
                placeholder="例）chat-gpt"
                className="border-gray-300"
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  onModelChange(e.target.value);
                }}
              />
            </FormControl>
           
          </FormItem>
        )}
      />
    </>
  );
};

export default ModelSelector; 