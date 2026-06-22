"use client";

import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isRecording: boolean;
  audioStream: MediaStream | null;
}

export default function AudioVisualizer({ isRecording, audioStream }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!isRecording || !audioStream) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      drawStaticWave();
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(audioStream);
    
    source.connect(analyser);
    analyser.fftSize = 128;
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      // Solid futuristic dark gradient background
      canvasCtx.fillStyle = '#0f172a';
      canvasCtx.fillRect(0, 0, width, height);
      
      const barWidth = (width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height * 0.85;
        
        const gradient = canvasCtx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#7c3aed');
        gradient.addColorStop(0.4, '#06b6d4');
        gradient.addColorStop(1, '#f59e0b');
        
        canvasCtx.fillStyle = gradient;
        // Rounded corners for waveform bars
        canvasCtx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
        
        x += barWidth;
      }
    };
    
    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isRecording, audioStream]);

  const drawStaticWave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;
    
    canvasCtx.fillStyle = '#0f172a';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    canvasCtx.strokeStyle = 'rgba(124, 58, 237, 0.3)';
    canvasCtx.lineWidth = 2.5;
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, canvas.height / 2);
    
    for (let i = 0; i < canvas.width; i += 15) {
      const amplitude = Math.sin(i * 0.03) * 12;
      canvasCtx.lineTo(i, (canvas.height / 2) + amplitude);
    }
    canvasCtx.stroke();
  };

  useEffect(() => {
    drawStaticWave();
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-darkCard border border-slate-800 p-1 bg-opacity-70 backdrop-blur-md">
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10 bg-slate-950/80 py-1 px-3 rounded-full border border-slate-800">
        <span className={`h-2.5 w-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-neonCyan'}`} />
        <span className="text-[9px] font-mono tracking-wider text-slate-300 font-bold uppercase">
          {isRecording ? 'LIVE WAVE / بث ميكروفون حي' : 'AUDIO SPECTRUM / مستشعر الإدخال'}
        </span>
      </div>
      <canvas 
        ref={canvasRef} 
        className="w-full h-24 block opacity-95 rounded-xl"
        width={600}
        height={96}
      />
    </div>
  );
}
