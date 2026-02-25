
import React, { useState } from 'react';
import { Student, StudentType } from '../../types';
import { formatTeacherName } from '../../utils/logic';
import PrintButton from '../Layout/PrintButton';

interface RoomBoxProps {
  num: number;
  roomMap: Map<number, Student>;
  draggedRoom: number | null;
  handleDragStart: (e: React.DragEvent, roomNum: number) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetRoomNum: number) => void;
  fontSize?: number;
}

const RoomBox: React.FC<RoomBoxProps> = ({ 
  num, 
  roomMap, 
  draggedRoom, 
  handleDragStart, 
  handleDragOver, 
  handleDrop,
  fontSize = 15
}) => {
  const student = roomMap.get(num);
  const isDragging = draggedRoom === num;
  const isServer = student?.type === StudentType.SERVER;

  const displayName = student 
      ? student.marathiName.replace(/\s*[\(\[]?(सेवक|Sevak|Server|धम्म सेवक|धम्म सेविका)[\)\]]?/gi, '').trim() 
      : '';

  const isIndian = [20, 18, 19, 17, 40, 38, 36, 34, 32, 41, 39, 37, 35, 33].includes(num);
  const isATRoom = num === 21;

  return (
    <div 
      draggable={true}
      onDragStart={(e) => handleDragStart(e, num)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, num)}
      className={`
        border border-black rounded-none relative flex flex-col h-16 w-full print:h-14
        transition-all duration-200 
        ${isDragging ? 'opacity-50 ring-2 ring-gray-400' : ''}
        ${student ? 'bg-white' : 'bg-gray-50/40'}
      `}
    >
      {/* Clear Black Room Number on White */}
      <span className="absolute top-0.5 left-1 text-[11px] font-black text-black leading-none z-10">
        {num}
      </span>

      {(isIndian || isATRoom) && (
          <div className="absolute top-1 right-1 z-10 flex gap-1">
              {isIndian && <span className="text-[8px] font-black text-indigo-700 leading-none">IND</span>}
              {isATRoom && <span className="text-[8px] font-black text-rose-700 leading-none">AT</span>}
          </div>
      )}

      {/* Clear Black Status Tag (Old/New) on White */}
      {student && (
           <span className="absolute bottom-1 right-1 text-[9px] font-black text-black leading-none z-10">
             {student.type === StudentType.NEW ? 'नवीन' : 'जुना'}
           </span>
      )}

      <div className="flex-grow flex items-center justify-center text-center w-full overflow-hidden px-1 pt-3 pb-1 h-full z-1 relative">
        {student ? (
          <div className="w-full flex flex-col justify-center items-center">
             <span 
                className="font-bold text-slate-900 leading-[1.1] block break-words px-0.5 w-full"
                style={{ fontSize: `${fontSize}px` }}
             >
                {displayName}
             </span>
             {isServer && <span className="text-[9px] font-black text-gray-500 block leading-none mt-0.5">(धम्म सेवक)</span>}
          </div>
        ) : (
          <span className="text-[12px] text-gray-200 font-black">-</span>
        )}
      </div>
    </div>
  );
};

interface Props {
  students: Student[];
  courseDate: string;
  teacherName: string;
  courseType: string;
  onUpdateStudents?: (updatedStudents: Student[]) => void;
  fontSize?: number;
}

