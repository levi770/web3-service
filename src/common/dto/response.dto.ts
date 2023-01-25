/**
 * A data transfer object for passing response data.
 */
export class Response {
  status: number;
  message: string | null;
  data: any;

  constructor(status: number, message: string | null, result: any) {
    this.status = status;
    this.message = message;
    this.data = result;
  }
}
