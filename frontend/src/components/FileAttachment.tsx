import React, { useState } from 'react';
import { FileSpreadsheet, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { FileAttachment as FileAttachmentType } from '../types';

interface FileAttachmentProps {
  file: FileAttachmentType;
  onRemove?: () => void;
  isPreview?: boolean;
}

export function FileAttachmentComponent({ file, onRemove, isPreview }: FileAttachmentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const previewData = isPreview ? file.preview : file.content;
  const maxRows = 5;

  if (!previewData?.length) return null;

  return (
    <div className="mt-2 bg-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-gray-800">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-white">{file.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {!isPreview && onRemove && (
            <button
              onClick={onRemove}
              className="p-1 hover:bg-gray-600 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-600 rounded-full transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400 hover:text-white" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 hover:text-white" />
            )}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="p-3 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-800">
              <tr>
                {previewData[0].map((header, i) => (
                  <th key={i} className="px-4 py-2">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.slice(1, maxRows + 1).map((row, i) => (
                <tr key={i} className="border-b border-gray-700">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {previewData.length > maxRows + 1 && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              Showing {maxRows} of {previewData.length - 1} rows
            </p>
          )}
        </div>
      )}
    </div>
  );
}