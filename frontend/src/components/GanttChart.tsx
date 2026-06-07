import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Tooltip } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

export interface GanttMilestone {
  id: number;
  name: string;
  plannedDate: string | Date;
  actualDate?: string | Date | null;
  status: 'pending' | 'completed' | 'overdue';
  assignee?: string | null;
}

export interface GanttTask {
  id: number;
  name: string;
  projectCode: string;
  status: string;
  researcher?: string | null;
  department?: string | null;
  startDate: string | Date | null;
  endDate: string | Date | null;
  progressPercent: number;
  totalMilestones: number;
  completedMilestones: number;
  milestones: GanttMilestone[];
}

export type ViewMode = 'day' | 'week' | 'month';

interface GanttChartProps {
  tasks: GanttTask[];
  timeRange: { start: string | Date; end: string | Date };
  viewMode?: ViewMode;
  onTaskClick?: (task: GanttTask) => void;
  rowHeight?: number;
  sidebarWidth?: number;
  statusColors?: Record<string, string>;
}

const defaultStatusColors: Record<string, string> = {
  planning: '#1890ff',
  in_progress: '#52c41a',
  completed: '#8c8c8c',
  suspended: '#faad14',
  cancelled: '#bfbfbf',
};

const milestoneColors: Record<string, string> = {
  pending: '#faad14',
  completed: '#52c41a',
  overdue: '#ff4d4f',
};

