import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Phone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { EmergencyContactCard } from "@/components/emergency/EmergencyContactCard";
import { AddContactDialog } from "@/components/emergency/AddContactDialog";
import { LocationDisplay } from "@/components/emergency/LocationDisplay";
import {
  loadEmergencyContacts,
  addEmergencyContact,
  removeEmergencyContact,
} from "@/utils/emergencyStorage";
import type { EmergencyContact } from "@/types/emergency";

const Emergency = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<EmergencyContact[]>(loadEmergencyContacts());
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
    toast({
      title: "Calling...",
      description: `Dialing ${phone}`,
    });
  };

  const handleEmergencyCall = () => {
    window.location.href = "tel:112";
    toast({
      title: "Emergency Call",
      description: "Calling emergency services",
      variant: "destructive",
    });
  };

  const handleAddContact = (contact: Omit<EmergencyContact, 'id'>) => {
    addEmergencyContact(contact);
    setContacts(loadEmergencyContacts());
    toast({
      title: "Contact Added",
      description: `${contact.name} has been added to emergency contacts`,
    });
  };

  const handleDeleteContact = (id: string) => {
    removeEmergencyContact(id);
    setContacts(loadEmergencyContacts());
    toast({
      title: "Contact Removed",
      description: "Emergency contact has been removed",
    });
  };

  return (
    <div className="min-h-screen flex flex-col p-6 pb-20">
      <header className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Emergency</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 space-y-6">
        {/* Emergency Call Button */}
        <div className="space-y-2">
          <Button
            onClick={handleEmergencyCall}
            variant="destructive"
            size="lg"
            className="w-full h-20 text-lg font-bold"
          >
            <Phone className="mr-3 h-6 w-6" />
            Call Emergency Services (112)
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            For immediate life-threatening emergencies
          </p>
        </div>

        {/* Location Display */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Share Location
          </h2>
          <LocationDisplay />
        </div>

        {/* Emergency Contacts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Emergency Contacts</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>

          {contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">No emergency contacts added</p>
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Contact
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <EmergencyContactCard
                  key={contact.id}
                  contact={contact}
                  onCall={handleCall}
                  onDelete={handleDeleteContact}
                />
              ))}
            </div>
          )}
        </div>

        {/* Return Button */}
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="w-full"
        >
          Return to Home
        </Button>
      </main>

      <AddContactDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAddContact}
      />
    </div>
  );
};

export default Emergency;
