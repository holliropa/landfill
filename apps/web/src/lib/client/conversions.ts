import { useMutation, useQuery } from "@tanstack/react-query";
import { createConversionJob, getConversionTargets } from "./api";
import type { CreateConversion } from "./types";

export function useConversionTargets(fileId: string | null) {
  return useQuery({
    queryKey: ["conversion-targets", fileId],
    queryFn: () => getConversionTargets(fileId!),
    enabled: !!fileId,
  });
}

export function useCreateConversion() {
  return useMutation({
    mutationFn: (input: CreateConversion) => createConversionJob(input),
  });
}
