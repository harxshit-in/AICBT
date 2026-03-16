import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getMessages, sendMessage, addReaction } from '../utils/firebase';
import { auth } from '../utils/firebase';

export default function Topic() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (id) {
      getMessages(id).then(setMessages);
    }
  }, [id]);

  const handleSendMessage = async () => {
    if (!id || !auth.currentUser) return;
    await sendMessage(id, auth.currentUser.uid, 'text', content);
    setContent('');
    getMessages(id).then(setMessages);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!auth.currentUser) return;
    await addReaction(messageId, auth.currentUser.uid, emoji);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Topic Messages</h1>
      <div className="space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className="bg-white p-4 rounded-2xl border flex flex-col gap-2">
            <p>{msg.content}</p>
            <div className="flex gap-2">
              <button onClick={() => handleReaction(msg.id, '👍')}>👍</button>
              <button onClick={() => handleReaction(msg.id, '❤️')}>❤️</button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={content} onChange={e => setContent(e.target.value)} className="flex-1 p-2 border rounded" />
        <button onClick={handleSendMessage} className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
      </div>
    </div>
  );
}
