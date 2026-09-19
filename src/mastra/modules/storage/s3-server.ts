import S3rver from 's3rver';
import { S3Config } from './config';

export interface S3Server {
  run(): Promise<void>;
  close(): Promise<void>;
}

export function createS3Server(config: S3Config): S3Server {
  const server = new S3rver({
    port: config.port,
    address: config.address,
    directory: config.directory,
    silent: config.silent,
    configureBuckets: [{ name: config.bucket }],
  });

  return {
    run: () => server.run(),
    close: () => server.close(),
  };
}
