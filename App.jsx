import './App.css';
import { useState, useEffect } from 'react';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';

function App() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const checkDueTasks = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (!task.completed && task.dueDate && task.dueTime) {
          const [year, month, day] = task.dueDate.split('-');
          const [hours, minutes] = task.dueTime.split(':');
          const taskDateTime = new Date(year, month - 1, day, hours, minutes);
          
          const timeDiff = taskDateTime - now;
          const oneHourInMs = 60 * 60 * 1000;
          
          if (timeDiff > 0 && timeDiff <= oneHourInMs && !task.notificationShown) {
            showNotification(task);
            setTasks(prevTasks =>
              prevTasks.map(t =>
                t.id === task.id ? { ...t, notificationShown: true } : t
              )
            );
          }
        }
      });
    };

    const interval = setInterval(checkDueTasks, 60000);
    return () => clearInterval(interval);
  }, [tasks]);

  const showNotification = (task) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Task Due Soon! ⏰', {
        body: `"${task.name}" is due in less than 1 hour!`,
        icon: '📋',
        tag: `task-${task.id}`,
      });
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const calculateEfficiency = (task) => {
    if (!task.completed || !task.dueDate || !task.dueTime) return null;
    
    const [year, month, day] = task.dueDate.split('-');
    const [hours, minutes] = task.dueTime.split(':');
    const dueDateTime = new Date(year, month - 1, day, hours, minutes);
    
    const completionDateTime = new Date(task.completionTime);
    const timeDiff = completionDateTime - dueDateTime;
    
    if (timeDiff <= 0) {
      return 100;
    }
    
    const delayHours = timeDiff / (1000 * 60 * 60);
    const efficiency = Math.max(0, 100 - 5 * delayHours);
    
    return Math.round(efficiency * 10) / 10;
  };

  const addTask = (taskName, dueDate, dueTime, timezone, priority, category) => {
    const newTask = {
      id: Date.now(),
      name: taskName,
      dueDate,
      dueTime,
      timezone,
      priority,
      category,
      completed: false,
      createdAt: new Date().toLocaleDateString(),
      notificationShown: false,
    };
    setTasks([newTask, ...tasks]);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const toggleTask = (id) => {
    setTasks(
      tasks.map(task =>
        task.id === id ? { 
          ...task, 
          completed: !task.completed,
          completionTime: !task.completed ? new Date().toISOString() : null
        } : task
      )
    );
  };

  let filteredTasks = tasks.filter(task => {
    let statusMatch = true;
    let priorityMatch = true;
    let categoryMatch = true;

    if (filter === 'completed') statusMatch = task.completed;
    if (filter === 'pending') statusMatch = !task.completed;

    if (priorityFilter !== 'all') priorityMatch = task.priority === priorityFilter;

    if (categoryFilter !== 'all') categoryMatch = task.category === categoryFilter;

    return statusMatch && priorityMatch && categoryMatch;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
  };

  const getOverallEfficiency = () => {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) return null;
    
    const totalEfficiency = completedTasks.reduce((sum, task) => {
      const eff = calculateEfficiency(task);
      return sum + (eff || 0);
    }, 0);
    
    return Math.round((totalEfficiency / completedTasks.length) * 10) / 10;
  };

  const overallEfficiency = getOverallEfficiency();

  const getThemeClass = () => {
    if (overallEfficiency === null) return 'theme-neutral';
    if (overallEfficiency < 60) return 'theme-red';
    if (overallEfficiency < 70) return 'theme-yellow';
    if (overallEfficiency < 90) return 'theme-neutral';
    return 'theme-green';
  };

  return (
    <div className={`App ${getThemeClass()}`}>
      <header className="scheduler-header">
        <h1>✅ Do it!</h1>
        <p>Organize and manage your tasks efficiently</p>
      </header>

      <div className="scheduler-container">
        <div className="stats-panel">
          <div className="stat-card efficiency-card">
            <span className="stat-value efficiency-value">{overallEfficiency ?? '-'}%</span>
            <span className="stat-label">Overall Efficiency</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
          <div className="stat-card completed">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        <TaskForm onAddTask={addTask} />

        <div className="filter-section">
          <div className="filter-controls">
            <div className="filter-group">
              <label>Status:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Priority:</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All</option>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                <option value="Self work">💼 Self work</option>
                <option value="Follow-up">📞 Follow-up</option>
                <option value="Take action">⚡ Take action</option>
              </select>
            </div>
          </div>
        </div>

        <TaskList
          tasks={filteredTasks}
          onDeleteTask={deleteTask}
          onToggleTask={toggleTask}
          calculateEfficiency={calculateEfficiency}
        />

        {filteredTasks.length === 0 && (
          <div className="empty-state">
            <p>No tasks match your filters. Create one to get started! 🚀</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
