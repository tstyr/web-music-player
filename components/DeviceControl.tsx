'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Tablet, Speaker, Check, Wifi } from 'lucide-react';
import { useMusicStore } from '@/lib/store';
import { useSocket } from '@/hooks/useSocket';

interface Device {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  isActive: boolean;
  connectedAt?: string;
}

interface DeviceControlProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeviceControl({ isOpen, onClose }: DeviceControlProps) {
  const { isSyncMode, setIsSyncMode, connectedDevices } = useMusicStore();
  const { socket } = useSocket();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

  // 現在のデバイスIDを取得
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const deviceId = localStorage.getItem('deviceId') || '';
      setCurrentDeviceId(deviceId);
      setSelectedDevice(deviceId);
    }
  }, []);

  // デバイスリストの更新を監視
  useEffect(() => {
    const handleDeviceListUpdate = (event: any) => {
      const data = event.detail;
      console.log('[DeviceControl] Device list updated:', data);
      
      if (data.devices && Array.isArray(data.devices)) {
        setDevices(data.devices.map((d: any) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          isActive: d.isActive,
          connectedAt: d.connectedAt
        })));
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('device-list-update', handleDeviceListUpdate);
      
      return () => {
        window.removeEventListener('device-list-update', handleDeviceListUpdate);
      };
    }
  }, []);

  // デバイス名を更新
  const updateDeviceName = (newName: string) => {
    if (socket) {
      socket.emit('update-device-name', { name: newName });
      if (typeof window !== 'undefined') {
        localStorage.setItem('deviceName', newName);
      }
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      default:
        return Monitor;
    }
  };

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId);
  };

  const handleSyncToggle = () => {
    setIsSyncMode(!isSyncMode);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* ポップアップメニュー */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-24 right-4 z-50 w-80 glass-dark rounded-xl border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* ヘッダー */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">デバイスを選択</h3>
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-400">{devices.length}台接続中</span>
              </div>
            </div>
          </div>

          {/* デバイスリスト */}
          <div className="max-h-64 overflow-y-auto">
            {devices.length === 0 ? (
              <div className="p-8 text-center">
                <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400 text-sm">接続中のデバイスがありません</p>
                <p className="text-gray-500 text-xs mt-2">
                  他のデバイスから同じURLにアクセスしてください
                </p>
              </div>
            ) : (
              devices.map((device) => {
                const DeviceIcon = getDeviceIcon(device.type);
                const isSelected = selectedDevice === device.id;
                const isCurrent = currentDeviceId === device.id;
                
                return (
                  <motion.button
                    key={device.id}
                    onClick={() => handleDeviceSelect(device.id)}
                    className={`w-full p-4 flex items-center space-x-3 hover:bg-white/5 transition-colors ${
                      isSelected ? 'bg-white/10' : ''
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-green-500/20' : 'bg-gray-700'
                    }`}>
                      <DeviceIcon className={`w-5 h-5 ${
                        isSelected ? 'text-green-500' : 'text-gray-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">
                        {device.name}
                        {isCurrent && (
                          <span className="ml-2 text-xs text-green-500">(このデバイス)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {device.isActive ? '接続中' : 'オフライン'}
                      </div>
                    </div>
                    
                    {isSelected && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </motion.button>
                );
              })
            )}
          </div>

          {/* 同期再生オプション */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleSyncToggle}
              className={`w-full p-3 rounded-lg flex items-center justify-between transition-colors ${
                isSyncMode 
                  ? 'bg-green-500/20 border border-green-500/50' 
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isSyncMode ? 'bg-green-500/30' : 'bg-gray-700'
                }`}>
                  <Speaker className={`w-4 h-4 ${
                    isSyncMode ? 'text-green-500' : 'text-gray-400'
                  }`} />
                </div>
                <div className="text-left">
                  <div className="font-medium text-white text-sm">全デバイスで同時再生</div>
                  <div className="text-xs text-gray-400">
                    {isSyncMode ? '有効' : '無効'}
                  </div>
                </div>
              </div>
              
              <div className={`w-10 h-6 rounded-full transition-colors ${
                isSyncMode ? 'bg-green-500' : 'bg-gray-600'
              }`}>
                <motion.div
                  className="w-5 h-5 bg-white rounded-full m-0.5"
                  animate={{ x: isSyncMode ? 16 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </div>
            </button>
          </div>

          {/* フッター */}
          <div className="p-3 bg-white/5 text-center">
            <p className="text-xs text-gray-400">
              同じネットワーク内のデバイスが自動的に表示されます
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
