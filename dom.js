'use strict'

const secret = {
  template: Symbol('content template'),
  firstNodes: Symbol('first nodes')
}
let cloneId = 0

module.exports = {
  extractContent,
  normalizeContent,
  insertContent,
  moveContent,
  removeContent,
  clearContent,
  mutateContext,
  findAncestor,
  findAncestorProp
}

function extractContent (elem) {
  const template = document.createDocumentFragment()
  let node = elem.firstChild
  while (node) {
    template.appendChild(node)
    node = elem.firstChild
  }
  elem[secret.template] = template
  elem[secret.firstNodes] = []
  return template
}

function normalizeContent (node) {
  if (node.nodeType === 1) {
    node.setAttribute('clone-id', `content-${cloneId++}`)
    const childNodes = node.childNodes
    let i = childNodes.length
    while (i--) {
      normalizeContent(childNodes[i])
    }
  } else if (node.nodeType === 3) {
    if (!node.nodeValue.trim()) node.remove()
  } else {
    node.remove()
  }
}

function insertContent (elem, index, contextState) {
  if (index !== undefined && typeof index !== 'number') {
    throw new TypeError('Second argument must be a number or undefined.')
  }
  if (contextState !== undefined && typeof contextState !== 'object') {
    throw new TypeError('Third argument must be an object or undefined.')
  }
  if (!elem[secret.template]) {
    throw new Error('you must extract a template with $extractContent before inserting')
  }
  const content = elem[secret.template].cloneNode(true)
  const firstNodes = elem[secret.firstNodes]
  const firstNode = content.firstChild
  const beforeNode = firstNodes[index]

  if (contextState) {
    contextState = Object.assign(Object.create(elem.$state), contextState)
    let node = firstNode
    while (node) {
      node.$contextState = contextState
      node = node.nextSibling
    }
  }

  elem.insertBefore(content, beforeNode)
  if (beforeNode) firstNodes.splice(index, 0, firstNode)
  else firstNodes.push(firstNode)
}

function removeContent (elem, index) {
  if (index !== undefined && typeof index !== 'number') {
    throw new TypeError('Second argument must be a number or undefined.')
  }
  const firstNodes = elem[secret.firstNodes]
  index = firstNodes[index] ? index : (firstNodes.length - 1)
  const firstNode = firstNodes[index]
  const nextNode = firstNodes[index + 1]


  let node = firstNode
  let next
  while (node && node !== nextNode) {
    next = node.nextSibling
    node.remove()
    node = next
  }

  if (nextNode) firstNodes.splice(index, 1)
  else firstNodes.pop()
}

function clearContent (elem) {
  elem.innerHTML = ''
  elem[secret.firstNodes] = []
}

function moveContent (elem, fromIndex, toIndex, extraContext) {
  if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') {
    throw new Error('first and second argument must be numbers')
  }
  if (extraContext !== undefined && typeof extraContext !== 'object') {
    throw new Error('third argument must be an object or undefined')
  }
  const firstNodes = elem[secret.firstNodes]
  const fromNode = firstNodes[fromIndex]
  const untilNode = firstNodes[fromIndex + 1]
  const toNode = firstNodes[toIndex]

  let node = fromNode
  let next
  while (node && node !== untilNode) {
    next = node.nextSibling
    elem.insertBefore(node, toNode)
    node = next
  }
  firstNodes.splice(fromIndex, 1)
  firstNodes.splice(toIndex, 0, fromNode)

  if (extraContext && fromNode && fromNode.$contextState) {
    Object.assign(fromNode.$contextState, extraContext)
  }
}

function mutateContext (elem, index, extraContext) {
  if (index !== undefined && typeof index !== 'number') {
    throw new TypeError('first argument must be a number or undefined')
  }
  if (typeof extraContext !== 'object') {
    throw new TypeError('second argument must be an object')
  }
  const startNode = elem[secret.firstNodes][index]
  if (startNode && startNode.$contextState) {
    Object.assign(startNode.$contextState, extraContext)
  }
}

function findAncestorProp (node, prop) {
  node = findAncestor(node, node => node[prop] !== undefined)
  return node ? node[prop] : undefined
}

function findAncestor (node, condition) {
  if (!node instanceof Node) {
    throw new TypeError('first argument must be a node')
  }
  if (typeof condition !== 'function') {
    throw new TypeError('second argument must be a function')
  }

  node = node.parentNode
  while (node && !condition(node)) {
    node = node.parentNode
  }
  return node
}