const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  timeRange,
  viewMode = 'month',
  onTaskClick,
  rowHeight = 48,
  sidebarWidth = 240,
  statusColors = defaultStatusColors,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);
  const headerHeight = 60;

  const { startDate, endDate } = useMemo(() => {
    const start = dayjs(timeRange.start);
    const end = dayjs(timeRange.end);
    return { startDate: start, endDate: end };
  }, [timeRange]);

  const totalDays = useMemo(() => {
    return endDate.diff(startDate, 'day') + 1;
  }, [startDate, endDate]);

  const { columns, columnWidth } = useMemo(() => {
    const cols: { label: string; date: Dayjs; subLabel?: string }[] = [];

    if (viewMode === 'day') {
      const colW = Math.max(40, 600 / Math.max(totalDays, 10));
      let current = startDate.clone();
      while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
        cols.push({
          label: current.format('MM-DD'),
          subLabel: current.format('ddd'),
          date: current.clone(),
        });
        current = current.add(1, 'day');
      }
      return { columns: cols, columnWidth: colW };
    } else if (viewMode === 'week') {
      const colW = Math.max(60, 800 / Math.max(totalDays / 7, 5));
      let current = startDate.clone().startOf('week');
      while (current.isBefore(endDate)) {
        const weekStart = current.clone();
        const weekEnd = current.clone().add(6, 'day');
        cols.push({
          label: `第${current.isoWeek()}周`,
          subLabel: `${weekStart.format('MM/DD')}-${weekEnd.format('MM/DD')}`,
          date: weekStart,
        });
        current = current.add(1, 'week');
      }
      return { columns: cols, columnWidth: colW };
    } else {
      const colW = Math.max(80, 800 / Math.max(totalDays / 30, 3));
      let current = startDate.clone().startOf('month');
      while (current.isBefore(endDate)) {
        cols.push({
          label: current.format('YYYY年MM月'),
          subLabel: `${current.daysInMonth()}天`,
          date: current.clone(),
        });
        current = current.add(1, 'month');
      }
      return { columns: cols, columnWidth: colW };
    }
  }, [startDate, endDate, viewMode, totalDays]);

  const totalWidth = useMemo(() => {
    if (viewMode === 'day') {
      return totalDays * columnWidth;
    } else if (viewMode === 'week') {
      return columns.length * columnWidth;
    } else {
      return columns.length * columnWidth;
    }
  }, [totalDays, columns.length, columnWidth, viewMode]);

  const getDatePosition = useCallback(
    (date: string | Date | null): number => {
      if (!date) return 0;
      const d = dayjs(date);
      const diff = d.diff(startDate, 'day');
      if (viewMode === 'day') {
        return diff * columnWidth + columnWidth / 2;
      } else if (viewMode === 'week') {
        const weekDiff = d.diff(startDate.startOf('week'), 'week');
        return Math.max(0, weekDiff * columnWidth + columnWidth / 2);
      } else {
        const monthStart = startDate.startOf('month');
        let position = 0;
        let current = monthStart.clone();
        while (current.isBefore(d.startOf('month'))) {
          position += columnWidth;
          current = current.add(1, 'month');
        }
        const dayOfMonth = d.date() - 1;
        const daysInMonth = d.daysInMonth();
        position += (dayOfMonth / daysInMonth) * columnWidth;
        return position;
      }
    },
    [startDate, columnWidth, viewMode],
  );

  const getTaskWidth = useCallback(
    (start: string | Date | null, end: string | Date | null): number => {
      if (!start || !end) return 0;
      const startPos = getDatePosition(start);
      const endPos = getDatePosition(end);
      return Math.max(endPos - startPos, columnWidth * 0.3);
    },
    [getDatePosition, columnWidth],
  );

  const visibleRowCount = Math.ceil(containerHeight / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
  const endIndex = Math.min(tasks.length, startIndex + visibleRowCount + 5);

  const visibleTasks = useMemo(() => {
    return tasks.slice(startIndex, endIndex).map((task, idx) => ({
      ...task,
      index: startIndex + idx,
    }));
  }, [tasks, startIndex, endIndex]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
    if (sidebarRef.current) {
      sidebarRef.current.scrollTop = target.scrollTop;
    }
  }, []);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const h = containerRef.current.clientHeight - headerHeight;
        setContainerHeight(Math.max(300, h));
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const todayPosition = useMemo(() => getDatePosition(dayjs().toDate()), [getDatePosition]);

  const renderTaskTooltip = (task: GanttTask) => (
    <div style={{ maxWidth: 320 }}>
      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
        {task.name}
      </div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
        项目编号：{task.projectCode}
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 12, marginBottom: 8 }}>
        <div>开始：{task.startDate ? dayjs(task.startDate).format('YYYY-MM-DD') : '-'}</div>
        <div>结束：{task.endDate ? dayjs(task.endDate).format('YYYY-MM-DD') : '-'}</div>
      </div>
      <div style={{ fontSize: 12, marginBottom: 4 }}>
        进度：{task.progressPercent}%（{task.completedMilestones}/{task.totalMilestones} 个里程碑）
      </div>
      <div style={{ fontSize: 12 }}>负责人：{task.researcher || '-'}</div>
    </div>
  );

  const renderMilestoneTooltip = (milestone: GanttMilestone) => (
    <div style={{ maxWidth: 240 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{milestone.name}</div>
      <div style={{ fontSize: 12, marginBottom: 4 }}>
        计划日期：{dayjs(milestone.plannedDate).format('YYYY-MM-DD')}
      </div>
      {milestone.actualDate && (
        <div style={{ fontSize: 12, marginBottom: 4 }}>
          实际日期：{dayjs(milestone.actualDate).format('YYYY-MM-DD')}
        </div>
      )}
      <div style={{ fontSize: 12 }}>负责人：{milestone.assignee || '-'}</div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        border: '1px solid #e8e8e8',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', borderBottom: '1px solid #e8e8e8' }}>
        <div
          style={{
            width: sidebarWidth,
            minWidth: sidebarWidth,
            flexShrink: 0,
            height: headerHeight,
            background: '#fafafa',
            borderRight: '1px solid #e8e8e8',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            fontWeight: 600,
            fontSize: 13,
            color: '#333',
          }}
        >
          实验项目
        </div>
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            height: headerHeight,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: totalWidth,
              height: '100%',
            }}
          >
            {columns.map((col, idx) => (
              <div
                key={idx}
                style={{
                  width: columnWidth,
                  minWidth: columnWidth,
                  borderRight: '1px solid #f0f0f0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fafafa',
                  fontSize: 12,
                  color: '#333',
                  fontWeight: 500,
                }}
              >
                <div style={{ fontWeight: 600 }}>{col.label}</div>
                {col.subLabel && (
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                    {col.subLabel}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div
          ref={sidebarRef}
          style={{
            width: sidebarWidth,
            minWidth: sidebarWidth,
            flexShrink: 0,
            overflow: 'hidden',
            borderRight: '1px solid #e8e8e8',
            background: '#fff',
          }}
        >
          <div style={{ height: tasks.length * rowHeight, position: 'relative' }}>
            {visibleTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  position: 'absolute',
                  top: task.index * rowHeight,
                  left: 0,
                  right: 0,
                  height: rowHeight,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  borderBottom: '1px solid #f5f5f5',
                  cursor: onTaskClick ? 'pointer' : 'default',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                onClick={() => onTaskClick?.(task)}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: statusColors[task.status] || '#1890ff',
                    marginRight: 10,
                    flexShrink: 0,
                  }}
                />
                <Tooltip title={task.name}>
                  <span
                    style={{
                      fontSize: 13,
                      color: '#333',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {task.name}
                  </span>
                </Tooltip>
              </div>
            ))}
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          style={{
            flex: 1,
            overflow: 'auto',
            position: 'relative',
          }}
          onScroll={handleScroll}
        >
          <div
            style={{
              width: totalWidth,
              height: tasks.length * rowHeight,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: todayPosition,
                bottom: 0,
                width: 2,
                background: '#ff4d4f',
                zIndex: 3,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -2,
                  left: -18,
                  fontSize: 10,
                  background: '#ff4d4f',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                今天
              </div>
            </div>

            {columns.map((col, idx) => (
              <div
                key={`grid-${idx}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: idx * columnWidth,
                  width: columnWidth,
                  height: '100%',
                  borderRight: '1px solid #f5f5f5',
                  pointerEvents: 'none',
                }}
              />
            ))}

            {visibleTasks.map((task) => {
              const taskLeft = getDatePosition(task.startDate);
              const taskWidth = getTaskWidth(task.startDate, task.endDate);
              const barHeight = 24;
              const barTop = (rowHeight - barHeight) / 2;

              if (!task.startDate || !task.endDate) {
                return null;
              }

              return (
                <div
                  key={`task-${task.id}`}
                  style={{
                    position: 'absolute',
                    top: task.index * rowHeight,
                    left: 0,
                    right: 0,
                    height: rowHeight,
                    borderBottom: '1px solid #fafafa',
                  }}
                >
                  <Tooltip title={renderTaskTooltip(task)} mouseEnterDelay={0.3}>
                    <div
                      style={{
                        position: 'absolute',
                        top: barTop,
                        left: taskLeft,
                        width: taskWidth,
                        height: barHeight,
                        background: statusColors[task.status] || '#1890ff',
                        borderRadius: 4,
                        cursor: onTaskClick ? 'pointer' : 'default',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        overflow: 'hidden',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick?.(task);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scaleY(1.1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scaleY(1)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${task.progressPercent}%`,
                          background: 'rgba(255,255,255,0.3)',
                          transition: 'width 0.3s',
                        }}
                      />
                      {taskWidth > 80 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 8,
                            right: 8,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: 11,
                            color: '#fff',
                            fontWeight: 500,
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {task.progressPercent}%
                        </div>
                      )}
                    </div>
                  </Tooltip>

                  {task.milestones.map((milestone) => {
                    const msPos = getDatePosition(
                      milestone.status === 'completed' && milestone.actualDate
                        ? milestone.actualDate
                        : milestone.plannedDate,
                    );
                    const msColor = milestoneColors[milestone.status] || '#faad14';
                    const msSize = 12;
                    const msTop = (rowHeight - msSize) / 2;

                    return (
                      <Tooltip
                        key={`ms-${milestone.id}`}
                        title={renderMilestoneTooltip(milestone)}
                        mouseEnterDelay={0.3}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: msTop,
                            left: msPos - msSize / 2,
                            width: msSize,
                            height: msSize,
                            background: msColor,
                            transform: 'rotate(45deg)',
                            cursor: 'pointer',
                            border: '2px solid #fff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            zIndex: 2,
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
