
import React from 'react';
import { Student, StudentType } from '../../types';
import { translateSpecialReq } from '../../utils/logic';
import PrintButton from '../Layout/PrintButton';

interface Props {
  students: Student[];
  courseDate: string;
  teacherName: string;
  courseType: string;
  fontSize?: number;
}

const NewStudentList: React.FC<Props> = ({ students, courseDate, teacherName, courseType, fontSize = 16 }) => {
  const newStudents = students
    .filter(s => s.type === StudentType.NEW)
    .sort((a, b) => b.age - a.age);

  const formatRoom = (room: string) => room.replace(/[^0-9]/g, '');

  const cleanIllness = (illness: string) => {
    if (!illness) return '';
    const clean = illness.toLowerCase().trim();
    if (clean === 'none' || clean === 'काहीही नाही' || clean === 'नाही') return '';
    return illness;
  };

  const femaleCount = students.filter(s => s.gender === 'F').length;
  const maleCount = students.filter(s => s.gender === 'M').length;
  const isFemaleCourse = femaleCount > maleCount;

  const headerTitle = isFemaleCourse ? "नवीन साधिका / New Student" : "नवीन साधक / New Student";

  return (
    <div className="bg-white p-8 max-w-[210mm] mx-auto min-h-screen print:p-0 print:m-0 print:max-w-none print:w-full print:block">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print { 
          @page { size: A4 portrait; margin: 10mm; } 
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .report-container { width: 100% !important; border: 2px solid black !important; padding: 5mm !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
        }
      ` }} />
      <div className="flex justify-between items-start mb-4 no-print">
         <h2 className="text-xl font-bold text-gray-800">New Students List Preview</h2>
         <PrintButton />
      </div>

      <div className="report-container border-2 border-black p-4 box-border rounded-none">
          <div className="text-center mb-4 border-b-2 border-black pb-2 print:mb-2">
            <h1 className="text-2xl font-bold text-stone-900 leading-tight">धम्म आवास विपश्यना केंद्र, लातूर</h1>
            <div className="flex justify-center items-center gap-4 text-sm font-bold mt-1 text-gray-900 uppercase print:text-[10px]">
               <span className="border-r border-black pr-4">{courseType}</span>
               <span className="border-r border-black pr-4">{courseDate}</span>
               <span>{teacherName}</span>
            </div>
            <h3 className="text-lg font-bold uppercase mt-1 underline decoration-2 underline-offset-2 tracking-wide">{headerTitle}</h3>
          </div>

          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100 print:bg-stone-50">
                <th className="border border-black p-1.5 w-12 text-center">अ.क्र.</th>
                <th className="border border-black p-1.5 text-left">साधकांचे नाव</th>
                <th className="border border-black p-1.5 w-14 text-center">वय</th>
                <th className="border border-black p-1.5 w-20 text-center">रूम नं</th>
                <th className="border border-black p-1.5 text-left">आजार</th>
                <th className="border border-black p-1.5 text-center w-28">शेरा</th>
              </tr>
            </thead>
            <tbody>
              {newStudents.map((student, index) => (
                <tr key={student.id} className="break-inside-avoid">
                  <td className="border border-black p-1.5 text-center font-bold">{index + 1}</td>
                  <td 
                    className="border border-black p-1.5 font-bold whitespace-nowrap overflow-hidden"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {student.marathiName}
                  </td>
                  <td className="border border-black p-1.5 text-center text-base">{student.age}</td>
                  <td className="border border-black p-1.5 text-center font-bold text-lg">{formatRoom(student.roomNo)}</td>
                  <td className="border border-black p-1.5 text-red-700 font-medium">
                    {cleanIllness(student.illness)}
                  </td>
                  <td className="border border-black p-1.5 font-bold text-center text-xs">
                    {translateSpecialReq(student.special)}
                  </td>
                </tr>
              ))}
              {newStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 italic">No students recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
      </div>
    </div>
  );
};

export default NewStudentList;
