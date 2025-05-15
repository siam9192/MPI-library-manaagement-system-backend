import { Schema } from "mongoose";
import { EAuditLogCategory, IAuditLog } from "./audit-log.interface";

const AuditLogModelSchema =  new Schema<IAuditLog>({
    performedBy:{
        type:Schema.Types.ObjectId,
        ref:"user"
    },
    category:{
        type:String,
        enum:Object.values(EAuditLogCategory),
        required:true
    },
     action:{
        type:String,
        required:true
    },
    description:{
         type:String,
        required:true
    },
     metaData:{
        type:Object,
        default:false
     }
},{
    timestamps:true
})