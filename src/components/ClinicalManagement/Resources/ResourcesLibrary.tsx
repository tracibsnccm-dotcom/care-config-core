import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useManagementResources } from "@/hooks/useManagementResources";
import { FileText, Download, Search, Star, Upload } from "lucide-react";
import { useState } from "react";

export function ResourcesLibrary() {
  const { resources, loading } = useManagementResources();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredResources = resources.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    return <FileText className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      policy: 'bg-blue-100 text-blue-800 border-blue-200',
      template: 'bg-green-100 text-green-800 border-green-200',
      guide: 'bg-purple-100 text-purple-800 border-purple-200',
      training: 'bg-orange-100 text-orange-800 border-orange-200',
      form: 'bg-pink-100 text-pink-800 border-pink-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      clinical: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      compliance: 'bg-amber-100 text-amber-800 border-amber-200',
      hr: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      operations: 'bg-violet-100 text-violet-800 border-violet-200',
      legal: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading resources...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Resources Library</h2>
          <p className="text-sm text-muted-foreground mt-1">Access policies, templates, and guides</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Resource
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Featured Resources */}
      {resources.some(r => r.is_featured) && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Featured Resources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.filter(r => r.is_featured).slice(0, 3).map((resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow border-2 border-amber-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getTypeIcon(resource.resource_type)}
                        {resource.title}
                      </CardTitle>
                    </div>
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={`text-xs ${getTypeColor(resource.resource_type)}`}>
                      {resource.resource_type}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${getCategoryColor(resource.category)}`}>
                      {resource.category}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="h-3 w-3 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Resources */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">All Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {getTypeIcon(resource.resource_type)}
                  {resource.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={`text-xs ${getTypeColor(resource.resource_type)}`}>
                    {resource.resource_type}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${getCategoryColor(resource.category)}`}>
                    {resource.category}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="h-3 w-3 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {filteredResources.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No resources found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}