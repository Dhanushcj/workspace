import React, { useState, useEffect } from 'react';
import { Plus, GripVertical, Trash2, CheckCircle2, Clock, Circle } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const API_URL = 'http://localhost:3001/api/tasks';

function SortableItem(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'todo': return <Circle size={16} className="text-zinc-500" />;
      case 'in_progress': return <Clock size={16} className="text-blue-500" />;
      case 'done': return <CheckCircle2 size={16} className="text-emerald-500" />;
      default: return <Circle size={16} className="text-zinc-500" />;
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-[#1e293b]/60 border border-zinc-700/50 p-4 rounded-2xl mb-3 flex flex-col gap-2 shadow-lg backdrop-blur-sm group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300">
            <GripVertical size={16} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white mb-1">{props.task.title}</h4>
            {props.task.description && (
              <p className="text-xs text-zinc-400 line-clamp-2">{props.task.description}</p>
            )}
          </div>
        </div>
        <button 
          onClick={() => props.onDelete(props.task._id)}
          className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-700/30">
        {getStatusIcon(props.task.status)}
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          {props.task.status.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle, status: 'todo' })
      });
      const newTask = await res.json();
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
    } catch (err) {
      console.error('Failed to add task', err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t._id !== id));
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Determine the container (column) we dropped into or the item we dropped over
    let newStatus = null;
    if (['todo', 'in_progress', 'done'].includes(overId)) {
      newStatus = overId;
    } else {
      const overTask = tasks.find(t => t._id === overId);
      if (overTask) newStatus = overTask.status;
    }

    if (newStatus) {
      const activeTask = tasks.find(t => t._id === activeId);
      if (activeTask && activeTask.status !== newStatus) {
        // Optimistic update
        const updatedTasks = tasks.map(t => t._id === activeId ? { ...t, status: newStatus } : t);
        setTasks(updatedTasks);
        
        try {
          await fetch(`${API_URL}/${activeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
        } catch (err) {
          console.error('Failed to update status', err);
          fetchTasks(); // Revert on failure
        }
      }
    }
  };

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
  ];

  return (
    <div className="min-h-screen bg-[#090d16] font-sans text-zinc-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8 h-full flex flex-col">
        {/* Header */}
        <div>
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1.5">PROJECT MANAGEMENT</p>
          <h2 className="text-3xl font-black tracking-tight leading-none text-white">Tasks & Workflows</h2>
          <p className="text-sm text-zinc-400 mt-2">Manage your team deliverables efficiently.</p>
        </div>

        {/* Add Task Form */}
        <form onSubmit={addTask} className="flex gap-4">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 bg-[#1e293b]/55 border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-lg"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Create Task</span>
          </button>
        </form>

        {/* Kanban Board */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-[500px]">
            {columns.map(col => {
              const columnTasks = tasks.filter(t => t.status === col.id);
              return (
                <div key={col.id} className="bg-[#0c1220]/60 border border-zinc-800/80 rounded-[32px] p-6 flex flex-col h-full shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between mb-6 px-2">
                    <h3 className="text-base font-black text-white tracking-wide">{col.title}</h3>
                    <div className="bg-zinc-800/60 text-zinc-400 text-xs font-bold px-3 py-1 rounded-full">
                      {columnTasks.length}
                    </div>
                  </div>
                  
                  {/* Drop zone for empty columns */}
                  <div id={col.id} className="flex-1">
                    <SortableContext items={columnTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                      {columnTasks.map(task => (
                        <SortableItem key={task._id} id={task._id} task={task} onDelete={deleteTask} />
                      ))}
                      {columnTasks.length === 0 && (
                        <div className="h-full border-2 border-dashed border-zinc-800/50 rounded-2xl flex items-center justify-center text-zinc-600 text-sm font-bold p-8 text-center min-h-[100px]">
                          Drop tasks here
                        </div>
                      )}
                    </SortableContext>
                  </div>
                </div>
              );
            })}
          </div>
        </DndContext>
      </div>
    </div>
  );
}
