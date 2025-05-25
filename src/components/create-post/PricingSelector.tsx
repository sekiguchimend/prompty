import React from 'react';
import { FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";

interface PricingSelectorProps {
  control: any;
  pricingType: string;
  onPricingTypeChange: (value: string) => void;
}

const PricingSelector: React.FC<PricingSelectorProps> = ({
  control,
  pricingType,
  onPricingTypeChange
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

      {/* 価格設定（有料の場合のみ表示） */}
      {pricingType === "paid" && (
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
      )}
    </>
  );
};

export default PricingSelector; 