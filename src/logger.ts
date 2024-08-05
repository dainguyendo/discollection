import { Logger } from "tslog";

const loggerSingleton = () => {
  return new Logger();
};

declare const globalThis: {
  logger: ReturnType<typeof loggerSingleton>;
} & typeof global;

const logger = globalThis.logger ?? loggerSingleton();

export default logger;

if (process.env.NODE_ENV !== "production") globalThis.logger = logger;
