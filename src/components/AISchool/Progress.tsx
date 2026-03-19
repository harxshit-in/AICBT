import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../utils/firebase';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function Progress() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'ai_school_topics'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTopics(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading progress...</div>;

  const completedCount = topics.filter(t => t.status === 'completed').length;
  const pendingCount = topics.length - completedCount;

  const pieData = [
    { name: 'Completed', value: completedCount },
    { name: 'Pending', value: pendingCount },
  ];

  const COLORS = ['#10B981', '#F59E0B'];

  const subjectData = topics.reduce((acc: any, topic) => {
    const subject = topic.subject;
    if (!acc[subject]) acc[subject] = { subject, completed: 0, total: 0 };
    acc[subject].total += 1;
    if (topic.status === 'completed') acc[subject].completed += 1;
    return acc;
  }, {});

  const barData = Object.values(subjectData);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-6">Learning Journey</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-64">
          <h3 className="text-lg font-semibold mb-2">Overall Completion</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="h-64">
          <h3 className="text-lg font-semibold mb-2">Mastery by Subject</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10B981" name="Completed" />
              <Bar dataKey="total" fill="#E5E7EB" name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
