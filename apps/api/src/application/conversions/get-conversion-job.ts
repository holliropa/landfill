import { conversionQueue } from "@/jobs/conversion/queue";

export async function getConversionJob(id: string) {
  const job = await conversionQueue.getJob(id);

  if (!job) {
    return { success: false as const, code: "NOT_FOUND" as const };
  }

  const state = await job.getState();

  return {
    success: true as const,
    data:{
      id: job.id,
      status: state,
      progress: typeof job.progress === "number" ? job.progress : 0,
      result: job.returnvalue ?? null,
      failedReason: job.failedReason ?? null,
    }
  }
}
