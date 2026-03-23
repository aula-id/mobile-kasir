import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';

interface ProductImageCaptureProps {
  value?: string;
  onChange: (imageUrl: string | undefined) => void;
}

export function ProductImageCapture({ value, onChange }: ProductImageCaptureProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error('Failed to access camera:', err);
      // Fall back to file upload
      fileInputRef.current?.click();
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
      onChange(imageUrl);
      stopCamera();
    }
  }, [onChange, stopCamera]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Resize image if too large
        const img = new Image();
        img.onload = () => {
          const maxSize = 800;
          let { width, height } = img;

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const resizedUrl = canvas.toDataURL('image/jpeg', 0.8);
            onChange(resizedUrl);
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
      // Reset input
      e.target.value = '';
    },
    [onChange]
  );

  const handleRemove = useCallback(() => {
    onChange(undefined);
  }, [onChange]);

  return (
    <div className="space-y-3">
      {/* Hidden elements */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Preview or placeholder */}
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Product"
            className="w-full h-48 object-cover rounded-xl border border-[#E8E2D9]"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-white/90 rounded-lg shadow-sm hover:bg-white transition-colors"
          >
            <X className="w-4 h-4 text-[#8D8D9B]" />
          </button>
        </div>
      ) : (
        <div className="w-full h-48 rounded-xl border-2 border-dashed border-[#E8E2D9] bg-[#FAFAF8] flex items-center justify-center">
          <p className="text-sm text-[#8D8D9B]">No image</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={startCamera}
          className="flex-1"
        >
          <Camera className="w-4 h-4 mr-2" />
          Camera
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </div>

      {/* Camera modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="flex-1 object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center gap-4">
              <button
                type="button"
                onClick={stopCamera}
                className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg"
              >
                <div className="w-16 h-16 rounded-full border-4 border-[#E07A5F]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  // Could implement camera flip here
                }}
                className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center opacity-50"
              >
                <RotateCcw className="w-6 h-6 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
