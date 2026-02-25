
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { parseAndTranslateStudents } from './services/geminiService';
import { generateSeating, formatCourseDateString, formatTeacherName, getAutoGridDimensions } from './utils/logic';
import { Student, StudentType } from './types';
import NewStudentList from './components/Reports/NewStudentList';
import OldStudentList from './components/Reports/OldStudentList';
import RoomChart from './components/Reports/RoomChart';
import HallSeating from './components/Reports/HallSeating';
import HallSeatingList from './components/Reports/HallSeatingList';
import DataEditor from './components/Dashboard/DataEditor';

// --- UI Sub-components ---

const StatCard = ({ label, value, colorClass, icon, bgGradient, staggerClass }: { label: string, value: number, colorClass: string, icon: React.ReactNode, bgGradient: string, staggerClass: string }) => (
  <div className={`relative overflow-hidden group p-7 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,0.03)] transition-all duration-500 hover:shadow-[0_30px_70px_rgba(15,23,42,0.08)] hover:-translate-y-2 flex flex-col justify-between h-64 ${staggerClass}`}>
    <div className={`absolute -right-12 -bottom-12 w-48 h-48 rounded-full blur-[80px] opacity-10 group-hover:opacity-25 transition-all duration-700 ${bgGradient}`}></div>
    
    <div className="relative z-10 flex justify-between items-start">
      <div className={`p-4 rounded-2xl shadow-sm group-hover:scale-105 group-hover:-rotate-3 transition-all duration-500 ${bgGradient} text-white bg-opacity-90 backdrop-blur-sm`}>
        {icon}
      </div>
      <div className="text-right">
        <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.4em] group-hover:text-slate-900 transition-colors duration-300">{label}</span>
      </div>
    </div>

    <div className="relative z-10 mt-auto">
      <div className="flex items-baseline gap-2">
        <span className={`text-6xl font-black tracking-tighter ${colorClass} drop-shadow-sm`}>
          {value}
        </span>
        <div className="h-1.5 w-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-400 transition-colors"></div>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 group-hover:text-slate-500 transition-colors">Registered Count</p>
    </div>

    <div className="absolute bottom-0 left-0 h-1.5 w-full bg-slate-50 overflow-hidden">
      <div className={`h-full w-0 group-hover:w-full transition-all duration-1000 ease-out ${bgGradient} opacity-40`}></div>
    </div>
  </div>
);

const GlassButton = ({ children, onClick, active }: { children: React.ReactNode, onClick: () => void, active?: boolean }) => (
  <button 
    onClick={onClick}
    className={`px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-300 transform active:scale-95 shadow-sm flex items-center gap-3 border ${
      active 
      ? `bg-indigo-600 text-white shadow-indigo-200 shadow-xl border-transparent -translate-y-1` 
      : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50 hover:-translate-y-1'
    }`}
  >
    {children}
  </button>
);

const ConfigInputGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] px-4 block">{label}</label>
    {children}
  </div>
);

