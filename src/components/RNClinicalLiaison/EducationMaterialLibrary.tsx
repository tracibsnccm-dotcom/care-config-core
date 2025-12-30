import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Video, FileText, Download, Share2, Plus, Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EducationMaterialLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [materialTypeFilter, setMaterialTypeFilter] = useState("all");

  // Placeholder data
  const materials = [
    {
      id: "1",
      title: "Understanding Your Back Pain",
      description: "Comprehensive guide to managing chronic back pain",
      category: "Pain Management",
      material_type: "pdf",
      diagnosis_tags: ["back_pain", "chronic_pain"],
      reading_level: "general",
      duration_minutes: 15,
    },
    {
      id: "2",
      title: "Physical Therapy Exercises for Whiplash",
      description: "Video demonstration of safe exercises",
      category: "Physical Therapy",
      material_type: "video",
      diagnosis_tags: ["whiplash", "neck_pain"],
      duration_minutes: 20,
    },
    {
      id: "3",
      title: "Nutrition Guide for Healing",
      description: "Foods that support recovery from injury",
      category: "Nutrition",
      material_type: "guide",
      diagnosis_tags: ["general"],
      reading_level: "high_school",
    },
  ];

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-5 h-5" />;
      case "pdf":
      case "guide":
        return <FileText className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Education Material Library</h2>
          <p className="text-sm text-muted-foreground">Share educational resources with clients</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Material
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="pain_management">Pain Management</SelectItem>
                <SelectItem value="physical_therapy">Physical Therapy</SelectItem>
                <SelectItem value="nutrition">Nutrition</SelectItem>
                <SelectItem value="mental_health">Mental Health</SelectItem>
              </SelectContent>
            </Select>
            <Select value={materialTypeFilter} onValueChange={setMaterialTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pdf">PDF Documents</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="guide">Guides</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((material) => (
          <Card key={material.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getMaterialIcon(material.material_type)}
                  <Badge variant="outline">{material.category}</Badge>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {material.material_type}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-2">{material.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{material.description}</p>
              <div className="flex flex-wrap gap-1">
                {material.diagnosis_tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag.replace("_", " ")}
                  </Badge>
                ))}
              </div>
              {material.duration_minutes && (
                <p className="text-xs text-muted-foreground">
                  Duration: {material.duration_minutes} minutes
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button size="sm" className="flex-1">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder for no results */}
      {materials.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No materials found. Try adjusting your filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
