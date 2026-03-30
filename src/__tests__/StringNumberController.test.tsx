import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { StringNumberController } from '../components/form/StringNumberController';

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({ t: (key: string) => key, i18n: { language: 'vi' } })),
}));

interface TestFormValues {
  testField: number;
}

function TestWrapper({
  defaultValue = 50,
  min,
  max,
}: {
  defaultValue?: number;
  min?: number;
  max?: number;
}) {
  const { control } = useForm<TestFormValues>({
    defaultValues: { testField: defaultValue },
  });

  return (
    <StringNumberController<TestFormValues>
      name="testField"
      control={control}
      testId="test-input"
      min={min}
      max={max}
    />
  );
}

function TestWrapperWithSetValue({ defaultValue = 50 }: { defaultValue?: number }) {
  const { control, setValue } = useForm<TestFormValues>({
    defaultValues: { testField: defaultValue },
  });

  return (
    <>
      <StringNumberController<TestFormValues>
        name="testField"
        control={control}
        testId="test-input"
      />
      <button data-testid="set-75" onClick={() => setValue('testField', 75 as never)}>
        Set 75
      </button>
      <button data-testid="set-0" onClick={() => setValue('testField', 0 as never)}>
        Set 0
      </button>
    </>
  );
}

describe('StringNumberController – handleBlur', () => {
  it('restores previous value on blur when input is empty', () => {
    render(<TestWrapper defaultValue={50} />);
    const input = screen.getByTestId('test-input') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(input.value).toBe('50');
  });

  it('restores previous value on repeated clear and blur', () => {
    render(<TestWrapper defaultValue={50} />);
    const input = screen.getByTestId('test-input') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');

    fireEvent.blur(input);
    expect(input.value).toBe('50');

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(input.value).toBe('50');
  });

  it('restores previous value when input is non-numeric on blur', () => {
    render(<TestWrapper defaultValue={50} />);
    const input = screen.getByTestId('test-input') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);

    expect(input.value).toBe('50');
  });

  it('clamps value on blur when input is valid', () => {
    render(<TestWrapper defaultValue={50} min={10} max={100} />);
    const input = screen.getByTestId('test-input') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '200' } });
    fireEvent.blur(input);

    expect(input.value).toBe('100');
  });

  it('clamps to min value on blur', () => {
    render(<TestWrapper defaultValue={50} min={10} max={100} />);
    const input = screen.getByTestId('test-input') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.blur(input);

    expect(input.value).toBe('10');
  });

  it('handles blur with valid in-range value', () => {
    render(<TestWrapper defaultValue={50} min={0} max={100} />);
    const input = screen.getByTestId('test-input') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '75' } });
    fireEvent.blur(input);

    expect(input.value).toBe('75');
  });

  it('handles blur when localValue is "-"', () => {
    render(<TestWrapper defaultValue={50} />);
    const input = screen.getByTestId('test-input') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '-' } });
    fireEvent.blur(input);

    expect(input.value).toBe('50');
  });

  it('restores previous value (0) when repeatedly clearing and blurring', () => {
    render(<TestWrapper defaultValue={0} />);
    const input = screen.getByTestId('test-input') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(input.value).toBe('0');

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(input.value).toBe('0');
  });

  it('restores previous valid value on blur when cleared', () => {
    render(<TestWrapper defaultValue={50} />);
    const input = screen.getByTestId('test-input') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '42' } });
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(input.value).toBe('42');
  });

  it('falls back to min prop when no previous value', () => {
    render(<TestWrapper defaultValue={NaN} min={5} />);
    const input = screen.getByTestId('test-input') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(input.value).toBe('5');
  });
});

describe('StringNumberController – external field sync', () => {
  it('syncs local value when field.value changes via setValue', () => {
    render(<TestWrapperWithSetValue defaultValue={50} />);
    const input = screen.getByTestId('test-input') as HTMLInputElement;
    expect(input.value).toBe('50');

    fireEvent.click(screen.getByTestId('set-75'));
    expect(input.value).toBe('75');
  });

  it('syncs local value when field.value is set to 0 via setValue', () => {
    render(<TestWrapperWithSetValue defaultValue={50} />);
    const input = screen.getByTestId('test-input') as HTMLInputElement;
    expect(input.value).toBe('50');

    fireEvent.click(screen.getByTestId('set-0'));
    expect(input.value).toBe('0');
  });
});