const RoomChart: React.FC<Props> = ({ students, courseDate, teacherName, courseType, onUpdateStudents, fontSize = 16 }) => {
  const getRoomNumber = (roomStr: string): number => {
    const num = roomStr.replace(/[^0-9]/g, '');
    return parseInt(num, 10) || 0;
  };

  const [draggedRoom, setDraggedRoom] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, roomNum: number) => {
     setDraggedRoom(roomNum);
     e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetRoomNum: number) => {
    e.preventDefault();
    if (draggedRoom === null || draggedRoom === targetRoomNum) return;
    const sourceStudent = students.find(s => getRoomNumber(s.roomNo) === draggedRoom);
    const targetStudent = students.find(s => getRoomNumber(s.roomNo) === targetRoomNum);
    const newStudents = [...students];
    if (sourceStudent) {
        const sIndex = newStudents.findIndex(s => s.id === sourceStudent.id);
        newStudents[sIndex] = { ...newStudents[sIndex], roomNo: String(targetRoomNum) };
    }
    if (targetStudent) {
        const tIndex = newStudents.findIndex(s => s.id === targetStudent.id);
        newStudents[tIndex] = { ...newStudents[tIndex], roomNo: String(draggedRoom) };
    }
    if (onUpdateStudents) onUpdateStudents(newStudents);
    setDraggedRoom(null);
  };

  const roomMap = new Map<number, Student>();
  students.forEach(s => {
    const rNum = getRoomNumber(s.roomNo);
    if (rNum > 0) roomMap.set(rNum, s);
  });

  const row1 = [20, 18, 16, 14, 12, 10, 8, 6];
  const row2 = [19, 17, 15, 13, 11, 9, 7, 5];
  const row4_Left = [25, 24, 23, 22, 21];
  const rowBottom_Even = [40, 38, 36, 34, 32, 30, 28, 26]; 
  const rowBottom_Odd = [41, 39, 37, 35, 33, 31, 29, 27];

  const commonProps = { roomMap, draggedRoom, handleDragStart, handleDragOver, handleDrop, fontSize };

  return (
    <div className="bg-white p-4 mx-auto w-full max-w-[297mm] print:p-0 print:m-0 print:max-w-none print:w-full">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print { 
          @page { size: A4 landscape; margin: 10mm; } 
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .print-area { border: 2.5px solid black !important; padding: 4mm !important; margin: 0 !important; width: 100% !important; border-radius: 0 !important; box-shadow: none !important; }
        }
      ` }} />
      
      <div className="flex justify-between items-start mb-4 no-print">
         <div>
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Accommodation Chart Preview</h2>
         </div>
         <PrintButton />
      </div>

      <div className="print-area border-[3px] border-black p-4 bg-white overflow-hidden print:overflow-visible rounded-none shadow-none">
           <div className="text-center mb-6 border-b-[3px] border-black pb-4 print:mb-2 print:pb-2">
            <h1 className="text-2xl font-black text-stone-900 leading-tight">धम्म आवास विपश्यना केंद्र, लातूर</h1>
            <div className="flex justify-center items-center gap-8 text-[11px] font-black mt-2 text-gray-900 uppercase print:text-[9px]">
               <span className="border-r-2 border-black pr-8">{courseType}</span>
               <span className="border-r-2 border-black pr-8">{courseDate}</span>
               <span>{teacherName}</span>
            </div>
          </div>

          <div className="w-full room-grid-stack space-y-2 print:space-y-1">
            <div className="grid grid-cols-8 gap-1.5 print:gap-1">
                {row1.map(n => <RoomBox key={n} num={n} {...commonProps} />)}
                {row2.map(n => <RoomBox key={n} num={n} {...commonProps} />)}
            </div>
            
            <div className="grid grid-cols-8 gap-1.5 print:gap-1 py-2">
                <div className="col-span-7 h-8 flex items-center justify-center">
                   <div className="border-y-2 border-dashed border-gray-100 w-full text-center">
                      <span className="text-[10px] uppercase tracking-[0.6em] text-gray-400 font-black">Inner Courtyard / मध्य अंगण</span>
                   </div>
                </div> 
                <RoomBox num={4} {...commonProps} />
                {row4_Left.map(n => <RoomBox key={n} num={n} {...commonProps} />)}
                <div className="col-span-2"></div>
                <RoomBox num={3} {...commonProps} />
                <div className="col-span-7"></div>
                <RoomBox num={2} {...commonProps} />
                <div className="col-span-7"></div>
                <RoomBox num={1} {...commonProps} />
            </div>

            <div className="flex flex-col gap-1.5 print:gap-1">
                 <div className="grid grid-cols-8 gap-1.5 print:gap-1">
                     {rowBottom_Even.map(n => <RoomBox key={n} num={n} {...commonProps} />)}
                 </div>
                 <div className="grid grid-cols-8 gap-1.5 print:gap-1">
                     {rowBottom_Odd.map(n => <RoomBox key={n} num={n} {...commonProps} />)}
                 </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default RoomChart;
