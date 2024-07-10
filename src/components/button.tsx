import clsx from 'clsx'
import React, { createContext, ReactNode, useContext } from 'react'
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  Text,
  TextProps,
} from 'react-native'

type Variants = 'primary' | 'secondary'

type ButtonProps = PressableProps & {
  variant?: Variants
  isLoading?: boolean
  children: ReactNode
}

const ButtonVariantContext = createContext<Variants>('primary')

function Button({
  isLoading,
  variant = 'primary',
  children,
  ...rest
}: ButtonProps) {
  return (
    <ButtonVariantContext.Provider value={variant}>
      <Pressable
        className={clsx(
          'h-11 w-full flex-row items-center justify-center gap-2 rounded-lg',
          { 'bg-lime-300': variant === 'primary' },
          { 'bg-zinc-800': variant === 'secondary' },
        )}
        disabled={isLoading}
        {...rest}
      >
        {isLoading ? <ActivityIndicator className="text-lime-950" /> : children}
      </Pressable>
    </ButtonVariantContext.Provider>
  )
}

function Title({ children, ...rest }: TextProps) {
  const variant = useContext(ButtonVariantContext)
  return (
    <Text
      className={clsx(
        'font-semibold text-base',
        { 'text-lime-950': variant === 'primary' },
        { 'text-zinc-300': variant === 'secondary' },
      )}
      {...rest}
    >
      {children}
    </Text>
  )
}

Button.Title = Title

export { Button }
