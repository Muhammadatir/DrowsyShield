import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Trash2, User, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { EmergencyContact } from "@/types/emergency";

interface EmergencyContactCardProps {
  contact: EmergencyContact;
  onCall: (phone: string) => void;
  onDelete: (id: string) => void;
  onShareLocation?: (contact: EmergencyContact) => void;
}

export const EmergencyContactCard = ({
  contact,
  onCall,
  onDelete,
  onShareLocation,
}: EmergencyContactCardProps) => {
  const { toast } = useToast();
  
  const handleShareLocation = async () => {
    try {
      if (!navigator.geolocation) {
        toast({
          title: "Location Not Available",
          description: "Geolocation is not supported by this device",
          variant: "destructive",
        });
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationUrl = `https://maps.google.com/maps?q=${latitude},${longitude}`;
          const message = `🚨 EMERGENCY ALERT 🚨\n\nI need help! My current location is:\n${locationUrl}\n\nSent from DrowsyShield Safety App`;
          
          // Create SMS link
          const smsUrl = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
          window.location.href = smsUrl;
          
          toast({
            title: "Location Shared",
            description: `Location sent to ${contact.name}`,
          });
          
          if (onShareLocation) {
            onShareLocation(contact);
          }
        },
        (error) => {
          console.error('Location error:', error);
          toast({
            title: "Location Error",
            description: "Unable to get your current location",
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } catch (error) {
      console.error('Share location error:', error);
      toast({
        title: "Error",
        description: "Failed to share location",
        variant: "destructive",
      });
    }
  };
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
              title="Call contact"
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              onClick={handleShareLocation}
              title="Share live location"
            >
              <MapPin className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(contact.id)}
              title="Delete contact"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
