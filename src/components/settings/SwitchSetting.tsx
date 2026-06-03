import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SwitchSettingProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const SwitchSetting = ({
  label,
  description,
  checked,
  onChange,
}: SwitchSettingProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
};
