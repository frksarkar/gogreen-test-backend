import Redis from "ioredis";
import config from ".";

let _redisClient: Redis | null = null;

function getRedisInstance(): Redis {
  if (!_redisClient) {
    _redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      username: config.redis.username,
      password: config.redis.password,
      maxRetriesPerRequest: null,
    });
    _redisClient.on("error", (err) => console.log("Redis Client Error", err));
    _redisClient.on("connect", () =>
      console.log("Redis Client Connected from redis.config.ts"),
    );
  }
  return _redisClient;
}

export const redisClient = new Proxy({} as Redis, {
  get(_target, prop: keyof Redis) {
    const client = getRedisInstance();
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export const bullMQConnection = {
  host: config.redis.host,
  port: config.redis.port,
  username: config.redis.username,
  password: config.redis.password,
};
