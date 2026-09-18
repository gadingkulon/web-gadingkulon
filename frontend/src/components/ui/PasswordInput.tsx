import { forwardRef, useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './Input';

type PasswordInputProps = Omit<
  ComponentProps<typeof Input>,
  'type' | 'trailing'
>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [terlihat, setTerlihat] = useState(false);
    const Ikon = terlihat ? EyeOff : Eye;

    return (
      <Input
        ref={ref}
        type={terlihat ? 'text' : 'password'}
        trailing={
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setTerlihat((v) => !v)}
            aria-label={terlihat ? 'Sembunyikan' : 'Tampilkan'}
            className="focus-ring cursor-pointer rounded p-1 text-slate-700 transition-all duration-150 hover:scale-110 hover:text-slate-900 active:scale-95"
          >
            <Ikon className="h-4 w-4" strokeWidth={2.5} />
          </button>
        }
        {...props}
      />
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
