import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Descriptions, Tag, Button, Space, Typography, Image, Upload,
  message, Spin, Empty, Row, Col, Modal,
} from 'antd';
import {
  ArrowLeftOutlined, FileTextOutlined, UploadOutlined,
  LeftOutlined, RightOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import { necropsyReportApi, deathRecordApi } from '../api';

const { Title, Text } = Typography;

const causeCategoryMap: Record<string, { label: string; color: string }> = {
  natural: { label: '自然死亡', color: 'default' },
  experiment_termination: { label: '实验终止', color: 'processing' },
  accidental: { label: '意外死亡', color: 'warning' },
  euthanasia: { label: '安乐死', color: 'error' },
};

const disposalMethodMap: Record<string, { label: string; color: string }> = {
  necropsy: { label: '尸检', color: 'processing' },
  incineration: { label: '焚化', color: 'default' },
  cryopreservation: { label: '冷冻保存', color: 'blue' },
};

const NecropsyReportDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);

  const fetchDetail = useCallback(async (reportId: number) => {
    try {
      setLoading(true);
      const res: any = await necropsyReportApi.getDetail(reportId);
      setReport(res);
      setImages(res.imageUrls || []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchDetail(parseInt(id, 10));
    }
  }, [id, fetchDetail]);

  const handlePreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  const handlePrevImage = () => {
    setPreviewIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    setPreviewIndex((prev) => (prev + 1) % images.length);
  };

  const handleUploadImage: UploadProps['beforeUpload'] = async (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件');
      return false;
    }
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('图片大小不能超过 10MB');
      return false;
    }

    try {
      if (id) {
        await necropsyReportApi.uploadImage(parseInt(id, 10), file);
        fetchDetail(parseInt(id, 10));
        message.success('上传成功');
      }
    } catch {
      // handled
    }
    return false;
  };

  const handleDeleteImage = async (imageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await necropsyReportApi.removeImage(parseInt(id, 10), imageUrl);
          fetchDetail(parseInt(id, 10));
          message.success('删除成功');
        } catch {
          // handled
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!report) {
    return (
      <div>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/death-records')}>
            返回列表
          </Button>
        </Space>
        <Card style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <Empty description="尸检报告不存在" />
        </Card>
      </div>
    );
  }

  const deathRecord = report.deathRecord;
  const animal = deathRecord?.animal;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/death-records')}>
          返回列表
        </Button>
      </Space>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            title={
              <Space>
                <FileTextOutlined style={{ color: '#6b7280' }} />
                <span style={{ fontWeight: 600 }}>尸检报告详情</span>
              </Space>
            }
            extra={
              <Button
                type="primary"
                onClick={() => navigate(`/death-records/${deathRecord?.id}/edit`)}
              >
                编辑报告
              </Button>
            }
          >
            <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
              动物信息
            </Title>
            <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small">
              <Descriptions.Item label="动物编号">
                <Text strong>{animal?.name || '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="物种">{animal?.species || '-'}</Descriptions.Item>
              <Descriptions.Item label="品系">{animal?.breed || '-'}</Descriptions.Item>
              <Descriptions.Item label="性别">
                {animal?.gender === 'male' ? '雄性' : animal?.gender === 'female' ? '雌性' : '未知'}
              </Descriptions.Item>
              <Descriptions.Item label="死亡时间">
                {deathRecord?.deathDatetime
                  ? dayjs(deathRecord.deathDatetime).format('YYYY-MM-DD HH:mm')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="死亡原因">
                {deathRecord?.causeCategory ? (
                  <Tag color={causeCategoryMap[deathRecord.causeCategory]?.color}>
                    {causeCategoryMap[deathRecord.causeCategory]?.label}
                  </Tag>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="处置方式">
                {deathRecord?.disposalMethod ? (
                  <Tag color={disposalMethodMap[deathRecord.disposalMethod]?.color}>
                    {disposalMethodMap[deathRecord.disposalMethod]?.label}
                  </Tag>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="发现人">{deathRecord?.foundBy || '-'}</Descriptions.Item>
              <Descriptions.Item label="确认兽医">{deathRecord?.confirmingVet || '-'}</Descriptions.Item>
            </Descriptions>

            {deathRecord?.causeDescription && (
              <>
                <Title level={5} style={{ marginTop: 20, marginBottom: 12 }}>
                  死亡原因详细描述
                </Title>
                <Card size="small" style={{ background: '#f9fafb' }}>
                  <Text>{deathRecord.causeDescription}</Text>
                </Card>
              </>
            )}
          </Card>
        </Col>

        <Col span={24}>
          <Card
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            title={
              <Space>
                <FileTextOutlined style={{ color: '#6b7280' }} />
                <span style={{ fontWeight: 600 }}>尸检结果</span>
              </Space>
            }
          >
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="尸检日期">
                {report.necropsyDate ? dayjs(report.necropsyDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="执行人">{report.performedBy || '-'}</Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 20, marginBottom: 12 }}>
              大体观察结果
            </Title>
            <Card size="small" style={{ background: '#f9fafb', marginBottom: 16 }}>
              <Text style={{ whiteSpace: 'pre-wrap' }}>
                {report.grossFindings || '暂无记录'}
              </Text>
            </Card>

            <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
              组织病理学发现
            </Title>
            <Card size="small" style={{ background: '#f9fafb', marginBottom: 16 }}>
              <Text style={{ whiteSpace: 'pre-wrap' }}>
                {report.histopathologyFindings || '暂无记录'}
              </Text>
            </Card>

            <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
              最终诊断
            </Title>
            <Card size="small" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <Text strong style={{ color: '#166534', whiteSpace: 'pre-wrap' }}>
                {report.finalDiagnosis || '暂无诊断'}
              </Text>
            </Card>
          </Card>
        </Col>

        <Col span={24}>
          <Card
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            title={
              <Space>
                <span style={{ fontWeight: 600 }}>尸检图片</span>
                <Tag>{images.length} 张</Tag>
              </Space>
            }
            extra={
              <Upload
                showUploadList={false}
                beforeUpload={handleUploadImage}
                accept="image/*"
                multiple
              >
                <Button type="primary" icon={<UploadOutlined />}>
                  上传图片
                </Button>
              </Upload>
            }
          >
            {images.length === 0 ? (
              <Empty description="暂无图片" style={{ padding: '40px 0' }} />
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {images.map((url, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      width: 140,
                      height: 140,
                      borderRadius: 8,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid #e5e7eb',
                      transition: 'transform 0.2s',
                    }}
                    onClick={() => handlePreview(index)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                    }}
                  >
                    <Image
                      src={url}
                      alt={`尸检图片 ${index + 1}`}
                      width={140}
                      height={140}
                      style={{ objectFit: 'cover' }}
                      preview={false}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                        padding: '8px 4px 4px',
                        color: '#fff',
                        fontSize: 12,
                        textAlign: 'center',
                      }}
                    >
                      图片 {index + 1}
                    </div>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'rgba(0,0,0,0.5)',
                        color: '#fff',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                      }}
                      className="image-delete-btn"
                      onClick={(e) => handleDeleteImage(url, e)}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        open={previewVisible}
        footer={null}
        closable
        onCancel={() => setPreviewVisible(false)}
        width={800}
        centered
        styles={{ body: { padding: 0, background: '#000' } }}
        closeIcon={<span style={{ color: '#fff', fontSize: 24 }}>×</span>}
      >
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <img
            src={images[previewIndex]}
            alt="预览"
            style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block', margin: '0 auto' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 0,
              right: 0,
              color: '#fff',
              textAlign: 'center',
            }}
          >
            {previewIndex + 1} / {images.length}
          </div>
          {images.length > 1 && (
            <>
              <Button
                type="text"
                icon={<LeftOutlined />}
                style={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#fff',
                  fontSize: 24,
                  background: 'rgba(0,0,0,0.3)',
                }}
                onClick={handlePrevImage}
              />
              <Button
                type="text"
                icon={<RightOutlined />}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#fff',
                  fontSize: 24,
                  background: 'rgba(0,0,0,0.3)',
                }}
                onClick={handleNextImage}
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default NecropsyReportDetail;
