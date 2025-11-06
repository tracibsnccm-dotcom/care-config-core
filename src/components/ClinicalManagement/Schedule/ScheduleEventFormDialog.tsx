import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTeamSchedule, ScheduleEvent } from "@/hooks/useTeamSchedule";
import { format } from "date-fns";

interface ScheduleEventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: ScheduleEvent;
  mode: 'create' | 'edit';
}

export function ScheduleEventFormDialog({ open, onOpenChange, event, mode }: ScheduleEventFormDialogProps) {
  const { createEvent, updateEvent } = useTeamSchedule();
  
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    event_type: event?.event_type || 'meeting',
    start_date: event ? format(new Date(event.start_time), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    start_time: event ? format(new Date(event.start_time), 'HH:mm') : '09:00',
    end_date: event ? format(new Date(event.end_time), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    end_time: event ? format(new Date(event.end_time), 'HH:mm') : '10:00',
    location: event?.location || '',
    is_recurring: event?.is_recurring || false,
    recurrence_pattern: event?.recurrence_pattern || 'weekly',
    reminder_minutes: event?.reminder_minutes || 15,
    status: event?.status || 'scheduled',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);

      const eventData = {
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type as any,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: formData.location,
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : undefined,
        reminder_minutes: formData.reminder_minutes,
        status: formData.status as any,
        attendees: [],
      };

      if (mode === 'edit' && event) {
        await updateEvent(event.id, eventData);
      } else {
        await createEvent(eventData as any);
      }
      
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        event_type: 'meeting',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_date: format(new Date(), 'yyyy-MM-dd'),
        end_time: '10:00',
        location: '',
        is_recurring: false,
        recurrence_pattern: 'weekly',
        reminder_minutes: 15,
        status: 'scheduled',
      });
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Event' : 'Edit Event'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Team Meeting"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Event details..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type *</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value: any) => setFormData({ ...formData, event_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="pto">PTO</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Conference Room A, Zoom"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder_minutes">Reminder (minutes before)</Label>
              <Select
                value={formData.reminder_minutes.toString()}
                onValueChange={(value) => setFormData({ ...formData, reminder_minutes: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No reminder</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="1440">1 day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Recurrence</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                />
                <Label htmlFor="is_recurring" className="cursor-pointer">
                  Recurring event
                </Label>
              </div>
            </div>

            {formData.is_recurring && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="recurrence_pattern">Recurrence Pattern</Label>
                <Select
                  value={formData.recurrence_pattern}
                  onValueChange={(value) => setFormData({ ...formData, recurrence_pattern: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'create' ? 'Create Event' : 'Update Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}