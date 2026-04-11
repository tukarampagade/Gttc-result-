import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private static genAI: GoogleGenerativeAI | null = null;

  private static getAI() {
    if (!this.genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
    return this.genAI;
  }

  static async analyzePerformance(student: any, results: any[]) {
    const ai = this.getAI();
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const resultsSummary = results.map(r => {
      const subjects = [];
      for (let i = 1; i <= 8; i++) {
        const ia = r[`subject${i}_ia`];
        const e = r[`subject${i}_e`];
        const t = r[`subject${i}_t`];
        if (t !== undefined) {
          subjects.push(`Subject ${i}: IA=${ia}, Exam=${e}, Total=${t}`);
        }
      }
      return `
        Semester ${r.semester}:
        - Total Marks: ${r.total}/960
        - Average: ${r.avg}%
        - Result Status: ${r.result}
        - Subject Details:
          ${subjects.join('\n          ')}
      `;
    }).join('\n');

    const prompt = `
      You are an expert Academic Counselor. Analyze the following academic performance for student ${student.name} (${student.regNo}).
      Department: ${student.department}
      Current Semester: ${student.semester}
      
      Detailed Academic History:
      ${resultsSummary}
      
      Please provide a comprehensive performance analysis including:
      1. **Overall Academic Standing**: A summary of their progress across semesters.
      2. **Subject-Wise Insights**: Identify specific subjects where the student excelled or struggled. Note any patterns in Internal Assessment (IA) vs. External Exam (E) scores.
      3. **Trend Analysis**: Is the student improving, declining, or consistent?
      4. **Strategic Recommendations**: Provide 3-4 actionable steps for the student to improve their GPA or maintain high performance.
      5. **Career/Skill Alignment**: Based on their department (${student.department}), suggest which areas they should focus on for better career prospects.
      
      Format the output using clean, professional HTML. Use:
      - <h5> for section headings
      - <p> for descriptive text
      - <ul> and <li> for lists
      - <strong> for emphasis
      - A <div> with a light background for the final "Motivational Closing".
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}
