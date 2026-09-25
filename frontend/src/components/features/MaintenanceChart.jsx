import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Wrench, AlertCircle } from 'lucide-react';

/**
 * MaintenanceChart Component
 * 
 * Calendar-style view showing maintenance schedule.
 * Uses actual maintenance schedule from analysis or shows default intervals.
 */

const PRIORITY_COLORS = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
    default: 'bg-blue-500'
};

const MaintenanceChart = ({ lastMaintenanceDate, maintenanceSchedule = [] }) => {
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    const today = useMemo(() => new Date(), []);
    const lastDate = useMemo(
        () => (lastMaintenanceDate ? new Date(lastMaintenanceDate) : today),
        [lastMaintenanceDate, today]
    );
    const hasLastMaintenanceDate = Boolean(lastMaintenanceDate);

    // Color palette for different task priorities
    // Parse schedule dates from backend or generate defaults
    const scheduledDates = useMemo(() => {
        const dates = {};

        if (maintenanceSchedule && maintenanceSchedule.length > 0) {
            // Use actual schedule from backend
            maintenanceSchedule.forEach(task => {
                if (task.scheduled_date) {
                    const taskDate = new Date(task.scheduled_date);
                    const key = taskDate.toISOString().split('T')[0];
                    if (!dates[key]) dates[key] = [];
                    dates[key].push({
                        name: task.task_name,
                        priority: task.priority?.toLowerCase() || 'medium',
                        color: PRIORITY_COLORS[task.priority?.toLowerCase()] || PRIORITY_COLORS.default
                    });
                }
            });
        } else {
            // Generate default maintenance schedule based on last maintenance
            const defaultTasks = [
                { name: 'Oil Check', daysFromLast: 15, priority: 'medium' },
                { name: 'Filter Clean', daysFromLast: 30, priority: 'medium' },
                { name: 'Belt Inspection', daysFromLast: 45, priority: 'low' },
                { name: 'Full Service', daysFromLast: 90, priority: 'high' },
            ];

            defaultTasks.forEach(task => {
                const taskDate = new Date(lastDate);
                taskDate.setDate(taskDate.getDate() + task.daysFromLast);
                const key = taskDate.toISOString().split('T')[0];
                if (!dates[key]) dates[key] = [];
                dates[key].push({
                    name: task.name,
                    priority: task.priority,
                    color: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.default
                });
            });
        }

        return dates;
    }, [lastDate, maintenanceSchedule]);

    // Get unique task types for legend
    const legendItems = useMemo(() => {
        const items = new Map();
        Object.values(scheduledDates).flat().forEach(task => {
            if (!items.has(task.name)) {
                items.set(task.name, task.color);
            }
        });
        return Array.from(items.entries());
    }, [scheduledDates]);

    // Get days in month
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        return { daysInMonth, startingDay, year, month };
    };

    const { daysInMonth, startingDay, year, month } = getDaysInMonth(currentMonth);

    // Navigate months
    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    // Check if a date has maintenance
    const getMaintenanceForDate = (day) => {
        const dateKey = new Date(year, month, day).toISOString().split('T')[0];
        return scheduledDates[dateKey] || [];
    };

    // Check if date is today
    const isToday = (day) => {
        return today.getDate() === day &&
            today.getMonth() === month &&
            today.getFullYear() === year;
    };

    // Check if date is the last maintenance date
    const isLastMaintenance = (day) => {
        if (!hasLastMaintenanceDate) return false;
        return lastDate.getDate() === day &&
            lastDate.getMonth() === month &&
            lastDate.getFullYear() === year;
    };

    // Check if date is past
    const isPast = (day) => {
        const date = new Date(year, month, day);
        return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    };

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    // Count upcoming tasks
    const upcomingCount = Object.keys(scheduledDates).filter(dateKey => {
        const d = new Date(dateKey);
        return d >= today;
    }).length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <Calendar size={24} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                            Maintenance Calendar
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-gray-500 dark:text-gray-400">
                            {upcomingCount} upcoming task{upcomingCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Last maintenance badge */}
                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                        {hasLastMaintenanceDate
                            ? `Last: ${lastDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                            : 'Last: Not provided'}
                    </span>
                </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
                <h4 className="font-semibold text-gray-800 dark:text-white">
                    {monthNames[month]} {year}
                </h4>
                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-slate-500 dark:text-gray-500 dark:text-gray-400 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: startingDay }, (_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const maintenance = getMaintenanceForDate(day);
                    const isTodayDate = isToday(day);
                    const wasLastMaintenance = isLastMaintenance(day);
                    const isPastDate = isPast(day);

                    return (
                        <div
                            key={day}
                            className={`
                                aspect-square p-1 rounded-lg relative flex flex-col items-center justify-center cursor-default
                                ${isTodayDate ? 'bg-organic-green/20 ring-2 ring-organic-green' : ''}
                                ${wasLastMaintenance ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                                ${isPastDate && !wasLastMaintenance && !isTodayDate ? 'opacity-40' : ''}
                                ${maintenance.length > 0 && !isPastDate ? 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30' : ''}
                            `}
                            title={maintenance.length > 0 ? maintenance.map(m => m.name).join(', ') : ''}
                        >
                            <span className={`text-sm ${isTodayDate ? 'font-bold text-organic-green' : 'text-gray-700 dark:text-gray-300'}`}>
                                {day}
                            </span>

                            {/* Maintenance indicators */}
                            {maintenance.length > 0 && (
                                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                                    {maintenance.slice(0, 3).map((m, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-2 h-2 rounded-full ${m.color}`}
                                        />
                                    ))}
                                    {maintenance.length > 3 && (
                                        <span className="text-[8px] text-slate-500 dark:text-gray-500">+{maintenance.length - 3}</span>
                                    )}
                                </div>
                            )}

                            {/* Last maintenance icon */}
                            {wasLastMaintenance && (
                                <Wrench size={10} className="text-blue-500 absolute bottom-0.5" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            {legendItems.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-slate-500 dark:text-gray-500 dark:text-gray-400 mb-2">Scheduled tasks:</p>
                    <div className="flex flex-wrap gap-3 text-xs">
                        {legendItems.slice(0, 4).map(([name, color]) => (
                            <div key={name} className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                                <span className="text-gray-600 dark:text-gray-400">{name}</span>
                            </div>
                        ))}
                        {legendItems.length > 4 && (
                            <span className="text-slate-500 dark:text-gray-500">+{legendItems.length - 4} more</span>
                        )}
                    </div>
                </div>
            )}

            {/* Tip */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-2">
                <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                    Navigate to future months to see upcoming maintenance dates
                </p>
            </div>
        </motion.div>
    );
};

export default MaintenanceChart;
