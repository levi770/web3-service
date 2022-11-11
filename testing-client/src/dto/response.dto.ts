export class ResponseDto {
  status: number;
  message: string | null;
  result: any;

  constructor(status: number, message: string | null, result: any) {
    this.status = status;
    this.message = message;
    this.result = result;
  }
}
