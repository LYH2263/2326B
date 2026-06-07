import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Button, Space, Tag, Typography, Descriptions, Timeline,
  List, Badge, Row, Col, Empty, message,
} from 'antd';
import {
  ArrowLeftOutlined, FileTextOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
  SendOutlined, RollbackOutlined, TeamOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { animalUsageRequestApi } from '../api';

const { Title, Text, Paragraph } = Typography;

const statusOptions = [
  { value: 'draft', label: '草稿', color: 'default', icon: <FileTextOutlined /> },
  { value: 'submitted', label: '待审批', color: 'processing', icon: <SendOutlined /> },
  { value: 'approved', label: '已通过', color: 'success', icon: <CheckCircleOutlined /> },
  { value: 'rejected', label: '已拒绝', color: 'error', icon: <CloseCircleOutlined /> },
  { value: 'withdrawn', label: '已撤回', color: 'warning', icon: <RollbackOutlined /> },
];

const genderLabels: Record<string, string> = {
  male: '雄性',
  female: '雌性',
  any: '不限',
};

const UsageRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res: any = await animalUsageRequestApi.getDetail(Number(id));
      setDetail(res);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTimeline = useCallback(async () => {
    if (!id) return;
    try {
      const res: any = await animalUsageRequestApi.getTimeline(Number(id));
      setTimeline(res || []);
    } catch {
    }
  }, [id]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => { fetchDetail(); fetchTimeline(); }, [fetchDetail, fetchTimeline]);

  const renderStatusTag = (status: string) => {
    const opt = statusOptions.find(o => o.value === status);
    if (!opt) return status;
    return <Tag color={opt.color} icon={opt.icon}>{opt.label}</Tag>;
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async () => {
    if (!detail) return;
    try {
      await animalUsageRequestApi.submit(detail.id);
      message.success('提交成功');
      fetchDetail();
      fetchTimeline();
    } catch {
    }
  };

  const handleWithdraw = async () => {
    if (!detail) return;
    try {
      await animalUsageRequestApi.withdraw(detail.id);
      message.success('撤回成功');
      fetchDetail();
      fetchTimeline();
    } catch {
    }
  };

  const isAdmin = user?.role === 'admin';
  const isApplicant = user && detail && user.id === detail.applicantId;

  const allocationAnimals = detail?.allocationResult?.animals || [];

  return (
    <div>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            使用申请详情
          </Title>
          <Tag color="default">#{detail?.id || '-'} 号申请
          </Tag>
          {detail && renderStatusTag(detail.status)}
        </div>

        {detail && (
          <>
            <Descriptions
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 20 }}
            >
              <Descriptions.Item label="申请ID">{detail.id}</Descriptions.Item>
              <Descriptions.Item label="申请日期">
                {detail.requestDate ? dayjs(detail.requestDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">
                {detail.applicant?.name || detail.applicant?.username || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {renderStatusTag(detail.status)}
              </Descriptions.Item>
              <Descriptions.Item label="物种">{detail.species}</Descriptions.Item>
              <Descriptions.Item label="品系">{detail.strain || '-'}</Descriptions.Item>
              <Descriptions.Item label="申请数量">{detail.quantity} 只</Descriptions.Item>
              <Descriptions.Item label="性别要求">
                {genderLabels[detail.genderRequirement] || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="体重范围">
                {detail.minWeight || detail.maxWeight
                  ? `${detail.minWeight || '-'} ~ ${detail.maxWeight || '-'} g`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="关联实验">
                {detail.experiment?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="使用周期" span={2}>
                {detail.startDate ? dayjs(detail.startDate).format('YYYY-MM-DD') : '-'}
                {' 至 '}
                {detail.endDate ? dayjs(detail.endDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="使用目的" span={2}>
                <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {detail.purpose || '-'}
                </Paragraph>
              </Descriptions.Item>
            </Descriptions>

            {detail.approver && (
              <Descriptions
                title="审批信息"
                bordered
                column={2}
                size="small"
                style={{ marginBottom: 20 }}
              >
                <Descriptions.Item label="审批人">
                  {detail.approver?.name || detail.approver?.username || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="审批时间">
                  {detail.approvalTime ? dayjs(detail.approvalTime).format('YYYY-MM-DD HH:mm') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="审批意见" span={2}>
                  {detail.approvalComment || '-'}
                </Descriptions.Item>
              </Descriptions>
            )}

            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Space>
                {isApplicant && detail.status === 'draft' && (
                  <Button type="primary" icon={<SendOutlined />} onClick={handleSubmit}>
                    提交申请
                  </Button>
                )}
                {isApplicant && (detail.status === 'submitted' || detail.status === 'approved') && (
                  <Button danger icon={<RollbackOutlined />} onClick={handleWithdraw}>
                    撤回申请
                  </Button>
                )}
                {isAdmin && detail.status === 'submitted' && (
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => navigate('/animal-usage-requests/approval')}>
                    去审批
                  </Button>
                )}
              </Space>
            </div>
          </>
        )}
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#1677ff' }} />
                <span>审批时间线</span>
              </Space>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <div style={{ padding: '12px 20px', background: '#fafafa', borderRadius: 8 }}>
              <Timeline
                items={timeline.map((item: any) => {
                  const statusOpt = statusOptions.find(o => o.value === item.status);
                  const color = item.time ? (statusOpt?.color || 'blue') : 'gray';
                  return {
                    color,
                    dot: statusOpt?.icon,
                    children: (
                      <div style={{ padding: '4px 0' }}>
                        <Text strong style={{ fontSize: 14 }}>{item.label}</Text>
                        {item.time ? (
                          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                            {dayjs(item.time).format('YYYY-MM-DD HH:mm')}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: '#bbb', marginTop: 2 }}>待完成</div>
                        )}
                      </div>
                    ),
                  };
                })}
              />
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={
              <Space>
                <TeamOutlined style={{ color: '#1677ff' }} />
                <span>分配结果</span>
              </Space>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            {allocationAnimals.length > 0 ? (
              <List
                dataSource={allocationAnimals}
                renderItem={(item: any) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      avatar={<Badge status="success" />}
                      title={
                        <Space>
                          <Text strong>{item.name}</Text>
                          <Tag color="blue">#{item.id}</Tag>
                        </Space>
                      }
                      description={
                        <Space size="large">
                          <Text type="secondary">{item.species}</Text>
                          <Text type="secondary">
                            {item.gender === 'male' ? '♂' : item.gender === 'female' ? '♀' : '?'}
                          </Text>
                          <Text type="secondary">{item.weight}g</Text>
                          <Text type="secondary">笼位: {item.cageNumber || '-'}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无分配结果" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UsageRequestDetail;
