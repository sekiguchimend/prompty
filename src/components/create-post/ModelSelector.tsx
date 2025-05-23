import React, { useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Input } from "../../components/ui/input";

// 利用可能なAIモデルのリスト
export const AI_MODELS = [
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5", label: "GPT-3.5" },
  { value: "custom", label: "カスタム（直接入力）" },
];

interface ModelSelectorProps {
  control: any;
  isCustomModel: boolean;
  onModelChange: (value: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  control,
  isCustomModel,
  onModelChange
}) => {
  return (
    <>
      <FormField
        control={control}
        name="aiModel"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel className="text-gray-700">使用AIモデル</FormLabel>
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                onModelChange(value);
              }}
            >
              <SelectTrigger className="border-gray-300 bg-white">
                <SelectValue placeholder="AIモデル選択" />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
      
      {/* カスタムAIモデル入力フィールド */}
      {isCustomModel && (
        <FormField
          control={control}
          name="customAiModel"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">カスタムAIモデル名</FormLabel>
              <FormControl>
                <Input
                  placeholder="例: GPT-4-1106-preview, gemini-1.5-pro"
                  className="border-gray-300"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}
    </>
  );
};

export default ModelSelector; 