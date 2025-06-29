import { Skeleton } from "@saasfly/ui/skeleton";

export default function Loading() {
  // Create arrays with specific lengths
  const detailsArray = Array.from({ length: 6 }, (_, i) => i);
  const featuresArray = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-[60vh] w-full rounded-2xl mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="col-span-2">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {detailsArray.map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="h-8 w-32 mb-4" />
          {featuresArray.map((i) => (
            <Skeleton key={i} className="h-6 w-full mb-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
