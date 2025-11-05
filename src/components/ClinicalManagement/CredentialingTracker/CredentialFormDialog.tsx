import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Credential } from "@/hooks/useCredentials";

interface CredentialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credential?: Credential | null;
  onSubmit: (data: Partial<Credential>) => void;
  isSubmitting: boolean;
}

export function CredentialFormDialog({
  open,
  onOpenChange,
  credential,
  onSubmit,
  isSubmitting
}: CredentialFormDialogProps) {
  const [formData, setFormData] = useState<Partial<Credential>>(
    credential || {
      credential_type: "",
      credential_name: "",
      license_number: "",
      issuing_organization: "",
      issue_date: "",
      expiration_date: "",
      status: "active",
      notes: ""
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {credential ? "Edit Credential" : "Add New Credential"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credential_type">Credential Type*</Label>
              <Select
                value={formData.credential_type}
                onValueChange={(value) => setFormData({ ...formData, credential_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RN License">RN License</SelectItem>
                  <SelectItem value="NP Certification">NP Certification</SelectItem>
                  <SelectItem value="BCLS">BCLS</SelectItem>
                  <SelectItem value="ACLS">ACLS</SelectItem>
                  <SelectItem value="PALS">PALS</SelectItem>
                  <SelectItem value="CCM Certification">CCM Certification</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="credential_name">Credential Name*</Label>
              <Input
                id="credential_name"
                value={formData.credential_name}
                onChange={(e) => setFormData({ ...formData, credential_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_number">License/Certificate Number</Label>
              <Input
                id="license_number"
                value={formData.license_number || ""}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuing_organization">Issuing Organization</Label>
              <Input
                id="issuing_organization"
                value={formData.issuing_organization || ""}
                onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue_date">Issue Date</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date || ""}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiration_date">Expiration Date*</Label>
              <Input
                id="expiration_date"
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending_renewal">Pending Renewal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : credential ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
