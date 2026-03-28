import { z } from 'zod';

const MAX_NAME_LENGTH = 100;

export const saveTemplateSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: 'Tên mẫu không được bỏ trống' })
    .max(MAX_NAME_LENGTH, { message: `Tên mẫu không được vượt quá ${MAX_NAME_LENGTH} ký tự` }),
  tags: z.array(z.string().min(1).trim()).default([]),
});

export type SaveTemplateFormData = z.infer<typeof saveTemplateSchema>;

export const saveTemplateDefaults: SaveTemplateFormData = {
  name: '',
  tags: [],
};

export { MAX_NAME_LENGTH };
