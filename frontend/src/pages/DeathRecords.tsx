import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Select, Modal, message, Popconfirm, Tooltip, Typography,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  EyeOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { deathRecordApi, animalApi } from '../api';

const { Option } = Select;

const causeCategoryOptions = [
  { value: 'natural', label: '自然死亡', color: 'default' },
  { value: 'experiment_termination', label: '实验终止', color: 'processing' },
  { value: 'accidental', label: '意外死亡', color: 'warning' },
  { value: 'euthanasia', label: '安乐死', color: 'error' },
];

const disposalMethodOptions = [
  { value: 'necropsy', label: '尸检', color: 'processing' },
  { value: 'incineration', label: '焚化', color: 'default' },
  { value: 'cryopreservation', label: '冷冻保存', color: 'blue' },
];

const necropsyStatusOptions = [
  { value: 'not_needed', label: '无需尸检', color: 'default' },
  { value: 'pending', label: '待尸检', color: 'warning' },
  { value: 'completed', label: '已完成', color: 'success' },
];

const DeathRecords: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [animalFilter, setAnimalFilter] = useState<number | undefined>();
  const [causeFilter, setCauseFilter] = useState<string | undefined>();
  const [disposalFilter, setDisposalFilter] = useState<string | undefined>();
  const [necropsyFilter, setNecropsyFilter] = useState<string | undefined>();
  const [animals, setAnimals] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await deathRecordApi.getList({
        page, pageSize,
        animalId: animalFilter,
        causeCategory: causeFilter,
        disposalMethod: disposalFilter,
        necropsyStatus: necropsyFilter,
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, animalFilter, causeFilter, disposalFilter, necropsyFilter]);

  const fetchAnimals = async () => {
    try {
      const res: any = await animalApi.getList({ page: 1, pageSize: 200 });
      setAnimals(res?.list || []);
    } catch {
      // handled
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchAnimals(); }, []);

  const handleAdd = () => {
    navigate('/death-records/new');
  };

  const handleEdit = (record: any) => {
    navigate(`/death-records/${record.id}/edit`);
  };

  const handleDelete = async (id: number) => {
    try {
      await deathRecordApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch {
      // handled
    }
  };

  const handleViewDetail = (record: any) => {
    navigate(`/death-records/${record.id}`);
  };

  const handleViewNecropsy = (record: any) => {
    if (record.necropsyReport) {
      navigate(`/necropsy-reports/${record.necropsyReport.id}`);
    }
  };

  const columns = [
    {
      title: '动物编号',
      key: 'animalName',
      width: 120,
      render: (_: any, record: any) => (
        <Typography.Text strong>{record.animal?.name || `#${record.animalId}`}</Typography.Text>
      ),
    },
    {
      title: '物种',
      key: 'species',
      width: 80,
      render: (_: any, record: any) => record.animal?.species || '-',
    },
    {
      title: '死亡时间',
      dataIndex: 'deathDatetime',
      key: 'deathDatetime',
      width: 160,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '死亡原因',
      dataIndex: 'causeCategory',
      key: 'causeCategory',
      width: 110,
      render: (c: string) => {
        const opt = causeCategoryOptions.find(o => o.value === c);
        return <Tag color={opt?.color}>{opt?.label || c}</Tag>;
      },
    },
    {
      title: '发现人',
      dataIndex: 'foundBy',
      key: 'foundBy',
      width: 80,
      render: (v: string) => v || '-',
    },
    {
      title: '确认兽医',
      dataIndex: 'confirmingVet',
      key: 'confirmingVet',
      width: 90,
      render: (v: string) => v || '-',
    },
    {
      title: '处置方式',
      dataIndex: 'disposalMethod',
      key: 'disposalMethod',
      width: 100,
      render: (m: string) => {
        const opt = disposalMethodOptions.find(o => o.value === m);
        return <Tag color={opt?.color}>{opt?.label || m}</Tag>;
      },
    },
    {
      title: '尸检状态',
      dataIndex: 'necropsyStatus',
      key: 'necropsyStatus',
      width: 100,
      render: (s: string) => {
        const opt = necropsyStatusOptions.find(o => o.value === s);
        return <Tag color={opt?.color}>{opt?.label || s}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          {record.necropsyReport && (
            <Tooltip title="查看尸检报告">
              <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => handleViewNecropsy(record)} />
            </Tooltip>
          )}
          <Popconfirm title="确定删除该死亡记录吗？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Tooltip title="删除">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        title={
          <Space>
            <FileTextOutlined style={{ color: '#6b7280' }} />
            <span style={{ fontWeight: 600 }}>死亡记录管理</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            登记死亡
          </Button>
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Select
            placeholder="选择动物"
            allowClear
            showSearch
            optionFilterProp="children"
            style={{ width: 180 }}
            value={animalFilter}
            onChange={(v) => { setAnimalFilter(v); setPage(1); }}
          >
            {animals.map(a => <Option key={a.id} value={a.id}>{a.name} ({a.species})</Option>)}
          </Select>
          <Select
            placeholder="死亡原因"
            allowClear
            style={{ width: 140 }}
            value={causeFilter}
            onChange={(v) => { setCauseFilter(v); setPage(1); }}
          >
            {causeCategoryOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
          </Select>
          <Select
            placeholder="处置方式"
            allowClear
            style={{ width: 130 }}
            value={disposalFilter}
            onChange={(v) => { setDisposalFilter(v); setPage(1); }}
          >
            {disposalMethodOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
          </Select>
          <Select
            placeholder="尸检状态"
            allowClear
            style={{ width: 130 }}
            value={necropsyFilter}
            onChange={(v) => { setNecropsyFilter(v); setPage(1); }}
          >
            {necropsyStatusOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => {
            setAnimalFilter(undefined);
            setCauseFilter(undefined);
            setDisposalFilter(undefined);
            setNecropsyFilter(undefined);
            setPage(1);
          }}>
            重置
          </Button>
        </div>

        <Table
          loading={loading}
          dataSource={data}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>
    </div>
  );
};

export default DeathRecords;
