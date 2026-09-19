import { ZodIssue } from 'zod';

export class ValidationError extends Error {
  public issues: ZodIssue[];
  constructor(message: string, issues: ZodIssue[]) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}
