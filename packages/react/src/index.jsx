import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { TravenEditor } from 'traven';

export const Traven = forwardRef(({ 
  defaultValue = "", 
  onChange, 
  options = {}, 
  className 
}, ref) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getValue: () => editorRef.current?.getValue() || "",
    getInstance: () => editorRef.current
  }), []);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Critical for React 18 Strict Mode which remounts components
    containerRef.current.innerHTML = "";

    editorRef.current = new TravenEditor({
      element: containerRef.current,
      initialValue: defaultValue,
      onChange: (val) => onChange && onChange(val),
      ...options
    });

    return () => {
      // Clean up instance on unmount
      if (editorRef.current && typeof editorRef.current.destroy === 'function') {
        editorRef.current.destroy();
      }
    };
  }, []); // Run once on mount

  return <div ref={containerRef} className={`traven-react-wrapper ${className || ''}`} />;
});
