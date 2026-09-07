import { useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { trpc } from '@/lib/trpc';

interface UseChatHistoryParams {
  courseId?: number;
  shareToken?: string;
  enabled: boolean;
}

export function useChatHistory({ courseId, shareToken, enabled }: UseChatHistoryParams) {
  const queryClient = useQueryClient();
  const historyInput = useMemo(
    () => ({ courseId: courseId!, limit: 100, offset: 0 }),
    [courseId],
  );
  const evaluationsInput = useMemo(
    () => ({ courseId: courseId!, limit: 200, offset: 0 }),
    [courseId],
  );

  const historyQuery = useQuery(trpc.chat.history.queryOptions(historyInput, {
    enabled: enabled && !!courseId && !shareToken,
  }));

  const evaluationsQuery = useQuery(trpc.evaluation.logs.queryOptions(evaluationsInput, {
    enabled: enabled && !!courseId && !shareToken,
  }));

  useEffect(() => {
    if (enabled && historyQuery.error) {
      console.error('Failed to load history', historyQuery.error);
    }
  }, [enabled, historyQuery.error]);

  useEffect(() => {
    if (enabled && evaluationsQuery.error) {
      console.error('Failed to load chat evaluations', evaluationsQuery.error);
    }
  }, [enabled, evaluationsQuery.error]);

  const historyWithEvaluations = (() => {
    const history = historyQuery.data?.data ?? null;
    if (!history) return null;

    const evaluationsByChatLogId = new Map(
      (evaluationsQuery.data?.data ?? []).map((evaluation) => [evaluation.chat_log_id, evaluation]),
    );

    return history.map((item) => ({
      ...item,
      evaluation: evaluationsByChatLogId.get(item.id),
    }));
  })();

  const exportHistoryCsvMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || shareToken) {
        return;
      }
      await apiClient.exportChatHistoryCsv(courseId);
    },
    onError: (e) => {
      console.error('Failed to export CSV', e);
    },
  });

  const exportHistoryCsv = useCallback(async () => {
    if (!courseId || shareToken) {
      return;
    }
    try {
      await exportHistoryCsvMutation.mutateAsync();
    } catch {
      // Handled in mutation onError.
    }
  }, [exportHistoryCsvMutation, courseId, shareToken]);

  const syncFeedbackInHistoryCache = useCallback(
    (chatLogId: number, nextFeedback: 'good' | 'bad' | null) => {
      if (!courseId || shareToken) return;
      queryClient.setQueryData(trpc.chat.history.queryKey(historyInput), (prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.map((item) =>
                item.id === chatLogId ? { ...item, feedback: nextFeedback } : item,
              ),
            }
          : prev);
    },
    [courseId, historyInput, shareToken, queryClient],
  );

  return {
    history: historyWithEvaluations,
    historyLoading:
      historyQuery.isLoading ||
      historyQuery.isFetching ||
      evaluationsQuery.isLoading ||
      evaluationsQuery.isFetching,
    historyError: historyQuery.error,
    exportHistoryCsv,
    isExportingHistoryCsv: exportHistoryCsvMutation.isPending,
    syncFeedbackInHistoryCache,
  };
}
