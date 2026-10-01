import type { ComponentProps } from 'react'
import cs from 'classnames'

export const P = ({ className, ...p }: ComponentProps<'p'>) => (
  <p className={cs('static-tweet-p', className)} {...p} />
)

export const Blockquote = ({
  className,
  ...p
}: ComponentProps<'blockquote'>) => (
  <blockquote className={cs('static-tweet-blockquote', className)} {...p} />
)

export const Hr = ({ className, ...p }: ComponentProps<'hr'>) => (
  <hr className={cs('static-tweet-hr', className)} {...p} />
)
