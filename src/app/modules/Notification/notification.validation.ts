import { z } from "zod";
import { ENotificationType } from "./notification.interface";

const createNotification = z.object({
    userId:z.string().nonempty("userId is required"),
    message:z.string().nonempty("message is required").max(100,"message too long,message can not be getter then 100 characters"),
    type:z.nativeEnum(ENotificationType,{message:`Invalid type type must be in ${Object.values(ENotificationType).join(',')}`})
})


const setMyNotificationsAsRead = z.object({
    ids:z.array(z.string().nonempty("Id can not be empty"))
})

export default {
    createNotification,
    setMyNotificationsAsRead
}