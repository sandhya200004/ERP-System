import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Upload,
  Button,
  Space,
  App,
  List,
  Tag,
} from 'antd';
import { UploadOutlined, DeleteOutlined, FileOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface TaskSubmitModalProps {
  visible: boolean;
  taskId: string;
  taskTitle: string;
  estimatedHours: number;
  complexity: string;
  onOk: (data: SubmitTaskData) => void;
  onCancel: () => void;
}

export interface SubmitTaskData {
  actualHours: number;
  notes: string;
  proofs: UploadFile[];
}

const complexityRequirements: Record<string, number> = {
  trivial: 0,
  small: 0,
  medium: 1,
  complex: 2,
  critical: 3,
};

const TaskSubmitModal: React.FC<TaskSubmitModalProps> = ({
  visible,
  taskId,
  taskTitle,
  estimatedHours,
  complexity,
  onOk,
  onCancel,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const minProofs = complexityRequirements[complexity] || 0;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (fileList.length < minProofs) {
        message.error(`This task requires at least ${minProofs} proof(s) for ${complexity} complexity`);
        return;
      }

      setLoading(true);

      const submitData: SubmitTaskData = {
        actualHours: values.actualHours,
        notes: values.notes || '',
        proofs: fileList,
      };

      onOk(submitData);
    } catch (error: any) {
      if (!error.errorFields) {
        message.error('Failed to submit task');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUploadChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList);
  };

  const beforeUpload = (file: File) => {
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('File must be smaller than 10MB');
      return false;
    }
    return false; // Prevent auto upload
  };

  const handleRemoveFile = (file: UploadFile) => {
    setFileList(fileList.filter((f) => f.uid !== file.uid));
  };

  return (
    <Modal
      title="Submit Task for Approval"
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={700}
      okText="Submit for Approval"
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          {taskTitle}
        </div>
        <Space>
          <Tag color="blue">Complexity: {complexity}</Tag>
          <Tag>Estimated: {estimatedHours}h</Tag>
          <Tag color={minProofs > 0 ? 'orange' : 'default'}>
            Required Proofs: {minProofs}
          </Tag>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          actualHours: estimatedHours,
        }}
      >
        <Form.Item
          name="actualHours"
          label="Actual Hours Spent"
          rules={[
            { required: true, message: 'Please enter actual hours' },
            { type: 'number', min: 0.1, message: 'Must be greater than 0' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Enter actual hours spent"
            step={0.5}
            precision={2}
          />
        </Form.Item>

        <Form.Item name="notes" label="Completion Notes">
          <TextArea
            rows={4}
            placeholder="Describe what was completed, any challenges faced, etc."
          />
        </Form.Item>

        <Form.Item
          label={
            <span>
              Upload Proof of Work
              {minProofs > 0 && (
                <span style={{ color: '#ff4d4f', marginLeft: 8 }}>
                  * (Minimum {minProofs} required)
                </span>
              )}
            </span>
          }
        >
          <Upload
            fileList={fileList}
            onChange={handleUploadChange}
            beforeUpload={beforeUpload}
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          >
            <Button icon={<UploadOutlined />}>
              Select Files (Max 10MB each)
            </Button>
          </Upload>
          <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
            Supported: Images, PDF, Word, Excel (Screenshots, documents, code snippets, etc.)
          </div>
        </Form.Item>

        {fileList.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              Selected Files ({fileList.length})
            </div>
            <List
              size="small"
              bordered
              dataSource={fileList}
              renderItem={(file) => (
                <List.Item
                  actions={[
                    <Button
                      key="delete"
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveFile(file)}
                    />,
                  ]}
                >
                  <Space>
                    <FileOutlined />
                    <span>{file.name}</span>
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                      ({(file.size! / 1024).toFixed(1)} KB)
                    </span>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default TaskSubmitModal;
