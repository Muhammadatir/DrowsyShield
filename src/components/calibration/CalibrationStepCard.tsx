import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CalibrationStepCardProps {
  title: string;
  description: string;
  instruction: string;
}

export const CalibrationStepCard = ({
  title,
  description,
  instruction,
}: CalibrationStepCardProps) => {
  return (
    <Card className="border-border bg-card/50">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{description}</p>
        <div className="bg-secondary/20 border border-secondary p-4 rounded-lg">
          <p className="text-sm font-medium text-secondary">{instruction}</p>
        </div>
      </CardContent>
    </Card>
  );
};
