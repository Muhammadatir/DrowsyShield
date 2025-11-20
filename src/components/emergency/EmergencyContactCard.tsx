import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Trash2, User } from "lucide-react";
import type { EmergencyContact } from "@/types/emergency";

interface EmergencyContactCardProps {
  contact: EmergencyContact;
  onCall: (phone: string) => void;
  onDelete: (id: string) => void;
}

export const EmergencyContactCard = ({
  contact,
  onCall,
  onDelete,
}: EmergencyContactCardProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-full">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{contact.name}</p>
              <p className="text-sm text-muted-foreground">{contact.relationship}</p>
              <p className="text-sm font-mono mt-1">{contact.phone}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="default"
              onClick={() => onCall(contact.phone)}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(contact.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
