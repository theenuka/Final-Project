import { Queue, Worker, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { deliverNotification } from "./deliver";
import { notificationConfig } from "./config";
import { NotificationJobPayload } from "./types";

let queue: Queue<NotificationJobPayload> | null = null;
let workerStarted = false;

if (
  notificationConfig.queueMode !== "inline" &&
  notificationConfig.queueMode !== "off" &&
  notificationConfig.redisUrl !== "inline" &&
  notificationConfig.redisUrl !== "off"
) {
  try {
    const connection = new IORedis(notificationConfig.redisUrl);
    queue = new Queue<NotificationJobPayload>(notificationConfig.queueName, { connection });
    const startWorkerInternal = () => {
      if (workerStarted) return;
      const worker = new Worker<NotificationJobPayload>(notificationConfig.queueName, async (job) => {
        await deliverNotification(job.data);
      }, { connection });
      worker.on("failed", (job, err) => {
        console.error("[notification:queue:failed]", job?.id, err);
      });
      worker.on("completed", (job) => {
        console.log("[notification:queue:completed]", job.id);
      });
      workerStarted = true;
    };

    startWorkerInternal();
  } catch (error) {
    console.error("[notification:queue:init:error]", error);
    queue = null;
  }
}

export const enqueueNotification = async (payload: NotificationJobPayload) => {
  if (queue) {
    const jobOptions: JobsOptions = {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: true,
      removeOnFail: 500,
    };
    await queue.add("notify", payload, jobOptions);
    return { queued: true };
  }
  await deliverNotification(payload);
  return { queued: false };
};