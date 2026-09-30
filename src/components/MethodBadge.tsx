import { HttpMethod } from '@/lib/types';
import { cn } from '@/lib/utils';

export function MethodBadge({ method, className }: { method: HttpMethod; className?: string }) {
  const colors: Record<HttpMethod, string> = {
    GET: 'text-blue-400',
    POST: 'text-green-400',
    PUT: 'text-yellow-400',
    PATCH: 'text-orange-400',
    DELETE: 'text-red-400',
    OPTIONS: 'text-purple-400',
    HEAD: 'text-gray-400',
  };

  return (
    <span className={cn('font-bold text-xs uppercase tracking-wider', colors[method], className)}>
      {method}
    </span>
  );
}
