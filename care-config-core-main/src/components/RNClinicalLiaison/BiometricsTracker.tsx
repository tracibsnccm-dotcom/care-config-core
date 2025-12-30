import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, TrendingUp, TrendingDown, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface BiometricsTrackerProps {
  caseId: string;
}

interface BiometricRecord {
  id: string;
  date: string;
  height_cm?: number;
  weight_kg: number;
  bmi: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  temperature_f?: number;
  recorded_by: string;
}

const biometricSchema = z.object({
  height_cm: z.number().min(50, "Height must be at least 50 cm").max(250, "Height must be less than 250 cm").optional(),
  weight_kg: z.number().min(20, "Weight must be at least 20 kg").max(300, "Weight must be less than 300 kg"),
  blood_pressure_systolic: z.number().min(60).max(250).optional(),
  blood_pressure_diastolic: z.number().min(40).max(150).optional(),
  heart_rate: z.number().min(30).max(200).optional(),
  temperature_f: z.number().min(95).max(106).optional(),
});

export default function BiometricsTracker({ caseId }: BiometricsTrackerProps) {
  const [records] = useState<BiometricRecord[]>([
    {
      id: "1",
      date: "2025-01-28",
      height_cm: 170,
      weight_kg: 75,
      bmi: 25.95,
      blood_pressure_systolic: 120,
      blood_pressure_diastolic: 80,
      heart_rate: 72,
      temperature_f: 98.6,
      recorded_by: "M. Garcia, RN CCM",
    },
    {
      id: "2",
      date: "2025-01-15",
      height_cm: 170,
      weight_kg: 76.5,
      bmi: 26.48,
      blood_pressure_systolic: 125,
      blood_pressure_diastolic: 82,
      heart_rate: 75,
      recorded_by: "M. Garcia, RN CCM",
    },
    {
      id: "3",
      date: "2025-01-01",
      height_cm: 170,
      weight_kg: 78,
      bmi: 26.99,
      blood_pressure_systolic: 128,
      blood_pressure_diastolic: 85,
      heart_rate: 78,
      recorded_by: "Primary Care",
    },
  ]);

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [calculatedBMI, setCalculatedBMI] = useState<number | null>(null);
  const [bmiCategory, setBmiCategory] = useState("");
  const { toast } = useToast();

  const calculateBMI = () => {
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    try {
      biometricSchema.parse({
        height_cm: heightNum,
        weight_kg: weightNum,
      });

      const bmi = weightNum / ((heightNum / 100) ** 2);
      setCalculatedBMI(parseFloat(bmi.toFixed(2)));

      let category = "";
      if (bmi < 18.5) category = "Underweight";
      else if (bmi >= 18.5 && bmi < 25) category = "Normal weight";
      else if (bmi >= 25 && bmi < 30) category = "Overweight";
      else category = "Obese";

      setBmiCategory(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  const getBMIColor = (bmi: number) => {
    if (bmi < 18.5) return "text-blue-600";
    if (bmi >= 18.5 && bmi < 25) return "text-green-600";
    if (bmi >= 25 && bmi < 30) return "text-orange-600";
    return "text-red-600";
  };

  const getBMIBadge = (bmi: number) => {
    let label = "";
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";

    if (bmi < 18.5) {
      label = "Underweight";
      variant = "secondary";
    } else if (bmi >= 18.5 && bmi < 25) {
      label = "Normal";
      variant = "default";
    } else if (bmi >= 25 && bmi < 30) {
      label = "Overweight";
      variant = "secondary";
    } else {
      label = "Obese";
      variant = "destructive";
    }

    return <Badge variant={variant}>{label}</Badge>;
  };

  const getTrend = (current: number, previous: number) => {
    if (current < previous) return <TrendingDown className="h-4 w-4 text-green-500" />;
    if (current > previous) return <TrendingUp className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const latestRecord = records[0];
  const previousRecord = records[1];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Current BMI</p>
            {previousRecord && getTrend(latestRecord.bmi, previousRecord.bmi)}
          </div>
          <p className={`text-2xl font-bold ${getBMIColor(latestRecord.bmi)}`}>{latestRecord.bmi}</p>
          {getBMIBadge(latestRecord.bmi)}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Weight</p>
            {previousRecord && getTrend(latestRecord.weight_kg, previousRecord.weight_kg)}
          </div>
          <p className="text-2xl font-bold">{latestRecord.weight_kg} kg</p>
          <p className="text-xs text-muted-foreground">
            {(latestRecord.weight_kg * 2.20462).toFixed(1)} lbs
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Blood Pressure</p>
            {previousRecord && latestRecord.blood_pressure_systolic && previousRecord.blood_pressure_systolic && 
              getTrend(latestRecord.blood_pressure_systolic, previousRecord.blood_pressure_systolic)}
          </div>
          <p className="text-2xl font-bold">
            {latestRecord.blood_pressure_systolic || "—"}/{latestRecord.blood_pressure_diastolic || "—"}
          </p>
          <p className="text-xs text-muted-foreground">mmHg</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Heart Rate</p>
            {previousRecord && latestRecord.heart_rate && previousRecord.heart_rate &&
              getTrend(latestRecord.heart_rate, previousRecord.heart_rate)}
          </div>
          <p className="text-2xl font-bold">{latestRecord.heart_rate || "—"}</p>
          <p className="text-xs text-muted-foreground">bpm</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">BMI Calculator</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              placeholder="170"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              min="50"
              max="250"
            />
          </div>

          <div>
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="75"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min="20"
              max="300"
            />
          </div>

          <div className="flex items-end">
            <Button onClick={calculateBMI} className="w-full">
              Calculate BMI
            </Button>
          </div>
        </div>

        {calculatedBMI !== null && (
          <div className="mt-4 p-4 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calculated BMI</p>
                <p className={`text-3xl font-bold ${getBMIColor(calculatedBMI)}`}>{calculatedBMI}</p>
                <p className="text-sm text-muted-foreground mt-1">{bmiCategory}</p>
              </div>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Save Record
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Biometric History</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Height (cm)</TableHead>
              <TableHead>Weight (kg)</TableHead>
              <TableHead>BMI</TableHead>
              <TableHead>BP (mmHg)</TableHead>
              <TableHead>HR (bpm)</TableHead>
              <TableHead>Temp (°F)</TableHead>
              <TableHead>Recorded By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record, index) => (
              <TableRow key={record.id}>
                <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                <TableCell>{record.height_cm || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {record.weight_kg}
                    {index < records.length - 1 && getTrend(record.weight_kg, records[index + 1].weight_kg)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${getBMIColor(record.bmi)}`}>{record.bmi}</span>
                    {getBMIBadge(record.bmi)}
                  </div>
                </TableCell>
                <TableCell>
                  {record.blood_pressure_systolic && record.blood_pressure_diastolic
                    ? `${record.blood_pressure_systolic}/${record.blood_pressure_diastolic}`
                    : "—"}
                </TableCell>
                <TableCell>{record.heart_rate || "—"}</TableCell>
                <TableCell>{record.temperature_f || "—"}</TableCell>
                <TableCell className="text-sm">{record.recorded_by}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
        <div className="flex gap-3">
          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">BMI Reference Ranges</p>
            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
              <p>• Underweight: BMI &lt; 18.5</p>
              <p>• Normal weight: BMI 18.5 - 24.9</p>
              <p>• Overweight: BMI 25 - 29.9</p>
              <p>• Obese: BMI ≥ 30</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
