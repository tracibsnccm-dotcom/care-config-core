import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ["Ctrl", "N"], description: "New diary entry", category: "Actions" },
  { keys: ["Ctrl", "F"], description: "Focus search", category: "Navigation" },
  { keys: ["Ctrl", "S"], description: "Save entry", category: "Actions" },
  { keys: ["Esc"], description: "Close dialog/modal", category: "Navigation" },
  { keys: ["←", "→"], description: "Previous/Next day (Calendar)", category: "Navigation" },
  { keys: ["↑", "↓"], description: "Previous/Next week (Calendar)", category: "Navigation" },
  { keys: ["Ctrl", "K"], description: "Quick command menu", category: "Navigation" },
  { keys: ["Ctrl", "D"], description: "Duplicate entry", category: "Actions" },
  { keys: ["?"], description: "Show keyboard shortcuts", category: "Help" },
];

interface DiaryKeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DiaryKeyboardShortcuts({ isOpen, onClose }: DiaryKeyboardShortcutsProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>Speed up your workflow with these shortcuts</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {["Actions", "Navigation", "Help"].map((category) => (
            <div key={category}>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">{category}</h3>
              <div className="space-y-2">
                {SHORTCUTS.filter((s) => s.category === category).map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <Badge key={keyIdx} variant="outline" className="font-mono">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useKeyboardShortcuts(handlers: {
  onNewEntry?: () => void;
  onSearch?: () => void;
  onSave?: () => void;
  onClose?: () => void;
  onDuplicate?: () => void;
  onHelp?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: New entry
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        handlers.onNewEntry?.();
      }

      // Ctrl/Cmd + F: Search
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        handlers.onSearch?.();
      }

      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handlers.onSave?.();
      }

      // Ctrl/Cmd + D: Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        handlers.onDuplicate?.();
      }

      // Escape: Close
      if (e.key === "Escape") {
        handlers.onClose?.();
      }

      // ?: Help
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlers.onHelp?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
