
"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, DocumentData, QuerySnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BloodRequest, BloodGroup } from '@/types';
import { bloodGroups } from '@/types';
import { BloodRequestCard } from '@/components/BloodRequestCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ListChecks, Search, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export default function ViewRequestsPage() {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [bloodGroupFilter, setBloodGroupFilter] = useState<BloodGroup | "all">("all");
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    // Base query: order by urgency (custom logic needed as Firestore doesn't support multiple inequalities on different fields easily for complex sorting like 'Urgency' string)
    // For simplicity, we sort by createdAt and then client-side for urgency if needed, or rely on combined field.
    // The prompt mentions "sorted primarily by urgency, then by recency". Firestore doesn't do this well with string-based urgency.
    // A common workaround is numeric urgency (Urgent=1, Moderate=2, Low=3) or composite fields.
    // Here, we'll sort by recency and let users filter. Urgency is displayed on cards.
    const q = query(collection(db, "requests"), where("status", "==", "active"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
      const fetchedRequests: BloodRequest[] = [];
      querySnapshot.forEach((doc) => {
        fetchedRequests.push({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt as Timestamp } as BloodRequest);
      });
      setRequests(fetchedRequests);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching requests:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests
      .filter(req => bloodGroupFilter === "all" || req.bloodGroup === bloodGroupFilter)
      .filter(req => locationFilter === "" || req.location.toLowerCase().includes(locationFilter.toLowerCase()))
      .sort((a, b) => {
        // Urgency sort: Urgent > Moderate > Low
        const urgencyOrder = { Urgent: 1, Moderate: 2, Low: 3 };
        if (urgencyOrder[a.urgency] < urgencyOrder[b.urgency]) return -1;
        if (urgencyOrder[a.urgency] > urgencyOrder[b.urgency]) return 1;
        // Then by recency (already handled by Firestore query in this basic setup)
        // For client-side sort consistency if Firestore sort changes:
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });
  }, [requests, bloodGroupFilter, locationFilter]);

  const resetFilters = () => {
    setBloodGroupFilter("all");
    setLocationFilter("");
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <ListChecks className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold">Active Blood Requests</h1>
        <p className="text-muted-foreground mt-2">Find blood requests based on your criteria.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-card shadow">
        <div>
          <label htmlFor="bloodGroupFilter" className="block text-sm font-medium mb-1">Blood Group</label>
          <Select value={bloodGroupFilter} onValueChange={(value) => setBloodGroupFilter(value as BloodGroup | "all")}>
            <SelectTrigger id="bloodGroupFilter">
              <SelectValue placeholder="Filter by blood group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Blood Groups</SelectItem>
              {bloodGroups.map(group => (
                <SelectItem key={group} value={group}>{group}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="locationFilter" className="block text-sm font-medium mb-1">Location</label>
          <div className="relative">
            <Input
              id="locationFilter"
              type="text"
              placeholder="Filter by hospital or area"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="md:self-end">
            <Button onClick={resetFilters} variant="outline" className="w-full">
                <RotateCcw className="h-4 w-4 mr-2"/> Reset Filters
            </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-lg">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/3" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map(request => (
            <BloodRequestCard key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-card rounded-lg shadow">
          <p className="text-xl text-muted-foreground">No blood requests match your current filters.</p>
          <p className="mt-2">Try adjusting your search or check back later.</p>
        </div>
      )}
    </div>
  );
}
