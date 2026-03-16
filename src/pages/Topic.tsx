import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getMessages, sendMessage, addReaction, getTopicDetails } from '../utils/firebase';
import { auth } from '../utils/firebase';
import { Send, Smile } from 'lucide-react';

export default function Topic() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [topic, setTopic] = useState<any>(null);
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      getTopicDetails(id).then(setTopic);
      getMessages(id).then(setMessages);
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!id || !auth.currentUser || !content.trim()) return;
    await sendMessage(id, auth.currentUser.uid, 'text', content);
    setContent('');
    getMessages(id).then(setMessages);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 p-4 font-bold text-lg text-slate-900">
        #{topic?.name || 'Loading...'}
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
              {msg.senderName?.charAt(0) || '?'}
            </div>
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
              <p className="font-bold text-sm text-slate-900">{msg.senderName || 'User'}</p>
              <p className="text-slate-700">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-2">
          <button className="p-2 text-slate-500 hover:text-slate-700"><Smile /></button>
          <input 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-transparent p-2 outline-none" 
            placeholder={`Message #${topic?.name || '...'}`}
          />
          <button onClick={handleSendMessage} className="p-2 bg-blue-600 text-white rounded-xl"><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}
