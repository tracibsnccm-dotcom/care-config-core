import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters?: {
    name: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder: string;
  }[];
}

export function FilterBar({ search, onSearchChange, filters }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      {filters?.map((filter) => (
        <Select key={filter.name} value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={filter.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {filter.placeholder}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}