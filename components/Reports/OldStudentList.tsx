
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

const OldStudentList: React.FC<Props> = ({ students, courseDate, teacherName, courseType, fontSize = 14 }) => {
  const oldStudents = students
    .filter(s => s.type === StudentType.OLD)
    .sort((a, b) => b.seniorityScore - a.seniorityScore);
  const servers = students
    .filter(s => s.type === StudentType.SERVER)
    .sort((a, b) => b.age - a.age);

  const femaleCount = students.filter(s => s.gender === 'F').length;
  const maleCount = students.filter(s => s.gender === 'M').length;
  const isFemaleCourse = femaleCount > maleCount;
  
  const titleText = isFemaleCourse ? "जुन्या साधिका / Old Student" : "जुने साधक / Old Student";
  const serverHeading = isFemaleCourse ? "धम्म सेविका" : "धम्म सेवक";

  const formatRoom = (room: string) => room.replace(/[^0-9]/g, '');

  const cleanIllness = (illness: string) => {
    if (!illness) return '';
    const clean = illness.toLowerCase().trim();
    if (clean === 'none' || clean === 'काहीही नाही' || clean === 'नाही') return '';
    return illness;
  };

  const renderTableRows = (data: Student[]) => {
    return data.map((student, index) => {
      const displayName = student.marathiName.replace(/\s*[\(\[]?(सेवक|Sevak|Server|धम्म सेवक|धम्म सेविका)[\)\]]?/gi, '').trim();
      return (
        <tr key={student.id} className="break-inside-avoid hover:bg-gray-50 transition-colors">
          <td className="border border-black p-0.5 text-center font-bold">{index + 1}</td>
          <td className="border border-black p-0.5 font-bold" style={{ fontSize: `${fontSize}px` }}>
            {displayName}
          </td>
          <td className="border border-black p-0.5 text-center">{student.age}</td>
          <td className="border border-black p-0.5 text-center font-bold text-[13px]">{formatRoom(student.roomNo)}</td>
          <td className="border border-black p-0.5 text-center">{student.courses.c10 || '-'}</td>
          <td className="border border-black p-0.5 text-center">{student.courses.cSTP || '-'}</td>
          <td className="border border-black p-0.5 text-center font-bold">{student.courses.cSPL || '-'}</td>
          <td className="border border-black p-0.5 text-center font-bold">{student.courses.cTSC || '-'}</td>
          <td className="border border-black p-0.5 text-center font-bold">{student.courses.c20 || '-'}</td>
          <td className="border border-black p-0.5 text-center font-bold">{student.courses.c30 || '-'}</td>
          <td className="border border-black p-0.5 text-center font-bold">{student.courses.c45 || '-'}</td>
          <td className="border border-black p-0.5 text-center font-bold">{student.courses.c60 || '-'}</td>
          <td className="border border-black p-0.5 text-red-700 font-medium text-[10px] text-center leading-tight">
            {cleanIllness(student.illness)}
          </td>
          <td className="border border-black p-0.5 font-bold text-center text-[8px]">{translateSpecialReq(student.special)}</td>
        </tr>
      );
    });
  };

  return (
    <div className="bg-white p-8 max-w-[297mm] mx-auto min-h-screen print:p-0 print:m-0 print:max-w-none print:w-full print:block">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print { 
          @page { size: A4 landscape; margin: 10mm; } 
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .report-container { width: 100% !important; border: 2px solid black !important; padding: 5mm !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
        }
      ` }} />
      <div className="flex justify-between items-start mb-4 no-print">
         <h2 className="text-xl font-bold text-gray-800">Old Students & Servers Preview</h2>
         <PrintButton />
      </div>
      <div className="report-container border-2 border-black p-4 box-border rounded-none shadow-none">
          <div className="text-center mb-4 border-b-2 border-black pb-2 print:mb-2">
            <h1 className="text-2xl font-bold text-stone-900 leading-tight">धम्म आवास विपश्यना केंद्र, लातूर</h1>
            <div className="flex justify-center items-center gap-8 text-[11px] font-black mt-2 text-gray-900 uppercase">
               <span className="border-r-2 border-black pr-8">{courseType}</span>
               <span className="border-r-2 border-black pr-8">{courseDate}</span>
               <span>{teacherName}</span>
            </div>
            <h3 className="text-lg font-bold uppercase mt-1 underline decoration-2 underline-offset-2 tracking-wide">{titleText}</h3>
          </div>
          <table className="w-full border-collapse border border-black text-[11px]">
            <thead>
              <tr className="bg-gray-100 print:bg-stone-50">
                <th className="border border-black p-1 w-10 text-center">अ.क्र.</th>
                <th className="border border-black p-1 text-left w-40">साधकांचे नाव</th>
                <th className="border border-black p-1 w-10 text-center">वय</th>
                <th className="border border-black p-1 w-12 text-center">रूम</th>
                <th className="border border-black p-1 w-8 text-center">10</th>
                <th className="border border-black p-1 w-8 text-center">STP</th>
                <th className="border border-black p-1 w-8 text-center">SPL</th>
                <th className="border border-black p-1 w-8 text-center">TSC</th>
                <th className="border border-black p-1 w-8 text-center">20</th>
                <th className="border border-black p-1 w-8 text-center">30</th>
                <th className="border border-black p-1 w-8 text-center">45</th>
                <th className="border border-black p-1 w-8 text-center">60</th>
                <th className="border border-black p-1 w-44 text-center">आजार</th>
                <th className="border border-black p-1 text-center w-16">शेरा</th>
              </tr>
            </thead>
            <tbody>
              {renderTableRows(oldStudents)}
              {servers.length > 0 && (
                <tr className="bg-stone-100 font-black">
                  <td colSpan={14} className="border border-black p-1 text-center uppercase tracking-widest text-[10px]">— {serverHeading} —</td>
                </tr>
              )}
              {renderTableRows(servers)}
            </tbody>
          </table>
      </div>
    </div>
  );
};

export default OldStudentList;
