"use client";
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download, Eye } from 'lucide-react';
import { AssetRow } from '@/lib/types';
import { formatMoney } from '@/lib/format';

interface EnhancedDataTableProps {
  assets: AssetRow[];
  onViewDetail?: (asset: AssetRow) => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'available':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'rented':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'under_maintenance':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const formatStatus = (status: string) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export function EnhancedDataTable({ assets, onViewDetail }: EnhancedDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.asset_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.machine_id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const uniqueStatuses = Array.from(new Set(assets.map(a => a.status)));

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Fleet Assets</CardTitle>
            <CardDescription>
              Comprehensive overview of all fleet assets and their current status
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="font-semibold">Asset ID</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Manufacturer</TableHead>
                <TableHead className="font-semibold">Year</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Current Renter</TableHead>
                <TableHead className="font-semibold text-right">Rate/Day</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset, index) => (
                <TableRow key={`${asset.machine_id}-${index}`} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      #{asset.machine_id}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium capitalize">
                      {asset.asset_type}
                    </div>
                  </TableCell>
                  <TableCell>{asset.manufacturer}</TableCell>
                  <TableCell>{asset.year_of_manufacture}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(asset.status)}>
                      {formatStatus(asset.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {asset.currentRenter ? (
                      <span className="text-sm font-medium">{asset.currentRenter}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMoney(Number(asset.rental_price_per_day))}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-gray-500">
                      {Number(asset.current_location_lat).toFixed(3)}, {Number(asset.current_location_lon).toFixed(3)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewDetail?.(asset)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex items-center justify-between pt-4 text-sm text-gray-500">
          <span>
            Showing {filteredAssets.length} of {assets.length} assets
          </span>
          <span>
            {assets.filter(a => a.status === 'available').length} available • {' '}
            {assets.filter(a => a.status === 'rented').length} rented • {' '}
            {assets.filter(a => a.status === 'under_maintenance').length} in maintenance
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
