import React from 'react';
import { 
  Clock, 
  Scale, 
  FlaskConical, 
  CheckCircle2, 
  CreditCard, 
  CheckCheck, 
  XCircle, 
  FileText 
} from 'lucide-react';

export const STATUS_CONFIG = {
  REGISTERED: {
    label: 'Registered',
    labelHi: 'पंजीकृत',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: FileText,
    dot: 'bg-blue-500'
  },
  WAITING: {
    label: 'In Waiting Queue',
    labelHi: 'प्रतीक्षा सूची में',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
    dot: 'bg-amber-500'
  },
  WEIGHING: {
    label: 'Weighing in Progress',
    labelHi: 'तौल जारी है',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Scale,
    dot: 'bg-purple-500'
  },
  QUALITY_CHECK: {
    label: 'Quality Inspection',
    labelHi: 'गुणवत्ता परीक्षण',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: FlaskConical,
    dot: 'bg-indigo-500'
  },
  ACCEPTED: {
    label: 'Quality Accepted',
    labelHi: 'फसल स्वीकृत',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
    dot: 'bg-emerald-500'
  },
  PAYMENT_PENDING: {
    label: 'DBT Payment Pending',
    labelHi: 'भुगतान प्रक्रियाधीन',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: CreditCard,
    dot: 'bg-orange-500'
  },
  COMPLETED: {
    label: 'Procurement Completed',
    labelHi: 'खरीद पूर्ण / भुगतान प्राप्त',
    color: 'bg-green-50 text-green-800 border-green-300 font-semibold',
    icon: CheckCheck,
    dot: 'bg-green-600'
  },
  REJECTED: {
    label: 'Quality Rejected',
    labelHi: 'अस्वीकृत',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
    dot: 'bg-rose-500'
  }
};

export default function StatusBadge({ status, size = 'md', showIcon = true }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Clock,
    dot: 'bg-gray-400'
  };

  const Icon = config.icon;
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.color} ${
        isSm ? 'px-2.5 py-0.5 text-xs' : isLg ? 'px-4 py-1.5 text-sm font-semibold' : 'px-3 py-1 text-xs'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot} ${status === 'WEIGHING' || status === 'QUALITY_CHECK' ? 'animate-ping' : ''}`} />
      {showIcon && <Icon className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      <span>{config.label}</span>
    </span>
  );
}
