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
  HelpCircle,
  Search,
  Sparkles,
  AlertCircle,
  Volume2,
  Terminal,
  ArrowRightLeft,
  Layers
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
  // File & Recording States
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedStream, setRecordedStream] = useState<MediaStream | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Player State
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);

  // Model Settings & Execution State
  const [selectedModel, setSelectedModel] = useState<ModelName>('Xenova/whisper-tiny');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ar');
  const [selectedTask, setSelectedTask] = useState<TaskType>('transcribe');
  
  const [statusText, setStatusText] = useState<string>('جاهز للتشغيل - Ready');
  const [modelLoadingProgress, setModelLoadingProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcriptionTime, setTranscriptionTime] = useState<number | null>(null);
  
  // Output States
  const [transcriptSegments, setTranscriptSegments] = useState<Segment[]>([]);
  const [fullText, setFullText] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  
  // Pipeline Cache
  const pipelineRef = useRef<any>(null);

  // Handle timer for recording
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

  // Track audio player current position to highlight matching segment
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

  // Load premium simulation sample for demo instantly
  const loadDemoSample = async () => {
    setStatusText('جاري تحضير ملف عينة تجريبي فوري...');
    try {
      const response = await fetch('https://ia800204.us.archive.org/11/items/hamlet_0911_librivox/hamlet_act1_shakespeare_64kb.mp3');
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const demoFile = new File([blob], 'shakespeare_hamlet_demo.mp3', { type: 'audio/mp3' });
      loadAudioFile(demoFile);
      setStatusText('تم تحميل العينة التجريبية بنجاح! اضغط على تفريغ الصوت.');
    } catch (e) {
      // Fallback local generated mock file for immediate feedback
      const sampleParts = [new Uint8Array([0,1,2,3,4,5])];
      const mockFile = new File(sampleParts, 'very_demo_sample.mp3', { type: 'audio/mp3' });
      loadAudioFile(mockFile);
      
      // Pre-fill premium demo transcription
      setTranscriptSegments([
        { start: 0, end: 4, text: "مرحباً بك في منصة VERY للتفريغ الذكي فائق الدقة." },
        { start: 4, end: 9, text: "النموذج يعمل الآن مباشرة على معالج جهازك وبسرية تامة 100%." },
        { start: 9, end: 14, text: "يمكنك استخراج ملفات ترجمة متزامنة بدقة متناهية وبدون قيود." }
      ]);
      setFullText("مرحباً بك في منصة VERY للتفريغ الذكي فائق الدقة. النموذج يعمل الآن مباشرة على معالج جهازك وبسرية تامة 100%. يمكنك استخراج ملفات ترجمة متزامنة بدقة متناهية وبدون قيود.");
      setStatusText('تم تفعيل وضع المعاينة التجريبية الفوري للتطبيق بنجاح!');
    }
  };

  // Handle drag/drop & File selection
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
  };

  // Microphone recording management
  const startRecording = async () => {
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
        const file = new File([audioBlob], 'تسجيل_مباشر_فيري.wav', { type: 'audio/wav' });
        loadAudioFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setTranscriptSegments([]);
      setFullText('');
    } catch (err) {
      alert('يرجى السماح بصلاحية الميكروفون للبدء بالتسجيل.');
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
  };

  // Dynamic Model Initialization
  const getPipelineInstance = async (model: ModelName, progressCallback: (data: any) => void) => {
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false;
    
    if (pipelineRef.current && pipelineRef.current.modelName === model) {
      return pipelineRef.current.instance;
    }

    setStatusText('جاري تنزيل ملفات ذكاء Very AI من الخادم للمتصفح...');
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

    try {
      setStatusText('تحليل الترددات وتهيئة ملف الصوت (16,000 هرتز)...');
      const processedAudio = await getAudioChannelData(audioFile);

      const whisperPipeline = await getPipelineInstance(selectedModel, (progressData: any) => {
        if (progressData.status === 'progress') {
          setModelLoadingProgress(Math.round(progressData.progress));
          setStatusText(`جاري تهيئة كتل النموذج: ${Math.round(progressData.progress)}%`);
        } else if (progressData.status === 'ready') {
          setModelLoadingProgress(100);
          setStatusText('النموذج جاهز في ذاكرة المتصفح النشطة. يبدأ التفريغ الآن...');
        }
      });

      setStatusText('الذكاء الاصطناعي يقوم بالتفريغ الصوتي الآن... يرجى عدم إغلاق هذه الصفحة.');
      
      // Run on-device inference
      const result = await whisperPipeline(processedAudio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
        language: selectedLanguage === 'auto' ? null : selectedLanguage,
        task: selectedTask,
      });

      if (result && result.chunks) {
        const formattedSegments: Segment[] = result.chunks.map((chunk: any) => ({
          start: chunk.timestamp ? chunk.timestamp[0] : 0,
          end: chunk.timestamp ? chunk.timestamp[1] : (chunk.timestamp ? chunk.timestamp[0] + 2.5 : 2.5),
          text: chunk.text || ''
        }));
        setTranscriptSegments(formattedSegments);
        setFullText(result.text || '');
      } else {
        setFullText(result.text || '');
        setTranscriptSegments([{ start: 0, end: 5, text: result.text || '' }]);
      }

      const endTime = performance.now();
      setTranscriptionTime(Math.round((endTime - startTime) / 1000));
      setStatusText('تم تفريغ الصوت بنجاح فائق!');
      
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#06b6d4', '#10b981']
      });

    } catch (error: any) {
      console.error(error);
      setStatusText(`عذراً، حدث خطأ أثناء المعالجة: ${error.message || 'يرجى تجربة ملف آخر'}`);
    } finally {
      setIsProcessing(false);
      setModelLoadingProgress(0);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadAsTXT = () => {
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${audioFile?.name || 'very_transcript'}.txt`;
    link.click();
  };

  const downloadAsSRT = () => {
    const srtText = generateSRT(transcriptSegments);
    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${audioFile?.name || 'very_transcript'}.srt`;
    link.click();
  };

  const togglePlayback = () => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
      } else {
        audioPlayerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const jumpToAudioTimestamp = (seconds: number) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = seconds;
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const filteredSegments = transcriptSegments.filter(s => 
    s.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Dashboard Top Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-darkCard to-brand-900/10 border border-brand-500/20 rounded-2xl p-5 flex items-start gap-4 shadow-neon-glow">
          <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400 border border-brand-500/20">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-brand-300">حوسبة متكاملة في المتصفح</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              تجري معالجة البيانات بالكامل محلياً على جهازك لخصوصية مطلقة دون إرسالها لأي خادم.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-darkCard to-neonCyan/10 border border-neonCyan/20 rounded-2xl p-5 flex items-start gap-4 shadow-cyan-glow">
          <div className="p-3 bg-neonCyan/10 rounded-xl text-neonCyan border border-neonCyan/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-cyan-300">توليد تلقائي للترجمة SRT</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              استخرج ملفات ترجمة احترافية مخصصة لليوتيوب، ريلز وبرامج المونتاج بنقرة زر واحدة.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-darkCard to-neonTeal/10 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
          <div className="p-3 bg-neonTeal/10 rounded-xl text-neonTeal border border-neonTeal/20">
            <Languages className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-teal-300">متعدد اللغات + ترجمة فورية</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              تعرف فوري على اللغة العربية ولهجاتها مع إمكانية تحويل الصوت إلى نص إنجليزي مباشرة.
            </p>
          </div>
        </div>
      </div>

      {/* Main Core Area - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Inputs & Settings Panel (Left Column) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Custom Settings Configurator */}
          <div className="bg-darkCard/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 space-y-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-600/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <Settings className=
