type JobHandler = (data: any) => Promise<void>;

interface Job {
  id: string;
  type: string;
  data: any;
  status: "pending" | "running" | "completed" | "failed";
  attempts: number;
  maxAttempts: number;
  error?: string;
  createdAt: Date;
}

class QueueService {
  private handlers = new Map<string, JobHandler>();
  private queue: Job[] = [];
  private processing = false;

  constructor() {
    // Start background processing tick
    setInterval(() => this.processQueue(), 1000);
  }

  // Register worker handler
  registerHandler(type: string, handler: JobHandler): void {
    this.handlers.set(type, handler);
    console.log(`[Queue] Handler registered for job type: ${type}`);
  }

  // Enqueue a background job
  addJob(type: string, data: any, maxAttempts = 3): string {
    const job: Job = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      data,
      status: "pending",
      attempts: 0,
      maxAttempts,
      createdAt: new Date(),
    };

    this.queue.push(job);
    console.log(`[Queue] Job added: ${type} (ID: ${job.id})`);
    
    // Trigger immediate process loop
    setImmediate(() => this.processQueue());
    
    return job.id;
  }

  // Process queue loop
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      const pendingJob = this.queue.find((job) => job.status === "pending");
      if (!pendingJob) {
        this.processing = false;
        return;
      }

      pendingJob.status = "running";
      pendingJob.attempts += 1;

      console.log(`[Queue] Running job: ${pendingJob.type} (ID: ${pendingJob.id}), Attempt: ${pendingJob.attempts}`);

      const handler = this.handlers.get(pendingJob.type);
      if (!handler) {
        throw new Error(`No worker handler registered for job type: ${pendingJob.type}`);
      }

      await handler(pendingJob.data);
      pendingJob.status = "completed";
      console.log(`[Queue] Job completed successfully: ${pendingJob.type} (ID: ${pendingJob.id})`);
      
      // Remove completed job from active queue to save memory
      this.queue = this.queue.filter((job) => job.id !== pendingJob.id);
    } catch (error: any) {
      const runningJob = this.queue.find((job) => job.status === "running");
      if (runningJob) {
        runningJob.error = error.message || String(error);
        if (runningJob.attempts >= runningJob.maxAttempts) {
          runningJob.status = "failed";
          console.error(`[Queue] Job failed permanently after ${runningJob.attempts} attempts: ${runningJob.type} (ID: ${runningJob.id}). Error: ${runningJob.error}`);
        } else {
          runningJob.status = "pending";
          console.warn(`[Queue] Job error. Re-enqueued: ${runningJob.type} (ID: ${runningJob.id}). Error: ${runningJob.error}`);
        }
      }
    } finally {
      this.processing = false;
      // If there are more pending tasks, process again immediately
      const hasMore = this.queue.some((job) => job.status === "pending");
      if (hasMore) {
        setImmediate(() => this.processQueue());
      }
    }
  }
}

export const queueService = new QueueService();
export default queueService;
