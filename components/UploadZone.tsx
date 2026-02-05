'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle, AlertCircle, Music, FileAudio } from 'lucide-react';

interface UploadResult {
  success: boolean;
  fileName: string;
  track?: any;
  metadata?: {
    format: string;
    quality: string;
    sampleRate: number;
    bitDepth: number;
    bitrate: number;
    isHighRes: boolean;
    fileSize: string;
  };
  error?: string;
}

interface UploadZoneProps {
  onUploadComplete?: (results: UploadResult[]) => void;
}

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // 音楽ファイルのみフィルタリング
    const audioFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg', 'wma', 'dsd', 'dsf', 'dff'].includes(ext || '');
    });

    if (audioFiles.length === 0) {
      alert('サポートされている音楽ファイルが見つかりません。');
      return;
    }

    setIsUploading(true);
    setUploadResults([]);
    setShowResults(true);

    try {
      const formData = new FormData();
      audioFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/music/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        setUploadResults(result.results);
        onUploadComplete?.(result.results);
      } else {
        console.error('Upload failed:', result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getQualityColor = (quality: string) => {
    if (quality.includes('Hi-Res')) return 'text-purple-400';
    if (quality.includes('Studio')) return 'text-blue-400';
    if (quality.includes('CD')) return 'text-green-400';
    return 'text-gray-400';
  };

  const getFormatIcon = (format: string) => {
    if (['FLAC', 'WAV', 'DSD', 'DSF', 'DFF'].includes(format)) {
      return <FileAudio className="w-5 h-5 text-purple-400" />;
    }
    return <Music className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div className="space-y-6">
      {/* アップロードゾーン */}
      <motion.div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
          isDragOver
            ? 'border-green-500 bg-green-500/10'
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
      >
        <input
          type="file"
          multiple
          accept=".mp3,.flac,.wav,.m4a,.aac,.ogg,.wma,.dsd,.dsf,.dff"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <motion.div
          animate={{ y: isDragOver ? -10 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">
            {isDragOver ? 'ファイルをドロップしてください' : '音楽ファイルをアップロード'}
          </h3>
          <p className="text-gray-400 mb-4">
            ドラッグ&ドロップまたはクリックしてファイルを選択
          </p>
          <div className="text-sm text-gray-500">
            <p>対応フォーマット: MP3, FLAC, WAV, M4A, AAC, OGG, WMA, DSD</p>
            <p className="mt-1">ハイレゾ音源（192kHz/24bit）まで対応</p>
          </div>
        </motion.div>
      </motion.div>

      {/* アップロード進行状況 */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
              <span>ファイルをアップロード中...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* アップロード結果 */}
      <AnimatePresence>
        {showResults && uploadResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-xl overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold">アップロード結果</h3>
              <button
                onClick={() => setShowResults(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {uploadResults.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 border-b border-white/5 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {result.success && result.metadata && getFormatIcon(result.metadata.format)}
                        <span className="font-medium truncate">{result.fileName}</span>
                      </div>
                      
                      {result.success && result.metadata ? (
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center space-x-4">
                            <span className={`font-medium ${getQualityColor(result.metadata.quality)}`}>
                              {result.metadata.quality}
                            </span>
                            <span className="text-gray-400">
                              {result.metadata.sampleRate / 1000}kHz / {result.metadata.bitDepth}bit
                            </span>
                            <span className="text-gray-400">
                              {result.metadata.format}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-gray-500">
                            <span>{result.metadata.fileSize}</span>
                            {result.metadata.bitrate > 0 && (
                              <span>{result.metadata.bitrate}kbps</span>
                            )}
                            {result.metadata.isHighRes && (
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                                Hi-Res
                              </span>
                            )}
                          </div>
                          {result.track && (
                            <div className="text-gray-400">
                              {result.track.title} - {result.track.artist}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-red-400 text-sm">
                          {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}