import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, Lock, Users, CheckCircle } from 'lucide-react';
import { getTopics, joinTopic, requestApproval } from '../utils/firebase';
import { auth } from '../utils/firebase';

export default function Community() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<any[]>([]);

  useEffect(() => {
    getTopics().then(setTopics);
  }, []);

  const handleJoin = async (topicId: string) => {
    if (!auth.currentUser) return;
    await joinTopic(topicId, auth.currentUser.uid);
    alert("Joined successfully!");
  };

  const handleRequestApproval = async (topicId: string) => {
    if (!auth.currentUser) return;
    await requestApproval(topicId, auth.currentUser.uid);
    alert("Approval requested!");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Community Topics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map(topic => (
          <div key={topic.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <img src={topic.imageUrl} alt={topic.name} className="w-full h-40 object-cover rounded-xl" />
            <h2 className="text-xl font-bold">{topic.name}</h2>
            <div className="flex gap-2 mt-auto">
              <button onClick={() => handleJoin(topic.id)} className="flex-1 bg-blue-500 text-white py-2 rounded-xl">Join</button>
              <button onClick={() => handleRequestApproval(topic.id)} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-xl">Request Approval</button>
            </div>
            <button onClick={() => navigate(`/community/${topic.id}`)} className="text-blue-600 font-medium">View Topic</button>
          </div>
        ))}
      </div>
    </div>
  );
}
