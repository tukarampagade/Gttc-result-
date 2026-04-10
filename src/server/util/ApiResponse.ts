export class ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;

  constructor(success: boolean, message: string, data: T | null = null) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  static ok<T>(message: string, data: T | null = null): ApiResponse<T> {
    return new ApiResponse(true, message, data);
  }

  static error<T>(message: string): ApiResponse<T> {
    return new ApiResponse(false, message, null);
  }
}
