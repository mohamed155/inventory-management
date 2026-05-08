import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { Badge, type badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  cn(
    'relative flex flex-wrap w-full items-start gap-x-3 gap-y-0.5',
    'rounded-lg border px-4 py-3 text-sm',
    '[&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current [&>svg]:shrink-0',
    'has-[>[data-slot=alert-badge]]:pr-16',
    'has-[>svg]:[&>[data-slot=alert-description]]:ms-7',
  ),
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive:
          'bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 [&>svg]:text-current',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'flex-1 min-w-0 line-clamp-1 min-h-4 font-medium tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

function AlertSubtitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-subtitle"
      className={cn(
        'basis-full min-w-0 text-sm font-medium text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'basis-full grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  );
}

function AlertBadge({
  className,
  variant,
  children,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <div
      data-slot="alert-badge"
      className="absolute right-4 top-1/2 -translate-y-1/2"
    >
      <Badge variant={variant} className={className} {...props}>
        {children}
      </Badge>
    </div>
  );
}

export { Alert, AlertTitle, AlertSubtitle, AlertDescription, AlertBadge };
