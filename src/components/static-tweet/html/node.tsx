import {
  createElement,
  type ComponentType,
  type Key,
  type ReactNode
} from 'react'
import handlers from './handlers'
import type {
  TweetNode,
  TweetComponents,
  TweetHandler,
  TweetRenderProps
} from '../types'

const defaultHandler =
  (name: string): TweetHandler =>
  (props, components, key) => {
    // The AST dispatches heterogeneous HTML renderers by tag name.
    const Comp = components[name as keyof TweetComponents] as
      | ComponentType<TweetRenderProps>
      | undefined
    if (Comp) return <Comp key={key} {...props} />
    const { data: _data, dataType: _dataType, ...attributes } = props
    return createElement(name, { ...attributes, key })
  }

function handleNode(
  node: TweetNode | undefined,
  components: TweetComponents,
  i?: Key
): ReactNode {
  if (!node) {
    return null
  }

  if (typeof node === 'string') {
    return node
  }

  const handler = handlers[node.tag] || defaultHandler(node.tag)

  if (!handler) {
    console.error('tweet error missing handler for:', node)
    return null
  }

  const { nodes } = node
  const props: TweetRenderProps = {
    ...node.props,
    className: Array.isArray(node.props?.className)
      ? node.props.className.join(' ')
      : node.props?.className
  }

  if (node.data) {
    props.data = node.data
  }

  if (nodes && Array.isArray(nodes)) {
    props.children = nodes.map((node, i) => handleNode(node, components, i))
  }

  const element = handler(props, components, i)

  if (!element) {
    console.error('A handler returned null for:', node)
  }

  return element
}

export default function Node({
  components,
  node
}: {
  components: TweetComponents
  node?: TweetNode
}): ReactNode {
  return handleNode(node, components)
}
