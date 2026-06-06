import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Select,
  Button,
  Space,
  Radio,
  Tag,
  Spin,
  Empty,
  Tooltip,
  Typography,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  FundViewOutlined,
  FilterOutlined,
  ReloadOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import GanttChart, { GanttTask, ViewMode } from '../components/GanttChart';
import { milestoneApi } from '../api';

const { Option } = Select;
const { Title, Text } = Typography;

const statusOptions = [
  { value: 'planning', label: '计划中', color: 'blue' },
  { value: 'in_progress', label: '进行中', color: 'green' },
  { value: 'completed', label: '已完成', color: 'default' },
  { value: 'suspended', label: '已暂停', color: 'warning' },
  { value: 'cancelled', label: '已取消', color: 'default' },
];

const statusColors: Record<string, string> = {
  planning: '#1890ff',
  in_progress: '#52c41a',
  completed: '#8c8c8c',
  suspended: '#faad14',
  cancelled: '#bfbfbf',
};

const ProjectProgress: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [timeRange, setTimeRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(),
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>();

  const fetchGanttData = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await milestoneApi.getGanttData({
        status: statusFilter,
        department: departmentFilter,
      });
      setTasks(res?.experiments || []);
      setTimeRange({
        start: new Date(res?.timeRange?.start || Date.now()),
        end: new Date(res?.timeRange?.end || Date.now()),
      });
      setDepartments(res?.departments || []);
    } catch (err) {
      console.error('获取甘特图数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, departmentFilter]);

  useEffect(() => {
    fetchGanttData();
  }, [fetchGanttData]);

  const handleTaskClick = (task: GanttTask) => {
    navigate('/experiments');
  };

  const handleReset = () => {
    setStatusFilter(undefined);
    setDepartmentFilter(undefined);
  };

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    overdue: tasks.filter((t) =>
      t.milestones.some((m) => m.status === 'overdue'),
    ).length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Statistic
              title="项目总数"
              value={stats.total}
              prefix={<ExperimentOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="进行中"
              value={stats.inProgress}
              prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined style={{ color: '#8c8c8c' }} />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="有逾期里程碑"
              value={stats.overdue}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
        </Row>
      </Card>

      <Card
        style={{
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
        bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        title={
          <Space>
            <FundViewOutlined style={{ color: '#722ed1' }} />
            <span style={{ fontWeight: 600 }}>项目进度甘特图</span>
          </Space>
        }
        extra={
          <Space size="small">
            <Radio.Group
              size="small"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="day">日</Radio.Button>
              <Radio.Button value="week">周</Radio.Button>
              <Radio.Button value="month">月</Radio.Button>
            </Radio.Group>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={fetchGanttData}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Space size="small">
            <FilterOutlined style={{ color: '#999' }} />
            <Text type="secondary" style={{ fontSize: 13 }}>
              筛选：
            </Text>
          </Space>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 130 }}
            size="small"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
          >
            {statusOptions.map((o) => (
              <Option key={o.value} value={o.value}>
                <Tag color={o.color} style={{ margin: 0 }}>
                  {o.label}
                </Tag>
              </Option>
            ))}
          </Select>
          <Select
            placeholder="部门筛选"
            allowClear
            style={{ width: 160 }}
            size="small"
            value={departmentFilter}
            onChange={(v) => setDepartmentFilter(v)}
            showSearch
            optionFilterProp="children"
          >
            {departments.map((d) => (
              <Option key={d} value={d}>
                {d}
              </Option>
            ))}
          </Select>
          <Button size="small" onClick={handleReset}>
            重置
          </Button>

          <div style={{ flex: 1 }} />

          <Space size="small" style={{ fontSize: 12, color: '#999' }}>
            <span>状态说明：</span>
            {statusOptions.slice(0, 3).map((s) => (
              <span key={s.value} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: statusColors[s.value],
                  }}
                />
                {s.label}
              </span>
            ))}
          </Space>
        </div>

        <div style={{ flex: 1, minHeight: 400, padding: '0 16px 16px' }}>
          <Spin spinning={loading} tip="加载中...">
            {tasks.length === 0 && !loading ? (
              <div style={{ padding: '60px 0' }}>
                <Empty description="暂无实验项目数据" />
              </div>
            ) : (
              <GanttChart
                tasks={tasks}
                timeRange={timeRange}
                viewMode={viewMode}
                onTaskClick={handleTaskClick}
                statusColors={statusColors}
              />
            )}
          </Spin>
        </div>
      </Card>
    </div>
  );
};

export default ProjectProgress;
