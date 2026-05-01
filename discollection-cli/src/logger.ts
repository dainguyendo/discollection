import { Logger } from "tslog";

const loggerSingleton = () => {
  return new Logger();
};

type GlobalWithLogger = typeof globalThis & {
  logger?: ReturnType<typeof loggerSingleton>;
};

const customGlobal = globalThis as GlobalWithLogger;

const logger = customGlobal.logger ?? loggerSingleton();

export default logger;

if (process.env.NODE_ENV !== "production") customGlobal.logger = logger;
