import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Target, TestConfig, PatientData, Cutoffs } from './types.ts';
import { chi2Corrected, binomialTest } from './stats.ts';
import { jsPDF } from 'jspdf';
import {
  PlusCircle,
  Play,
  Settings2,
  ChevronLeft,
  Download,
  Upload,
  FileText,
  Maximize2,
  Grid,
  CheckCircle2,
  AlertTriangle,
  Info,
  ListChecks,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Default Constants ---
const DEFAULT_MAX_X = 1240;
const DEFAULT_MAX_Y = 960;
const DEFAULT_CUTOFFS: Cutoffs = {
  cocLower: -0.08,
  cocUpper: 0.08,
  omissionsLeft: 3,
  omissionsRight: 3,
  falsePositivesNormal: 5,
  falsePositivesDefectLeft: 3,
  falsePositivesDefectRight: 3,
  falsePositivesDistractor: 3,
};

// --- Layout Modals / Helpers ---

type ViewState = 'START' | 'SETUP' | 'TEST';

export default function App() {
  const [view, setView] = useState<ViewState>('START');
  const [currentConfig, setCurrentConfig] = useState<TestConfig | null>(null);

  const handleCreateTest = () => {
    const newConfig: TestConfig = {
      version: 2,
      testName: 'Neuer Test',
      comment: '',
      maxX: DEFAULT_MAX_X,
      maxY: DEFAULT_MAX_Y,
      markDefectMode: false,
      perseverate: false,
      copyTask: false,
      targetSize: 24,
      imageData: '',
      targets: [],
      cutoffs: { ...DEFAULT_CUTOFFS },
    };
    setCurrentConfig(newConfig);
    setView('SETUP');
  };

  const handleLoadTest = (e: React.ChangeEvent<HTMLInputElement>, forTestMode: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target?.result as string) as TestConfig;
        setCurrentConfig(config);
        setView(forTestMode ? 'TEST' : 'SETUP');
      } catch (err) {
        alert('Fehler beim Laden der Datei.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 antialiased font-sans">
      <AnimatePresence mode="wait">
        {view === 'START' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center min-h-screen p-6"
          >
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl shadow-slate-200/40 p-12 border border-slate-200">
              <div className="text-center mb-12">
                <div className="bg-blue-600 inline-block p-3 rounded-lg mb-4 shadow-lg shadow-blue-200">
                  <Play className="w-8 h-8 text-white fill-current" />
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-1">Cancel 2.0</h1>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Neuropsychologische Diagnostik</p>
              </div>

              <div className="space-y-3">
                <div className="relative group">
                  <input
                    type="file"
                    accept=".json"
                    id="load-test-input"
                    className="hidden"
                    onChange={(e) => handleLoadTest(e, true)}
                  />
                  <label
                    htmlFor="load-test-input"
                    className="flex items-center gap-4 w-full p-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer transition-all duration-200 shadow-md active:scale-[0.99]"
                  >
                    <Play className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-bold text-base leading-none">Test durchführen</div>
                      <div className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-wider">Basisdatei laden</div>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCreateTest}
                    className="flex flex-col items-center justify-center gap-2 p-5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 rounded-xl transition-all duration-200 active:scale-[0.99]"
                  >
                    <PlusCircle className="w-6 h-6 text-slate-400" />
                    <span className="font-bold text-xs">Neu einrichten</span>
                  </button>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      id="edit-test-input"
                      className="hidden"
                      onChange={(e) => handleLoadTest(e, false)}
                    />
                    <label
                      htmlFor="edit-test-input"
                      className="flex flex-col items-center justify-center gap-2 p-5 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.99]"
                    >
                      <Settings2 className="w-6 h-6 text-slate-400" />
                      <span className="font-bold text-xs">Bearbeiten</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span className="uppercase tracking-widest">Version 2.0.4-Stable</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> System Bereit</span>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'SETUP' && currentConfig && (
          <SetupView 
            config={currentConfig} 
            onBack={() => setView('START')} 
            onSave={(updated) => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(updated, null, 2));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", `${updated.testName.toLowerCase().replace(/\s+/g, '-')}.json`);
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
              setView('START');
            }}
          />
        )}

        {view === 'TEST' && currentConfig && (
          <TestView 
            config={currentConfig} 
            onBack={() => setView('START')} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Setup View Component ---

const PAINT_TYPES = [
  { type: 'normal' as const,     label: 'Normal',    bg: 'bg-blue-500',   ring: 'ring-blue-500',   text: 'text-blue-700',   lightBg: 'bg-blue-50' },
  { type: 'defectLeft' as const, label: 'Defekt L',  bg: 'bg-red-500',    ring: 'ring-red-500',    text: 'text-red-700',    lightBg: 'bg-red-50' },
  { type: 'defectRight' as const,label: 'Defekt R',  bg: 'bg-sky-400',    ring: 'ring-sky-400',    text: 'text-sky-700',    lightBg: 'bg-sky-50' },
  { type: 'distractor' as const, label: 'Distraktor',bg: 'bg-purple-500', ring: 'ring-purple-500', text: 'text-purple-700', lightBg: 'bg-purple-50' },
];

function SetupView({ config, onBack, onSave }: { config: TestConfig, onBack: () => void, onSave: (c: TestConfig) => void }) {
  const [localConfig, setLocalConfig] = useState<TestConfig>(config);
  const [numTargets, setNumTargets] = useState<number>(localConfig.targets.length || 35);
  const [activeTab, setActiveTab] = useState<'info' | 'targets' | 'cutoffs'>('info');
  const [paintType, setPaintType] = useState<Target['type']>('normal');
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDraggingTarget = useRef(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setLocalConfig(prev => ({ ...prev, imageData: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const generateGrid = () => {
    const n = numTargets;
    const nCols = Math.ceil(Math.sqrt(n));
    const nRows = Math.ceil(n / nCols);
    const targets: Target[] = [];
    let count = 0;
    
    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        if (count >= n) break;
        targets.push({
          id: count + 1,
          x: Math.round((c + 1) * (localConfig.maxX / (nCols + 1))),
          y: Math.round((r + 1) * (localConfig.maxY / (nRows + 1))),
          type: 'normal'
        });
        count++;
      }
    }
    setLocalConfig(prev => ({ ...prev, targets }));
  };

  const updateTargetPosition = (id: number, x: number, y: number) => {
    setLocalConfig(prev => ({
      ...prev,
      targets: prev.targets.map(t => t.id === id ? { ...t, x, y } : t)
    }));
  };

  const updateTargetType = (id: number, type: Target['type']) => {
    setLocalConfig(prev => ({
      ...prev,
      targets: prev.targets.map(t => t.id === id ? { ...t, type } : t)
    }));
  };

  const addTarget = (x: number, y: number) => {
    const newId = localConfig.targets.length > 0 ? Math.max(...localConfig.targets.map(t => t.id)) + 1 : 1;
    setLocalConfig(prev => ({
      ...prev,
      targets: [...prev.targets, { id: newId, x: Math.round(x), y: Math.round(y), type: paintType }]
    }));
  };

  const deleteTarget = (id: number) => {
    setLocalConfig(prev => ({
      ...prev,
      targets: prev.targets.filter(t => t.id !== id)
    }));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!localConfig.imageData) return;
    if (isDraggingTarget.current) { isDraggingTarget.current = false; return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / 0.8);
    const y = Math.round((e.clientY - rect.top) / 0.8);
    if (x < 0 || y < 0 || x > localConfig.maxX || y > localConfig.maxY) return;
    addTarget(x, y);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      <header className="h-14 bg-slate-800 text-white flex items-center justify-between px-6 shrink-0 relative z-10 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-1.5 hover:bg-slate-700 rounded transition-colors cursor-pointer group">
            <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-white" />
          </button>
          <div>
            <h2 className="text-sm font-bold leading-tight">{localConfig.testName}</h2>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Test-Konfiguration</div>
          </div>
        </div>
        <button 
          onClick={() => onSave(localConfig)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm shadow-blue-900"
        >
          <Download className="w-4 h-4" />
          BASISDATEI SPEICHERN
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm">
          <div className="flex border-b border-slate-200 bg-slate-50">
            {(['info', 'targets', 'cutoffs'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              >
                {tab === 'info' && 'Allgemein'}
                {tab === 'targets' && 'Ziele'}
                {tab === 'cutoffs' && 'Grenzwerte'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Testname</label>
                  <input
                    type="text"
                    value={localConfig.testName}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, testName: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 outline-none focus:border-blue-400 focus:bg-white transition-all text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Kommentar</label>
                  <textarea
                    rows={3}
                    value={localConfig.comment}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 outline-none focus:border-blue-400 focus:bg-white transition-all text-xs font-bold resize-none"
                  />
                </div>
                <div className="pt-2 space-y-1">
                  <Toggle 
                    label="Hemi-Defekt Modus" 
                    checked={localConfig.markDefectMode} 
                    onChange={v => setLocalConfig(prev => ({ ...prev, markDefectMode: v }))} 
                  />
                  <Toggle 
                    label="Perseverationen" 
                    checked={localConfig.perseverate} 
                    onChange={v => setLocalConfig(prev => ({ ...prev, perseverate: v }))} 
                  />
                  <Toggle 
                    label="Copy Task" 
                    checked={localConfig.copyTask} 
                    onChange={v => setLocalConfig(prev => ({ ...prev, copyTask: v }))} 
                  />
                </div>
                <div className="pt-4 bg-slate-50 p-3 rounded border border-slate-100">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex justify-between">
                    <span>Target-Größe</span>
                    <span className="text-slate-900">{localConfig.targetSize}px</span>
                  </label>
                  <input
                    type="range"
                    min="16"
                    max="48"
                    value={localConfig.targetSize}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, targetSize: parseInt(e.target.value) }))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            )}

            {activeTab === 'targets' && (
              <div className="space-y-4">
                {/* Paint mode selector */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Paint-Modus</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PAINT_TYPES.map(pt => (
                      <button
                        key={pt.type}
                        onClick={() => setPaintType(pt.type)}
                        className={`flex items-center gap-2 px-3 py-2 rounded border-2 text-[10px] font-black uppercase tracking-tight transition-all ${
                          paintType === pt.type
                            ? `${pt.lightBg} border-current ${pt.text} ring-2 ${pt.ring} ring-offset-1`
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full ${pt.bg} shrink-0`} />
                        {pt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 ml-1 leading-relaxed">
                    Leere Fläche klicken → Target erstellen<br />
                    Target klicken → Typ ändern oder löschen
                  </p>
                </div>

                {/* Type count summary */}
                {localConfig.targets.length > 0 && (
                  <div className="bg-slate-50 rounded border border-slate-100 p-3">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Verteilung ({localConfig.targets.length} gesamt)</div>
                    <div className="grid grid-cols-2 gap-1">
                      {PAINT_TYPES.map(pt => {
                        const count = localConfig.targets.filter(t => t.type === pt.type).length;
                        return (
                          <div key={pt.type} className={`flex items-center gap-1.5 px-2 py-1 rounded ${pt.lightBg}`}>
                            <div className={`w-2 h-2 rounded-full ${pt.bg} shrink-0`} />
                            <span className={`text-[9px] font-black ${pt.text}`}>{pt.label}</span>
                            <span className={`ml-auto text-[10px] font-black ${pt.text}`}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Grid generator */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Auto-Grid</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={numTargets}
                      onChange={(e) => setNumTargets(parseInt(e.target.value) || 0)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-2 outline-none focus:border-blue-400 focus:bg-white transition-all text-xs font-bold tabular-nums"
                    />
                    <button
                      onClick={generateGrid}
                      title="Gleichmäßiges Grid generieren (alle Normal)"
                      className="p-2 bg-slate-900 text-white rounded hover:bg-slate-800 active:scale-95 transition-all w-10 flex items-center justify-center shadow-lg"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                  </div>
                </div>


                {/* Compact target list by type */}
                {localConfig.targets.length > 0 && (
                  <div className="space-y-2">
                    {PAINT_TYPES.map(pt => {
                      const group = localConfig.targets.filter(t => t.type === pt.type);
                      if (group.length === 0) return null;
                      return (
                        <div key={pt.type}>
                          <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${pt.text}`}>{pt.label}</div>
                          <div className="flex flex-wrap gap-1">
                            {group.map(t => (
                              <span
                                key={t.id}
                                onClick={() => {
                                  const next = PAINT_TYPES[(PAINT_TYPES.findIndex(p => p.type === t.type) + 1) % PAINT_TYPES.length].type;
                                  updateTargetType(t.id, next);
                                }}
                                title={`#${t.id} — klicken zum Wechseln`}
                                className={`inline-flex items-center justify-center w-7 h-5 rounded text-[8px] font-black cursor-pointer ${pt.lightBg} ${pt.text} border border-current/20 hover:opacity-70`}
                              >
                                {t.id}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {localConfig.targets.length === 0 && (
                  <div className="text-center py-8 text-slate-400 italic text-xs">Keine Targets definiert.</div>
                )}
              </div>
            )}

            {activeTab === 'cutoffs' && (
              <div className="space-y-4">
                <CutoffField 
                  label="CoC Untergrenze" 
                  value={localConfig.cutoffs.cocLower} 
                  onChange={v => setLocalConfig(prev => ({ ...prev, cutoffs: { ...prev.cutoffs, cocLower: v } }))} 
                />
                <CutoffField 
                  label="CoC Obergrenze" 
                  value={localConfig.cutoffs.cocUpper} 
                  onChange={v => setLocalConfig(prev => ({ ...prev, cutoffs: { ...prev.cutoffs, cocUpper: v } }))} 
                />
                <CutoffField 
                  label="Auslassungen L max." 
                  value={localConfig.cutoffs.omissionsLeft} 
                  onChange={v => setLocalConfig(prev => ({ ...prev, cutoffs: { ...prev.cutoffs, omissionsLeft: v } }))} 
                />
                <CutoffField 
                  label="Auslassungen R max." 
                  value={localConfig.cutoffs.omissionsRight} 
                  onChange={v => setLocalConfig(prev => ({ ...prev, cutoffs: { ...prev.cutoffs, omissionsRight: v } }))} 
                />
                <CutoffField
                  label="Falsch Normal max."
                  value={localConfig.cutoffs.falsePositivesNormal}
                  onChange={v => setLocalConfig(prev => ({ ...prev, cutoffs: { ...prev.cutoffs, falsePositivesNormal: v } }))}
                />
                {localConfig.targets.some(t => t.type === 'distractor') && (
                  <CutoffField
                    label="Falsch Distraktor max."
                    value={localConfig.cutoffs.falsePositivesDistractor ?? 3}
                    onChange={v => setLocalConfig(prev => ({ ...prev, cutoffs: { ...prev.cutoffs, falsePositivesDistractor: v } }))}
                  />
                )}
                {localConfig.markDefectMode && (
                  <>
                    <CutoffField 
                      label="Falsch Defekt L max." 
                      value={localConfig.cutoffs.falsePositivesDefectLeft} 
                      onChange={v => setLocalConfig(prev => ({ ...prev, cutoffs: { ...prev.cutoffs, falsePositivesDefectLeft: v } }))} 
                    />
                    <CutoffField 
                      label="Falsch Defekt R max." 
                      value={localConfig.cutoffs.falsePositivesDefectRight} 
                      onChange={v => setLocalConfig(prev => ({ ...prev, cutoffs: { ...prev.cutoffs, falsePositivesDefectRight: v } }))} 
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 relative bg-slate-200 overflow-hidden flex items-center justify-center p-8">
          {localConfig.imageData ? (
            <div
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="relative shadow-2xl bg-white cursor-crosshair"
              style={{ width: localConfig.maxX, height: localConfig.maxY, transform: 'scale(0.8)', transformOrigin: 'center' }}
            >
              <img
                src={localConfig.imageData}
                alt="Test"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-80"
              />
              <div className="absolute inset-0">
                {localConfig.targets.map(t => (
                  <TargetOverlay
                    key={t.id}
                    target={t}
                    size={localConfig.targetSize}
                    mode="SETUP"
                    onUpdate={(x, y) => updateTargetPosition(t.id, x, y)}
                    onDragStart={() => { isDraggingTarget.current = true; }}
                    onClick={() => {
                      if (t.type === paintType) {
                        deleteTarget(t.id);
                      } else {
                        updateTargetType(t.id, paintType);
                      }
                    }}
                    bounds={{ width: localConfig.maxX, height: localConfig.maxY }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md p-12 bg-white rounded-3xl border-4 border-dashed border-slate-300 text-center flex flex-col items-center justify-center gap-4">
              <Upload className="w-16 h-16 text-slate-300" />
              <div className="text-slate-500 font-bold">Bitte laden Sie ein Testbild hoch</div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="initial-img-upload" />
              <label htmlFor="initial-img-upload" className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold cursor-pointer hover:bg-slate-800 transition-all active:scale-95 shadow-lg">
                Bild auswählen
              </label>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- Test View Component ---

function TestView({ config, onBack }: { config: TestConfig, onBack: () => void }) {
  const [patient, setPatient] = useState<PatientData>({ name: '', date: new Date().toISOString().split('T')[0] });
  const [targets, setTargets] = useState<Target[]>(config.targets);
  const [perseverationCount, setPerseverationCount] = useState<number>(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  const markAllCorrect = () => {
    setTargets(prev => prev.map(t => t.type === 'normal' ? { ...t, checked: true } : t));
  };

  const resetAll = () => {
    setTargets(prev => prev.map(t => ({ ...t, checked: false, checkedDefect: false })));
  };

  const toggleTarget = (id: number) => {
    setTargets(prev => prev.map(t => {
      if (t.id === id) {
        if (config.markDefectMode && (t.type === 'defectLeft' || t.type === 'defectRight')) {
          if (!t.checked && !t.checkedDefect) return { ...t, checked: true };
          if (t.checked && !t.checkedDefect) return { ...t, checked: false, checkedDefect: true };
          return { ...t, checked: false, checkedDefect: false };
        } else {
          return { ...t, checked: !t.checked };
        }
      }
      return t;
    }));
  };

  const results = useMemo(() => {
    const normalTargets = targets.filter(t => t.type === 'normal');
    const checkedNormal = normalTargets.filter(t => t.checked);
    
    // CoC Calculation
    const maxX = config.maxX;
    const minXTarget = normalTargets.length ? Math.min(...normalTargets.map(t => t.x)) : 0;
    const maxXTarget = normalTargets.length ? Math.max(...normalTargets.map(t => t.x)) : maxX;
    const rangeX = maxXTarget - minXTarget || 1;

    const xScaledAll = normalTargets.map(t => (t.x - minXTarget) / rangeX);
    const meanXAll = xScaledAll.reduce((a, b) => a + b, 0) / (normalTargets.length || 1);
    
    // Y Calculations
    const minYTarget = normalTargets.length ? Math.min(...normalTargets.map(t => t.y)) : 0;
    const maxYTarget = normalTargets.length ? Math.max(...normalTargets.map(t => t.y)) : config.maxY;
    const rangeY = maxYTarget - minYTarget || 1;
    const yScaledAll = normalTargets.map(t => ((config.maxY - t.y) - (config.maxY - maxYTarget)) / rangeY);
    const meanYAll = yScaledAll.reduce((a, b) => a + b, 0) / (normalTargets.length || 1);

    let coc = 0;
    let cocY = 0;
    if (checkedNormal.length > 0) {
      const xScaledChecked = checkedNormal.map(t => (t.x - minXTarget) / rangeX);
      const meanXChecked = xScaledChecked.reduce((a, b) => a + b, 0) / checkedNormal.length;
      coc = 2 * (meanXChecked - meanXAll);

      const yScaledChecked = checkedNormal.map(t => ((config.maxY - t.y) - (config.maxY - maxYTarget)) / rangeY);
      const meanYChecked = yScaledChecked.reduce((a, b) => a + b, 0) / checkedNormal.length;
      cocY = 2 * (meanYChecked - meanYAll);
    }

    // Omissions & Side Logic
    const midXActual = (minXTarget + maxXTarget) / 2;
    const leftAll = normalTargets.filter(t => t.x < midXActual);
    const rightAll = normalTargets.filter(t => t.x >= midXActual);
    
    const leftMissed = leftAll.filter(t => !t.checked).length;
    const rightMissed = rightAll.filter(t => !t.checked).length;
    const leftHits = leftAll.filter(t => t.checked).length;
    const rightHits = rightAll.filter(t => t.checked).length;

    // Chi2
    const chiResult = chi2Corrected(leftHits, rightHits, leftMissed, rightMissed);

    // Allocentric Indexes
    const dlTargets = targets.filter(t => t.type === 'defectLeft');
    const drTargets = targets.filter(t => t.type === 'defectRight');

    const Le = dlTargets.filter(t => t.checked).length;
    const Re = drTargets.filter(t => t.checked).length;
    const Lc = dlTargets.filter(t => t.checkedDefect).length;
    const Rc = drTargets.filter(t => t.checkedDefect).length;
    const Wc = checkedNormal.length;

    let allocIndex = ((Le - Re) / (Wc || 1) + (Rc - Lc) / ((Rc + Lc) || 1)) / 2;
    
    // Validate Alloc Index
    const invalidAlloc = ((Le + Re) / 2) >= Wc;

    // Distractors (false positives)
    const distractorTargets = targets.filter(t => t.type === 'distractor');
    const distractorHits = distractorTargets.filter(t => t.checked).length;

    return {
      coc,
      cocY,
      leftMissed,
      rightMissed,
      leftHits,
      rightHits,
      chiP: chiResult.p,
      allMarked: checkedNormal.length,
      totalNormal: normalTargets.length,
      allocIndex,
      invalidAlloc,
      Le, Re, Lc, Rc, Wc,
      distractorHits,
      totalDistractors: distractorTargets.length,
    };
  }, [targets, config]);

  const exportPDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // Head
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(config.testName, margin, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Patient: ${patient.name || 'N/A'}`, margin, 30);
    doc.text(`Datum: ${patient.date}`, margin, 35);

    // Canvas Snapshot
    // To get a high-quality capture, we render to a hidden canvas or a dedicated scaling method.
    // For this app, we build a temporary canvas.
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = config.maxX;
    tempCanvas.height = config.maxY;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      // 1. Draw Image with object-contain (matches how the app displays it)
      const img = new Image();
      img.src = config.imageData;
      await new Promise(resolve => img.onload = resolve);
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = config.maxX / config.maxY;
      let drawX = 0, drawY = 0, drawW = config.maxX, drawH = config.maxY;
      if (imgAspect > canvasAspect) {
        drawH = config.maxX / imgAspect;
        drawY = (config.maxY - drawH) / 2;
      } else {
        drawW = config.maxY * imgAspect;
        drawX = (config.maxX - drawW) / 2;
      }
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // 2. Draw Targets
      targets.forEach(t => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, config.targetSize / 2, 0, Math.PI * 2);
        
        // green = correct, red = missed/wrong
        let color = 'rgba(239, 68, 68, 0.3)';
        if (t.type === 'normal') {
          color = t.checked ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.5)';
        } else if (t.type === 'defectLeft' || t.type === 'defectRight') {
          color = t.checkedDefect ? 'rgba(34, 197, 94, 0.8)' : (t.checked ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.25)');
        } else if (t.type === 'distractor') {
          color = t.checked ? 'rgba(239, 68, 68, 0.7)' : 'rgba(168, 85, 247, 0.15)';
        }
        
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      const imgData = tempCanvas.toDataURL('image/png');
      const imgHeight = (config.maxY * contentWidth) / config.maxX;
      doc.addImage(imgData, 'PNG', margin, 45, contentWidth, imgHeight);

      // Table
      const tableY = 45 + imgHeight + 10;
      doc.setFontSize(12);
      doc.text('Ergebnisse', margin, tableY);
      
      doc.setFontSize(9);
      const rows = [
        ['Maß', 'Wert', 'Grenzwert', 'Status'],
        ['CoC (kalibriert)', results.coc.toFixed(3), `${config.cutoffs.cocLower} / ${config.cutoffs.cocUpper}`, results.coc < config.cutoffs.cocLower || results.coc > config.cutoffs.cocUpper ? 'Auffällig' : 'Normal'],
        ['CoC (Y-Achse)', results.cocY.toFixed(3), '-', '-'],
        ['Auslassungen Links', results.leftMissed.toString(), `≤ ${config.cutoffs.omissionsLeft}`, results.leftMissed > config.cutoffs.omissionsLeft ? 'Auffällig' : 'Normal'],
        ['Auslassungen Rechts', results.rightMissed.toString(), `≤ ${config.cutoffs.omissionsRight}`, results.rightMissed > config.cutoffs.omissionsRight ? 'Auffällig' : 'Normal'],
        ['Chi² p-Wert', results.chiP.toFixed(3), '< 0.05', results.chiP < 0.05 ? 'Signifikant' : 'Unauffällig'],
        ['Alloc. a-Index', results.invalidAlloc ? 'Ungültig' : results.allocIndex.toFixed(2), '-', '-'],
        ['Perseverationen', perseverationCount.toString(), '-', '-'],
        ...(results.totalDistractors > 0 ? [['Distraktoren (falsch)', `${results.distractorHits} / ${results.totalDistractors}`, `≤ ${config.cutoffs.falsePositivesDistractor ?? 3}`, results.distractorHits > (config.cutoffs.falsePositivesDistractor ?? 3) ? 'Auffällig' : 'Normal']] : []),
      ];

      let currentY = tableY + 8;
      rows.forEach((row, i) => {
        if (i === 0) doc.setFont('helvetica', 'bold');
        else doc.setFont('helvetica', 'normal');
        
        doc.text(row[0], margin, currentY);
        doc.text(row[1], margin + 60, currentY);
        doc.text(row[2], margin + 90, currentY);
        doc.text(row[3], margin + 140, currentY);
        currentY += 6;
      });
    }

    doc.save(`${patient.name || 'test'}_${patient.date}.pdf`);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100">
      <header className="h-14 bg-slate-800 text-white flex items-center justify-between px-6 shrink-0 relative z-20 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-1.5 hover:bg-slate-700 rounded transition-colors cursor-pointer group text-slate-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
             <h2 className="text-sm font-bold leading-tight">{config.testName}</h2>
             <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">In Durchführung</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900 p-1 rounded border border-slate-700">
            <input 
              placeholder="Patientenname"
              value={patient.name}
              onChange={(e) => setPatient(prev => ({ ...prev, name: e.target.value }))}
              className="bg-transparent text-white px-2 py-1 outline-none font-medium placeholder:text-slate-600 w-40 text-xs"
            />
            <input 
              type="date"
              value={patient.date}
              onChange={(e) => setPatient(prev => ({ ...prev, date: e.target.value }))}
              className="bg-slate-800 text-white px-2 py-1 rounded outline-none font-medium text-[10px] border-l border-slate-700"
            />
          </div>
          <button 
            onClick={exportPDF}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-900/40 transition-all active:scale-95 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            PDF EXPORT
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Stats */}
        <aside className="w-[296px] bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto shadow-sm z-10">
          {/* Quick actions */}
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex gap-2">
            <button
              onClick={markAllCorrect}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <ListChecks className="w-3.5 h-3.5" />
              Alle korrekt markieren
            </button>
            <button
              onClick={resetAll}
              title="Alle Markierungen zurücksetzen"
              className="p-2 bg-white border border-slate-200 hover:border-slate-400 text-slate-500 hover:text-slate-800 rounded transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-5">
            {/* Treffer */}
            <div>
              <SidebarSection label="Treffer" />
              <div className="space-y-1.5">
                <StatRow
                  label="Korrekt markiert"
                  value={`${results.allMarked} / ${results.totalNormal}`}
                  sub={`${((results.allMarked / (results.totalNormal || 1)) * 100).toFixed(0)}%`}
                  info="Anzahl der korrekt angekreuzten Targets (Treffer) im Verhältnis zur Gesamtzahl aller Targets."
                />
              </div>
            </div>

            {/* Auslassungen */}
            <div>
              <SidebarSection label="Auslassungen" info="Targets, die der Patient NICHT angekreuzt hat. Aufgeteilt nach linker und rechter Bildhälfte (Mittelpunkt = geometrische Mitte aller Targets)." />
              <div className="grid grid-cols-2 gap-2">
                <HemiCard
                  side="Links"
                  hits={results.leftHits}
                  missed={results.leftMissed}
                  cutoff={config.cutoffs.omissionsLeft}
                />
                <HemiCard
                  side="Rechts"
                  hits={results.rightHits}
                  missed={results.rightMissed}
                  cutoff={config.cutoffs.omissionsRight}
                />
              </div>
            </div>

            {/* Räumliche Asymmetrie */}
            <div>
              <SidebarSection label="Räumliche Asymmetrie" />
              <div className="space-y-1.5">
                <StatRow
                  label="CoC (horizontal)"
                  value={results.coc.toFixed(3)}
                  alert={results.coc < config.cutoffs.cocLower || results.coc > config.cutoffs.cocUpper}
                  info={`Coefficient of Concentration (horizontal). Misst die räumliche Tendenz beim Ankreuzen: positive Werte = Tendenz nach rechts, negative Werte = Tendenz nach links. Normbereich: ${config.cutoffs.cocLower} bis ${config.cutoffs.cocUpper}.`}
                />
                <StatRow
                  label="CoC (vertikal)"
                  value={results.cocY.toFixed(3)}
                  info="Coefficient of Concentration (vertikal). Positive Werte = Tendenz nach oben, negative Werte = Tendenz nach unten."
                />
                <StatRow
                  label="Chi² p-Wert"
                  value={results.chiP.toFixed(3)}
                  symbol={results.chiP < 0.05 ? ' *' : ''}
                  info="Yates-korrigierter Chi-Quadrat-Test auf Asymmetrie zwischen linker und rechter Hemisphäre. p < 0.05 = statistisch signifikante Asymmetrie."
                />
              </div>
            </div>

            {/* Distraktoren */}
            {results.totalDistractors > 0 && (
              <div>
                <SidebarSection label="Distraktoren" info="Items, die NICHT angekreuzt werden sollten. Ein Ankreuzen gilt als Fehler (falsch-positiv)." />
                <StatRow
                  label="Falsch angekreuzt"
                  value={`${results.distractorHits} / ${results.totalDistractors}`}
                  alert={results.distractorHits > (config.cutoffs.falsePositivesDistractor ?? 3)}
                  info={`Anzahl der fälschlicherweise angekreuzten Distraktoren. Grenzwert: ≤ ${config.cutoffs.falsePositivesDistractor ?? 3}.`}
                />
              </div>
            )}

            {/* Allocentrisch */}
            {config.markDefectMode && (
              <div>
                <SidebarSection label="Allocentrisch" info="Misst objektbezogene (allocentrische) Vernachlässigung anhand von Items mit einseitigen Defekten. Unabhängig von der räumlichen Position des Objekts." />
                <div className="space-y-1.5">
                  <StatRow
                    label="a-Index"
                    value={results.invalidAlloc ? 'Ungültig' : results.allocIndex.toFixed(2)}
                    info="Allocentrischer Index: > 0 = links-allocentrische Vernachlässigung, < 0 = rechts-allocentrisch. Ungültig wenn zu wenige Korrekt-Markierungen vorliegen."
                  />
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    <div className="p-1.5 px-2 bg-slate-50 rounded border border-slate-100 space-y-0.5">
                      <div className="text-[8px] text-slate-400">Defekt-Fehler</div>
                      <div>Le: {results.Le} · Re: {results.Re}</div>
                    </div>
                    <div className="p-1.5 px-2 bg-slate-50 rounded border border-slate-100 space-y-0.5">
                      <div className="text-[8px] text-slate-400">Defekt-Korrekt</div>
                      <div>Lc: {results.Lc} · Rc: {results.Rc}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Perseverationen */}
            {config.perseverate && (
              <div>
                <SidebarSection label="Perseverationen" info="Mehrfaches Ankreuzen desselben Items. Manuell zu erfassen." />
                <div className="flex items-center gap-2">
                  <button onClick={() => setPerseverationCount(c => Math.max(0, c - 1))} className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-lg text-slate-600 transition-colors cursor-pointer">-</button>
                  <div className="flex-1 text-center font-black text-xl text-slate-800 tabular-nums">{perseverationCount}</div>
                  <button onClick={() => setPerseverationCount(c => c + 1)} className="w-8 h-8 rounded bg-slate-900 hover:bg-slate-800 flex items-center justify-center font-bold text-lg text-white transition-colors cursor-pointer">+</button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto p-3 bg-slate-50 border-t border-slate-200">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Grenzwerte</div>
            <div className="text-[9px] text-slate-500 font-bold opacity-60">
              CoC: {config.cutoffs.cocLower} / {config.cutoffs.cocUpper} · Miss L/R: {config.cutoffs.omissionsLeft} / {config.cutoffs.omissionsRight}
            </div>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 relative bg-slate-200 flex items-center justify-center p-4">
          <div 
            className="relative shadow-2xl bg-white border border-slate-300"
            style={{ 
              width: config.maxX, 
              height: config.maxY, 
              transform: 'scale(0.8)', 
              transformOrigin: 'center' 
            }}
          >
            <img 
              src={config.imageData} 
              alt="Test" 
              className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-90"
            />
            {/* Grid Placeholder pattern as seen in design */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            
            <div className="absolute inset-0">
              {targets.map(t => (
                <TargetOverlay 
                  key={t.id} 
                  target={t} 
                  size={config.targetSize}
                  mode="TEST"
                  onClick={() => toggleTarget(t.id)}
                />
              ))}
            </div>
            {/* Center Reference crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-slate-200/50 pointer-events-none">
              <div className="absolute top-1/2 w-full h-px bg-slate-200/30"></div>
              <div className="absolute left-1/2 h-full w-px bg-slate-200/30"></div>
            </div>
          </div>

          <footer className="absolute bottom-4 left-6 right-6 flex justify-between text-[10px] text-slate-400 font-black opacity-40 uppercase tracking-[0.3em] pointer-events-none">
            <span>Nur zur klinischen Verwendung</span>
            <span>Cancel 2.0 Diagnostik Module</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

// --- Sub-Components ---

function Toggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group p-1.5 hover:bg-slate-50 rounded transition-colors">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900">{label}</span>
      <div 
        onClick={() => onChange(!checked)}
        className={`w-8 h-4 rounded-full relative transition-all duration-200 ${checked ? 'bg-emerald-500 shadow-sm' : 'bg-slate-200'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
    </label>
  );
}

function CutoffField({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="bg-slate-50 p-2 px-3 rounded border border-slate-100">
      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-transparent border-0 p-0 outline-none focus:ring-0 text-sm font-black text-slate-800 tabular-nums"
      />
    </div>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <div className="relative inline-flex group/tip">
      <Info className="w-3 h-3 text-slate-300 cursor-help shrink-0" />
      <div className="absolute left-full top-0 ml-2 w-56 p-2.5 bg-slate-800 text-white text-[9px] leading-relaxed rounded shadow-xl opacity-0 group-hover/tip:opacity-100 pointer-events-none z-50 transition-opacity font-normal normal-case tracking-normal">
        {text}
      </div>
    </div>
  );
}

function SidebarSection({ label, info }: { label: string; info?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <div className="w-1 h-3 rounded-full bg-blue-500 shrink-0" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      {info && <InfoTip text={info} />}
    </div>
  );
}

function HemiCard({ side, hits, missed, cutoff }: { side: string; hits: number; missed: number; cutoff: number }) {
  const over = missed > cutoff;
  return (
    <div className={`p-2.5 rounded border flex flex-col gap-1 ${over ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
      <div className="text-[9px] font-black text-slate-400 uppercase">{side}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-black text-slate-800 tabular-nums">{hits}</span>
        <span className="text-[9px] text-slate-400 font-bold">getroffen</span>
      </div>
      <div className={`flex items-center gap-1 text-[9px] font-black ${over ? 'text-rose-600' : 'text-slate-400'}`}>
        {over && <AlertTriangle className="w-3 h-3" />}
        <span>{missed} Auslassung{missed !== 1 ? 'en' : ''}</span>
        {over && <span className="text-rose-400">(max. {cutoff})</span>}
      </div>
    </div>
  );
}

function StatRow({ label, value, sub, alert, symbol, info }: { label: string, value: string, sub?: string, alert?: boolean, symbol?: string, info?: string }) {
  return (
    <div className={`flex items-center justify-between p-2 rounded border transition-colors ${alert ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
      <div className="flex items-center gap-1.5">
        <div className={`text-[10px] font-bold ${alert ? 'text-rose-900' : 'text-slate-500'} uppercase tracking-tight`}>{label}</div>
        {info && <InfoTip text={info} />}
      </div>
      <div className="flex items-center gap-2">
        {alert && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />}
        <div className={`font-black text-sm tabular-nums ${alert ? 'text-rose-600' : 'text-slate-900'}`}>
          {value}{symbol && <span className="ml-0.5">{symbol}</span>}
        </div>
        {sub && <div className="text-[9px] font-black text-slate-400">{sub}</div>}
      </div>
    </div>
  );
}

// --- Target Overlay (Shared Logic) ---

interface TargetOverlayProps {
  target: Target;
  size: number;
  mode: 'SETUP' | 'TEST';
  onUpdate?: (x: number, y: number) => void;
  onDragStart?: () => void;
  onClick?: () => void;
  bounds?: { width: number; height: number };
}

function TargetOverlay({ target, size, mode, onUpdate, onDragStart, onClick, bounds }: TargetOverlayProps) {
  const isDragging = useRef(false);
  const hasMoved = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'SETUP') return;
    isDragging.current = true;
    hasMoved.current = false;
    e.stopPropagation();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (mode === 'SETUP') {
      e.stopPropagation();
      if (hasMoved.current) return;
      onClick?.();
    } else {
      onClick?.();
    }
  };

  useEffect(() => {
    if (mode !== 'SETUP') return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !onUpdate || !bounds) return;
      if (!hasMoved.current) onDragStart?.();
      hasMoved.current = true;

      const parent = (e.target as HTMLElement).closest('.relative');
      if (!parent) return;
      const rect = parent.getBoundingClientRect();

      const scale = 0.8;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      onUpdate(Math.min(Math.max(0, x), bounds.width), Math.min(Math.max(0, y), bounds.height));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mode, onUpdate, bounds]);

  let bgColor: string;
  let borderColor: string;

  if (mode === 'SETUP') {
    // Bright, clearly distinguishable colors in setup mode
    if (target.type === 'normal') {
      bgColor = 'rgba(59, 130, 246, 0.55)';
      borderColor = 'rgba(37, 99, 235, 0.9)';
    } else if (target.type === 'defectLeft') {
      bgColor = 'rgba(239, 68, 68, 0.55)';
      borderColor = 'rgba(220, 38, 38, 0.9)';
    } else if (target.type === 'defectRight') {
      bgColor = 'rgba(14, 165, 233, 0.55)';
      borderColor = 'rgba(2, 132, 199, 0.9)';
    } else {
      bgColor = 'rgba(168, 85, 247, 0.55)';
      borderColor = 'rgba(139, 92, 246, 0.9)';
    }
  } else {
    bgColor = 'rgba(203, 213, 225, 0.2)';
    borderColor = 'rgba(148, 163, 184, 0.3)';

    if (target.type === 'normal') {
      bgColor = target.checked ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.15)';
      borderColor = target.checked ? 'rgba(16, 185, 129, 0.8)' : 'rgba(56, 189, 248, 0.5)';
    } else if (target.type === 'defectLeft') {
      bgColor = target.checkedDefect ? 'rgba(16, 185, 129, 0.4)' : (target.checked ? 'rgba(244, 63, 94, 0.3)' : 'rgba(244, 63, 94, 0.05)');
      borderColor = target.checkedDefect ? 'rgba(16, 185, 129, 0.8)' : 'rgba(244, 63, 94, 0.6)';
    } else if (target.type === 'defectRight') {
      bgColor = target.checkedDefect ? 'rgba(16, 185, 129, 0.4)' : (target.checked ? 'rgba(56, 189, 248, 0.3)' : 'rgba(56, 189, 248, 0.05)');
      borderColor = target.checkedDefect ? 'rgba(16, 185, 129, 0.8)' : 'rgba(56, 189, 248, 0.6)';
    } else if (target.type === 'distractor') {
      bgColor = target.checked ? 'rgba(239, 68, 68, 0.35)' : 'rgba(168, 85, 247, 0.07)';
      borderColor = target.checked ? 'rgba(239, 68, 68, 0.7)' : 'rgba(168, 85, 247, 0.4)';
    }
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={`absolute rounded-full border transition-all cursor-pointer flex items-center justify-center select-none active:scale-110 ${mode === 'SETUP' ? 'hover:scale-110 hover:z-50' : ''}`}
      style={{
        left: target.x,
        top: target.y,
        width: size,
        height: size,
        backgroundColor: bgColor,
        borderColor: borderColor,
        borderWidth: mode === 'SETUP' ? 2 : 1,
        transform: 'translate(-50%, -50%)',
        boxShadow: target.checked || target.checkedDefect ? '0 0 10px rgba(0,0,0,0.1)' : 'none'
      }}
    >
      {mode === 'SETUP' && <div className="text-[7px] font-black text-white opacity-70 drop-shadow">{target.id}</div>}
      {(target.checked || target.checkedDefect) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1.5 h-1.5 rounded-full bg-slate-900"></motion.div>}
    </div>
  );
}
