import React from 'react';
import { Modal } from 'antd';
import ReflectiveCard from './ReflectiveCard';

interface EmployeeBadgeModalProps {
  visible: boolean;
  onClose: () => void;
  employeeName?: string;
  employeeTitle?: string;
  employeeId?: string;
  enableWebcam?: boolean;
  title?: string;
}

const EmployeeBadgeModal: React.FC<EmployeeBadgeModalProps> = ({
  visible,
  onClose,
  employeeName,
  employeeTitle,
  employeeId,
  enableWebcam = true,
  title = 'Employee Badge Verification'
}) => {
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={400}
      title={title}
      bodyStyle={{ 
        padding: '24px', 
        display: 'flex', 
        justifyContent: 'center',
        background: '#000'
      }}
      style={{ background: '#000' }}
    >
      <ReflectiveCard
        employeeName={employeeName}
        employeeTitle={employeeTitle}
        employeeId={employeeId}
        enableWebcam={enableWebcam}
      />
    </Modal>
  );
};

export default EmployeeBadgeModal;
