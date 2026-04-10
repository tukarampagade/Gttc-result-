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

    const prompt = `
      Analyze the following academic performance for student ${student.name} (${student.regNo}).
      Department: ${student.department}
      Semester: ${student.semester}
      
      Results:
      ${results.map(r => `Semester ${r.semester}: Total ${r.totalMarks || r.total}/960, Status: ${r.result || r.status}`).join('\n')}
      
      Please provide:
      1. A brief summary of their overall performance.
      2. Strengths and weaknesses based on the data.
      3. Recommendations for improvement.
      4. A motivational closing statement.
      
      Format the output using clean HTML (use <h5> for headings, <p> for text, and <ul>/<li> for lists).
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}
