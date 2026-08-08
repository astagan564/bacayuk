import React from 'react';
import { X, FileText } from 'lucide-react';
import changelogRaw from '../data/user-changelog.md?raw';

interface ChangelogModalProps {
  onClose: () => void;
  isNight: boolean;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose, isNight }) => {
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('## ')) {
        return <h3 key={index} className={`text-lg font-black mt-6 mb-3 pb-1 border-b ${isNight ? 'text-indigo-200 border-indigo-800/50' : 'text-amber-900 border-amber-200'}`}>{line.substring(3)}</h3>;
      }
      
      if (line.startsWith('### ')) {
        return <h4 key={index} className={`font-bold mt-4 mb-2 ${isNight ? 'text-indigo-300' : 'text-amber-700'}`}>{line.substring(4)}</h4>;
      }
      
      if (line.startsWith('# ')) {
        return null;
      }
      if (line.startsWith('- ')) {
        // Parse basic bold text `**text**`
        const parts = line.substring(2).split(/(\*\*.*?\*\*)/g);
        return (
          <li key={index} className="ml-4 mb-1.5 list-disc text-sm">
            {parts.map((part, i) => 
              part.startsWith('**') && part.endsWith('**') 
                ? <strong key={i}>{part.slice(2, -2)}</strong> 
                : <span key={i}>{part}</span>
            )}
          </li>
        );
      }
      if (line.trim() === '') {
        return <br key={index} className="h-2" />;
      }
      // Parse links `[text](url)`
      const linkMatch = line.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
         const parts = line.split(linkMatch[0]);
         return (
           <p key={index} className="text-sm mb-2">
             {parts[0]}
             <a href={linkMatch[2]} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{linkMatch[1]}</a>
             {parts[1]}
           </p>
         );
      }

      return <p key={index} className="text-sm mb-2">{line}</p>;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div 
        className={`relative w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border-4 ${
          isNight 
            ? 'bg-slate-900 border-indigo-900 shadow-indigo-900/50' 
            : 'bg-amber-50 border-amber-200 shadow-amber-900/20'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isNight ? 'bg-slate-800 border-indigo-800' : 'bg-amber-100 border-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isNight ? 'bg-indigo-900 text-indigo-300' : 'bg-amber-200 text-amber-700'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <h2 className={`text-lg font-black ${isNight ? 'text-slate-200' : 'text-amber-950'}`}>
              Riwayat Pembaruan (Changelog)
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isNight ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-amber-200 text-amber-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-6 ${
          isNight ? 'text-slate-300' : 'text-amber-900'
        } [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:rounded-full ${
          isNight ? '[&::-webkit-scrollbar-thumb]:bg-indigo-800' : '[&::-webkit-scrollbar-thumb]:bg-amber-300'
        }`}>
          {renderMarkdown(changelogRaw)}
        </div>
      </div>
    </div>
  );
};
