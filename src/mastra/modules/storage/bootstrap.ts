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

let clientPromise: Promise<ObjectClient> | null = null;

export async function objectClient(config: S3Config = s3Config): Promise<ObjectClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const server = createS3Server(config);
      await server.run();

      const client = new S3Client({
        endpoint: getEndpoint(config),
        region: config.region,
        forcePathStyle: true,
        credentials: config.credentials,
      });

      const service = createObjectService({ client, config });
      await service.ensureBucket();

      return {
        service,
        config,
        endpoint: getEndpoint(config),
        async close() {
          client.destroy();
          await server.close();
          clientPromise = null;
        },
      };
    })();
  }
  return clientPromise;
}

export async function getObjectService(config: S3Config = s3Config): Promise<ObjectService> {
  const client = await objectClient(config);
  return client.service;
}
