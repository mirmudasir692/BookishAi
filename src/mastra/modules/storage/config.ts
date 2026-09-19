export interface S3Config {
  port: number;
  address: string;
  directory: string;
  bucket: string;
  silent: boolean;
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export const s3Config: S3Config = {
  port: 4568,
  address: '127.0.0.1',
  directory: './.s3rver',
  bucket: 'test-bucket',
  silent: true,
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'S3RVER',
    secretAccessKey: 'S3RVER',
  },
};

export const getEndpoint = (config: S3Config) => `http://${config.address}:${config.port}`;
