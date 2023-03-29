/**
 * A data transfer object for passing response data.
 */
export class ResponseDto {
  public status: number;
  public message: string | string[];
  public data: any;

  constructor(status: number, message: string | string[], data: any) {
    this.status = status;
    this.message = message;
    this.data = data;
  }
}
