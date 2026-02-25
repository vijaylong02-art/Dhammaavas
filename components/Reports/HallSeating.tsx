
import React, { useState } from 'react';
import { Student, StudentType } from '../../types';
import { translateSpecialReq } from '../../utils/logic';
import PrintButton from '../Layout/PrintButton';

interface Props {
  students: Student[];
  rows: number;
  cols: number;
  courseDate: string;
  teacherName: string;
  courseType: string;
  fontSize?: number;
  onUpdateStudents?: (updates: Student[]) => void;
}

const DhammaPlatform = () => {
  return (
    <div className="flex flex-col items-center justify-center my-1 print:my-0">
       <div className="px-6 py-1 bg-stone-50 rounded border border-black flex items-center justify-center print:bg-white print:rounded-none">
          <div className="text-[10px] font-black text-black uppercase tracking-[0.15em]">DHAMMA SEAT</div>
       </div>
    </div>
  );
};

const HallSeating: React.FC<Props> = ({ 
  students, 
  rows, 
  cols, 
  courseDate, 
  teacherName, 
  courseType, 
  fontSize = 13,
  onUpdateStudents 
}) => {
  const [isTeacherView, setIsTeacherView] = useState(false); 
  const [draggedSeat, setDraggedSeat] = useState<string | null>(null);

  const seatMap = new Map<string, Student>();
  students.filter(s => s.seatNo).forEach(s => { if(s.seatNo) seatMap.set(s.seatNo, s); });

  const getDisplayRoom = (roomStr: string) => roomStr.replace(/[^0-9]/g, '');
  const gapIndex = Math.floor(cols / 2) - 1; 

  const handleDragStart = (e: React.DragEvent, seatId: string) => {
    if (seatMap.has(seatId)) {
        setDraggedSeat(seatId);
        e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetSeatId: string) => {
    e.preventDefault();
    if (!draggedSeat || draggedSeat === targetSeatId || !onUpdateStudents) return;

    const sourceStudent = seatMap.get(draggedSeat);
    const targetStudent = seatMap.get(targetSeatId);

    const updates: Student[] = [];
    if (sourceStudent) {
        // Fix the source student at the target seat
        updates.push({ ...sourceStudent, manualSeat: targetSeatId });
    }

    if (targetStudent) {
        // Free the target student so the algorithm re-places them by merit elsewhere
        updates.push({ ...targetStudent, manualSeat: '', seatNo: undefined });
    }

    onUpdateStudents(updates);
    setDraggedSeat(null);
  };

  return (
    <div className="bg-white p-6 mx-auto min-h-screen max-w-[297mm] print:p-0 print:m-0 print:max-w-none print:min-h-0 print:w-full transition-colors duration-500">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print { 
          @page { size: A4 landscape; margin: 10mm; } 
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .print-area { border: 3px solid black !important; padding: 5mm !important; margin: 0 !important; width: 100% !important; border-radius: 0 !important; box-shadow: none !important; }
        }
      ` }} />
      
      <div className="no-print flex justify-between items-center mb-8 bg-stone-50 p-6 rounded-[2.5rem] border border-stone-200 transition-colors">
        <div className="flex gap-4 items-center">
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg>
           </div>
           <div>
              <h2 className="text-xl font-black text-stone-800 dark:text-white">Hall Seating Map</h2>
              <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">
                Drag to pin a seeker. Others will relocate based on merit.
              </p>
           </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsTeacherView(!isTeacherView)} 
            className="bg-emerald-600 text-white text-[10px] font-black px-6 py-4 rounded-2xl shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2 uppercase tracking-widest"
          >
            {isTeacherView ? 'Front View' : 'Teacher View'}
          </button>
          <PrintButton />
        </div>
      </div>

      <div className="print-area border-[3px] border-black p-4 bg-white relative overflow-hidden print:overflow-visible print:border-black print:p-4 rounded-none shadow-none">
        
        <div className="text-center mb-4 border-b-[3px] border-black pb-4 print:mb-2 print:pb-2">
            <h1 className="text-2xl font-black text-stone-900 leading-tight">धम्म आवास विपश्यना केंद्र, लातूर</h1>
            <div className="flex justify-center items-center gap-8 text-[11px] font-black mt-2 text-gray-900 uppercase print:text-[9px]">
               <span className="border-r-2 border-black pr-8">{courseType}</span>
               <span className="border-r-2 border-black pr-8">{courseDate}</span>
               <span>{teacherName}</span>
            </div>
        </div>

        <div className="flex flex-col items-center w-full justify-start">
          {!isTeacherView && <DhammaPlatform />}
          
          <div className={`grid gap-0.5 w-full ${isTeacherView ? 'rotate-180' : ''}`}
               style={{ 
                 gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                 alignContent: 'start'
               }}>
            {Array.from({ length: rows }).map((_, rIndex) => {
               const rowNumber = rIndex + 1;
               return Array.from({ length: cols }).map((_, cIndex) => {
                 const seatId = `${String.fromCharCode(65 + cIndex)}${rowNumber}`;
                 const student = seatMap.get(seatId);
                 const isGap = cIndex === gapIndex;
                 const isDragging = draggedSeat === seatId;

                 return (
                   <div 
                      key={seatId} 
                      className={`relative h-full ${isGap ? 'pr-2' : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, seatId)}
                   >
                       {isGap && <div className="absolute top-0 bottom-0 right-1 w-[1px] border-r border-dashed border-stone-200"></div>}
                       <div 
                          draggable={!!student}
                          onDragStart={(e) => handleDragStart(e, seatId)}
                          className={`
                            border border-stone-300 min-h-[68px] print:min-h-[58px] flex flex-col items-center justify-center relative rounded-none p-0.5
                            transition-all duration-200 cursor-move
                            ${student ? 'bg-white border-black shadow-sm print:shadow-none' : 'bg-stone-50/5 border-dashed border-stone-200'}
                            ${isTeacherView ? 'rotate-180' : ''} 
                            ${isDragging ? 'opacity-30 scale-95' : ''}
                            ${student?.manualSeat ? 'ring-2 ring-indigo-500 ring-inset print:ring-0' : ''}
                          `}
                       >
                         <span className="absolute top-0.5 left-0.5 text-[6px] text-black font-black uppercase">{seatId}</span>
                         
                         {student && (
                            <span className="absolute top-0.5 right-0.5 text-[6px] font-black text-black">
                                {student.type === StudentType.NEW ? 'नवीन' : 'जुना'}
                            </span>
                         )}

                         {student ? (
                           <div className="w-full flex flex-col items-center text-center">
                             <div className="text-[9px] font-black text-black mb-0.5 leading-none print:text-[8px]">{getDisplayRoom(student.roomNo)}</div>
                             <div 
                               className="font-bold leading-tight text-black uppercase tracking-tight w-full whitespace-normal break-words"
                               style={{ fontSize: `${fontSize}px` }}
                             >
                                {student.marathiName}
                             </div>
                             {student.special !== 'None' && (
                               <div className="mt-1 w-full px-1">
                                   <div className="text-[6px] font-black bg-stone-50 text-stone-700 py-0.5 rounded-none border border-stone-200 uppercase tracking-tighter print:bg-white">
                                       {translateSpecialReq(student.special)}
                                   </div>
                               </div>
                             )}
                           </div>
                         ) : <div className="text-[8px] text-gray-200 font-black italic print:hidden">vacant</div>}
                       </div>
                   </div>
                 );
               });
            })}
          </div>

          {isTeacherView && <div className="mt-2"><DhammaPlatform /></div>}
        </div>
      </div>
    </div>
  );
};

export default HallSeating;
