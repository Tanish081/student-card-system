import { useEffect, useRef } from 'react';

const GRID_SIZE = 40;
const GRID_LINE_COLOR = 'rgba(0, 212, 180, 0.04)';
const FLASH_TEAL = 'rgba(0, 212, 180, 0.12)';
const FLASH_AMBER = 'rgba(244, 166, 35, 0.16)';
const WAVE_TEAL = 'rgba(0, 212, 180, 0.3)';
const WAVE_AMBER = 'rgba(244, 166, 35, 0.5)';
const FLASH_DURATION = 800;
const BASE_AMPLITUDE = 18;
const SPIKE_AMPLITUDE = 45;
const PERIOD = 200;
const SPEED = 30;

const randomRange = (min, max) => min + Math.random() * (max - min);

const AdminLoginCanvas = ({ className = '' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return undefined;
    }

    let rafId = 0;
    let phase = 0;
    let lastFrame = performance.now();
    let nextFlashAt = lastFrame + randomRange(2000, 4000);
    let nextSpikeAt = lastFrame + randomRange(4000, 7000);
    let spikeEndsAt = 0;
    const flashes = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawGrid = (width, height) => {
      context.strokeStyle = GRID_LINE_COLOR;
      context.lineWidth = 1;

      for (let x = 0; x <= width; x += GRID_SIZE) {
        context.beginPath();
        context.moveTo(x + 0.5, 0);
        context.lineTo(x + 0.5, height);
        context.stroke();
      }

      for (let y = 0; y <= height; y += GRID_SIZE) {
        context.beginPath();
        context.moveTo(0, y + 0.5);
        context.lineTo(width, y + 0.5);
        context.stroke();
      }
    };

    const drawFlashes = (timestamp) => {
      for (let index = flashes.length - 1; index >= 0; index -= 1) {
        const flash = flashes[index];
        const elapsed = timestamp - flash.startedAt;
        const progress = Math.min(elapsed / FLASH_DURATION, 1);

        if (progress >= 1) {
          flashes.splice(index, 1);
          continue;
        }

        const alpha = 1 - progress;
        const color = flash.color === 'amber'
          ? `rgba(244, 166, 35, ${(0.16 * alpha).toFixed(3)})`
          : `rgba(0, 212, 180, ${(0.15 * alpha).toFixed(3)})`;

        context.fillStyle = color;
        context.fillRect(
          flash.column * GRID_SIZE,
          flash.row * GRID_SIZE,
          GRID_SIZE,
          GRID_SIZE
        );
      }
    };

    const drawWave = (width, height, isSpike) => {
      const amplitude = isSpike ? SPIKE_AMPLITUDE : BASE_AMPLITUDE;
      const yCenter = height * 0.6;
      context.beginPath();
      context.strokeStyle = isSpike ? WAVE_AMBER : WAVE_TEAL;
      context.lineWidth = 1.5;

      for (let x = 0; x <= width; x += 4) {
        const y = yCenter + Math.sin(((x + phase) / PERIOD) * Math.PI * 2) * amplitude;
        if (x === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }

      context.stroke();
    };

    const render = (timestamp) => {
      const dt = (timestamp - lastFrame) / 1000;
      lastFrame = timestamp;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (timestamp >= nextFlashAt) {
        const flashCount = Math.random() > 0.55 ? 2 : 1;
        const maxColumns = Math.max(Math.floor(width / GRID_SIZE), 1);
        const maxRows = Math.max(Math.floor(height / GRID_SIZE), 1);

        for (let i = 0; i < flashCount; i += 1) {
          flashes.push({
            column: Math.floor(Math.random() * maxColumns),
            row: Math.floor(Math.random() * maxRows),
            startedAt: timestamp,
            color: Math.random() < 0.2 ? 'amber' : 'teal'
          });
        }

        nextFlashAt = timestamp + randomRange(2000, 4000);
      }

      if (timestamp >= nextSpikeAt) {
        spikeEndsAt = timestamp + 1400;
        nextSpikeAt = timestamp + randomRange(4000, 7000);
      }

      const isSpike = timestamp <= spikeEndsAt;
      phase -= SPEED * dt;

      context.clearRect(0, 0, width, height);
      drawGrid(width, height);
      drawFlashes(timestamp);
      drawWave(width, height, isSpike);

      rafId = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    rafId = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
};

export default AdminLoginCanvas;
