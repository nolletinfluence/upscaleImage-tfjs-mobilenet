import { useContext } from 'react';
import { UpscalerContext, UpscalerContextType } from '../context/UpscalerContext';

export function useUpscaler(): UpscalerContextType {
  const context = useContext(UpscalerContext);
  if (context === undefined) {
    throw new Error('useUpscaler must be used within an UpscalerProvider');
  }
  return context;
}