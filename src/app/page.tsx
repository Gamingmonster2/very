import React from 'react';
import WhisperTranscriber from '../components/WhisperTranscriber';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  Layers,
  Github,
  Heart,
  Lock,
  Mic,
  Keyboard,
  Sparkles,
  Sliders,
  Volume2
} from 'lucide-react';

export default function Page() {
  return (
    <main className="min-h-screen text-slate-100 pb-20">
      
      {/* Luxury Navbar Banner */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-500 via-brand-600 to-neonCyan flex items-center justify-center font-black text-white text-lg shadow-neon-glow">
              v
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-widest text-white uppercase flex items-center gap-1.5">
                very ai
                <span className="text-[9px] text-neonCyan bg-neonCyan/10 px-2 py-0.5 rounded-full border border-neonCyan/20 font-mono">
                  V1.5
                </span>
              </span>
              <span className="text-[9px] text-slate-400 font-medium">
                التفريغ الصوتي الذكي في المتصفح
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 hidden md:inline-block font-mono bg-slate-900/50 py-1 px-3 rounded-lg">
              🔒 100% On-Device AI
            </span>
            <a 
              href="#how-it-works"
              className="text-xs font-bold text-slate-300 hover:text-white border border-slate-800 rounded-xl px-4 py-2 transition-all bg-slate-900/60 hover:bg-slate-900"
            >
              كيف يعمل؟
            </a>
          </div>
        </div>
      </header>

      {/* Hero Header Presentation */}
      <div className="relative overflow-hidden pt-16 pb-10">
        
        {/* Beautiful high-end abstract neon grids & blur spheres */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-20 right-5 w-[250px] h-[250px] bg-neonCyan/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-5 w-[250px] h-[250px] bg-goldAccent/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          
          {/* Micro interaction batch */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800/80 rounded-full px-4 py-1.5 mb-8 shadow-neon-glow">
            <span className="h-2 w-2 rounded-full bg-neonCyan animate-ping" />
            <span className="text-[11px] font-bold text-slate-300">
              الواجهة المحسنة لإنتاج النصوص والترجمة الفورية SRT
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-105 to-slate-400 leading-tight tracking-tight max-w-4xl mx-auto">
            تفريغ الصوت بأمان تام مع <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-brand-600 to-neonCyan text-glow-purple">very ai</span>
          </h1>

          {/* Subtitle desc */}
          <p className="text-xs sm:text-sm md:text-base text-slate-400 mt-6 max-w-3xl mx-auto leading-relaxed">
            منصة ويب احترافية ممتازة لتفريغ المقابلات الصوتية والمقاطع وخطابات الميكروفون إلى نصوص دقيقة بنسبة 100%. تتم المعالجة بالكامل محلياً داخل جهازك دون أي اشتراكات أو مشاركة لبياناتك الخاصة مع أي طرف.
          </p>
        </div>
      </div>

      {/* Interactive component section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <WhisperTranscriber />
      </div>

      {/* Feature section */}
      <div id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 space-y-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            ميزات تفوق التوقعات لبيئة العمل
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-3">
            صُمم very ai خصيصاً لتلبية متطلبات الخصوصية والإنتاجية العالية لصنّاع المحتوى والشركات.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Block 1 */}
          <div className="glass-panel p-6 rounded-2xl space-y-3 border border-slate-800">
            <div className="h-12 w-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 border border-brand-500/20">
              <Lock className="h-5 w-5 text-glow-purple" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">معالجة آمنة ومعزولة</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              لن تغادر ملفاتك الصوتية أو تسجيلاتك جهازك أبداً. فك الترميز والتحليل والتفريغ يتم بالكامل على معالجك لتفادي سرقة البيانات والخصوصية المحكمة.
            </p>
          </div>

          {/* Block 2 */}
          <div className="glass-panel p-6 rounded-2xl space-y-3 border border-slate-800">
            <div className="h-12 w-12 rounded-xl bg-neonCyan/10 flex items-center justify-center text-neonCyan border border-neonCyan/20">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">سرعة وأداء فوري</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              بفضل تقنيات WebAssembly الحديثة، يتم تحويل الصوت إلى نص بسرعة توازي الوقت الفعلي للمقطع، مع دعم كامل للتشغيل المباشر داخل المتصفح.
            </p>
          </div>

          {/* Block 3 */}
          <div className="glass-panel p-6 rounded-2xl space-y-3 border border-slate-800">
            <div className="h-12 w-12 rounded-xl bg-goldAccent/10 flex items-center justify-center text-goldAccent border border-goldAccent/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">تصدير قياسي SRT</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              قم بتوليد ملفات الترجمة المتوافقة مع جميع منصات المونتاج والفيديو بضغطة زر واحدة، مع الحفاظ على التزامن الزمني الدقيق.
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
