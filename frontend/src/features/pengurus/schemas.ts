import { z } from 'zod';

const password = z.string().min(8, 'Minimal 8 karakter');

export const isiJabatanSchema = z.object({
  username: z
    .string()
    .min(3, 'Minimal 3 karakter')
    .max(32, 'Maksimal 32 karakter'),
  password,
});
export type IsiJabatanFormValues = z.infer<typeof isiJabatanSchema>;

export const passwordBaruSchema = z.object({ password });
export type PasswordBaruFormValues = z.infer<typeof passwordBaruSchema>;
