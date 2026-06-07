import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Row,
  Col,
  Tag,
} from 'antd';
import {
  ArrowLeftOutlined,
  SendOutlined,
  LinkOutlined,
  BugOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { messageApi, userApi, animalApi, experimentApi } from '../api';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;
const { Option } = Select;

const ComposeMessage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [relatedType, setRelatedType] = useState<string>('none');
  const [relatedId, setRelatedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, animalsRes, experimentsRes] = await Promise.all([
          userApi.getList(),
          animalApi.getList({ pageSize: 50 }),
          experimentApi.getList({ pageSize: 50 }),
        ]);
        setUsers((usersRes as unknown as any[]) || []);
        setAnimals((animalsRes as any)?.list || []);
        setExperiments((experimentsRes as any)?.list || []);
      } catch {
        // error handled
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const data: any = {
        receiverId: values.receiverId,
        title: values.title,
        content: values.content,
      };

      if (relatedType !== 'none' && relatedId) {
        data.relatedType = relatedType;
        data.relatedId = relatedId;
      }

      await messageApi.send(data);
      message.success('发送成功');
      navigate('/messages');
    } catch {
      // error handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/messages')}
            />
            <span>写站内信</span>
          </Space>
        }
      >
        <Form form={form} layout="vertical" style={{ maxWidth: 700 }}>
          <Form.Item
            name="receiverId"
            label="收件人"
            rules={[{ required: true, message: '请选择收件人' }]}
          >
            <Select
              showSearch
              placeholder="请选择收件人"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.name || user.username}
                  {user.role === 'admin' && <Tag color="blue" style={{ marginLeft: 8 }}>管理员</Tag>}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入消息标题" maxLength={200} />
          </Form.Item>

          <Form.Item label="关联资源（可选）">
            <Row gutter={16}>
              <Col span={8}>
                <Select
                  value={relatedType}
                  onChange={(val) => {
                    setRelatedType(val);
                    setRelatedId(null);
                  }}
                  style={{ width: '100%' }}
                >
                  <Option value="none">不关联</Option>
                  <Option value="animal">
                    <BugOutlined style={{ marginRight: 4 }} />
                    关联动物
                  </Option>
                  <Option value="experiment">
                    <ExperimentOutlined style={{ marginRight: 4 }} />
                    关联实验
                  </Option>
                </Select>
              </Col>
              <Col span={16}>
                {relatedType === 'animal' && (
                  <Select
                    value={relatedId}
                    onChange={setRelatedId}
                    placeholder="选择动物"
                    showSearch
                    optionFilterProp="children"
                    style={{ width: '100%' }}
                  >
                    {animals.map((animal) => (
                      <Option key={animal.id} value={animal.id}>
                        {animal.name} - {animal.species} ({animal.breed || '未知品系'})
                      </Option>
                    ))}
                  </Select>
                )}
                {relatedType === 'experiment' && (
                  <Select
                    value={relatedId}
                    onChange={setRelatedId}
                    placeholder="选择实验项目"
                    showSearch
                    optionFilterProp="children"
                    style={{ width: '100%' }}
                  >
                    {experiments.map((exp) => (
                      <Option key={exp.id} value={exp.id}>
                        {exp.projectCode} - {exp.name}
                      </Option>
                    ))}
                  </Select>
                )}
              </Col>
            </Row>
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入消息内容' }]}
          >
            <TextArea rows={10} placeholder="请输入消息内容..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmit}
                loading={loading}
              >
                发送
              </Button>
              <Button onClick={() => navigate('/messages')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ComposeMessage;
