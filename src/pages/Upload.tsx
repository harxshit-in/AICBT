import React from 'react';
import { useNavigate } from 'react-router-dom';
import PDFUploader from '../components/PDFUploader';
import { ArrowLeft, Info } from 'lucide-react';

export default function Upload() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Upload Exam Paper</h1>
        <p className="text-slate-500">Convert your PDF exam paper into an interactive online test</p>
      </div>

      <PDFUploader onComplete={() => navigate('/')} />

      <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100 flex gap-4">
        <div className="bg-orange-100 p-2 rounded-xl h-fit">
          <Info className="w-5 h-5 text-orange-600" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-orange-900">Tips for best results:</h4>
          <ul className="text-sm text-orange-800/80 space-y-1 list-disc list-inside">
            <li>Ensure the PDF has clear text and multiple-choice questions.</li>
            <li>Both <strong>English and Hindi</strong> questions are now supported.</li>
            <li>Bilingual papers (English + Hindi) are detected automatically.</li>
            <li>You can choose to keep English, Hindi, or both after extraction.</li>
            <li>Math expressions and symbols are preserved using AI extraction.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
