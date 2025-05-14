import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';

// Bu bileşen Canvas bileşenine canvasRef prop'u ile bağlanmalı
export default function HistogramAnalysis({ canvasRef }) {
  const [isOpen, setIsOpen] = useState(false);
  const [histData, setHistData] = useState([]);
  const chartRef = useRef(null);
  let chartInstance = useRef(null);

  // Event listener: "canvas:histogram" tetiklendiğinde histogramı hesapla
  useEffect(() => {
    const handler = () => {
      performHistogramAnalysis();
    };
    window.addEventListener('canvas:histogram', handler);
    return () => {
      window.removeEventListener('canvas:histogram', handler);
    };
  }, []);

  // Histogram hesaplama
  const performHistogramAnalysis = () => {
     const fabricCanvas = canvasRef.current;
    if (!fabricCanvas || !fabricCanvas.lowerCanvasEl) {
      alert('Histogram yapmak için canvas bulunamadı.');
      return;
    }

    // 1) Tüm çizili içeriği tutan gerçek <canvas> elementi
    const baseCanvas = fabricCanvas.lowerCanvasEl;
    const w = baseCanvas.width;
    const h = baseCanvas.height;
    if (!w || !h) {
      alert(`Canvas boyutları geçersiz: ${w}×${h}`);
      return;
    }

    // 2) Piksel verisini oku
    const ctx = baseCanvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, w, h).data;

    // 3) Histogram hesapla
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < imgData.length; i += 4) {
      const gray = Math.round(0.299 * imgData[i] 
                          + 0.587 * imgData[i+1] 
                          + 0.114 * imgData[i+2]);
      histogram[gray]++;
    }

    // 4) State’e ata ve modal’ı aç
    setHistData(histogram);
    setIsOpen(true);
  };

  // Chart.js ile çubuğu çiz
  useEffect(() => {
    if (isOpen && histData.length) {
      const ctx = chartRef.current.getContext('2d');
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
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
          scales: {
            x: { display: false },
            y: { beginAtZero: true }
          },
          animation: false,
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }, [isOpen, histData]);

  if (!isOpen) return null;

  return (
    <div className="histogram-modal">
      <div className="modal-content">
        <h3>Histogram Analizi</h3>
        <canvas ref={chartRef} width={512} height={200}></canvas>
        <button onClick={() => setIsOpen(false)}>Kapat</button>
      </div>
    </div>
  );
}
