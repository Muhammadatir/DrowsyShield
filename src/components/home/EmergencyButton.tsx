import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export const EmergencyButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate("/emergency")}
      variant="destructive"
      size="lg"
      className="w-full font-bold"
    >
      <AlertTriangle className="mr-2 h-5 w-5" />
      Emergency
    </Button>
  );
};
