import { z } from 'zod';

export const petugasLoginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});
export type PetugasLoginFormValues = z.infer<typeof petugasLoginSchema>;

export const gantiPasswordSchema = z
  .object({
    passwordLama: z.string().min(1, 'Password lama wajib diisi'),
    passwordBaru: z.string().min(8, 'Minimal 8 karakter'),
    ulangi: z.string().min(1, 'Ulangi password wajib diisi'),
  })
  .refine((v) => v.passwordBaru === v.ulangi, {
    path: ['ulangi'],
    message: 'Password tidak sama dengan sebelumnya',
  })
  .refine((v) => v.passwordBaru !== v.passwordLama, {
    path: ['passwordBaru'],

    message: 'Password baru harus berbeda dari yang lama',
  });
export type GantiPasswordFormValues = z.infer<typeof gantiPasswordSchema>;
