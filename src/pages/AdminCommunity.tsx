import React, { useState, useEffect } from 'react';
import { createTopic, closeTopic, getTopics } from '../utils/firebase';

export default function AdminCommunity() {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [topics, setTopics] = useState<any[]>([]);

  useEffect(() => {
    getTopics().then(setTopics);
  }, []);

  const handleCreateTopic = async () => {
    await createTopic(name, imageUrl);
    setName('');
    setImageUrl('');
    getTopics().then(setTopics);
  };

  const handleCloseTopic = async (topicId: string) => {
    await closeTopic(topicId);
    getTopics().then(setTopics);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Admin Community Panel</h1>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <input type="text" placeholder="Topic Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" />
        <input type="text" placeholder="Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full p-2 border rounded" />
        <button onClick={handleCreateTopic} className="bg-blue-600 text-white px-4 py-2 rounded">Create Topic</button>
      </div>
      <div className="space-y-4">
        {topics.map(topic => (
          <div key={topic.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center">
            <span>{topic.name} ({topic.status})</span>
            {topic.status === 'open' && <button onClick={() => handleCloseTopic(topic.id)} className="bg-red-500 text-white px-4 py-2 rounded">Close</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
