import React, { useState } from 'react';
import {
  Modal,
  Form,
  Rate,
  Input,
  Space,
  List,
  Typography,
  Tag,
  Divider,
  App,
  Button,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text } = Typography;

interface TaskApprovalModalProps {
  visible: boolean;
  task: any; // Task with submission details
  onApprove: (data: ApprovalData) => void;
  onReject: (feedback: string) => void;
  onCancel: () => void;
}

export interface ApprovalData {
  qualityScore: number;
  feedback: string;
}

const TaskApprovalModal: React.FC<TaskApprovalModalProps> = ({
  visible,
  task,
  onApprove,
  onReject,
  onCancel,
}) => {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  if (!task) return null;

  const handleApprove = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const approvalData: ApprovalData = {
        qualityScore: values.qualityScore * 20, // Convert 5-star to 100-point scale
        feedback: values.feedback || '',
      };

      onApprove(approvalData);
    } catch (error: any) {
      if (!error.errorFields) {
        message.error('Failed to approve task');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    modal.confirm({
      title: 'Reject Task Submission',
      content: (
        <Form layout="vertical">
          <Form.Item label="Feedback (Required)">
            <TextArea
              rows={4}
              id="rejectFeedback"
              placeholder="Explain what needs to be improved or corrected..."
            />
          </Form.Item>
        </Form>
      ),
      okText: 'Reject',
      okType: 'danger',
      onOk: () => {
        const feedback = (document.getElementById('rejectFeedback') as HTMLTextAreaElement)?.value;
        if (!feedback || feedback.trim().length < 10) {
          message.error('Please provide detailed feedback (at least 10 characters)');
          return Promise.reject();
        }
        onReject(feedback);
        return Promise.resolve();
      },
    });
  };

  const effortVariance =
    task.estimatedHours && task.actualHours
      ? ((task.actualHours - task.estimatedHours) / task.estimatedHours) * 100
      : 0;

  const isEffortAccurate = Math.abs(effortVariance) <= 25;

  return (
    <Modal
      title="Review Task Submission"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="reject"
          danger
          icon={<CloseCircleOutlined />}
          onClick={handleReject}
          loading={loading}
        >
          Reject
        </Button>,
        <Button
          key="approve"
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handleApprove}
          loading={loading}
        >
          Approve
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
          {task.title}
        </div>
        <Space wrap>
          <Tag color="blue">Complexity: {task.complexity}</Tag>
          <Tag color="green">Estimated: {task.estimatedHours}h</Tag>
          <Tag color="orange">Actual: {task.actualHours}h</Tag>
          <Tag color={isEffortAccurate ? 'success' : 'warning'}>
            Variance: {effortVariance > 0 ? '+' : ''}
            {effortVariance.toFixed(1)}%
          </Tag>
          <Tag>Submitted: {dayjs(task.submittedAt).format('DD MMM, HH:mm')}</Tag>
        </Space>
      </div>

      <Divider />

      {task.notes && (
        <div style={{ marginBottom: 16 }}>
          <Text strong>Completion Notes:</Text>
          <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            {task.notes}
          </div>
        </div>
      )}

      {task.proofs && task.proofs.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text strong>
            Proof of Work ({task.proofs.length} file{task.proofs.length > 1 ? 's' : ''})
          </Text>
          <List
            size="small"
            bordered
            style={{ marginTop: 8 }}
            dataSource={task.proofs}
            renderItem={(proof: any) => (
              <List.Item
                actions={[
                  <Button
                    key="download"
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => message.info('Downloading proof...')}
                  >
                    Download
                  </Button>,
                ]}
              >
                <Space>
                  <FileOutlined />
                  <span>{proof.fileName}</span>
                  <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                    {dayjs(proof.uploadedAt).format('DD MMM, HH:mm')}
                  </span>
                </Space>
              </List.Item>
            )}
          />
        </div>
      )}

      <Divider />

      <Form form={form} layout="vertical" initialValues={{ qualityScore: 4 }}>
        <Form.Item
          name="qualityScore"
          label="Quality Score"
          rules={[{ required: true, message: 'Please rate the quality' }]}
        >
          <Rate
            count={5}
            style={{ fontSize: 32 }}
            tooltips={['Poor', 'Below Average', 'Average', 'Good', 'Excellent']}
          />
        </Form.Item>

        <Form.Item name="feedback" label="Feedback (Optional)">
          <TextArea
            rows={4}
            placeholder="Provide feedback on the work quality, what was done well, areas for improvement..."
          />
        </Form.Item>
      </Form>

      <div style={{ background: '#e6f7ff', padding: 12, borderRadius: 4, marginTop: 16 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          💡 <strong>Tip:</strong> Quality score affects the employee's KPI. Consider completeness,
          code/design quality, adherence to requirements, and overall professionalism.
        </Text>
      </div>
    </Modal>
  );
};

export default TaskApprovalModal;
