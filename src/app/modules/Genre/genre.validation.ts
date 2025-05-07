import { z } from "zod";
import { EGenreStatus } from "./genre.interface";

const createGenre = z.object({
    name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Invalid type string is required',
    })
    .nonempty()
    .max(50),
  imageUrl: z.string().url('Invalid url').optional(),
})


const updateGenre = createGenre.partial()


const changeGenreStatus = z.object({
  status: z.enum([EGenreStatus.ACTIVE,EGenreStatus.INACTIVE]),
});


export default  {
    createGenre,
    updateGenre,
    changeGenreStatus
}