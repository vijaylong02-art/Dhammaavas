
import React from 'react';
import { Student } from '../../types';
import { translateSpecialReq } from '../../utils/logic';
import PrintButton from '../Layout/PrintButton';

interface Props {
  students: Student[];
  courseDate: string;
  teacherName: string;
  courseType: string;
  fontSize?: number;
}

const HallSeatingList: React.FC<Props> = ({ students, courseDate, teacherName, courseType, fontSize = 16 }) => {
  const seatedStudents = students.filter(s => s.seatNo);
  
  // Sort by row first, then zigzag by column
  const seatList = [...seatedStudents].sort((a, b) => {
    const parseSeat = (s?: string) => {
      if (!s) return { r: 999, c: 999 };
      const m = s.match(/([A-Z])(\d+)/i);
      if (!m) return { r: 999, c: 999 };
      return { 
        c: m[1].toUpperCase().charCodeAt(0) - 65, 
        r: parseInt(m[2], 10) 
      };
    };
    
    const pA = parseSeat(a.seatNo);
    const pB = parseSeat(b.seatNo);
    
    // Sort primarily by row index
    if (pA.r !== pB.r) return pA.r - pB.r;
    
    // Within same row, apply Zigzag logic:
    // Row 1, 3, 5... (Odd Rows) -> Left to Right (A to Z)
    // Row 2, 4, 6... (Even Rows) -> Right to Left (Z to A)
    const isRowEven = pA.r % 2 === 0;
    return isRowEven ? pB.c - pA.c : pA.c - pB.c;
  });

  const titleText = "आसन व्यवस्था सूची / Seating List";

  return (
    <div className="bg-white p-8 max-w-[210mm] mx-auto min-h-screen print:p-0 print:m-0 print:max-w-none print:w-full">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print { 
          @page { size: A4 portrait; margin: 10mm; } 
          .print-scale { transform: scale(0.98); transform-origin: top center; }
          body { background: white !important; }
        }
      ` }} />
      <div className="flex justify-between items-start mb-4 no-print">
         <h2 className="text-xl font-bold text-gray-800">Hall Seating List Preview</h2>
         <PrintButton />
      </div>

      <div className="print-scale border-2 border-black p-4 box-border print:border-black print:m-0">
         <div className="text-center mb-2 border-b-2 border-black pb-2">
            <h1 className="text-2xl font-bold text-stone-900 leading-tight">धम्म आवास विपश्यना केंद्र, लातूर</h1>
            <div className="flex justify-center items-center gap-4 text-sm font-bold mt-1 text-gray-900 uppercase">
               <span className="border-r-2 border-black pr-4">{courseType}</span>
               <span className="border-r-2 border-black pr-4">{courseDate}</span>
               <span>{teacherName}</span>
            </div>
            <h3 className="text-lg font-bold uppercase mt-1 underline decoration-2 underline-offset-2 tracking-wide">{titleText}</h3>
        </div>

        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-gray-100 print:bg-stone-50">
              <th className="border border-black p-2 w-16 text-center">अ.क्र.</th>
              <th className="border border-black p-2 text-left">साधकांचे नाव</th>
              <th className="border border-black p-2 w-24 text-center">सीट क्रमांक</th>
              <th className="border border-black p-2 text-left">शेरा</th>
            </tr>
          </thead>
          <tbody>
            {seatList.map((s, idx) => (
              <tr key={s.id} className="break-inside-avoid">
                <td className="border border-black p-2 text-center font-bold">{idx + 1}</td>
                <td 
                  className="border border-black p-2 font-bold"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {s.marathiName}
                </td>
                <td className="border border-black p-2 text-center font-bold text-base">{s.seatNo}</td>
                <td className="border border-black p-2 font-bold text-[11px]">
                  {translateSpecialReq(s.special)}
                </td>
              </tr>
            ))}
            {seatList.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400 italic">No assigned seats recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HallSeatingList;
