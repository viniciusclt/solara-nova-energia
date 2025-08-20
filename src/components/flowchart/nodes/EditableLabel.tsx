// ============================================================================
// EditableLabel - Componente para edição inline de labels de nós
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { Edit2 } from 'lucide-react';

interface EditableLabelProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  placeholder?: string;
  isSelected?: boolean;
  maxLength?: number;
}

export const EditableLabel: React.FC<EditableLabelProps> = ({
  value,
  onSave,
  className = '',
  placeholder = 'Digite o nome...',
  isSelected = false,
  maxLength = 50
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== value) {
      onSave(trimmedValue);
    } else {
      setEditValue(value); // Reset to original value if empty or unchanged
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // Prevent triggering global delete functionality
    
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setEditValue(newValue);
    }
  };

  if (isEditing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={`bg-white border-2 border-blue-500 rounded px-2 py-1 text-sm font-semibold text-center outline-none ${className}`}
          placeholder={placeholder}
          maxLength={maxLength}
        />
        <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
          Enter para salvar • Esc para cancelar
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative group cursor-pointer ${className}`}
      onDoubleClick={handleDoubleClick}
      title="Clique duas vezes para editar"
    >
      <span className="font-semibold text-slate-800">
        {value || placeholder}
      </span>
      
      {/* Edit icon - only show when selected or hovered */}
      {(isSelected || false) && (
        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-blue-500 text-white rounded-full p-1">
            <Edit2 size={10} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableLabel;