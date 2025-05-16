import { model, Schema } from 'mongoose';
import { EAuditLogCategory, IAuditLog } from './audit-log.interface';

const AuditLogModelSchema = new Schema<IAuditLog>(
  {
    category: {
      type: String,
      enum: Object.values(EAuditLogCategory),
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metaData: {
      type: Object,
      default: false,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'user',
    },
  },
  {
    timestamps: true,
  }
);

const AuditLog = model<IAuditLog>('AuditLog', AuditLogModelSchema);

export default AuditLog;
