
import { Skeleton } from "@/components/ui/skeleton";

const QuickDialSkeleton = () => (
  <div className="flex items-center space-x-4 p-3">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-[150px]" />
      <Skeleton className="h-3 w-[100px]" />
    </div>
    <div className="flex space-x-2">
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  </div>
);

export default QuickDialSkeleton;
