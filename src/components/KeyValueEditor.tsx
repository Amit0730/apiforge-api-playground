import { KeyValue } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface KeyValueEditorProps {
  items: KeyValue[];
  onChange: (items: KeyValue[]) => void;
  placeholderKey?: string;
  placeholderValue?: string;
}

export function KeyValueEditor({ items, onChange, placeholderKey = 'Key', placeholderValue = 'Value' }: KeyValueEditorProps) {
  const updateItem = (index: number, field: keyof KeyValue, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    // Always keep at least one empty row
    if (newItems.length === 0) {
      newItems.push({ id: uuidv4(), key: '', value: '', enabled: true });
    }
    onChange(newItems);
  };

  const addItem = () => {
    onChange([...items, { id: uuidv4(), key: '', value: '', enabled: true }]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 mb-2 text-xs font-semibold text-gray-400 px-1">
        <div className="w-6 text-center">On</div>
        <div>{placeholderKey}</div>
        <div>{placeholderValue}</div>
        <div className="w-8"></div>
      </div>
      {items.map((item, index) => (
        <div key={item.id} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center group">
          <div className="w-6 flex justify-center">
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={(e) => updateItem(index, 'enabled', e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-[var(--panel)] border-[var(--panel-border)] text-[var(--primary)] focus:ring-[var(--primary)] focus:ring-offset-0"
            />
          </div>
          <input
            type="text"
            value={item.key}
            onChange={(e) => {
              updateItem(index, 'key', e.target.value);
              // Auto-add new row if we type in the last row
              if (index === items.length - 1 && e.target.value) {
                addItem();
              }
            }}
            placeholder={placeholderKey}
            className="bg-[var(--background)] border border-[var(--panel-border)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--primary)] font-mono"
          />
          <input
            type="text"
            value={item.value}
            onChange={(e) => updateItem(index, 'value', e.target.value)}
            placeholder={placeholderValue}
            className="bg-[var(--background)] border border-[var(--panel-border)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--primary)] font-mono"
          />
          <button
            onClick={() => removeItem(index)}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
