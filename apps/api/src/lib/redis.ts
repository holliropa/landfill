import config from "@/config";

function getRedisConnectionOptions() {
  const redisUrl = new URL(config.redis.url);

  return {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    username: redisUrl.username,
    password: redisUrl.password,
    db: Number(redisUrl.pathname.slice(1) || 0),
  };
}

export function createQueueRedisConnection() {
  return {
    ...getRedisConnectionOptions(),
    maxRetriesPerRequest: 1,
  };
}

export function createWorkerRedisConnection() {
  return {
    ...getRedisConnectionOptions(),
    maxRetriesPerRequest: null,
  };
}
