import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Search } from 'lucide-react';
import { QuestionBank, getAllBanks } from '../utils/storage';

export default function AllPdfToCbt() {
  const navigate = useNavigate();
  const [pdfTests, setPdfTests] = useState<QuestionBank[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getAllBanks().then(banksData => {
      const pdfs = banksData.filter(b => b.sourceFile && b.sourceFile.toLowerCase().endsWith('.pdf'));
      setPdfTests(pdfs.sort((a, b) => b.createdAt - a.createdAt));
    });
  }, []);

  const filteredTests = pdfTests.filter(test => 
    test.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 lg:pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your PDF to CBT Tests</h1>
            <p className="text-sm text-slate-500">All tests generated from your uploaded PDFs</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search tests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
        />
      </div>

      {filteredTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTests.map(test => (
            <div 
              key={test.bankId}
              onClick={() => navigate(`/test/${test.bankId}`)}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-orange-500" />
                </div>
                <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                  {test.questions.length} Qs
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2 flex-1">{test.name}</h3>
              <p className="text-xs text-slate-500 mt-auto pt-4 border-t border-slate-100">
                {new Date(test.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No tests found</h3>
          <p className="text-slate-500">
            {searchQuery ? "No tests match your search." : "You haven't generated any tests from PDFs yet."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate('/upload')}
              className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
            >
              Upload PDF
            </button>
          )}
        </div>
      )}
    </div>
  );
}
