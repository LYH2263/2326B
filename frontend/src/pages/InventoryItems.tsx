import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Form,
  Modal,
  InputNumber,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Typography,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ImportOutlined,
  ExportOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { inventoryApi } from '../api';
import dayjs from 'dayjs';
import InventoryTransactionModal from '../components/InventoryTransactionModal';

const { Option } = Select;
const { Text } = Typography;

const categoryMap: Record<string, { label: string; color: string }> = {
  drug: { label: '药品', color: 'blue' },
  consumable: { label: '耗材', color: 'green' },
  reagent: { label: '试剂', color: 'orange' },
  equipment: { label: '设备', color: 'purple' },
};

const InventoryItems: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchForm] = Form.useForm();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editForm] = Form.useForm();
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'in' | 'out' | 'adjust'>('in');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: searchParams.get('keyword') || undefined,
        category: searchParams.get('category') || undefined,
        supplier: searchParams.get('supplier') || undefined,
        warningOnly: searchParams.get('warningOnly') || undefined,
      };
      const res: any = await inventoryApi.getItems(params);
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch (error) {
      console.error('Failed to fetch inventory items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchParams]);

  useEffect(() => {
    const category = searchParams.get('category');
    const keyword = searchParams.get('keyword');
    if (category || keyword) {
      searchForm.setFieldsValue({
        category: category || undefined,
        keyword: keyword || undefined,
      });
    }
  }, []);

  const handleSearch = (values: any) => {
    const newParams: any = {};
    if (values.keyword) newParams.keyword = values.keyword;
    if (values.category) newParams.category = values.category;
    if (values.supplier) newParams.supplier = values.supplier;
    if (values.warningOnly) newParams.warningOnly = values.warningOnly;
    setSearchParams(newParams);
    setPagination({ ...pagination, current: 1 });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({});
    setPagination({ ...pagination, current: 1 });
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    editForm.setFieldsValue({
      ...item,
      expiryDate: item.expiryDate ? dayjs(item.expiryDate) : undefined,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      const data = {
        ...values,
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : undefined,
      };
      if (editItem?.id) {
        await inventoryApi.updateItem(editItem.id, data);
        message.success('更新成功');
      } else {
        await inventoryApi.createItem(data);
        message.success('创建成功');
      }
      setEditModalOpen(false);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await inventoryApi.deleteItem(id);
      message.success('删除成功');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleTransaction = (type: 'in' | 'out' | 'adjust', itemId?: number) => {
    setTransactionType(type);
    if (itemId) {
      setSelectedItemId(itemId);
    } else {
      setSelectedItemId(null);
    }
    setTransactionModalOpen(true);
  };

  const handleTransactionSuccess = () => {
    fetchData();
  };

  const isLowStock = (item: any) => {
    return Number(item.currentQuantity) <= Number(item.safetyStock);
  };

  const isExpiringSoon = (item: any) => {
    if (!item.expiryDate) return false;
    const daysLeft = dayjs(item.expiryDate).diff(dayjs(), 'day');
    return daysLeft <= 30;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '物品名称',
      dataIndex: 'name',
      render: (text: string, record: any) => (
        <a onClick={() => navigate(`/inventory/items/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '类别',
      dataIndex: 'category',
      width: 100,
      render: (cat: string) => {
        const cfg = categoryMap[cat] || { label: cat, color: 'default' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: '规格',
      dataIndex: 'specification',
      width: 140,
      render: (text: string) => text || '-',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      width: 60,
    },
    {
      title: '当前库存',
      dataIndex: 'currentQuantity',
      width: 110,
      render: (qty: number, record: any) => {
        const low = isLowStock(record);
        return (
          <Text strong style={{ color: low ? '#ff4d4f' : '#333' }}>
            {qty} {record.unit}
            {low && <WarningOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} />}
          </Text>
        );
      },
    },
    {
      title: '安全库存',
      dataIndex: 'safetyStock',
      width: 100,
      render: (qty: number, record: any) => `${qty} ${record.unit}`,
    },
    {
      title: '有效期',
      dataIndex: 'expiryDate',
      width: 120,
      render: (date: string, record: any) => {
        if (!date) return '-';
        const expiring = isExpiringSoon(record);
        const isExpired = dayjs(date).isBefore(dayjs());
        return (
          <Tag color={isExpired ? 'red' : expiring ? 'orange' : 'default'}>
            {dayjs(date).format('YYYY-MM-DD')}
          </Tag>
        );
      },
    },
    {
      title: '存储位置',
      dataIndex: 'storageLocation',
      width: 140,
      render: (text: string) => text || '-',
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/inventory/items/${record.id}`)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<ImportOutlined />} onClick={() => handleTransaction('in', record.id)}>
            入库
          </Button>
          <Button type="link" size="small" icon={<ExportOutlined />} onClick={() => handleTransaction('out', record.id)}>
            出库
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该物品吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="搜索">
            <Input placeholder="物品名称" prefix={<SearchOutlined />} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="category" label="类别">
            <Select placeholder="全部" style={{ width: 120 }} allowClear>
              {Object.entries(categoryMap).map(([key, val]) => (
                <Option key={key} value={key}>
                  {val.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="supplier" label="供应商">
            <Input placeholder="供应商" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item>
            <Button
              type={searchParams.get('warningOnly') ? 'primary' : 'default'}
              icon={<WarningOutlined />}
              onClick={() => {
                const newWarningOnly = searchParams.get('warningOnly') ? '' : 'true';
                const newParams: any = {};
                if (searchForm.getFieldValue('keyword')) newParams.keyword = searchForm.getFieldValue('keyword');
                if (searchForm.getFieldValue('category')) newParams.category = searchForm.getFieldValue('category');
                if (searchForm.getFieldValue('supplier')) newParams.supplier = searchForm.getFieldValue('supplier');
                if (newWarningOnly) newParams.warningOnly = newWarningOnly;
                setSearchParams(newParams);
                setPagination({ ...pagination, current: 1 });
              }}
            >
              仅显示预警
            </Button>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="库存物品列表"
        extra={
          <Space>
            <Button icon={<ImportOutlined />} onClick={() => handleTransaction('in')}>
              批量入库
            </Button>
            <Button icon={<ExportOutlined />} onClick={() => handleTransaction('out')}>
              批量出库
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleEdit({})}>
              新增物品
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
          onChange={(p) => setPagination({ current: p.current || 1, pageSize: p.pageSize || 10 })}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 编辑/新增弹窗 */}
      <Modal
        title={editItem?.id ? '编辑物品' : '新增物品'}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleEditSubmit}
        width={600}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="物品名称" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="请输入物品名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="类别" rules={[{ required: true, message: '请选择类别' }]}>
                <Select>
                  {Object.entries(categoryMap).map(([key, val]) => (
                    <Option key={key} value={key}>
                      {val.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="specification" label="规格">
                <Input placeholder="请输入规格" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit" label="单位" rules={[{ required: true, message: '请输入单位' }]}>
                <Input placeholder="如：瓶、盒、支" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="currentQuantity" label="当前库存" rules={[{ required: true, message: '请输入当前库存' }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="safetyStock" label="安全库存" rules={[{ required: true, message: '请输入安全库存' }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="storageLocation" label="存储位置">
                <Input placeholder="请输入存储位置" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expiryDate" label="有效期">
                <DatePicker style={{ width: '100%' }} placeholder="选择有效期" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="supplier" label="供应商">
                <Input placeholder="请输入供应商" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unitPrice" label="单价">
                <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 出入库弹窗 */}
      <InventoryTransactionModal
        open={transactionModalOpen}
        onCancel={() => setTransactionModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        defaultItemId={selectedItemId}
        defaultType={transactionType}
      />
    </div>
  );
};

export default InventoryItems;
