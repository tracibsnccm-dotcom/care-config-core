import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QualityProject } from "@/hooks/useQualityProjects";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Target, CheckCircle, Clock } from "lucide-react";

interface QualityMetricsDashboardProps {
  projects: QualityProject[];
}

export function QualityMetricsDashboard({ projects }: QualityMetricsDashboardProps) {
  // Calculate summary statistics
  const totalProjects = projects.length;
  const completedProjects = projects.filter((p) => p.status === "Completed").length;
  const inProgressProjects = projects.filter((p) => p.status === "In Progress").length;
  const avgImprovement =
    projects
      .filter((p) => p.improvement_percentage !== null)
      .reduce((acc, p) => acc + (p.improvement_percentage || 0), 0) /
      projects.filter((p) => p.improvement_percentage !== null).length || 0;

  // Status distribution data
  const statusData = [
    { name: "Planning", value: projects.filter((p) => p.status === "Planning").length },
    { name: "In Progress", value: inProgressProjects },
    { name: "On Hold", value: projects.filter((p) => p.status === "On Hold").length },
    { name: "Under Review", value: projects.filter((p) => p.status === "Under Review").length },
    { name: "Completed", value: completedProjects },
  ].filter((item) => item.value > 0);

  // Category distribution
  const categoryData = projects.reduce((acc: any[], project) => {
    const existing = acc.find((item) => item.category === project.category);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ category: project.category, count: 1 });
    }
    return acc;
  }, []);

  // Improvement trends (top performers)
  const improvementData = projects
    .filter((p) => p.improvement_percentage !== null && p.improvement_percentage > 0)
    .sort((a, b) => (b.improvement_percentage || 0) - (a.improvement_percentage || 0))
    .slice(0, 5)
    .map((p) => ({
      name: p.project_name.length > 20 ? p.project_name.substring(0, 20) + "..." : p.project_name,
      improvement: p.improvement_percentage?.toFixed(1),
    }));

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-3xl font-bold">{totalProjects}</p>
              </div>
              <Target className="h-10 w-10 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{inProgressProjects}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completedProjects}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Improvement</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {avgImprovement > 0 ? "+" : ""}
                  {avgImprovement.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
            <CardDescription>Current status of all quality improvement projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Projects by Category</CardTitle>
            <CardDescription>Distribution across improvement categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performers */}
        {improvementData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Top Performing Projects</CardTitle>
              <CardDescription>Projects with highest improvement percentages</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={improvementData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" unit="%" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="improvement" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
