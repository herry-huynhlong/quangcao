'use client';
import { useCallback, useEffect, useState } from 'react';

export function useApiResource<T>(load:(signal:AbortSignal)=>Promise<T>){
  const [data,setData]=useState<T|null>(null); const [error,setError]=useState(''); const [attempt,setAttempt]=useState(0);
  useEffect(()=>{const controller=new AbortController();load(controller.signal).then(result=>setData(result)).catch(caught=>{if(controller.signal.aborted)return;setError(caught instanceof Error?caught.message:'Không thể tải dữ liệu.');});return()=>controller.abort();},[load,attempt]);
  const retry=useCallback(()=>{setError('');setAttempt(value=>value+1);},[]);
  return {data,error,retry,loading:data===null&&!error};
}
