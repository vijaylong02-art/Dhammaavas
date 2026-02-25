
import React, { useState } from 'react';
import { Student, SpecialRequirement, StudentType } from '../../types';

interface Props {
  students: Student[];
  onUpdate: (updatedStudent: Student) => void;
  onReset: () => void;
}

const DataEditor: React.FC<Props> = ({ students, onUpdate, onReset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredStudents = students.filter(s => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = s.marathiName.toLowerCase().includes(search) ||
                         s.originalName.toLowerCase().includes(search) ||
                         s.roomNo.includes(search);
    
    let matchesType = filterType === 'ALL' || s.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleFieldChange = (student: Student, field: keyof Student, value: any) => {
    onUpdate({ ...student, [field]: value });
  };

  const handleTeenagerToggle = (student: Student, isTeenager: boolean) => {
    const newCourses = { ...student.courses, cTeenager: isTeenager ? 1 : 0 };
    let newType = student.type;
    
    // Logic: NEW -> OLD when teenager selected
    if (isTeenager && student.type === StudentType.NEW) {
      newType = StudentType.OLD;
    } 
    // Logic: OLD -> NEW when teenager unselected (only if no other courses exist)
    else if (!isTeenager && student.type === StudentType.OLD) {
      const hasOtherCourses = 
        student.courses.c10 > 0 || 
        student.courses.c20 > 0 || 
        student.courses.c30 > 0 || 
        student.courses.c45 > 0 || 
        student.courses.c60 > 0 || 
        student.courses.cSTP > 0 || 
        student.courses.cTSC > 0 || 
        student.courses.cSPL > 0;
      
      if (!hasOtherCourses) {
        newType = StudentType.NEW;
      }
    }

    onUpdate({
      ...student,
      type: newType,
      courses: newCourses
    });
  };

  return (
    <div className="rounded-[4.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] overflow-hidden border border-slate-100 transition-all bg-white/70 backdrop-blur-3xl animate-fade-in">
      {/* HUB HEADER */}
      <div className="px-16 py-14 flex flex-col xl:flex-row justify-between items-center gap-12 bg-white/40">
        <div className="text-center xl:text-left space-y-6">
          <div className="flex items-center gap-6 justify-center xl:justify-start">
             <div className="w-4 h-4 rounded-full bg-indigo-600 shadow-[0_0_20px_#6366f1] animate-pulse"></div>
             <h2 className="text-5xl font-black italic tracking-tighter uppercase drop-shadow-sm">Registry Hub</h2>
          </div>
          <div className="flex flex-wrap justify-center xl:justify-start gap-2.5 p-2 bg-slate-100/60 rounded-[2.5rem] border border-white/50 shadow-inner">
             {['ALL', 'NEW', 'OLD', 'SERVER'].map(type => (
               <button 
                 key={type} 
                 onClick={() => setFilterType(type)}
                 className={`px-10 py-3.5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-500 ${filterType === type ? 'bg-indigo-600 text-white shadow-2xl scale-105 translate-y-[-2px]' : 'text-slate-500 hover:text-indigo-600'}`}
               >
                 {type}
               </button>
             ))}
          </div>
        </div>
        
        <div className="relative w-full xl:w-[700px] group">
          <input 
            type="text" 
            placeholder="Search Registry (Name, Status)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-white/60 px-24 py-9 rounded-[3.5rem] text-lg font-black outline-none focus:ring-[20px] focus:ring-indigo-600/5 transition-all shadow-premium placeholder-slate-200"
          />
          <svg className="absolute left-10 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      {/* DATA GRID */}
      <div className="w-full overflow-x-auto hide-scrollbar px-6 pb-6">
        <table className="w-full text-left border-separate border-spacing-y-4 min-w-[1100px]">
          <thead>
            <tr>
              <th className="px-14 py-6 font-black text-slate-300 text-[11px] uppercase tracking-[0.6em] w-[45%]">Student Profile</th>
              <th className="px-6 py-6 font-black text-slate-300 text-[11px] uppercase tracking-[0.6em] text-center w-36">Age</th>
              <th className="px-6 py-6 font-black text-slate-300 text-[11px] uppercase tracking-[0.6em] text-center w-64">TEENAGER</th>
              <th className="px-6 py-6 font-black text-slate-300 text-[11px] uppercase tracking-[0.6em] text-center w-52">Requirement</th>
              <th className="px-10 py-6 font-black text-slate-300 text-[11px] uppercase tracking-[0.6em] text-center w-48">Seating</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => (
              <tr key={student.id} className="group">
                <td className="px-14 py-10 bg-white/80 first:rounded-l-[3.5rem] border-y border-l border-white/60 group-hover:bg-white transition-all duration-300 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-1">
                  <div className="space-y-4">
                    <div className="flex items-center gap-5">
                      <input 
                        type="text"
                        value={student.marathiName}
                        onChange={(e) => handleFieldChange(student, 'marathiName', e.target.value)}
                        className="flex-grow bg-transparent font-black text-slate-900 outline-none text-2xl tracking-tight italic border-b-2 border-transparent focus:border-indigo-600 transition-all py-1 font-report-noto"
                      />
                    </div>
                    <div className="flex items-center gap-5">
                       <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] ${
                         student.type === StudentType.NEW ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 
                         student.type === StudentType.OLD ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 
                         'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                       }`}>
                          {student.type}
                       </span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] truncate max-w-[200px]">
                          {student.originalName} {student.manualSeat ? `[FIXED: ${student.manualSeat}]` : ''}
                       </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-10 bg-white/80 border-y border-white/60 group-hover:bg-white transition-all duration-300 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-1">
                    <input 
                      type="number" 
                      value={student.age}
                      onChange={(e) => handleFieldChange(student, 'age', Number(e.target.value))}
                      className="w-full bg-slate-50 text-center font-black text-2xl py-6 rounded-[2.5rem] border-2 border-transparent focus:border-indigo-600 outline-none transition-all shadow-inner"
                    />
                </td>
                <td className="px-6 py-10 bg-white/80 border-y border-white/60 group-hover:bg-white transition-all duration-300 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-1">
                    <div className="flex justify-center">
                        <button 
                          onClick={() => handleTeenagerToggle(student, student.courses.cTeenager === 0)}
                          className={`px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-500 border-2 ${
                            student.courses.cTeenager > 0 
                            ? 'bg-indigo-600 text-white border-transparent shadow-xl' 
                            : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'
                          }`}
                        >
                          {student.courses.cTeenager > 0 ? 'Teenager' : 'Select'}
                        </button>
                    </div>
                </td>
                <td className="px-6 py-10 bg-white/80 border-y border-white/60 group-hover:bg-white transition-all duration-300 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-1">
                    <select
                      value={student.special}
                      onChange={(e) => handleFieldChange(student, 'special', e.target.value)}
                      className="bg-white/90 px-6 py-6 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest cursor-pointer outline-none w-full border-2 border-transparent focus:border-indigo-600 shadow-sm transition-all text-center appearance-none"
                    >
                      {Object.values(SpecialRequirement).map(req => (
                        <option key={req} value={req}>{req}</option>
                      ))}
                    </select>
                </td>
                <td className="px-10 py-10 bg-white/80 last:rounded-r-[3.5rem] border-y border-r border-white/60 group-hover:bg-white transition-all duration-300 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-1">
                    <select
                      value={student.hearing || 'None'}
                      onChange={(e) => handleFieldChange(student, 'hearing', e.target.value as any)}
                      className="bg-slate-900 text-white px-6 py-6 rounded-[2.5rem] text-[9px] font-black uppercase tracking-widest w-full cursor-pointer hover:scale-105 transition-all outline-none shadow-2xl text-center"
                    >
                       <option value="None">Balanced</option>
                       <option value="Left">Left Ear</option>
                       <option value="Right">Right Ear</option>
                    </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredStudents.length === 0 && (
        <div className="p-48 text-center space-y-10 animate-fade-in">
           <div className="text-9xl opacity-10 grayscale">🗂️</div>
           <div className="space-y-4">
             <h3 className="text-3xl font-black text-slate-300 uppercase tracking-[0.6em]">No Match Found</h3>
             <p className="text-base text-slate-400 font-bold max-w-lg mx-auto tracking-tight">Ensure you have initialized student data or try a different search term.</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default DataEditor;
