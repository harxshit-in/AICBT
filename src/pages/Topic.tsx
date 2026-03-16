import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { listenToMessages, sendMessage, getTopicDetails, getTopicMembers, requestApproval, auth } from '../utils/firebase';
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
      
      const unsubscribe = listenToMessages(id, (newMessages) => {
        setMessages(newMessages);
      });

      getTopicMembers(id).then(members => {
        const member = members.find(m => m.userId === auth.currentUser?.uid);
        setIsApproved(member?.role === 'approved_poster' || member?.role === 'admin');
        setHasRequested(member?.status === 'pending_approval');
      });

      return () => unsubscribe();
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
    const messageContent = content;
    setContent('');
    await sendMessage(id, auth.currentUser.uid, 'text', messageContent);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-32px)] bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="relative">
            {topic?.imageUrl ? (
              <img src={topic.imageUrl} alt={topic.name} className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 font-bold">
                #{topic?.name?.charAt(0)}
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${topic?.status === 'open' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </div>
          <div>
            <h1 className="font-black text-slate-900 text-lg leading-tight">#{topic?.name || 'Loading...'}</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {topic?.status === 'open' ? 'Active Discussion' : 'Closed Topic'}
            </p>
          </div>
        </div>
        {!isApproved && topic?.status !== 'closed' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <span className="text-[10px] font-black uppercase tracking-wider">Read Only</span>
          </div>
        )}
      </header>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#fcfcfd]">
        {topic?.status === 'closed' && (
          <div className="flex justify-center">
            <div className="bg-slate-100 text-slate-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
              Discussion Closed
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => {
          const isMe = msg.userId === auth.currentUser?.uid;
          const showAvatar = idx === 0 || messages[idx-1].userId !== msg.userId;
          
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
              {!isMe && showAvatar && (
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-12">
                  {msg.senderName || 'Anonymous'}
                </span>
              )}
              <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isMe && (
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${showAvatar ? 'bg-blue-50 text-blue-500' : 'opacity-0'}`}>
                    {msg.senderName?.charAt(0) || '?'}
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <div className={`px-4 py-3 rounded-3xl shadow-sm text-sm font-medium leading-relaxed ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                  }`}>
                    {msg.content}
                  </div>
                  <span className={`text-[9px] font-bold text-slate-400 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100">
        {topic?.status === 'closed' ? (
          <div className="bg-slate-50 p-4 rounded-2xl text-center text-slate-400 text-xs font-bold uppercase tracking-widest border border-slate-100">
            This topic is closed. No new messages can be sent.
          </div>
        ) : isApproved ? (
          <div className="relative flex items-center gap-3">
            <div className="flex-1 relative">
              <input 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 pr-12 outline-none focus:border-blue-200 focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400" 
                placeholder={`Type a message in #${topic?.name || '...'}`}
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                <Smile size={20} />
              </button>
            </div>
            <button 
              onClick={handleSendMessage} 
              disabled={!content.trim()}
              className={`p-4 rounded-2xl shadow-lg transition-all active:scale-95 ${
                content.trim() 
                  ? 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700' 
                  : 'bg-slate-100 text-slate-300 shadow-none cursor-not-allowed'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        ) : (
          <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50 text-center">
            {hasRequested ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm mb-2">
                  <Lock size={20} className="animate-pulse" />
                </div>
                <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Request Pending</h3>
                <p className="text-xs text-slate-500 font-medium">An admin will review your request shortly.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm font-bold text-slate-600">You need approval to participate in this discussion.</p>
                <button 
                  onClick={handleRequestApproval} 
                  className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                >
                  Request Approval
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
