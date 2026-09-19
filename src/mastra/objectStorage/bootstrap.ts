import { S3Client } from '@aws-sdk/client-s3';
import { s3Config, getEndpoint, S3Config } from './config';
import { createS3Server } from './s3-server';
import { createObjectService, ObjectService } from './object-service';

export interface ObjectClient {
  service: ObjectService;
  config: S3Config;
  endpoint: string;
  close(): Promise<void>;
}

export async function objectClient(config: S3Config = s3Config): Promise<ObjectClient> {
  const server = createS3Server(config);
  await server.run();

  const client = new S3Client({
    endpoint: getEndpoint(config),
    region: config.region,
    forcePathStyle: true,
    credentials: config.credentials,
  });

  const service = createObjectService({ client, config });

  return {
    service,
    config,
    endpoint: getEndpoint(config),
    async close() {
      client.destroy();
      await server.close();
    },
  };
}
