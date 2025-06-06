import React, { useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";

// 利用可能なAIモデルのリスト
export const AI_MODELS = [
  { value: "claude-4-sonnet", label: "Claude 4 Sonnet" },
  { value: "claude-sonnet-4", label: "Claude Sonnet 4" },
] as const;

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
          <FormItem className="space-y-3">
            <FormLabel className="text-base font-medium">AIモデル</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={(value) => {
                  field.onChange(value);
                  onModelChange(value);
                }}
                value={field.value}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="claude-3-7-sonnet-20250219" id="claude-3-7-sonnet-20250219" />
                  <Label htmlFor="claude-3-7-sonnet-20250219" className="text-sm">
                    Claude 3.7 Sonnet (2025年2月19日版) - 推奨
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="claude-3-5-sonnet-20241022" id="claude-3-5-sonnet-20241022" />
                  <Label htmlFor="claude-3-5-sonnet-20241022" className="text-sm">
                    Claude 3.5 Sonnet (最新版)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="claude-3-sonnet-20240229" id="claude-3-sonnet-20240229" />
                  <Label htmlFor="claude-3-sonnet-20240229" className="text-sm">
                    Claude 3 Sonnet
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="claude-3-opus-20240229" id="claude-3-opus-20240229" />
                  <Label htmlFor="claude-3-opus-20240229" className="text-sm">
                    Claude 3 Opus (最高性能)
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
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