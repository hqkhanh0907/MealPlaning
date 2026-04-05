import i18n from 'i18next';
import { z } from 'zod';

const MAX_NAME_LENGTH = 100;

export const saveTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: i18n.t('validation.template.nameRequired') })
    .max(MAX_NAME_LENGTH, { error: i18n.t('validation.template.nameMaxLength', { max: MAX_NAME_LENGTH }) }),
  tags: z.array(z.string().min(1).trim()).default([]),
});

export type SaveTemplateFormData = z.infer<typeof saveTemplateSchema>;

export const saveTemplateDefaults: SaveTemplateFormData = {
  name: '',
  tags: [],
};

export { MAX_NAME_LENGTH };
