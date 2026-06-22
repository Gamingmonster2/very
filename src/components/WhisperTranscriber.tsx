"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  UploadCloud,
  Settings,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Trash2,
  Cpu,
  Languages,
  Sparkles,
  Search,
  Volume2,
  Terminal,
  FileText,
  Info,
  HelpCircle,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  AudioLines
} from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import { getAudioChannelData, formatTimestamp, generateSRT } from '../utils/audioHelper';
import confetti from 'canvas-confetti';

type ModelName = 'Xenova/whisper-tiny' | 'Xenova/whisper-base';
type TaskType = 'transcribe' | 'translate';

interface Segment {
  start: number;
  end: number;
  text: string;
}

export default function WhisperTranscriber() {
  // Input state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedStream, setRecordedStream] = useState<MediaStream | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');

  // Playback state
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);

  // AI Model configurations
  const [selectedModel, setSelectedModel] = useState<ModelName>('Xenova/whisper-tiny');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ar');
  const [selectedTask, setSelectedTask] = useState<TaskType>('transcribe');
  
  // Logs & Status monitoring
  const [statusText, setStatusText] = useState<string>('مرحباً بك في very ai. قم برفع ملف صوتي أو استخدم الميكروفون المباشر لبدء التفريغ الصوتي المحلي الآمن كلياً.');
  const [modelLoadingProgress, setModelLoadingProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcriptionTime, setTranscriptionTime] = useState<number | null>(null);
  const [executionLog, setExecutionLog] = useState<string[]>(['[نظام] تم تشغيل المحرك بنجاح 100% محلياً.']);
  
  // Subtitles & Outputs
  const [transcriptSegments, setTranscriptSegments] = useState<Segment[]>([]);
  const [fullText, setFullText] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  
  // Model instance storage
  const pipelineRef = useRef<any>(null);

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString('ar-EG', { hour12: false });
    setExecutionLog(prev => [`[${time}] ${message}`, ...prev]);
  };

  // Track record duration
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Sync playback pointer for highlighting current sentence
  useEffect(() => {
    const player = audioPlayerRef.current;
    if (!player) return;
    
    const handleTimeUpdate = () => {
      setCurrentPlaybackTime(player.currentTime);
    };
    
    player.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      player.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [audioUrl]);

  // Launch quick Demo simulator for immediate engagement without heavy model weights downloads
  const handleLoadDemoPlayground = () => {
    addLog('تفعيل عينة المحاكاة التجريبية الفورية...');
    setStatusText('تم تحميل العينة التوضيحية بنجاح. تذوق أداء very ai فوري!');
    
    const demoData = [
      { start: 0, end: 4.2, text: "مرحباً بكم في عصر الذكاء الاصطناعي الصديق للخصوصية مع منصة very ai." },
      { start: 4.2, end: 9.5, text: "يقوم تطبيق very ai بتفكيك وتحليل المقاطع الصوتية بالكامل داخل المتصفح وبدون أي اشتراك." },
      { start: 9.5, end: 14.8, text: "يمكنكم تعديل النصوص المصدرة، تصفيتها، وتصديرها كملفات ترجمة SRT متزامنة فوراً." },
      { start: 14.8, end: 20.0, text: "احموا سرية اجتماعاتكم ومقابلاتكم الصحفية عبر المعالجة المحلية على جهازكم مباشرة!" }
    ];

    const mockParts = [new Uint8Array([0, 10, 20, 30])];
    const sampleFile = new File(mockParts, 'very_ai_premium_demo.mp3', { type: 'audio/mp3' });
    
    setAudioFile(sampleFile);
    setAudioUrl(''); 
    setTranscriptSegments(demoData);
    const computedText = demoData.map(d => d.text).join(' ');
    setFullText(computedText);
    setTranscriptionTime(2);
    
    addLog('تم ملء بيانات العينة واستخراج ملف SRT تفاعلي فوري.');
    
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7c3aed', '#06b6d4', '#f59e0b']
    });
  };

  // Handle drag selection
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      loadAudioFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadAudioFile(file);
    }
  };

  const loadAudioFile = (file: File) => {
    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setTranscriptSegments([]);
    setFullText('');
    setTranscriptionTime(null);
    setStatusText(`تم إرفاق الملف الصوتي: ${file.name}. جاهز للتحليل.`);
    addLog(`تم تحميل ملف خارجي: ${file.name} بقيمة ${(file.size / (1024 * 1024)).toFixed(2)} ميجابايت.`);
  };

  // Mic Recording Actions
  const startRecording = async () => {
    addLog('طلب صلاحيات الوصول إلى الميكروفون...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordedStream(stream);
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([audioBlob], 'تسجيل_صوتي_مباشر_very_ai.wav', { type: 'audio/wav' });
        loadAudioFile(file);
        stream.getTracks().forEach(track => track.stop());
        addLog('تم إنهاء التسجيل وتحويل المسار الصوتي بنجاح.');
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setTranscriptSegments([]);
      setFullText('');
      addLog('الميكروفون قيد التسجيل الآن... تحدث بصوت واضح.');
    } catch (err) {
      addLog('فشل الوصول للميكروفون. يرجى تأكيد منح الإذن للمتصفح.');
      alert('يرجى السماح بصلاحية الميكروفون للبدء بالتسجيل الحي.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const clearAudio = () => {
    setAudioFile(null);
    setAudioUrl('');
    setTranscriptSegments([]);
    setFullText('');
    setTranscriptionTime(null);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setIsPlaying(false);
    setStatusText('تم إفراغ الملف الحالي.');
    addLog('تم تنظيف مساحة العمل وعزل الملف النشط.');
  };

  // Main AI Inference Core
  const getPipelineInstance = async (model: ModelName, progressCallback: (data: any) => void) => {
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false;
    
    if (pipelineRef.current && pipelineRef.current.modelName === model) {
      addLog('تم العثور على حزمة النموذج مخزنة مسبقاً في ذاكرة الرام.');
      return pipelineRef.current.instance;
    }

    addLog(`بدء تحميل ملفات أوزان الذكاء الاصطناعي (${model}) من خوادم HuggingFace إلى جهازك لأول مرة...`);
    const instance = await pipeline('automatic-speech-recognition', model, { 
      progress_callback: progressCallback,
    });
    
    pipelineRef.current = { modelName: model, instance };
    return instance;
  };

  const runTranscription = async () => {
    if (!audioFile) return;
    
    setIsProcessing(true);
    setTranscriptionTime(null);
    const startTime = performance.now();
    addLog('جاري فك تشفير الصوت وتقليله لأحادية القناة بـ 16,000 هرتز...');

    try {
      const processedAudio = await getAudioChannelData(audioFile);
      addLog('تم تجهيز مصفوفة الصوت (Float32Array) بنجاح. استدعاء نموذج Whisper...');

      const whisperPipeline = await getPipelineInstance(selectedModel, (progressData: any) => {
        if (progressData.status === 'progress') {
          const progress = Math.round(progressData.progress);
          setModelLoadingProgress(progress);
          setStatusText(`جاري تهيئة كتل الذكاء الاصطناعي: ${progress}%`);
        } else if (progressData.status === 'ready') {
          setModelLoadingProgress(100);
          setStatusText('النموذج مستقر وجاهز في الرام. بدء معالجة النص والتفريع الصوتي...');
        }
      });

      addLog('النموذج نشط بالكامل. بدء المعالجة العميقة واستخلاص النبرات...');
      
      const result = await whisperPipeline(processedAudio, { 
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
        language: selectedLanguage === 'auto' ? null : selectedLanguage,
        task: selectedTask,
      });

      addLog('اكتملت المعالجة العميقة. جاري فرز الجمل والمقاطع الزمنية...');

      if (result && result.chunks) {
        const formattedSegments: Segment[] = result.chunks.map((chunk: any) => ({
          start: chunk.timestamp ? chunk.timestamp[0] : 0,
          end: chunk.timestamp ? chunk.timestamp[1] : (chunk.timestamp ? chunk.timestamp[0] + 2.5 : 2.5),
          text: chunk.text || ''
        }));
        setTranscriptSegments(formattedSegments);
        setFullText(result.text || '');
      } else {
        const fallbackText = result.text || '';
        setFullText(fallbackText);
        setTranscriptSegments([{ start: 0, end: 5, text: fallbackText }]);
      }

      const endTime = performance.now();
      const diffSeconds = Math.round((endTime - startTime) / 1000);
      setTranscriptionTime(diffSeconds);
      setStatusText('تم الانتهاء بنجاح باهر! النص والترجمة متوفران للتصدير.');
      addLog(`تم التفريغ الصوتي بنجاح تام في زمن قدره ${diffSeconds} ثواني.`);
      
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.7 },
        colors: ['#7c3aed', '#06b6d4', '#10b981']
      });

    } catch (error: any) {
      console.error(error);
      addLog(`[خطأ تقني] فشل تفريغ الصوت: ${error.message || 'خطأ مجهول'}`);
      setStatusText('عذراً، تعذر إتمام العملية. جرب ملفاً أصغر أو تأكد من إعدادات المتصفح.');
    } finally {
      setIsProcessing(false);
      setModelLoadingProgress(0);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    addLog('تم نسخ النص الكامل إلى الحافظة بنجاح.');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const downloadAsTXT = () => {
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `very_ai_${audioFile?.name || 'transcription'}.txt`;
    link.click();
    addLog('تم تصدير ملف النص العادي بنجاح.');
  };

  const downloadAsSRT = () => {
    const srtText = generateSRT(transcriptSegments);
    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `very_ai_${audioFile?.name || 'transcription'}.srt`;
    link.click();
    addLog('تم تصدير ملف الترجمة المتزامن SRT بنجاح.');
  };

  const togglePlayback = () => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
      } else {
        audioPlayerRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const jumpToAudioTimestamp = (seconds: number) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = seconds;
      audioPlayerRef.current.play().catch(() => {});
      setIsPlaying(true);
      addLog(`الانتقال في الخط الزمني إلى: ${formatTimestamp(seconds)}`);
    }
  };

  const filteredSegments = transcriptSegments.filter(s => 
    s.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      
      {/* Top Indicators Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="gradient-border-card p-6 flex items-start gap-4 shadow-neon-glow transition-transform hover:-translate-y-1 duration-300">
          <div className="p-3 bg-brand-500/20 rounded-2xl text-brand-400 border border-brand-500/30">
            <Cpu className="h-6 w-6 text-glow-purple" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">خصوصية قصوى وآمنة</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              تتم المعالجة بنسبة 100% داخل المتصفح. لا يتم إرسال أي صوت أو نصوص إلى خوادم خارجية.
            </p>
          </div>
        </div>

        <div className="gradient-border-card p-6 flex items-start gap-4 shadow-cyan-glow transition-transform hover:-translate-y-1 duration-300">
          <div className="p-3 bg-neonCyan/20 rounded-2xl text-neonCyan border border-neonCyan/30">
            <Sparkles className="h-6 w-6 text-glow-cyan" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">أدوات تصدير مرنة</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              تصدير فوري بنقرة واحدة لملفات الترجمة SRT متناهية الدقة المتوافقة مع يوتيوب وكاب كات.
            </p>
          </div>
        </div>

        <div className="gradient-border-card p-6 flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300">
          <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 border border-emerald-500/30">
            <Languages className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">متعدد اللغات + ترجمة</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              كشف فوري وذكي للغة العربية بلهجاتها المختلفة، مع خيار الترجمة الفورية للغة الإنجليزية.
            </p>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout: Options & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Configuration Column (Left) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* AI Engines Panel */}
          <div className="glass-panel rounded-3xl p-6 space-y-5 relative overflow-hidden shadow-glass-glow">
            <div className="absolute top-0 left-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-neonCyan/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Settings className="h-5 w-5 text-brand-400" />
                <h3 className="font-extrabold text-sm text-slate-200">إعدادات محرك Whisper</h3>
              </div>
              <span className="text-[11px] font-bold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                تفريغ محلي محمي
              </span>
            </div>

            <div className="space-y-4">
              {/* Model Select */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2.5">
                  اختر حجم نموذج الذكاء الاصطناعي
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedModel('Xenova/whisper-tiny')}
                    className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                      selectedModel === 'Xenova/whisper-tiny'
                        ? 'border-brand-500 bg-brand-500/20 text-white shadow-neon-glow'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs text-white">Whisper Tiny</span>
                    <span className="text-[10px] text-slate-400 mt-1.5 leading-tight">سرعة خاطفة (75 ميجابايت)</span>
                  </button>

                  <button
                    type=
