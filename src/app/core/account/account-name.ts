export function accountNameError(name: string): string | null {
  const length = Array.from(name.trim()).length;
  if (length === 0) return 'Nhập họ và tên.';
  if (length > 100) return 'Họ và tên tối đa 100 ký tự.';
  return null;
}
