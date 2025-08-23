import { useState } from 'react';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import { Toaster } from './components/ui/toaster';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="min-h-screen bg-sidebar p-6 space-y-6">
      <Toaster />
      <TaskForm onCreated={() => setRefreshKey(k => k + 1)} />
      <TaskList refreshKey={refreshKey} />
    </div>
  );
}

export default App
