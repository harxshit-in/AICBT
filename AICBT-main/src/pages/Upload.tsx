import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PDFUploader from '../components/PDFUploader';
import { ArrowLeft, Info, Key, Settings } from 'lucide-react';

export default function Upload() {
  const navigate = useNavigate();
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    const apiKey = localStorage.getItem('user_gemini_api_key');
    setHasApiKey(!!apiKey);
  }, []);

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

      {!hasApiKey ? (
        <div className="bg-red-50 border-2 border-red-100 rounded-[2.5rem] p-10 text-center space-y-6">
          <div className="bg-red-100 w-20 h-20 rounded-3xl flex items-center justify-center text-red-600 mx-auto">
            <Key className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-red-900">API Key Required</h2>
            <p className="text-red-700 font-medium max-w-md mx-auto">
              To extract questions from your PDF, you need to provide a Gemini API Key. 
              This ensures your data stays private and the service remains free.
            </p>
          </div>
          <Link
            to="/settings"
            className="inline-flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-200 active:scale-95"
          >
            <Settings className="w-5 h-5" />
            Go to Settings to add API Key
          </Link>
        </div>
      ) : (
        <PDFUploader onComplete={() => navigate('/')} />
      )}

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
