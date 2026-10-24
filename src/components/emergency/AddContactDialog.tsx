import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (contact: { name: string; phone: string; relationship: string }) => void;
}

// Country code map for common prefixes
const COUNTRY_CODES: Record<string, string> = {
  "0092": "+92", "92": "+92",   // Pakistan
  "0044": "+44", "44": "+44",   // UK
  "001":  "+1",  "1":  "+1",    // US/Canada
  "0091": "+91", "91": "+91",   // India
  "0020": "+20", "20": "+20",   // Egypt
  "00971": "+971", "971": "+971", // UAE
  "00966": "+966", "966": "+966", // Saudi Arabia
};

/**
 * Converts any phone format to E.164 (+XXXXXXXXXXX)
 * Examples:
 *   03001234567   → +923001234567  (assumes PK if starts with 0)
 *   923001234567  → +923001234567
 *   +923001234567 → +923001234567  (already correct)
 *   0092300...    → +92300...
 */
const toE164 = (raw: string): string => {
  // Strip all spaces, dashes, parentheses
  let digits = raw.replace(/[\s\-().]/g, "");

  // Already in E.164
  if (digits.startsWith("+")) return digits;

  // Try known country code prefixes (longest match first)
  for (const prefix of Object.keys(COUNTRY_CODES).sort((a, b) => b.length - a.length)) {
    if (digits.startsWith(prefix)) {
      return COUNTRY_CODES[prefix] + digits.slice(prefix.length);
    }
  }

  // Starts with 0 — local format, assume Pakistan (+92)
  if (digits.startsWith("0")) return "+92" + digits.slice(1);

  // Fallback — prepend + and hope for the best
  return "+" + digits;
};

const isValidE164 = (phone: string): boolean =>
  /^\+[1-9]\d{7,14}$/.test(phone);

export const AddContactDialog = ({
  open,
  onOpenChange,
  onAdd,
}: AddContactDialogProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("family");
  const [phoneError, setPhoneError] = useState("");

  const formatted = phone ? toE164(phone) : "";
  const valid = isValidE164(formatted);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    setPhoneError("");
  };

  const handleSubmit = () => {
    if (!name) return;
    if (!valid) {
      setPhoneError("Enter a valid number e.g. 03001234567 or +923001234567");
      return;
    }
    onAdd({ name, phone: formatted, relationship });
    setName("");
    setPhone("");
    setRelationship("family");
    setPhoneError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Emergency Contact</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="03001234567 or +923001234567"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={phoneError ? "border-red-500" : ""}
            />
            {phone && valid && (
              <p className="text-xs text-green-600">✓ Will be saved as {formatted}</p>
            )}
            {phoneError && (
              <p className="text-xs text-red-500">{phoneError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="colleague">Colleague</SelectItem>
                <SelectItem value="emergency">Emergency Services</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name || !phone}>
            Add Contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
