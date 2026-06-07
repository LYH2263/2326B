import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Tabs, Descriptions, Tag, Button, Space, Input, Select, DatePicker,
  Upload, message, Modal, Image, Empty, Spin, Popconfirm, Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined, TagOutlined,
  CalendarOutlined, SearchOutlined, ReloadOutlined,
} from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';
import dayjs from 'dayjs';
import { animalApi, animalPhotoApi } from '../api';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const statusOptions = [
  { value: 'healthy', label: '健康', color: 'success' },
  { value: 'sick', label: '患病', color: 'error' },
  { value: 'in_experiment', label: '实验中', color: 'processing' },
  { value: 'deceased', label: '已死亡', color: 'default' },
  { value: 'quarantine', label: '隔离中', color: 'warning' },
];

const genderOptions = [
  { value: 'male', label: '雄性' },
  { value: 'female', label: '雌性' },
  { value: 'unknown', label: '未知' },
];

const defaultTagOptions = ['术前', '术后', '皮肤异常', '正常', '解剖', '给药', '体重测量', '其他'];

const AnimalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [animal, setAnimal] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(24);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [keyword, setKeyword] = useState('');
  const [uploadVisible, setUploadVisible] = useState(false);
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [uploadShotDate, setUploadShotDate] = useState<any>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const uploadFileListRef = useRef<UploadFile[]>([]);

  const animalId = id ? parseInt(id, 10) : 0;

  const fetchAnimal = useCallback(async () => {
    if (!animalId) return;
    try {
      setLoading(true);
      const res: any = await animalApi.getDetail(animalId);
      setAnimal(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [animalId]);

  const fetchPhotos = useCallback(async () => {
    if (!animalId) return;
    try {
      setPhotoLoading(true);
      const params: any = {
        page,
        pageSize,
      };
      if (selectedTags.length > 0) {
        params.tags = selectedTags.join(',');
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      if (keyword) {
        params.keyword = keyword;
      }
      const res: any = await animalPhotoApi.getByAnimalId(animalId, params);
      setPhotos(res?.list || []);
      setTotal(res?.total || 0);
    } catch {
      // handled
    } finally {
      setPhotoLoading(false);
    }
  }, [animalId, page, pageSize, selectedTags, dateRange, keyword]);

  const fetchAllTags = useCallback(async () => {
    try {
      const res: any = await animalPhotoApi.getAllTags();
      if (Array.isArray(res)) {
        const tagSet = new Set([...defaultTagOptions, ...res]);
        setAllTags(Array.from(tagSet));
      } else {
        setAllTags(defaultTagOptions);
      }
    } catch {
      setAllTags(defaultTagOptions);
    }
  }, []);

  useEffect(() => {
    fetchAnimal();
    fetchAllTags();
  }, [fetchAnimal, fetchAllTags]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleDelete = async (photoId: number) => {
    try {
      await animalPhotoApi.delete(photoId);
      message.success('删除成功');
      fetchPhotos();
      fetchAllTags();
    } catch {
      // handled
    }
  };

  const handlePreview = (index: number) => {
    if (photos.length > 0 && photos[index]) {
      setPreviewIndex(index);
      setPreviewVisible(true);
    }
  };

  const handleUpload = async () => {
    const fileList = uploadFileListRef.current;
    if (!animalId) return;
    if (fileList.length === 0) {
      message.warning('请选择要上传的图片');
      return;
    }

    const formData = new FormData();
    fileList.forEach((file) => {
      if (file.originFileObj) {
        formData.append('files', file.originFileObj);
      }
    });
    if (uploadTags.length > 0) {
      formData.append('tags', uploadTags.join(','));
    }
    if (uploadShotDate) {
      formData.append('shotDate', uploadShotDate.format('YYYY-MM-DD'));
    }
    if (uploadDescription) {
      formData.append('description', uploadDescription);
    }

    try {
      setUploading(true);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        formData.append('uploader', user.name || user.username);
      }

      await animalPhotoApi.upload(animalId, formData);
      message.success(`成功上传 ${fileList.length} 张图片`);
      setUploadVisible(false);
      setUploadTags([]);
      setUploadShotDate(null);
      setUploadDescription('');
      uploadFileListRef.current = [];
      fetchPhotos();
      fetchAllTags();
    } catch {
      // handled
    } finally {
      setUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    multiple: true,
    listType: 'picture-card',
    accept: '.jpg,.jpeg,.png,.webp',
    beforeUpload: (file) => {
      const isImage = /\.(jpg|jpeg|png|webp)$/i.test(file.name);
      if (!isImage) {
        message.error('只能上传图片文件!');
        return Upload.LIST_IGNORE;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('图片大小不能超过 10MB!');
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: ({ fileList }) => {
      uploadFileListRef.current = fileList;
    },
    maxCount: 20,
    defaultFileList: [],
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传</div>
    </div>
  );

  const renderPhotos = () => {
    if (photoLoading && photos.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (photos.length === 0) {
      return <Empty description="暂无图片" style={{ padding: '60px 0' }} />;
    }

    return (
      <Image.PreviewGroup
        preview={{
          visible: previewVisible,
          current: previewIndex,
          onVisibleChange: (visible) => setPreviewVisible(visible),
          onChange: (current) => setPreviewIndex(current),
        }}
        items={photos.map((p) => p.imageUrl)}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
        }}>
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              style={{
                position: 'relative',
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                aspectRatio: '1',
                background: '#f5f5f5',
              }}
              onClick={() => handlePreview(index)}
              className="photo-item"
            >
              <Image
                src={photo.thumbnailUrl}
                alt={photo.originalFilename}
                width="100%"
                height="100%"
                style={{ objectFit: 'cover' }}
                preview={false}
              />
              <div style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 2,
              }} className="photo-actions">
                <Popconfirm
                  title="确定删除这张图片吗？"
                  onConfirm={(e) => { e?.stopPropagation(); handleDelete(photo.id); }}
                  onCancel={(e) => e?.stopPropagation()}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="primary"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </div>
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '8px 10px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                color: '#fff',
                fontSize: 12,
              }}>
                <div style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: 4,
                }}>
                  {photo.originalFilename}
                </div>
                {photo.tags && photo.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {photo.tags.slice(0, 3).map((tag: string) => (
                      <Tag key={tag} color="blue" style={{ margin: 0, fontSize: 11 }}>
                        {tag}
                      </Tag>
                    ))}
                    {photo.tags.length > 3 && (
                      <Tag style={{ margin: 0, fontSize: 11 }}>+{photo.tags.length - 3}</Tag>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Image.PreviewGroup>
    );
  };

  const tabItems = [
    {
      key: 'info',
      label: '基本信息',
      children: (
        <Spin spinning={loading}>
          {animal && (
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle" style={{ marginTop: 16 }}>
              <Descriptions.Item label="编号">{animal.name}</Descriptions.Item>
              <Descriptions.Item label="物种">{animal.species}</Descriptions.Item>
              <Descriptions.Item label="品系">{animal.breed || '-'}</Descriptions.Item>
              <Descriptions.Item label="性别">
                {genderOptions.find(o => o.value === animal.gender)?.label || animal.gender}
              </Descriptions.Item>
              <Descriptions.Item label="体重">{animal.weight ? `${animal.weight}g` : '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusOptions.find(o => o.value === animal.status)?.color}>
                  {statusOptions.find(o => o.value === animal.status)?.label || animal.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="笼号">{animal.cageNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="RFID">{animal.rfidTag || '-'}</Descriptions.Item>
              <Descriptions.Item label="出生日期">
                {animal.birthDate ? dayjs(animal.birthDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="来源">{animal.source || '-'}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{animal.description || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(animal.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(animal.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Spin>
      ),
    },
    {
      key: 'photos',
      label: `相册 (${total})`,
      children: (
        <div style={{ marginTop: 16 }}>
          <div style={{
            display: 'flex',
            gap: 12,
            marginBottom: 16,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <Input
              placeholder="搜索描述/文件名"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={() => { setPage(1); fetchPhotos(); }}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              mode="tags"
              placeholder="标签筛选"
              style={{ minWidth: 200, maxWidth: 400 }}
              value={selectedTags}
              onChange={(v) => { setSelectedTags(v); setPage(1); }}
              tokenSeparators={[',']}
            >
              {allTags.map(tag => (
                <Option key={tag} value={tag}>{tag}</Option>
              ))}
            </Select>
            <RangePicker
              value={dateRange}
              onChange={(dates: any) => { setDateRange(dates); setPage(1); }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => {
              setSelectedTags([]);
              setDateRange(null);
              setKeyword('');
              setPage(1);
            }}>
              重置
            </Button>
            <div style={{ flex: 1 }} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              uploadFileListRef.current = [];
              setUploadVisible(true);
            }}>
              上传图片
            </Button>
          </div>

          {renderPhotos()}

          {total > pageSize && photos.length < total && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Button onClick={() => setPage(p => p + 1)}>
                加载更多
              </Button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        title={
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
            <span style={{ fontWeight: 600 }}>
              {loading ? '加载中...' : animal?.name || '动物详情'}
            </span>
          </Space>
        }
      >
        <Tabs defaultActiveKey="photos" items={tabItems} />
      </Card>

      <Modal
        title="上传图片"
        open={uploadVisible}
        onCancel={() => setUploadVisible(false)}
        onOk={handleUpload}
        okText="上传"
        cancelText="取消"
        confirmLoading={uploading}
        width={600}
        destroyOnClose
      >
        <div style={{ marginTop: 8 }}>
          <Upload {...uploadProps}>
            {uploadButton}
          </Upload>
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                <TagOutlined /> 标签
              </label>
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="输入或选择标签，回车确认"
                value={uploadTags}
                onChange={setUploadTags}
                tokenSeparators={[',', ' ']}
              >
                {allTags.map(tag => (
                  <Option key={tag} value={tag}>{tag}</Option>
                ))}
              </Select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                <CalendarOutlined /> 拍摄日期
              </label>
              <DatePicker style={{ width: '100%' }} value={uploadShotDate} onChange={setUploadShotDate} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>描述</label>
              <TextArea
                rows={3}
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="图片描述（可选）"
              />
            </div>
            <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
              支持 JPG/PNG/WebP 格式，单张不超过 10MB，最多 20 张
            </div>
          </div>
        </div>
      </Modal>

      <style>{`
        .photo-item .photo-actions {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .photo-item:hover .photo-actions {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default AnimalDetail;
