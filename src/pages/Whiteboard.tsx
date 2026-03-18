import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { 
  Pencil, 
  Eraser, 
  Trash2, 
  Download, 
  Users, 
  Share2,
  Undo2,
  Redo2,
  Square,
  Circle as CircleIcon,
  Type as TypeIcon
} from 'lucide-react';
import { db, auth } from '../utils/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

export default function Whiteboard() {
  const [tool, setTool] = useState('pen');
  const [lines, setLines] = useState<any[]>([]);
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const isDrawing = useRef(false);
  const stageRef = useRef<any>(null);
  const sessionId = "global_study_room"; // For demo, use a fixed session

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "whiteboard_data", sessionId), (doc) => {
      if (doc.exists()) {
        setLines(doc.data().lines || []);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleMouseDown = (e: any) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    const newLine = { tool, points: [pos.x, pos.y], color, strokeWidth };
    const newLines = [...lines, newLine];
    setLines(newLines);
    syncToFirebase(newLines);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    syncToFirebase(lines);
  };

  const syncToFirebase = async (newLines: any[]) => {
    try {
      await setDoc(doc(db, "whiteboard_data", sessionId), { lines: newLines }, { merge: true });
    } catch (err) {
      console.error("Firebase Sync Error:", err);
    }
  };

  const clearBoard = () => {
    setLines([]);
    syncToFirebase([]);
  };

  const downloadImage = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-32px)] bg-slate-50 rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[
            { id: 'pen', icon: Pencil, label: 'Pen' },
            { id: 'eraser', icon: Eraser, label: 'Eraser' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`p-3 rounded-xl transition-all ${
                tool === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              title={t.label}
            >
              <t.icon size={20} />
            </button>
          ))}
          <div className="w-px h-8 bg-slate-200 mx-2" />
          <input 
            type="color" 
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded-xl border-none cursor-pointer overflow-hidden"
          />
          <select 
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="bg-slate-100 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none"
          >
            <option value="2">Thin</option>
            <option value="5">Medium</option>
            <option value="10">Thick</option>
            <option value="20">Extra Thick</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={downloadImage}
            className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"
            title="Download as Image"
          >
            <Download size={20} />
          </button>
          <button 
            onClick={clearBoard}
            className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all"
            title="Clear Board"
          >
            <Trash2 size={20} />
          </button>
          <div className="w-px h-8 bg-slate-200 mx-2" />
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Users size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Collaborative Mode</span>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-white cursor-crosshair relative">
        <Stage
          width={window.innerWidth}
          height={window.innerHeight}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          ref={stageRef}
        >
          <Layer>
            {lines.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke={line.tool === 'eraser' ? '#ffffff' : line.color}
                strokeWidth={line.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === 'eraser' ? 'destination-out' : 'source-over'
                }
              />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Footer Info */}
      <div className="bg-white border-t border-slate-100 p-4 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Collaborative AI Whiteboard • Real-time Sync Active
        </p>
      </div>
    </div>
  );
}
