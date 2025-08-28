import { Badge } from "@/components/ui/badge";

export function AnomalyChips({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((a) => (
        <Badge key={a} variant="secondary">{a}</Badge>
      ))}
    </div>
  );
}


