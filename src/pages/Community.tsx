import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopics, joinTopic, requestApproval, getJoinedTopics } from '../utils/firebase';
import { auth } from '../utils/firebase';

export default function Community() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<any[]>([]);
  const [joinedTopics, setJoinedTopics] = useState<any[]>([]);

  useEffect(() => {
    getTopics().then(setTopics);
    if (auth.currentUser) {
      getJoinedTopics(auth.currentUser.uid).then(setJoinedTopics);
    }
  }, []);

  const handleJoin = async (topicId: string) => {
    if (!auth.currentUser) return;
    await joinTopic(topicId, auth.currentUser.uid);
    alert("Joined successfully!");
    getJoinedTopics(auth.currentUser.uid).then(setJoinedTopics);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {joinedTopics.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Your Communities</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {joinedTopics.map(topic => (
              <button key={topic.id} onClick={() => navigate(`/community/${topic.id}`)} className="flex-shrink-0 w-32 h-32 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center gap-2">
                <img src={topic.imageUrl} alt={topic.name} className="w-16 h-16 rounded-full object-cover" />
                <span className="text-sm font-medium truncate w-full text-center">{topic.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold text-slate-900">Explore Topics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map(topic => (
          <div key={topic.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <img src={topic.imageUrl} alt={topic.name} className="w-full h-40 object-cover rounded-xl" />
            <h2 className="text-xl font-bold">{topic.name}</h2>
            <div className="flex gap-2 mt-auto">
              <button onClick={() => handleJoin(topic.id)} className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-medium">Join</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
