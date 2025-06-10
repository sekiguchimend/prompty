import React, { useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Input } from "../../components/ui/input";


// 利用可能なAIモデルのリスト
export const AI_MODELS = [
  { value: "claude-4-sonnet", label: "Claude 4 Sonnet" },
  { value: "claude-sonnet-4", label: "Claude Sonnet 4" },
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
                placeholder="claude-4-20250120, claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022 など"
                className="border-gray-300"
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  onModelChange(e.target.value);
                }}
              />
            </FormControl>
            <div className="text-sm text-gray-500 space-y-1">
              <p>• 推奨: claude-4-20250120 (最新・高性能)</p>
              <p>• 高速: claude-3-5-haiku-20241022 (経済的)</p>
              <p>• その他: gpt-4o, gemini-1.5-pro など</p>
            </div>
          </FormItem>
        )}
      />
    </>
  );
};

export default ModelSelector; 