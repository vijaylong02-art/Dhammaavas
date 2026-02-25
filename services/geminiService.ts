
import { GoogleGenAI } from "@google/genai";
import { Student, StudentType, SpecialRequirement } from "../types";
import { calculateSeniority } from "../utils/logic";
import { v4 as uuidv4 } from 'uuid';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found in environment");
  return new GoogleGenAI({ apiKey });
};

export const parseAndTranslateStudents = async (text: string): Promise<{ students: Student[], startDate?: string, endDate?: string, extractedTeacher?: string }> => {
  const ai = getClient();
  
  const prompt = `
    You are a data processing assistant for a Vipassana center in Maharashtra.
    Analyze the raw text and extract student data. 
    
    TRANSLATION RULES:
    1. Translate student names into Marathi with perfect Maharashtrian surname nuances.
    2. Translate the "illness" field into Marathi (e.g., "Diabetes" -> "मधुमेह", "Back pain" -> "पाठदुखी", "Blood Pressure" -> "रक्तदाब"). 
    3. If no illness is mentioned or it is "None", return "काही नाही" in the illness field.
    
    CLASSIFICATION RULE:
    - A student is OLD if they have completed any 10-day, 20-day, etc., courses or Teenager courses (TC).
    - If all course counts are 0, they are generally NEW students.
    - If "Teenager Course" or "TC" is mentioned, they are definitely OLD students.
    - Mapping: "CW" or "Chauki" -> "Chauki", "Chair" -> "Chair", "Backrest" -> "Backrest".

    Return JSON:
    {
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "extractedTeacher": "string",
      "students": [
        {
          "originalName": "string",
          "marathiName": "string",
          "age": number,
          "gender": "M" | "F",
          "roomNo": "string",
          "illness": "string",
          "special": "None" | "Chair" | "Chauki" | "Backrest",
          "hearing": "Left" | "Right" | "None",
          "isServer": boolean,
          "courses": { "c60": 0, "c10": 0, "cTeenager": 0, "seva": 0, ... }
        }
      ]
    }

    Input Text:
    ${text}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const rawResult = JSON.parse(response.text || "{}");
    const rawData = rawResult.students || [];

    const students: Student[] = rawData.map((d: any) => {
      let type = StudentType.NEW;
      
      const cTeenager = d.courses.cTeenager || 0;
      const hasOtherCourses = 
        (d.courses.c10 || 0) > 0 || 
        (d.courses.c20 || 0) > 0 || 
        (d.courses.c30 || 0) > 0 || 
        (d.courses.c45 || 0) > 0 || 
        (d.courses.c60 || 0) > 0 || 
        (d.courses.cSTP || 0) > 0 || 
        (d.courses.cTSC || 0) > 0 || 
        (d.courses.cSPL || 0) > 0;
      
      if (d.isServer) {
        type = StudentType.SERVER;
      } else if (hasOtherCourses || cTeenager > 0) {
        type = StudentType.OLD;
      }
      
      const student: Student = {
        id: uuidv4(),
        originalName: d.originalName,
        marathiName: d.marathiName,
        age: d.age,
        gender: d.gender,
        courses: {
          c60: d.courses.c60 || 0,
          c45: d.courses.c45 || 0,
          c30: d.courses.c30 || 0,
          c20: d.courses.c20 || 0,
          cTSC: d.courses.cTSC || 0,
          cSPL: d.courses.cSPL || 0,
          cSTP: d.courses.cSTP || 0,
          c10: d.courses.c10 || 0,
          cTeenager: cTeenager,
          seva: d.courses.seva || 0
        },
        illness: (d.illness === 'None' || d.illness === 'काही नाही') ? '' : d.illness,
        special: d.special as SpecialRequirement,
        roomNo: d.roomNo || '',
        hearing: d.hearing || 'None',
        type: type,
        seniorityScore: 0,
        manualSeat: ''
      };

      student.seniorityScore = calculateSeniority(student);
      return student;
    });

    return { 
        students, 
        startDate: rawResult.startDate,
        endDate: rawResult.endDate,
        extractedTeacher: rawResult.extractedTeacher
    };
  } catch (error) {
    console.error("Gemini processing error:", error);
    throw new Error("Failed to process student data.");
  }
};
