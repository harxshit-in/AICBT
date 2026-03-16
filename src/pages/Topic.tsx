import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getMessages, sendMessage, getTopicDetails, getTopicMembers, requestApproval } from '../utils/firebase';
import { auth } from '../utils/firebase';
import { Send, Smile, Lock } from 'lucide-react';

export default function Topic() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [topic, setTopic] = useState<any>(null);
  const [content, setContent] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && auth.currentUser) {
      getTopicDetails(id).then(setTopic);
      getMessages(id).then(setMessages);
      getTopicMembers(id).then(members => {
        const member = members.find(m => m.userId === auth.currentUser?.uid);
        setIsApproved(member?.role === 'approved_poster' || member?.role === 'admin');
        setHasRequested(member?.status === 'pending_approval');
      });
    }
  }, [id]);

  const handleRequestApproval = async () => {
    if (!id || !auth.currentUser) return;
    await requestApproval(id, auth.currentUser.uid);
    setHasRequested(true);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!id || !auth.currentUser || !content.trim() || !isApproved || topic?.status === 'closed') return;
    await sendMessage(id, auth.currentUser.uid, 'text', content);
    setContent('');
    getMessages(id).then(setMessages);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="bg-white border-b border-slate-200 p-3 font-bold text-lg text-slate-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          {topic?.imageUrl && <img src={topic.imageUrl} alt={topic.name} className="w-10 h-10 rounded-full object-cover shrink-0" />}
          <span className="truncate">#{topic?.name || 'Loading...'}</span>
        </div>
        {!isApproved && topic?.status !== 'closed' && (
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full flex items-center gap-1 shrink-0">
            <Lock size={12}/> Pending Approval
          </span>
        )}
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {topic?.status === 'closed' && (
          <div className="bg-slate-200 text-slate-700 p-3 rounded-xl text-center text-sm font-bold sticky top-0 z-10">
            This topic is now closed.
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 shrink-0">
              {msg.senderName?.charAt(0) || '?'}
            </div>
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
              <p className="font-bold text-sm text-slate-900">{msg.senderName || 'User'}</p>
              <p className="text-slate-700 break-words">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {topic?.status === 'closed' ? (
        <div className="p-4 bg-white border-t border-slate-200 text-center text-slate-500 text-sm shrink-0">
          This topic is closed. No new messages can be sent.
        </div>
      ) : isApproved ? (
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
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
      ) : (
        <div className="p-4 bg-white border-t border-slate-200 text-center text-slate-500 text-sm shrink-0">
          {hasRequested ? (
            "Approval request sent. Waiting for admin."
          ) : (
            <button onClick={handleRequestApproval} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold">
              Request Approval to Send Messages
            </button>
          )}
        </div>
      )}
    </div>
  );
}
