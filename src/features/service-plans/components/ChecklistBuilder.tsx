import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { ChecklistItemTemplate } from '@/types/field.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChecklistBuilderProps {
  items: ChecklistItemTemplate[];
  onChange: (nextItems: ChecklistItemTemplate[]) => void;
}

/**
 * ChecklistBuilder (Feature 04 — Sección 4):
 * Componente interactivo para agregar, marcar obligatorio/opcional,
 * reordenar (arriba/abajo) o eliminar tareas de verificación que el
 * técnico verá en su móvil cuando ejecute una visita de este plan.
 */
export function ChecklistBuilder({ items, onChange }: ChecklistBuilderProps) {
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [newTaskRequired, setNewTaskRequired] = useState(true);

  const handleAddItem = () => {
    const trimmed = newTaskLabel.trim();
    if (!trimmed) return;
    const nextItem: ChecklistItemTemplate = {
      id: `chk-${Date.now().toString().slice(-4)}`,
      label: trimmed,
      isRequired: newTaskRequired,
    };
    onChange([...items, nextItem]);
    setNewTaskLabel('');
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const copy = [...items];
    const current = copy[index];
    const target = copy[targetIndex];
    if (!current || !target) return;
    copy[index] = target;
    copy[targetIndex] = current;
    onChange(copy);
  };

  const handleToggleRequired = (id: string) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, isRequired: !item.isRequired } : item
      )
    );
  };

  const handleRemove = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-3 rounded-[12px] border bg-background p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-foreground">
          Constructor de Checklist Técnico ({items.length} tareas)
        </p>
        <span className="text-[11px] text-[#78909C]">
          Sincronizado con el Paso 4 de la App Móvil PWA
        </span>
      </div>

      {/* Barra para agregar tarea */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Ej. Medición de voltaje en bornera de salida (220V AC ±2%)..."
          value={newTaskLabel}
          onChange={(e) => setNewTaskLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddItem();
            }
          }}
        />
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setNewTaskRequired((prev) => !prev)}
            className="rounded-[8px] border bg-card px-3 py-2 text-[12px] font-semibold text-foreground hover:border-[#0D6950]"
          >
            {newTaskRequired ? 'Obligatorio' : 'Opcional'}
          </button>
          <Button type="button" size="sm" onClick={handleAddItem}>
            <Plus className="h-4 w-4" />
            <span>Añadir Tarea</span>
          </Button>
        </div>
      </div>

      {/* Lista ordenable */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 rounded-[8px] border bg-card px-3 py-2 text-[12px]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono font-bold text-[#0D6950]">
                {idx + 1}.
              </span>
              <span className="truncate font-medium text-foreground">
                {item.label}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleToggleRequired(item.id)}
                title="Cambiar entre obligatorio y opcional"
              >
                <Badge variant={item.isRequired ? 'info' : 'secondary'}>
                  {item.isRequired ? 'Obligatorio' : 'Opcional'}
                </Badge>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={idx === 0}
                onClick={() => handleMove(idx, -1)}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={idx === items.length - 1}
                onClick={() => handleMove(idx, 1)}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#A8262B]"
                onClick={() => handleRemove(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
