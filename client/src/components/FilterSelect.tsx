import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type FilterSelectProps = {
  onFilterChange: (period: string) => void;
};

export default function FilterSelect({ onFilterChange }: FilterSelectProps) {
  const [selectedFilter, setSelectedFilter] = useState('week');
  
  useEffect(() => {
    onFilterChange(selectedFilter);
  }, [selectedFilter, onFilterChange]);

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4">
      <div className="p-4">
        <Label htmlFor="filter-select" className="block text-sm font-medium text-gray-700 mb-1">
          View Period
        </Label>
        <Select 
          value={selectedFilter} 
          onValueChange={setSelectedFilter}
        >
          <SelectTrigger id="filter-select" className="w-full md:w-48">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="1">Last day</SelectItem>
            <SelectItem value="3">Last 3 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
