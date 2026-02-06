'use client';

import React from 'react';

interface SkeletonLoaderProps {
  count?: number;
}

const SkeletonLoader = React.memo(({ count = 10 }: SkeletonLoaderProps) => {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <div className="grid grid-cols-12 gap-4 text-sm text-gray-400 font-medium">
          <div className="col-span-1">#</div>
          <div className="col-span-4">TITLE</div>
          <div className="col-span-2">ALBUM</div>
          <div className="col-span-2">QUALITY</div>
          <div className="col-span-2">DURATION</div>
          <div className="col-span-1"></div>
        </div>
      </div>
      
      <div className="divide-y divide-white/5">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="p-4 animate-pulse">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-1">
                <div className="w-4 h-4 bg-gray-700 rounded"></div>
              </div>
              
              <div className="col-span-4 flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-700 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
              
              <div className="col-span-2">
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
              
              <div className="col-span-2">
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
              
              <div className="col-span-2">
                <div className="h-3 bg-gray-700 rounded w-1/3"></div>
              </div>
              
              <div className="col-span-1">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-700 rounded"></div>
                  <div className="w-4 h-4 bg-gray-700 rounded"></div>
                  <div className="w-4 h-4 bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

SkeletonLoader.displayName = 'SkeletonLoader';

export default SkeletonLoader;
