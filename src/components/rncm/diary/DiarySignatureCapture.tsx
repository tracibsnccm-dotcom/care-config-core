import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDiarySignatures } from "@/hooks/useDiarySignatures";
import { CheckCircle, X } from "lucide-react";
import { useRef, useState } from "react";

interface DiarySignatureCaptureProps {
  entryId: string;
  signerRole: string;
}

export function DiarySignatureCapture({ entryId, signerRole }: DiarySignatureCaptureProps) {
  const { signatures, saveSignature } = useDiarySignatures(entryId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const signatureData = canvas.toDataURL();
    await saveSignature(signatureData, signerRole);
    clearSignature();
  };

  const existingSignature = signatures.find((s) => s.signer_role === signerRole);

  if (existingSignature) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Signed by {signerRole}</span>
        </div>
        <img
          src={existingSignature.signature_data}
          alt="Signature"
          className="mt-2 h-24 border rounded"
        />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h4 className="font-medium">Sign as {signerRole}</h4>
        <div className="border rounded bg-white">
          <canvas
            ref={canvasRef}
            width={400}
            height={150}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="cursor-crosshair w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!hasSignature}>
            Save Signature
          </Button>
          <Button variant="outline" onClick={clearSignature}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
}
