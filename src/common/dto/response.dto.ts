/**
 * @class ResponseDto - A data transfer object for passing response data.
 * @export
 *
 * @param {number} status - The status code for the response.
 * @param {string} [message] - A message for the response.
 * @param {any} result - The result data for the response.
 */
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
