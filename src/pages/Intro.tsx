import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { 
  GraduationCap, ArrowRight, Brain, Sparkles, Zap, ShieldCheck, 
  Globe, Headphones, FileUp, ScanLine, FileText, CheckCircle2, 
  BarChart3, Layers, MessageSquare, Play, Star, Users, Lock, Newspaper
} from 'lucide-react';

interface IntroProps {
  onStart: () => void;
}

export default function Intro({ onStart }: IntroProps) {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);

  const features = [
    {
      title: "ParikshAI",
      subtitle: "Deep Paper Analysis",
      description: "Upload past papers and get instant trend reports, chapter-wise weightage, and personalized strategies.",
      icon: Brain,
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
      visual: (
        <div className="relative w-full h-full p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="h-2 w-24 bg-slate-100 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <motion.div 
              initial={{ height: 0 }}
              whileInView={{ height: '80px' }}
              className="bg-purple-500/20 rounded-xl border border-purple-100" 
            />
            <motion.div 
              initial={{ height: 0 }}
              whileInView={{ height: '120px' }}
              className="bg-purple-500 rounded-xl shadow-lg shadow-purple-200" 
            />
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm text-[10px] font-bold text-slate-500">
            Trend: +15% focus on Modern History
          </div>
        </div>
      )
    },
    {
      title: "AI Vidyalay",
      subtitle: "Visual Study Guides",
      description: "Generate comprehensive notes and visual slides for any topic. Complex concepts explained simply.",
      icon: Layers,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      visual: (
        <div className="relative w-full h-full p-6 flex flex-col gap-4">
          <div className="aspect-video bg-blue-50 rounded-2xl border border-blue-100 overflow-hidden relative">
            <motion.div 
              animate={{ x: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" 
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full bg-slate-100 rounded-full" />
            <div className="h-2 w-2/3 bg-slate-100 rounded-full" />
          </div>
        </div>
      )
    },
    {
      title: "Audio Summary",
      subtitle: "Learn on the Go",
      description: "Convert any topic into a narrated AI podcast. Perfect for revision while commuting or relaxing.",
      icon: Headphones,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      visual: (
        <div className="relative w-full h-full p-6 flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
              <motion.div
                key={i}
                animate={{ height: [10, h * 10, 10] }}
                transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                className="w-1.5 bg-emerald-500 rounded-full"
              />
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div className="text-xs font-black text-slate-900">Chapter 1: Summary</div>
          </div>
        </div>
      )
    },
    {
      title: "AI Mentor",
      subtitle: "24/7 Guidance",
      description: "Get instant answers to your doubts, study tips, and motivation from your personal AI Mentor.",
      icon: MessageSquare,
      color: "bg-rose-500",
      lightColor: "bg-rose-50",
      textColor: "text-rose-600",
      visual: (
        <div className="relative w-full h-full p-6 flex flex-col gap-4">
          <div className="flex-1 bg-slate-50 rounded-2xl p-4 space-y-3">
            <div className="h-2 w-3/4 bg-slate-200 rounded-full" />
            <div className="h-2 w-1/2 bg-slate-200 rounded-full" />
          </div>
          <div className="flex items-center gap-3 p-3 bg-rose-500 rounded-2xl text-white">
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-bold">Ask me anything...</span>
          </div>
        </div>
      )
    },
    {
      title: "Daily Current Affairs",
      subtitle: "Stay Updated",
      description: "Get curated daily, weekly, and monthly current affairs summaries tailored for your exams.",
      icon: Newspaper,
      color: "bg-orange-500",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600",
      visual: (
        <div className="relative w-full h-full p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-orange-500" />
            <div className="h-2 w-24 bg-slate-100 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full bg-slate-100 rounded-full" />
            <div className="h-2 w-full bg-slate-100 rounded-full" />
            <div className="h-2 w-2/3 bg-slate-100 rounded-full" />
          </div>
        </div>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-600">
      {/* Sticky Header */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-200 group-hover:scale-105 transition-transform duration-300">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              AI <span className="text-orange-500">CBT</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How it Works', 'Pricing', 'About'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                {item}
              </a>
            ))}
          </div>
          <button 
            onClick={onStart}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        <motion.div style={{ opacity, scale }} className="max-w-7xl mx-auto px-6 text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-xs font-black tracking-widest uppercase border border-orange-100">
              <Sparkles className="w-3.5 h-3.5" />
              Revolutionizing Exam Preparation
            </div>
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black text-slate-900 leading-[0.95] tracking-tight">
              Study with the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">Power of AI.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-3xl mx-auto">
              The ultimate AI tutor for <span className="text-slate-900 font-bold underline decoration-orange-500/30">SSC & Railways</span>. 
              Analyze papers, generate visual guides, and practice in a zero-distraction environment.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <button
              onClick={onStart}
              className="group relative flex items-center justify-center gap-3 bg-orange-500 text-white px-12 py-6 rounded-[2rem] font-black text-xl hover:bg-orange-600 transition-all shadow-2xl shadow-orange-200 active:scale-[0.98] overflow-hidden w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              Start Your Journey
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-4 px-8 py-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
              <div className="text-sm font-bold text-slate-400">
                <span className="text-slate-900">15,000+</span> Active Students
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating Background Elements */}
        <div className="absolute top-1/2 left-0 w-full h-full -z-10 pointer-events-none">
          <motion.div 
            animate={{ y: [0, -50, 0], rotate: [0, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
            className="absolute top-0 left-10 w-96 h-96 bg-orange-200 rounded-full blur-[120px] opacity-40" 
          />
          <motion.div 
            animate={{ y: [0, 50, 0], rotate: [0, -10, 0], scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
            className="absolute bottom-0 right-10 w-[500px] h-[500px] bg-blue-200 rounded-full blur-[120px] opacity-40" 
          />
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="border-y border-slate-100 bg-slate-50/50 py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Perfectly Optimized For</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            {['SSC CGL', 'RRB NTPC', 'SSC CHSL', 'RAILWAY GROUP D', 'SSC MTS', 'RRB ALP'].map(brand => (
              <span key={brand} className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-24 space-y-6">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">Everything you need to <span className="text-orange-500">Ace your Exams.</span></h2>
            <p className="text-xl text-slate-500 font-medium">We've combined the latest in Generative AI to create a toolset that covers every aspect of your learning journey.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group bg-slate-50 rounded-[3rem] p-10 border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 flex flex-col lg:flex-row gap-10"
              >
                <div className="flex-1 space-y-6">
                  <div className={`${feature.lightColor} ${feature.textColor} w-14 h-14 rounded-2xl flex items-center justify-center`}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <div className={`text-xs font-black uppercase tracking-widest ${feature.textColor}`}>{feature.subtitle}</div>
                    <h3 className="text-3xl font-black text-slate-900">{feature.title}</h3>
                  </div>
                  <p className="text-slate-500 font-medium leading-relaxed">{feature.description}</p>
                  <button className={`flex items-center gap-2 font-black text-sm ${feature.textColor} group-hover:translate-x-2 transition-transform`}>
                    Learn More <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[240px]">
                  {feature.visual}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-5xl md:text-6xl font-black tracking-tight">How AI CBT <br /><span className="text-orange-500">Works.</span></h2>
                <p className="text-xl text-slate-400 font-medium">Three simple steps to transform your study routine forever.</p>
              </div>

              <div className="space-y-10">
                {[
                  { step: "01", title: "Connect your AI", desc: "Add your Gemini API key. It stays private on your device, ensuring 100% security and free processing." },
                  { step: "02", title: "Upload your Content", desc: "Drop your PDFs, past papers, or just enter a topic name. Our AI begins analyzing instantly." },
                  { step: "03", title: "Start Learning", desc: "Get trend reports, take interactive tests, or listen to summaries. Your personalized path is ready." }
                ].map((s, i) => (
                  <div key={i} className="flex gap-8 group">
                    <div className="text-4xl font-black text-orange-500/20 group-hover:text-orange-500 transition-colors duration-500">{s.step}</div>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black">{s.title}</h4>
                      <p className="text-slate-400 font-medium leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl"
              >
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-sm font-bold">AI Processing...</div>
                    </div>
                    <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">98% Accuracy</div>
                  </div>

                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        initial={{ width: 0 }}
                        whileInView={{ width: '100%' }}
                        transition={{ delay: i * 0.2, duration: 1 }}
                        className="h-3 bg-white/10 rounded-full relative overflow-hidden"
                      >
                        <motion.div 
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent w-1/2" 
                        />
                      </motion.div>
                    ))}
                  </div>

                  <div className="p-6 bg-orange-500 rounded-3xl text-center space-y-2">
                    <div className="text-xs font-black uppercase tracking-widest opacity-80">Extraction Complete</div>
                    <div className="text-2xl font-black">150 Questions Found</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black tracking-widest uppercase border border-emerald-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero Distraction Zone
              </div>
              <h2 className="text-5xl font-black text-slate-900 leading-tight">Focus on what matters: <br /><span className="text-orange-500">Your Selection.</span></h2>
              <p className="text-xl text-slate-500 font-medium leading-relaxed">
                Unlike YouTube or Telegram, AI CBT is a clean, ad-free, and distraction-free environment. 
                No notifications, no reels, no comments—just you and your study material.
              </p>
              <div className="space-y-4">
                {[
                  "100% Ad-Free Experience",
                  "No Social Media Distractions",
                  "Focused Deep-Work Interface",
                  "Optimized for Long Study Sessions"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-700 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/10 rounded-[3rem] blur-3xl" />
              <div className="relative bg-white border border-slate-100 rounded-[3rem] p-8 shadow-2xl shadow-slate-200">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900">Deep Study Mode</div>
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Active Now</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '75%' }}
                      transition={{ duration: 2 }}
                      className="h-full bg-emerald-500" 
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Focus Level</span>
                    <span>75% Increase</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mb-24">
            <h2 className="text-5xl font-black text-slate-900 mb-6">Loved by <span className="text-orange-500">Thousands.</span></h2>
            <div className="flex items-center justify-center gap-1 text-orange-500">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-6 h-6 fill-current" />)}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Rahul Sharma", role: "UPSC Aspirant", text: "ParikshAI changed how I analyze PYQs. The trend reports are spot on and saved me weeks of manual work." },
              { name: "Priya Patel", role: "SSC Candidate", text: "The PDF to CBT feature is a lifesaver. I can turn any book into a real exam environment in seconds." },
              { name: "Ankit Verma", role: "JEE Student", text: "AI Vidyalay's visual guides helped me understand complex physics concepts that I was struggling with for months." }
            ].map((t, i) => (
              <div key={i} className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 space-y-6">
                <p className="text-lg text-slate-600 font-medium italic leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                    <img src={`https://picsum.photos/seed/${t.name}/100/100`} alt={t.name} referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <div className="font-black text-slate-900">{t.name}</div>
                    <div className="text-xs font-bold text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-[4rem] p-12 md:p-24 text-center space-y-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-500 rounded-full blur-[100px]" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500 rounded-full blur-[100px]" />
          </div>

          <div className="space-y-6 relative z-10">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight">Ready to <span className="text-orange-500">Transform</span> your Prep?</h2>
            <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">Join thousands of students who are already studying smarter with AI CBT.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
            <button
              onClick={onStart}
              className="w-full sm:w-auto bg-orange-500 text-white px-12 py-6 rounded-[2rem] font-black text-xl hover:bg-orange-600 transition-all shadow-2xl shadow-orange-500/20 active:scale-95"
            >
              Get Started for Free
            </button>
            <button className="w-full sm:w-auto bg-white/10 text-white px-12 py-6 rounded-[2rem] font-black text-xl hover:bg-white/20 transition-all backdrop-blur-md">
              View Demo
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 pt-8 relative z-10">
            <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              No Credit Card Required
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Free Gemini API Support
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2 space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="bg-orange-500 p-2 rounded-xl">
                  <GraduationCap className="text-white w-6 h-6" />
                </div>
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  AI <span className="text-orange-500">CBT</span>
                </span>
              </div>
              <p className="text-slate-500 font-medium max-w-sm">
                Empowering students with the world's most advanced AI-powered study platform. 
                Built for excellence, designed for you.
              </p>
              <div className="flex items-center gap-4">
                {[Globe, MessageSquare, Users].map((Icon, i) => (
                  <div key={i} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all cursor-pointer">
                    <Icon className="w-5 h-5" />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-black text-slate-900 mb-6">Product</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">ParikshAI</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">AI Vidyalay</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-900 mb-6">Company</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><a href="#" className="hover:text-orange-500 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-sm font-bold text-slate-400">
              © 2026 AI CBT Platform. All rights reserved.
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
              <Lock className="w-4 h-4" />
              Secure & Private Processing
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
