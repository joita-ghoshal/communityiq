import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' };

export default function Avatar({ src, firstName, lastName, size = 'md', className }: AvatarProps) {
  if (src) {
    return <img src={src} alt="" className={cn('rounded-full object-cover', sizes[size], className)} />;
  }
  return (
    <div className={cn('rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold', sizes[size], className)}>
      {getInitials(firstName, lastName)}
    </div>
  );
}