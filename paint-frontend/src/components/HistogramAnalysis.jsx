// HistogramAnalysis.jsx
import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function HistogramAnalysis({ canvasRef }) {
  const [isOpen, setIsOpen] = useState(false);
  const [histData, setHistData] = useState([]);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // 1) Event listener: histogram tetiklenince çalışacak
  useEffect(() => {
    const handler = () => performHistogramAnalysis();
    window.addEventListener('canvas:histogram', handler);
    return () => window.removeEventListener('canvas:histogram', handler);
  }, []);

  const performHistogramAnalysis = () => {
    const fabricCanvas = canvasRef.current;
    if (!fabricCanvas?.lowerCanvasEl) {
      alert('Histogram yapmak için canvas bulunamadı.');
      return;
    }
    const base = fabricCanvas.lowerCanvasEl;
    const w = base.width, h = base.height;
    if (!w || !h) {
      alert(`Canvas boyutları geçersiz: ${w}×${h}`);
      return;
    }
    const ctx = base.getContext('2d');
    const img = ctx.getImageData(0, 0, w, h).data;
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < img.length; i += 4) {
      const gray = Math.round(0.299*img[i] + 0.587*img[i+1] + 0.114*img[i+2]);
      histogram[gray]++;
    }
    setHistData(histogram);
    setIsOpen(true);
  };

  // 2) Chart çizimi
  useEffect(() => {
    if (!isOpen || !histData.length) return;
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current?.destroy();
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Array.from({ length: 256 }, (_, i) => i),
        datasets: [{
          data: histData,
          label: 'Piksel Dağılımı',
          barPercentage: 1.0,
          categoryPercentage: 1.0
        }]
      },
      options: {
        scales: { x: { display: false }, y: { beginAtZero: true } },
        plugins: { legend: { display: false } },
        animation: false
      }
    });
  }, [isOpen, histData]);

  if (!isOpen) return null;

  // 3) Tam ekran overlay olarak render et
  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: 20,
          borderRadius: 4,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          maxWidth: '90%',
          maxHeight: '80%',
          overflow: 'auto'
        }}
      >
        <h3 style={{ marginTop: 0 }}>Histogram Analizi</h3>
        <canvas ref={chartRef} width={512} height={200} />
        <div style={{ textAlign: 'right', marginTop: 12 }}>
          <button onClick={() => setIsOpen(false)}>Kapat</button>
        </div>
      </div>
    </div>
  );
}
