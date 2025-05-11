// bookPermissions.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const BookPermissionsSchema = new Schema(
  {
    canViewBooks: { type: Boolean, default: false },
    canAddBooks: { type: Boolean, default: false },
    canEditBooks: { type: Boolean, default: false },
    canDeleteBooks: { type: Boolean, default: false },
  },
  { _id: false }
);

const NotificationPermissionsSchema = new Schema(
  {
    canView: { type: Boolean, default: false },
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
    canSend: { type: Boolean, default: false },
  },
  { _id: false }
);

const SystemPermissionsSchema = new Schema(
  {
    canChangePassword: { type: Boolean, default: false },
    canUpdateProfile: { type: Boolean, default: false },
    canConfigureBasicSettings: { type: Boolean, default: false },
    canConfigureCriticalSettings: { type: Boolean, default: false },
  },
  { _id: false }
);
