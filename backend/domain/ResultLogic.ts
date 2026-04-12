
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
   * 
   * For 2nd Semester, the 8th subject is IA only (Min 35/70)
   */
  static getResult(subjectMarks: { ia: number, e: number }[], semester: number = 3): string {
    const isPass = subjectMarks.every((m, i) => {
      const ia = m.ia || 0;
      const e = m.e || 0;
      const t = ia + e;

      // 2nd Semester Elective (Subject 8) is IA only
      if (semester === 2 && i === 7) {
        return ia >= 35;
      }

      return ia >= 35 && e >= 25 && t >= 60;
    });
    return isPass ? 'PASS' : 'FAIL';
  }
}
