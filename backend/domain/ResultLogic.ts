
export class ResultCalculator {
  static calculateTotal(marks: number[]): number {
    return marks.reduce((sum, mark) => sum + (mark || 0), 0);
  }

  static calculateAvg(total: number, count: number): number {
    if (count === 0) return 0;
    return parseFloat((total / count).toFixed(2));
  }
}

export class PassFailLogic {
  /**
   * Proper analysis for pass/fail:
   * IA >= 35 (out of 70)
   * E >= 25 (out of 50)
   * Total >= 60 (out of 120)
   */
  static getResult(subjectMarks: { ia: number, e: number }[]): string {
    const isPass = subjectMarks.every(m => (m.ia || 0) >= 35 && (m.e || 0) >= 25 && ((m.ia || 0) + (m.e || 0)) >= 60);
    return isPass ? 'PASS' : 'FAIL';
  }
}
