import React from 'react';
import { FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { AlertTriangle, ExternalLink, Scissors } from "lucide-react";
import Link from "next/link";

interface PricingSelectorProps {
  control: any;
  pricingType: string;
  onPricingTypeChange: (value: string) => void;
  onInsertPreviewMarker?: () => void;
  previewLines?: number;
  onPreviewLinesChange?: (lines: number) => void;
}

const PricingSelector: React.FC<PricingSelectorProps> = ({
  control,
  pricingType,
  onPricingTypeChange,
  onInsertPreviewMarker,
  previewLines,
  onPreviewLinesChange
}) => {
  return (
    <>
      <FormField
        control={control}
        name="pricingType"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className="text-gray-700">公開タイプ</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  onPricingTypeChange(value);
                }}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="free" id="free" />
                  <Label htmlFor="free" className="font-normal cursor-pointer">無料</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paid" id="paid" />
                  <Label htmlFor="paid" className="font-normal cursor-pointer">有料</Label>
                </div>
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />

      {/* 有料選択時の警告メッセージ */}
      {pricingType === "paid" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-800 mb-1">
                Stripeアカウントの設定が必要です
              </h4>
              <p className="text-sm text-amber-700 mb-3">
                有料記事を投稿するには、事前にStripeアカウントを設定し、決済機能を有効にする必要があります。
              </p>
              <Link 
                href="/settings?tab=stripe" 
                className="inline-flex items-center text-sm text-amber-800 hover:text-amber-900 font-medium underline"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Stripe設定ページへ
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 価格設定（有料の場合のみ表示） */}
      {pricingType === "paid" && (
        <>
          <FormField
            control={control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">価格（円）</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="例: 300"
                    className="border-gray-300"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* プレビュー終了位置設定 */}
          <div className="space-y-3">
            <FormLabel className="text-gray-700 flex items-center">
              <Scissors className="h-4 w-4 mr-2 text-red-600" />
              プレビュー終了位置
            </FormLabel>
            <div className="text-sm text-gray-500">
              プロンプト内容の赤い線をドラッグして、無料で表示する範囲を設定できます。
              {previewLines && (
                <span className="block mt-1 text-red-600 font-medium">
                  現在の設定: {previewLines}行目まで無料表示
                </span>
              )}
            </div>
            
            {/* マーカー挿入ボタン */}
            {onInsertPreviewMarker && (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onInsertPreviewMarker}
                  className="flex items-center space-x-2 text-sm border-red-200 text-red-700 hover:bg-red-50"
                >
                  <Scissors className="h-4 w-4" />
                  <span>プレビュー終了位置を表示</span>
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  プロンプト内容に赤い線が表示され、ドラッグで位置を調整できます
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default PricingSelector; 