import React from 'react'
import handlers from './handlers'

const defaultHandler =
  (name: string | number) =>
  // eslint-disable-next-line react/display-name
  (props: JSX.IntrinsicAttributes, components: { [x: string]: any }) => {
    const Comp = components[name]
    return Comp ? <Comp {...props} /> : React.createElement(name, props)
  }

function handleNode(
  node: { tag?: any; props?: any; data?: any; nodes?: any },
  components: any,
  i = undefined
) {
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
  const props = { ...node.props, key: i }

  // Always send className as a string
  if (props.className && Array.isArray(props.className)) {
    props.className = props.className.join(' ')
  }

  if (node.data) {
    props.data = node.data
  }

  if (nodes && Array.isArray(nodes)) {
    props.children = nodes.map((node, i) => handleNode(node, components, i))
  }

  const element = handler(props, components, i, node)

  if (!element) {
    console.error('A handler returned null for:', node)
  }

  return element
}

export default function Node({ components, node }) {
  return handleNode(node, components)
}
