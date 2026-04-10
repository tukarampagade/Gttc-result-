export class ResultCalculator {
  static calculateTotal(marks: number[]): number {
    return marks.reduce((acc, curr) => acc + curr, 0);
  }

  static calculateAvg(total: number, count: number): number {
    return count > 0 ? total / count : 0;
  }
}

export class PassFailLogic {
  static getResult(marks: number[]): string {
    // Each subject must have at least 60 marks
    const hasFailedSubject = marks.some(m => m < 60);
    return hasFailedSubject ? 'FAIL' : 'PASS';
  }
}
