'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Tablet, Speaker, Check } from 'lucide-react';
import { useMusicStore } from '@/lib/store';

interface Device {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  isActive: boolean;
  lastSeen: Date;
}

interface DeviceControlProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeviceControl({ isOpen, onClose }: DeviceControlProps) {
  const { isSyncMode, setIsSyncMode, connectedDevices } = useMusicStore();
  const [devices, setDevices] = useState<Device[]>([
    {
      id: 'current',
      name: 'このデバイス',
      type: 'desktop',
      isActive: true,
      lastSeen: new Date()
    }
  ]);
  const [selectedDevice, setSelectedDevice] = useState<string>('current');

  useEffect(() => {
    // Socket.ioから接続デバイス情報を取得
    // TODO: 実際のSocket.io実装と連携
    if (connectedDevices > 1) {
      setDevices([
        {
          id: 'current',
          name: 'このデバイス',
          type: 'desktop',
          isActive: true,
          lastSeen: new Date()
        },
        {
          id: 'device-2',
          name: 'スマートフォン',
          type: 'mobile',
          isActive: true,
          lastSeen: new Date()
        }
      ]);
    }
  }, [connectedDevices]);

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
    // TODO: Socket.ioでデバイス切り替えを通知
  };

  const handleSyncToggle = () => {
    setIsSyncMode(!isSyncMode);
    // TODO: Socket.ioで同期モードを通知
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
                <Speaker className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">{devices.length}台接続中</span>
              </div>
            </div>
          </div>

          {/* デバイスリスト */}
          <div className="max-h-64 overflow-y-auto">
            {devices.map((device) => {
              const DeviceIcon = getDeviceIcon(device.type);
              const isSelected = selectedDevice === device.id;
              
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
                    <div className="font-medium text-white">{device.name}</div>
                    <div className="text-xs text-gray-400">
                      {device.isActive ? '接続中' : '最終接続: ' + device.lastSeen.toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                </motion.button>
              );
            })}
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
                  <div className="text-xs text-gray-400">マルチルーム同期</div>
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
              QRコードでスマホから接続できます
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
