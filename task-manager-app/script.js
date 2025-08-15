class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.currentPriorityFilter = null;
        this.initializeElements();
        this.bindEvents();
        this.render();
    }

    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.tasksList = document.getElementById('tasksList');
        this.emptyState = document.getElementById('emptyState');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.priorityFilters = document.querySelectorAll('.priority-filter');
        this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');
    }

    bindEvents() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        this.priorityFilters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setPriorityFilter(e.target.dataset.priority);
            });
        });

        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());

        // Make stat cards clickable
        this.completedTasksEl.parentElement.addEventListener('click', () => {
            this.setFilter('completed');
            this.showNotification('Showing completed tasks', 'info');
        });

        this.pendingTasksEl.parentElement.addEventListener('click', () => {
            this.setFilter('pending');
            this.showNotification('Showing pending tasks', 'info');
        });

        this.totalTasksEl.parentElement.addEventListener('click', () => {
            this.setFilter('all');
            this.showNotification('Showing all tasks', 'info');
        });
    }

    addTask() {
        const text = this.taskInput.value.trim();
        if (!text) return;

        const task = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            priority: this.prioritySelect.value,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.taskInput.value = '';
        this.render();
        this.showNotification('Task added successfully!', 'success');
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.render();
            this.showNotification(
                task.completed ? 'Task completed!' : 'Task marked as pending',
                task.completed ? 'success' : 'info'
            );
        }
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.render();
            this.showNotification('Task deleted!', 'warning');
        }
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const newText = prompt('Edit task:', task.text);
        if (newText !== null && newText.trim()) {
            task.text = newText.trim();
            task.editedAt = new Date().toISOString();
            this.saveTasks();
            this.render();
            this.showNotification('Task updated!', 'success');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    setPriorityFilter(priority) {
        if (this.currentPriorityFilter === priority) {
            this.currentPriorityFilter = null;
            this.priorityFilters.forEach(btn => btn.classList.remove('active'));
        } else {
            this.currentPriorityFilter = priority;
            this.priorityFilters.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.priority === priority);
            });
        }
        this.render();
    }

    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear!', 'info');
            return;
        }

        if (confirm(`Delete ${completedCount} completed task${completedCount > 1 ? 's' : ''}?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.render();
            this.showNotification(`${completedCount} completed task${completedCount > 1 ? 's' : ''} deleted!`, 'success');
        }
    }

    clearAll() {
        if (this.tasks.length === 0) {
            this.showNotification('No tasks to clear!', 'info');
            return;
        }

        if (confirm(`Delete all ${this.tasks.length} tasks? This cannot be undone.`)) {
            this.tasks = [];
            this.saveTasks();
            this.render();
            this.showNotification('All tasks cleared!', 'warning');
        }
    }

    getFilteredTasks() {
        let filtered = [...this.tasks];

        // Apply status filter
        if (this.currentFilter === 'completed') {
            filtered = filtered.filter(t => t.completed);
        } else if (this.currentFilter === 'pending') {
            filtered = filtered.filter(t => !t.completed);
        }

        // Apply priority filter
        if (this.currentPriorityFilter) {
            filtered = filtered.filter(t => t.priority === this.currentPriorityFilter);
        }

        return filtered;
    }

    render() {
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.tasksList.style.display = 'none';
            this.emptyState.style.display = 'block';
        } else {
            this.tasksList.style.display = 'block';
            this.emptyState.style.display = 'none';
            
            this.tasksList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
            
            // Bind task-specific events
            filteredTasks.forEach(task => {
                const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
                if (taskElement) {
                    taskElement.querySelector('.complete-btn').addEventListener('click', () => this.toggleTask(task.id));
                    taskElement.querySelector('.delete-btn').addEventListener('click', () => this.deleteTask(task.id));
                    taskElement.querySelector('.edit-btn').addEventListener('click', () => this.editTask(task.id));
                }
            });
        }

        this.updateStats();
        this.updateStatCardStyles();
    }

    createTaskHTML(task) {
        const createdDate = new Date(task.createdAt).toLocaleDateString();
        const createdTime = new Date(task.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    <span class="task-priority ${task.priority}">${task.priority}</span>
                </div>
                <div class="task-actions">
                    <button class="task-btn complete-btn">
                        <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                        ${task.completed ? 'Undo' : 'Complete'}
                    </button>
                    <button class="task-btn edit-btn">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="task-btn delete-btn">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
                <div class="task-timestamp">
                    Created: ${createdDate} at ${createdTime}
                    ${task.completedAt ? `<br>Completed: ${new Date(task.completedAt).toLocaleDateString()} at ${new Date(task.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : ''}
                    ${task.editedAt ? `<br>Last edited: ${new Date(task.editedAt).toLocaleDateString()} at ${new Date(task.editedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : ''}
                </div>
            </div>
        `;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;

        this.totalTasksEl.textContent = total;
        this.completedTasksEl.textContent = completed;
        this.pendingTasksEl.textContent = pending;
    }

    updateStatCardStyles() {
        // Add clickable class to all stat cards
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            card.classList.add('clickable');
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: this.getNotificationColor(type),
            color: 'white',
            padding: '15px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: '1000',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: '500',
            animation: 'slideInRight 0.3s ease',
            maxWidth: '300px'
        });

        // Add animation keyframes if not already added
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    getNotificationColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        return colors[type] || colors.info;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTasks() {
        localStorage.setItem('taskManager_tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        try {
            const saved = localStorage.getItem('taskManager_tasks');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading tasks from localStorage:', error);
            return [];
        }
    }
}

// Initialize the task manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
    
    // Add some sample tasks for demonstration (only if no tasks exist)
    if (window.taskManager.tasks.length === 0) {
        const sampleTasks = [
            { text: 'Welcome to your Personal Task Manager!', priority: 'high' },
            { text: 'Try adding a new task above', priority: 'medium' },
            { text: 'Click the complete button to mark tasks as done', priority: 'low' },
            { text: 'Use filters to organize your view', priority: 'medium' }
        ];
        
        sampleTasks.forEach((task, index) => {
            setTimeout(() => {
                window.taskManager.taskInput.value = task.text;
                window.taskManager.prioritySelect.value = task.priority;
                window.taskManager.addTask();
            }, index * 500);
        });
    }
});
