import { z } from "zod";
import { EManagementAccountRegistrationRequestRole } from "./management-account-registration-request.interface";

const createRegistrationRequest = z.object({
    email:z.string().email(),
    role:z.nativeEnum(EManagementAccountRegistrationRequestRole),
})



export default {
    createRegistrationRequest
}

