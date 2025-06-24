import { useQuery } from '@tanstack/react-query';
import { mailApi } from '../services/mailApi';

export function useMessage(messageId: string | null) {
  return useQuery({
    queryKey: ['message', messageId],
    queryFn: () => mailApi.getMessage(messageId!),
    enabled: !!messageId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}