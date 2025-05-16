import { Schema } from 'mongoose';
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
    targetId:Schema.Types.ObjectId,
    metaData: {
      type: Object,
      default: false,
    },

      performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'user',
    }
  },
  {
    timestamps: true,
  }
);
