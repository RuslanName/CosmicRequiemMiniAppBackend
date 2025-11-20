import * as os from 'os';
import { ENV } from './constants';

const cluster = require('cluster');

export const CLUSTER_CONFIG = {
  enabled: ENV.CLUSTER_ENABLED,
  workers: ENV.CLUSTER_WORKERS
    ? parseInt(ENV.CLUSTER_WORKERS, 10)
    : os.cpus().length,
};

export function isMaster(): boolean {
  return cluster.isPrimary || cluster.isMaster;
}

export function setupCluster(bootstrap: () => Promise<void>): void {
  if (!CLUSTER_CONFIG.enabled) {
    bootstrap();
    return;
  }

  if (isMaster()) {
    console.log(`Master process ${process.pid} is running`);
    console.log(`Starting ${CLUSTER_CONFIG.workers} workers...`);

    for (let i = 0; i < CLUSTER_CONFIG.workers; i++) {
      const worker = cluster.fork();
      console.log(`Worker ${worker.process.pid} started`);
    }

    cluster.on('exit', (worker, code, signal) => {
      console.log(
        `Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Restarting...`,
      );
      const newWorker = cluster.fork();
      console.log(`Worker ${newWorker.process.pid} restarted`);
    });

    cluster.on('online', (worker) => {
      console.log(`Worker ${worker.process.pid} is online`);
    });

    cluster.on('disconnect', (worker) => {
      console.log(`Worker ${worker.process.pid} disconnected`);
    });
  } else {
    console.log(`Worker process ${process.pid} is running`);
    bootstrap();
  }
}
