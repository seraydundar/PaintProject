// src/components/CameraFilter.jsx
import React, { useEffect, useRef, useState } from 'react';

export default function CameraFilter() {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const recorderRef = useRef(null);

  const [stream, setStream]         = useState(null);
  const [recordedChunks, setChunks] = useState([]);
  const [isRecording, setRecording] = useState(false);
  const [filters, setFilters]       = useState([]);

  // 1️⃣ Kamera başlat
  useEffect(() => {
    async function initCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play().catch(() => {});
        }
        setStream(s);
      } catch (err) {
        console.error('Kamera açılamadı:', err);
      }
    }
    initCamera();
    return () => stream?.getTracks()?.forEach(t => t.stop());
  }, []);

  // 2️⃣ Video → Canvas (her frame, kombine filtreli)
  useEffect(() => {
    if (!stream) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    function draw() {
      if (!video.videoWidth) {
        animId = requestAnimationFrame(draw);
        return;
      }
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const filterString = filters.length ? filters.join(' ') : 'none';
      ctx.filter = filterString;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => cancelAnimationFrame(animId);
  }, [stream, filters]);

  // 3️⃣ Toolbar’dan gelen filtre olaylarını dinle (kombine)
  useEffect(() => {
    const applyHandler = (e) => {
      const { key, value } = typeof e.detail === 'object' ? e.detail : { key: e.detail };
      let f;
      switch (key) {
        case 'grayscale': f = 'grayscale(100%)'; break;
        case 'blur':      f = 'blur(5px)';       break;
        case 'brightness': f = `brightness(${1 + (value||0)})`; break;
        case 'contrast':  f = `contrast(${1 + (value||0)})`;   break;
        case 'invert':    f = 'invert(100%)';     break;
        default: return;
      }
      setFilters(prev => prev.includes(f) ? prev : [...prev, f]);
    };
    const undoHandler = (e) => {
      const { key, value } = typeof e.detail === 'object' ? e.detail : { key: e.detail };
      let f;
      switch (key) {
        case 'grayscale': f = 'grayscale(100%)'; break;
        case 'blur':      f = 'blur(5px)';       break;
        case 'brightness': f = `brightness(${1 + (value||0)})`; break;
        case 'contrast':  f = `contrast(${1 + (value||0)})`;   break;
        case 'invert':    f = 'invert(100%)';     break;
        default: return;
      }
      setFilters(prev => prev.filter(item => item !== f));
    };

    window.addEventListener('canvas:apply-filter', applyHandler);
    window.addEventListener('canvas:undo-filter', undoHandler);
    return () => {
      window.removeEventListener('canvas:apply-filter', applyHandler);
      window.removeEventListener('canvas:undo-filter', undoHandler);
    };
  }, []);

  // 4️⃣ Kayıt kontrol
  const handleRecord = () => {
    if (!canvasRef.current) return;
    if (!isRecording) {
      const canvasStream = canvasRef.current.captureStream(30);
      const recorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });
      recorder.ondataavailable = e => { if (e.data.size) setChunks(prev => [...prev, e.data]); };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } else {
      recorderRef.current.stop();
      setRecording(false);
    }
  };

  // 5️⃣ Kaydı indir
  const downloadRecording = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'recording.webm';
    a.click();
    URL.revokeObjectURL(url);
    setChunks([]);
  };

  // 6️⃣ Fotoğraf çek (PNG)
  const handlePhoto = () => {
    const dataURL = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'photo.png';
    a.click();
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h3>Canlı Kamera (Kombine Filtre, Kaydet & Fotoğraf)</h3>
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
      <canvas ref={canvasRef} style={{ marginTop: 10, maxWidth: '100%' }} />
      <div style={{ marginTop: 15 }}>
        <button onClick={handleRecord}>
          {isRecording ? 'Durdur' : 'Kaydet'}
        </button>
        {!isRecording && recordedChunks.length > 0 && (
          <button onClick={downloadRecording} style={{ marginLeft: 10 }}>
            İndir
          </button>
        )}
        <button onClick={handlePhoto} style={{ marginLeft: 10 }}>
          Fotoğraf
        </button>
      </div>
    </div>
  );
}
