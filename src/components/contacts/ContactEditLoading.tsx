
import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ContactEditLoading = () => {
  return (
    <Card className="w-full max-w-3xl mx-auto my-8">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-40" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </CardContent>
    </Card>
  );
};
