import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';

export function useEvaluationSummary(courseId: number | null, enabled = true) {
  return useQuery(trpc.evaluation.summary.queryOptions({ courseId: courseId! }, {
    enabled: enabled && courseId != null,
    staleTime: 5 * 60 * 1000,
  }));
}
