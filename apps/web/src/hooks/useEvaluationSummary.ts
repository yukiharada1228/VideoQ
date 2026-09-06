import { trpc } from '@/lib/trpc';

export function useEvaluationSummary(courseId: number | null, enabled = true) {
  return trpc.evaluation.summary.useQuery({ courseId: courseId! }, {
    enabled: enabled && courseId != null,
    staleTime: 5 * 60 * 1000,
  });
}
