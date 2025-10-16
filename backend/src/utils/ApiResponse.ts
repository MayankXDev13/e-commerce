/**
 * @description Common Response class to send a consistent response structure to the client.
 */
class ApiResponse<T> {
  public statusCode: number;
  public data: T;
  public message: string;
  public success: boolean;

  /**
   * @param statusCode - HTTP status code
   * @param data - Response data payload
   * @param message - Response message (default: "Success")
   */
  constructor(statusCode: number, data: T, message: string = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
