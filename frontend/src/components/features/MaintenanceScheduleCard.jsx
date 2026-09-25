import React from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    Clock,
    Wrench as Tool,
    AlertCircle,
    CheckCircle,
    ChevronRight
} from 'lucide-react';

/**
 * MaintenanceScheduleCard Component
 * 
 * Displays the generated maintenance schedule.
 * Features:
 * - Calendar-style task list
 * - Priority indicators
 * - Estimated duration
 * - Tools required
 */

const MaintenanceScheduleCard = ({ schedule = [], isLoading = false }) => {
    if (isLoading) {
        return (
            <div className="glass-panel p-6 rounded-2xl animate-pulse">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!schedule || schedule.length === 0) {
        return (
            <div className="glass-panel p-6 rounded-2xl text-center">
                <Calendar size={48} className="mx-auto text-slate-600 dark:text-gray-400 mb-4" />
                <p className="text-slate-500 dark:text-gray-500 dark:text-gray-400">
                    No maintenance schedule available
                </p>
                <p className="text-sm text-slate-600 dark:text-gray-400 dark:text-gray-500 mt-2">
                    Analyze equipment to generate a schedule
                </p>
            </div>
        );
    }

    // Priority color mapping
    const getPriorityStyles = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return {
                    bg: 'bg-red-100 dark:bg-red-900/30',
                    text: 'text-red-600 dark:text-red-400',
                    border: 'border-l-red-500',
                    badge: 'bg-red-500'
                };
            case 'high':
                return {
                    bg: 'bg-orange-100 dark:bg-orange-900/30',
                    text: 'text-orange-600 dark:text-orange-400',
                    border: 'border-l-orange-500',
                    badge: 'bg-orange-500'
                };
            case 'medium':
                return {
                    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
                    text: 'text-yellow-600 dark:text-yellow-400',
                    border: 'border-l-yellow-500',
                    badge: 'bg-yellow-500'
                };
            case 'low':
                return {
                    bg: 'bg-green-100 dark:bg-green-900/30',
                    text: 'text-green-600 dark:text-green-400',
                    border: 'border-l-green-500',
                    badge: 'bg-green-500'
                };
            default:
                return {
                    bg: 'bg-gray-100 dark:bg-gray-800',
                    text: 'text-gray-600 dark:text-gray-400',
                    border: 'border-l-gray-500',
                    badge: 'bg-gray-500'
                };
        }
    };

    // Difficulty badge
    const getDifficultyBadge = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy':
                return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Easy</span>;
            case 'moderate':
                return <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">Moderate</span>;
            case 'difficult':
                return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">Difficult</span>;
            default:
                return null;
        }
    };

    // Format date
    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-IN', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    // Group by upcoming/later
    const today = new Date();
    const upcomingTasks = schedule.filter(task => {
        const taskDate = new Date(task.scheduled_date);
        return taskDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    });
    const laterTasks = schedule.filter(task => {
        const taskDate = new Date(task.scheduled_date);
        return taskDate > new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <Calendar size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                            Maintenance Schedule
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-gray-500 dark:text-gray-400">
                            {schedule.length} tasks scheduled
                        </p>
                    </div>
                </div>
            </div>

            {/* Upcoming Tasks (This Week) */}
            {upcomingTasks.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <AlertCircle size={14} />
                        This Week
                    </h4>
                    <div className="space-y-3">
                        {upcomingTasks.map((task, index) => {
                            const styles = getPriorityStyles(task.priority);
                            return (
                                <motion.div
                                    key={task.task_id || index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`p-4 rounded-xl border-l-4 ${styles.bg} ${styles.border}`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h5 className="font-semibold text-gray-800 dark:text-white">
                                            {task.task_name}
                                        </h5>
                                        <div className={`w-2 h-2 rounded-full ${styles.badge}`} />
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        {task.description}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-3 text-xs">
                                        <span className="flex items-center gap-1 text-slate-500 dark:text-gray-500 dark:text-gray-400">
                                            <Calendar size={12} />
                                            {formatDate(task.scheduled_date)}
                                        </span>
                                        <span className="flex items-center gap-1 text-slate-500 dark:text-gray-500 dark:text-gray-400">
                                            <Clock size={12} />
                                            {task.estimated_duration}
                                        </span>
                                        {getDifficultyBadge(task.difficulty)}
                                    </div>

                                    {task.tools_required && task.tools_required.length > 0 && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <Tool size={12} className="text-slate-600 dark:text-gray-400" />
                                            <span className="text-xs text-slate-500 dark:text-gray-500 dark:text-gray-400">
                                                {task.tools_required.slice(0, 3).join(', ')}
                                                {task.tools_required.length > 3 && ` +${task.tools_required.length - 3} more`}
                                            </span>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Later Tasks */}
            {laterTasks.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <CheckCircle size={14} />
                        Upcoming
                    </h4>
                    <div className="space-y-2">
                        {laterTasks.slice(0, 5).map((task, index) => {
                            const styles = getPriorityStyles(task.priority);
                            return (
                                <motion.div
                                    key={task.task_id || index}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 + index * 0.05 }}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${styles.badge}`} />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                                                {task.task_name}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-gray-500 dark:text-gray-400">
                                                {formatDate(task.scheduled_date)}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-600 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                </motion.div>
                            );
                        })}

                        {laterTasks.length > 5 && (
                            <p className="text-xs text-slate-500 dark:text-gray-500 dark:text-gray-400 text-center mt-2">
                                +{laterTasks.length - 5} more tasks scheduled
                            </p>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default MaintenanceScheduleCard;
