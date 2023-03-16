/**
 * A data transfer object for passing response data.
 */
export class ResponseDto {
  public statusCode: number;
  public message: string[];
  public data: any;

  constructor(statusCode: number, message: string[], data: any) {}
}
