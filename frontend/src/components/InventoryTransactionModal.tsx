import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker, Button, Space, message, Row, Col } from 'antd';
import { PlusOutlined, MinusOutlined, EditOutlined } from '@ant-design/icons';
import { inventoryApi, experimentApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface InventoryTransactionModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  defaultItemId?: number | null;
  defaultType?: 'in' | 'out' | 'adjust';
}

const InventoryTransactionModal: React.FC<InventoryTransactionModalProps> = ({
  open,
  onCancel,
  onSuccess,
  defaultItemId,
  defaultType = 'in',
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [type, setType] = useState<'in' | 'out' | 'adjust'>(defaultType);

  useEffect(() => {
    if (open) {
      fetchItems();
      fetchExperiments();
      form.resetFields();
      setType(defaultType);
      if (defaultItemId) {
        form.setFieldsValue({ itemId: defaultItemId });
        handleItemSelect(defaultItemId);
      }
    }
  }, [open, defaultItemId, defaultType]);

  const fetchItems = async () => {
    try {
      const res: any = await inventoryApi.getItems({ pageSize: 100 });
      setItems(res?.list || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const fetchExperiments = async () => {
    try {
      const res: any = await experimentApi.getList({ pageSize: 100 });
      setExperiments(res?.list || []);
    } catch (error) {
      console.error('Failed to fetch experiments:', error);
    }
  };

  const handleItemSelect = async (itemId: number) => {
    try {
      const item = await inventoryApi.getItemDetail(itemId);
      setSelectedItem(item);
    } catch (error) {
      console.error('Failed to fetch item detail:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const data = {
        itemId: values.itemId,
        type: type,
        quantity: values.quantity,
        operator: values.operator,
        experimentId: values.experimentId || undefined,
        reason: values.reason,
        transactionDate: values.transactionDate
          ? values.transactionDate.toISOString()
          : undefined,
      };

      await inventoryApi.createTransaction(data);
      message.success(type === 'in' ? '入库成功' : type === 'out' ? '出库成功' : '盘点调整成功');
      form.resetFields();
      onSuccess();
      onCancel();
    } catch (error: any) {
      console.error('Transaction failed:', error);
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const typeConfig = {
    in: { title: '入库登记', icon: <PlusOutlined />, color: '#52c41a' },
    out: { title: '出库登记', icon: <MinusOutlined />, color: '#ff4d4f' },
    adjust: { title: '盘点调整', icon: <EditOutlined />, color: '#fa8c16' },
  };

  return (
    <Modal
      title={
        <Space>
          <span style={{ color: typeConfig[type].color }}>{typeConfig[type].icon}</span>
          <span>{typeConfig[type].title}</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={560}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ type, transactionDate: dayjs() }}>
        {/* 类型切换 */}
        <Form.Item label="操作类型">
          <Space>
            {(['in', 'out', 'adjust'] as const).map((t) => (
              <Button
                key={t}
                type={type === t ? 'primary' : 'default'}
                onClick={() => setType(t)}
                icon={typeConfig[t].icon}
                style={type === t ? { background: typeConfig[t].color, borderColor: typeConfig[t].color } : {}}
              >
                {typeConfig[t].title}
              </Button>
            ))}
          </Space>
        </Form.Item>

        {/* 物品选择 */}
        <Form.Item
          name="itemId"
          label="选择物品"
          rules={[{ required: true, message: '请选择物品' }]}
        >
          <Select
            placeholder="请搜索选择物品"
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
            onChange={(value) => handleItemSelect(value)}
            disabled={!!defaultItemId}
          >
            {items.map((item) => (
              <Option key={item.id} value={item.id}>
                {item.name} - {item.specification || '无规格'} (库存: {item.currentQuantity} {item.unit})
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 当前库存显示 */}
        {selectedItem && (
          <div style={{
            padding: '12px 16px',
            background: '#f5f5f5',
            borderRadius: 8,
            marginBottom: 16,
          }}>
            <Row>
              <Col span={12}>
                <div style={{ fontSize: 12, color: '#999' }}>当前库存</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#333' }}>
                  {selectedItem.currentQuantity} {selectedItem.unit}
                </div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 12, color: '#999' }}>安全库存</div>
                <div style={{ fontSize: 16, color: '#666' }}>
                  {selectedItem.safetyStock} {selectedItem.unit}
                </div>
              </Col>
            </Row>
          </div>
        )}

        {/* 数量 */}
        <Form.Item
          name="quantity"
          label={type === 'adjust' ? '调整数量（正为增加，负为减少）' : '数量'}
          rules={[{ required: true, message: '请输入数量' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={type === 'adjust' ? undefined : 0.01}
            step={1}
            placeholder={`请输入${type === 'in' ? '入库' : type === 'out' ? '出库' : '调整'}数量`}
            addonAfter={selectedItem?.unit || ''}
          />
        </Form.Item>

        {/* 事务日期 */}
        <Form.Item name="transactionDate" label="事务日期">
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>

        {/* 操作人 */}
        <Form.Item name="operator" label="操作人">
          <Input placeholder="请输入操作人姓名" />
        </Form.Item>

        {/* 关联实验 */}
        <Form.Item name="experimentId" label="关联实验（可选）">
          <Select placeholder="请选择关联的实验项目" allowClear showSearch filterOption={(input, option) =>
            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
          }>
            {experiments.map((exp) => (
              <Option key={exp.id} value={exp.id}>
                {exp.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 原因说明 */}
        <Form.Item name="reason" label="原因说明">
          <TextArea rows={3} placeholder="请输入原因说明" maxLength={500} showCount />
        </Form.Item>

        {/* 操作按钮 */}
        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" loading={loading} onClick={handleSubmit}>
              确认{type === 'in' ? '入库' : type === 'out' ? '出库' : '调整'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InventoryTransactionModal;