const App: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new' | 'old' | 'rooms' | 'hall' | 'hall-list' | 'config'>('dashboard');
  const [rawText, setRawText] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherGender, setTeacherGender] = useState<'Male' | 'Female'>('Male');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [manualDateStr, setManualDateStr] = useState('');
  const [courseType, setCourseType] = useState('10 Days');
  const [hallRows, setHallRows] = useState(8);
  const [hallCols, setHallCols] = useState(8);
  const [specialSeatSide, setSpecialSeatSide] = useState<'Left' | 'Right'>('Right');
  const [specialFillDirection, setSpecialFillDirection] = useState<'Front' | 'Back'>('Back');
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [reportFont, setReportFont] = useState<'Noto'>('Noto');
  
  const [reportFontSizes, setReportFontSizes] = useState<Record<string, number>>({
    global: 14,
    new: 14,
    old: 14,
    rooms: 14,
    hall: 14,
    'hall-list': 14
  });
  const [isIndividualFontSize, setIsIndividualFontSize] = useState(true);

  const [surnameOverrides, setSurnameOverrides] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('dhamma_learned_surnames');
    return saved ? JSON.parse(saved) : {};
  });

  // Track previous dimensions to trigger manual seat reset
  const prevDims = useRef({ rows: hallRows, cols: hallCols });

  useEffect(() => {
    localStorage.setItem('dhamma_learned_surnames', JSON.stringify(surnameOverrides));
  }, [surnameOverrides]);

  useEffect(() => { 
    setManualDateStr(formatCourseDateString(startDate, endDate)); 
  }, [startDate, endDate]);

  const fullCourseTitle = useMemo(() => {
    const cleanType = courseType.trim().replace(/\s+Course$/i, "");
    const genderLabel = teacherGender === 'Male' ? 'Male' : 'Female';
    return `${cleanType} ${genderLabel} Course`;
  }, [courseType, teacherGender]);

  // Seating effect - resets manual seats to auto if dimensions change
  useEffect(() => {
    if (students.length > 0) {
      const dimsChanged = prevDims.current.rows !== hallRows || prevDims.current.cols !== hallCols;
      
      setStudents(prev => {
        const sanitized = prev.map(s => {
          if (dimsChanged) {
            // Full reset to Auto Mode if Row/Col changed
            return { ...s, manualSeat: '', seatNo: undefined };
          }
          if (s.manualSeat) {
            const match = s.manualSeat.match(/([A-Z])(\d+)/i);
            if (match) {
              const c = match[1].toUpperCase().charCodeAt(0) - 65;
              const r = parseInt(match[2], 10) - 1;
              if (r >= hallRows || c >= hallCols) {
                return { ...s, manualSeat: '', seatNo: undefined };
              }
            }
          }
          return s;
        });

        if (dimsChanged) {
          prevDims.current = { rows: hallRows, cols: hallCols };
        }
        
        return generateSeating(sanitized, hallRows, hallCols, specialSeatSide, specialFillDirection);
      });
    }
  }, [specialSeatSide, specialFillDirection, hallRows, hallCols]);

  const handleProcess = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    try {
      const { students: processed, extractedTeacher, startDate: sDate, endDate: eDate } = await parseAndTranslateStudents(rawText);
      const merged = processed.map(s => {
        let finalMarathiName = s.marathiName;
        const parts = s.originalName.trim().split(/\s+/);
        if (parts.length > 0) {
          const engSur = parts[parts.length - 1].toLowerCase();
          if (surnameOverrides[engSur]) {
            const maraParts = finalMarathiName.trim().split(/\s+/);
            if (maraParts.length > 0) {
              maraParts[maraParts.length - 1] = surnameOverrides[engSur];
              finalMarathiName = maraParts.join(' ');
            }
          }
        }
        return { ...s, marathiName: finalMarathiName };
      });
      if (extractedTeacher && !teacherName) setTeacherName(extractedTeacher);
      if (sDate) setStartDate(sDate);
      if (eDate) setEndDate(eDate);
      const fem = merged.filter(s => s.gender === 'F').length;
      setTeacherGender(fem > (merged.length / 2) ? 'Female' : 'Male');
      
      const count = merged.filter(s => s.type !== StudentType.SERVER).length;
      
      const { rows: rowsNeeded, cols: colsNeeded } = getAutoGridDimensions(count);
      setHallRows(rowsNeeded);
      setHallCols(colsNeeded);
      prevDims.current = { rows: rowsNeeded, cols: colsNeeded };
      
      setStudents(generateSeating(merged, rowsNeeded, colsNeeded, specialSeatSide, specialFillDirection));
      setActiveTab('dashboard');
    } catch (e) { alert("Registry synchronization failed."); }
    finally { setLoading(false); }
  };

  const handleUpdateStudents = (updates: Student | Student[]) => {
    const updateArray = Array.isArray(updates) ? updates : [updates];
    setStudents(prev => {
      const newStudents = prev.map(s => {
        const update = updateArray.find(u => u.id === s.id);
        return update ? update : s;
      });
      return generateSeating(newStudents, hallRows, hallCols, specialSeatSide, specialFillDirection);
    });
  };

  const handleResetRegistry = () => {
    if (confirm("मूळ मजकुरावरून पुन्हा डेटा जनरेट करायचा का? केलेले सर्व बदल रद्द होतील.")) {
      handleProcess();
    }
  };

  const stats = useMemo(() => ({
    total: students.length,
    new: students.filter(s => s.type === StudentType.NEW).length,
    old: students.filter(s => s.type === StudentType.OLD).length,
    servers: students.filter(s => s.type === StudentType.SERVER).length,
  }), [students]);

  const getFontSize = (tab: string) => isIndividualFontSize ? (reportFontSizes[tab] || reportFontSizes.global) : reportFontSizes.global;

  const fontClass = useMemo(() => {
    return 'font-report-noto';
  }, [reportFont]);

  if (showWelcome) return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white p-8 text-center overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-500 rounded-full blur-[140px] opacity-20"></div>
      </div>
      <div className="relative z-10 max-w-2xl animate-fade-up">
        <div className="mb-10 inline-flex items-center justify-center w-28 h-28 bg-indigo-600 rounded-[3rem] shadow-[0_30px_60px_rgba(99,102,241,0.4)] rotate-12 hover:rotate-0 transition-all duration-700">
          <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 21l9-9-9-9-9 9 9 9z" />
          </svg>
        </div>
        <h1 className="text-8xl font-black text-slate-900 tracking-tighter mb-4 italic drop-shadow-sm">
          Dhamma<span className="text-indigo-600">Avasa</span>
        </h1>
        <p className="text-2xl text-slate-500 font-semibold mb-12 tracking-tight">Registry, Seating, and Rooming made simple.</p>
        <button 
          onClick={() => setShowWelcome(false)}
          className="px-20 py-7 bg-slate-900 text-white rounded-[3rem] font-black uppercase tracking-[0.3em] text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_30px_60px_rgba(0,0,0,0.15)]"
        >
          Launch Workspace
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#fcfdfe] transition-colors duration-500 overflow-hidden font-['Outfit']">
      <aside className="w-80 p-8 no-print flex flex-col h-full z-50">
        <div className="h-full rounded-[3.5rem] flex flex-col bg-white border border-slate-100 shadow-[0_30px_100px_rgba(0,0,0,0.06)]">
          <div className="p-10 border-b border-slate-50">
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setShowWelcome(true)}>
              <div className="w-12 h-12 bg-indigo-600 rounded-[1.3rem] flex items-center justify-center shadow-xl shadow-indigo-400/30 group-hover:rotate-12 transition-all duration-500">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 21l9-9-9-9-9 9 9 9z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black italic tracking-tighter group-hover:text-indigo-600 transition-colors leading-none">Dhamma<span className="text-indigo-600 group-hover:text-slate-900 transition-colors">Avasa</span></h1>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-1">Management v2.0</span>
              </div>
            </div>
          </div>
          <div className="flex-grow p-6 space-y-2 overflow-y-auto hide-scrollbar">
            <div className="px-6 py-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Main Hub</div>
            {[
              { id: 'dashboard', label: 'Command Center', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z' },
              { id: 'config', label: 'System Setup', icon: 'M10.3 4.3c.4-1.7 2.9-1.7 3.3 0a1.7 1.7 0 002.6 1.1' }
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-5 px-7 py-5 rounded-[2.2rem] transition-all duration-500 group relative overflow-hidden ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 -translate-y-1' : 'text-slate-500 hover:bg-slate-50 hover:-translate-x-1'}`}>
                <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d={item.icon} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="text-sm font-black relative z-10 tracking-tight">{item.label}</span>
              </button>
            ))}
            <div className="px-6 pt-10 py-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Reports</div>
            {[
              { id: 'new', label: 'New Seekers', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14' },
              { id: 'old', label: 'Old Seekers', icon: 'M9 12l2 2 4-4' },
              { id: 'rooms', label: 'Accommodation', icon: 'M3 12l2-2' },
              { id: 'hall', label: 'Hall Grid', icon: 'M17 16l-4 4' },
              { id: 'hall-list', label: 'Seating List', icon: 'M4 6h16' }
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-5 px-7 py-5 rounded-[2.2rem] transition-all duration-500 group ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 -translate-y-1' : 'text-slate-500 hover:bg-slate-50 hover:-translate-x-1'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d={item.icon} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="text-sm font-black tracking-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-grow flex flex-col h-full overflow-hidden relative">
        <header className="h-32 px-16 flex items-center justify-between no-print z-40">
          <div>
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic drop-shadow-sm">
              {activeTab === 'dashboard' ? 'Command Center' : activeTab === 'config' ? 'System Configuration' : activeTab === 'hall-list' ? 'Seating List' : activeTab.toUpperCase()}
            </h2>
            <div className="flex items-center gap-3 mt-3">
               <span className="px-4 py-1.5 bg-indigo-50 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] rounded-xl border border-indigo-100">{fullCourseTitle}</span>
               <div className="w-2 h-2 rounded-full bg-slate-200"></div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{manualDateStr || 'NOT SYNCHRONIZED'}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {activeTab === 'dashboard' && (
              <GlassButton onClick={() => setActiveTab('config')} active={false}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                Settings
              </GlassButton>
            )}
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-16 hide-scrollbar print:p-0">
          {activeTab === 'dashboard' && (
            <div className="max-w-[1500px] mx-auto space-y-16 pb-32">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 animate-fade-up">
                <StatCard label="Total Registry" value={stats.total} colorClass="text-slate-900" bgGradient="bg-gradient-to-br from-slate-700 to-slate-900" staggerClass="stagger-1" icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                <StatCard label="New Seekers" value={stats.new} colorClass="text-emerald-600" bgGradient="bg-gradient-to-br from-emerald-500 to-emerald-600" staggerClass="stagger-2" icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>} />
                <StatCard label="Old Seekers" value={stats.old} colorClass="text-indigo-600" bgGradient="bg-gradient-to-br from-indigo-500 to-indigo-700" staggerClass="stagger-3" icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 018.618 3.04M12 10a2 2 0 100-4 2 2 0 000 4z" /></svg>} />
                <StatCard label="Dhamma Service" value={stats.servers} colorClass="text-rose-600" bgGradient="bg-gradient-to-br from-rose-500 to-rose-600" staggerClass="stagger-4" icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>} />
              </div>
              
              <div className="p-12 rounded-[4rem] bg-white border border-slate-100 flex flex-col md:flex-row items-center gap-12 shadow-[0_40px_100px_rgba(0,0,0,0.04)] stagger-2 transition-all duration-700 hover:shadow-[0_60px_120px_rgba(0,0,0,0.06)]">
                <div className="flex-shrink-0 px-10 border-r-2 border-slate-50 hidden md:flex flex-col items-center">
                  <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse-slow shadow-indigo-200 shadow-lg mb-6"></div>
                  <div className="text-[11px] font-black uppercase text-slate-300 tracking-[0.6em] [writing-mode:vertical-lr] rotate-180">DATA SYNC</div>
                </div>
                <div className="flex-grow space-y-6 w-full">
                  <div className="flex items-center justify-between px-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.5em]">Live Feed Connector</label>
                  </div>
                  <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="Paste student data here..." className="w-full bg-slate-50 rounded-[2.5rem] px-14 py-12 outline-none transition-all font-mono text-xs h-40 resize-none border border-slate-100 focus:bg-white focus:ring-4 focus:ring-indigo-100 placeholder-slate-200" />
                </div>
                <button onClick={handleProcess} disabled={loading || !rawText.trim()} className="w-full md:w-auto px-24 py-12 bg-slate-900 text-white rounded-[3rem] font-black uppercase tracking-[0.4em] text-[13px] shadow-2xl hover:scale-105 active:scale-95 transition-all duration-500 disabled:opacity-30 flex flex-col items-center justify-center gap-3 group">
                  {loading ? <div className="w-6 h-6 border-4 border-slate-400 border-t-indigo-600 rounded-full animate-spin"></div> : <svg className="w-8 h-8 group-hover:rotate-180 transition-transform duration-1000" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                  <span className="mt-1">{loading ? 'Processing...' : 'Initialize'}</span>
                </button>
              </div>

              {students.length > 0 && <div className="animate-fade-in stagger-3"><DataEditor students={students} onUpdate={handleUpdateStudents} onReset={handleResetRegistry} /></div>}
            </div>
          )}

          {activeTab === 'config' && (
            <div className="max-w-5xl mx-auto space-y-10 pb-32 animate-fade-up">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.04)] space-y-10">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14" /></svg>
                      </div>
                      <h3 className="text-3xl font-black italic tracking-tighter uppercase">Teacher & Session</h3>
                    </div>
                    
                    <div className="space-y-8">
                      <ConfigInputGroup label="Lead Acarya">
                        <input type="text" value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="Acarya name..." className="w-full bg-slate-50 px-10 py-6 rounded-[2rem] text-lg font-black border-2 border-transparent focus:bg-white focus:border-indigo-600 outline-none transition-all placeholder-slate-200" />
                      </ConfigInputGroup>
                      
                      <ConfigInputGroup label="Course Category">
                        <select value={courseType} onChange={e => setCourseType(e.target.value)} className="w-full bg-slate-50 px-10 py-6 rounded-[2rem] text-lg font-black border-2 border-transparent focus:bg-white focus:border-indigo-600 outline-none transition-all appearance-none cursor-pointer">
                          {['10 Days', '2 Days', '3 Days', 'Satipatthana', 'Teenager'].map(t => <option key={t} value={t}>{t} Protocol</option>)}
                        </select>
                      </ConfigInputGroup>
                    </div>
                  </div>

                  <div className="p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.04)] space-y-10">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg>
                      </div>
                      <h3 className="text-3xl font-black italic tracking-tighter uppercase">Hall Dimensions</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                       <div className="flex flex-col items-center justify-center bg-slate-50 p-8 rounded-[2rem]">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.5em]">Hall Rows</span>
                          <div className="flex items-center gap-6 mt-6">
                             <button onClick={() => setHallRows(Math.max(1, hallRows-1))} className="w-12 h-12 rounded-xl bg-white shadow flex items-center justify-center font-black hover:bg-indigo-600 hover:text-white transition-all text-2xl">-</button>
                             <span className="text-5xl font-black tracking-tighter text-slate-900">{hallRows}</span>
                             <button onClick={() => setHallRows(hallRows+1)} className="w-12 h-12 rounded-xl bg-white shadow flex items-center justify-center font-black hover:bg-indigo-600 hover:text-white transition-all text-2xl">+</button>
                          </div>
                       </div>
                       <div className="flex flex-col items-center justify-center bg-slate-50 p-8 rounded-[2rem]">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.5em]">Hall Columns</span>
                          <div className="flex items-center gap-6 mt-6">
                             <button onClick={() => setHallCols(Math.max(1, hallCols-1))} className="w-12 h-12 rounded-xl bg-white shadow flex items-center justify-center font-black hover:bg-indigo-600 hover:text-white transition-all text-2xl">-</button>
                             <span className="text-5xl font-black tracking-tighter text-slate-900">{hallCols}</span>
                             <button onClick={() => setHallCols(hallCols+1)} className="w-12 h-12 rounded-xl bg-white shadow flex items-center justify-center font-black hover:bg-indigo-600 hover:text-white transition-all text-2xl">+</button>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>

               <div className="p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.04)] space-y-10">
                  <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-rose-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      </div>
                      <h3 className="text-3xl font-black italic tracking-tighter uppercase">Special Seating Toggles</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <ConfigInputGroup label="Seating Side (Chairs/Chauki)">
                        <div className="grid grid-cols-2 gap-4">
                           {['Left', 'Right'].map(side => (
                             <button key={side} onClick={() => setSpecialSeatSide(side as any)} className={`flex items-center justify-center py-6 px-4 rounded-[1.5rem] border-2 transition-all duration-500 font-black text-sm uppercase tracking-widest ${specialSeatSide === side ? 'bg-indigo-600 text-white border-transparent shadow-lg' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-white'}`}>
                               {side} Side
                             </button>
                           ))}
                        </div>
                     </ConfigInputGroup>

                     <ConfigInputGroup label="Fill Direction">
                        <div className="grid grid-cols-2 gap-4">
                           {['Front', 'Back'].map(dir => (
                             <button key={dir} onClick={() => setSpecialFillDirection(dir as any)} className={`flex items-center justify-center py-6 px-4 rounded-[1.5rem] border-2 transition-all duration-500 font-black text-sm uppercase tracking-widest ${specialFillDirection === dir ? 'bg-indigo-600 text-white border-transparent shadow-lg' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-white'}`}>
                               {dir} First
                             </button>
                           ))}
                        </div>
                     </ConfigInputGroup>
                  </div>
               </div>

               <div className="p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.04)] space-y-10">
                  <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-amber-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                      </div>
                      <h3 className="text-3xl font-black italic tracking-tighter uppercase">Visuals & Font Sizes</h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <ConfigInputGroup label="Typography Style">
                        <button className="w-full flex flex-col items-center justify-center py-8 px-4 rounded-[2rem] border-2 bg-indigo-600 text-white border-transparent shadow-lg transition-all duration-500">
                           <span className="font-black text-2xl italic">Noto Serif Devanagari</span>
                        </button>
                     </ConfigInputGroup>

                     <ConfigInputGroup label="Report Font Scaling (Global)">
                        <div className="bg-slate-50 p-8 rounded-[2rem] space-y-4">
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Global Scale</span>
                              <span className="text-sm font-black text-indigo-600">{reportFontSizes.global}px</span>
                           </div>
                           <input 
                             type="range" 
                             min="10" 
                             max="32" 
                             value={reportFontSizes.global} 
                             onChange={e => setReportFontSizes(prev => ({...prev, global: parseInt(e.target.value)}))}
                             className="w-full accent-indigo-600"
                           />
                        </div>
                     </ConfigInputGroup>

                     <div className="lg:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] px-4 block mb-4">Detailed Scaling</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {[
                             { id: 'new', label: 'New Students List' },
                             { id: 'old', label: 'Old Students List' },
                             { id: 'rooms', label: 'Accommodation Chart' },
                             { id: 'hall', label: 'Hall Seating Map' },
                             { id: 'hall-list', label: 'Seating Index List' }
                           ].map(report => (
                             <div key={report.id} className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 flex items-center justify-between gap-6">
                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider whitespace-nowrap">{report.label}</span>
                                <div className="flex items-center gap-4 flex-grow max-w-[150px]">
                                   <input 
                                     type="range" 
                                     min="10" 
                                     max="28" 
                                     value={reportFontSizes[report.id]} 
                                     onChange={e => setReportFontSizes(prev => ({...prev, [report.id]: parseInt(e.target.value)}))}
                                     className="w-full accent-indigo-400"
                                   />
                                   <span className="text-[10px] font-black text-indigo-600 min-w-[30px]">{reportFontSizes[report.id]}px</span>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="pt-10 flex justify-center pb-20">
                  <button onClick={() => setActiveTab('dashboard')} className="px-24 py-8 bg-slate-900 text-white rounded-[3rem] font-black uppercase tracking-[0.5em] text-[12px] transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center gap-4 group">
                    <svg className="w-6 h-6 group-hover:scale-125 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    Apply & Sync
                  </button>
               </div>
            </div>
          )}

          <div className={`${['dashboard', 'config'].includes(activeTab) ? 'hidden' : 'block'} animate-fade-in pb-32 print:pb-0`}>
            <div className={`overflow-hidden bg-white ${fontClass} print:rounded-none`}>
              {activeTab === 'new' && <NewStudentList students={students} courseDate={manualDateStr} teacherName={formatTeacherName(teacherName, teacherGender)} courseType={fullCourseTitle} fontSize={getFontSize('new')} />}
              {activeTab === 'old' && <OldStudentList students={students} courseDate={manualDateStr} teacherName={formatTeacherName(teacherName, teacherGender)} courseType={fullCourseTitle} fontSize={getFontSize('old')} />}
              {activeTab === 'rooms' && <RoomChart students={students} courseDate={manualDateStr} teacherName={teacherName} courseType={fullCourseTitle} onUpdateStudents={setStudents} fontSize={getFontSize('rooms')} />}
              {activeTab === 'hall' && <HallSeating students={students} rows={hallRows} cols={hallCols} courseDate={manualDateStr} teacherName={teacherName} courseType={fullCourseTitle} fontSize={getFontSize('hall')} onUpdateStudents={handleUpdateStudents} />}
              {activeTab === 'hall-list' && <HallSeatingList students={students} courseDate={manualDateStr} teacherName={teacherName} courseType={fullCourseTitle} fontSize={getFontSize('hall-list')} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
