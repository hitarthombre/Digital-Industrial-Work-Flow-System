// Error carrying an HTTP status code, picked up by the global errorHandler
export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const notFound = (resource: string) => new HttpError(404, `${resource} not found`);
export const badRequest = (message: string) => new HttpError(400, message);

export default HttpError;
