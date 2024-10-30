import triggerEvent from './event'
import { sleep } from './utils'

interface TextFieldData {
  value: string
  delay?: number
  clearValue?: boolean
}

interface CheckboxRadioData {
  selected: boolean
}

interface SelectData {
  value: string
  selectOptionBy?: 'first-option' | 'last-option' | 'custom-position'
  optionPosition?: number
}

function formEvent(element: HTMLElement, eventType: string, inputType: string, value: string): void {
  const eventInit: EventInit = { bubbles: true, cancelable: true, composed: false }
  triggerEvent(element, eventType, { inputType, data: value, ...eventInit })
  element.dispatchEvent(new Event('change', eventInit))
}

export async function typeText(element: HTMLInputElement | HTMLTextAreaElement, data: TextFieldData): Promise<void> {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    throw new TypeError(
      `Unsupported element type: ${element}. Only HTMLInputElement and HTMLTextAreaElement are supported.`,
    )
  }

  element.focus()
  if (data.clearValue) {
    element.value = ''
    formEvent(element, 'input', 'deleteContentBackward', '')
  }

  for (const char of data.value) {
    element.value += char
    formEvent(element, 'input', 'insertText', char)
    if (data.delay)
      await sleep(data.delay)
  }

  element.blur()
}

export function toggleCheck(element: HTMLInputElement, data: CheckboxRadioData): void {
  if (element.type !== 'checkbox' && element.type !== 'radio')
    throw new Error(`Element is not a checkbox or radio button: ${element.type}`)

  element.checked = data.selected
  formEvent(element, 'change', 'change', data.selected.toString())
}

export function selectOption(element: HTMLSelectElement, data: SelectData): void {
  if (element.tagName !== 'SELECT')
    throw new Error('Element is not a select dropdown')

  const options = Array.from(element.options)
  let selectedOption: HTMLOptionElement | undefined

  switch (data.selectOptionBy) {
    case 'first-option':
      selectedOption = options[0]
      break
    case 'last-option':
      selectedOption = options.at(-1)
      break
    case 'custom-position': {
      const index = Math.min(Math.max(0, data.optionPosition! - 1), options.length - 1)
      selectedOption = options[index]
      break
    }
    default:
      selectedOption = options.find(option => option.value === data.value)
      break
  }

  if (selectedOption) {
    element.value = selectedOption.value
    formEvent(element, 'change', 'change', selectedOption.value)
  }
  else {
    throw new Error('Selected option is undefined.')
  }
}

export async function uploadFile(element: HTMLInputElement, files: File[]): Promise<void> {
  if (element.tagName !== 'INPUT' || element.type !== 'file')
    throw new Error('Element is not a file input')

  const dataTransfer = new DataTransfer()
  if (!element.multiple && files.length > 1) {
    dataTransfer.items.add(files[0])
  }
  else {
    files.forEach((file) => {
      dataTransfer.items.add(file)
    })
  }
  element.files = dataTransfer.files
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

/** 聚焦并选择元素的全部内容 */
function selectAll(element: HTMLElement): void {
  const selection = window.getSelection()
  if (!selection)
    return
  const range = document.createRange()
  range.selectNodeContents(element)
  selection.removeAllRanges()
  selection.addRange(range)
  range.detach()
}

/**
 * 通过模拟 backspace 键删除文本
 */
export function deleteText(element: HTMLElement): void {
  const backSpace = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    keyCode: 8,
    which: 8,
    location: 0,
    key: 'Backspace',
  })
  element.dispatchEvent(backSpace)
}

/**
 *
 * @param element
 * @param data  不考虑延迟~
 */
export async function insertText(element: HTMLElement, data: TextFieldData): Promise<void> {
  const { value, clearValue } = data

  if (!element)
    throw new Error('Element not provided')

  element.focus()

  // 清空内容逻辑
  if (clearValue) {
    selectAll(element)
    // 其实没有必要删除，因为粘贴会覆盖
    await sleep(100) // 增加小延迟以确保命令已处理
    // deleteText(element);
  }

  // delay 20
  // 插入文本，考虑延
  element.focus()
  document.execCommand('insertText', false, value)
  element.dispatchEvent(new Event('change', { bubbles: true }))
  await sleep(300) // 增加小延迟以确保命令已处理
  // cursor 移动到最后
  element.focus()
  selectAll(element)
  await sleep(300) // 增加小延迟以确保命令已处理

  // 右方向键移动到最后
  const keydown = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    keyCode: 39,
    which: 39,
    location: 0,
    key: 'ArrowRight',
  })
  element.dispatchEvent(keydown)

  element.blur()
}

// 不适用 textarea
export async function pasteText(element: HTMLElement, data: TextFieldData): Promise<void> {
  const { value, clearValue } = data

  if (!element)
    throw new Error('Element not provided')

  element.focus() // 确保元素已聚焦
  // 清空内容逻辑
  if (clearValue) {
    selectAll(element)
    // 其实没有必要删除，因为粘贴会覆盖
    await sleep(100) // 增加小延迟以确保命令已处理
    deleteText(element)
  }

  element.focus() // 确保元素已聚焦
  // 创建 DataTransfer 对象来模拟剪贴板操作
  const dataTransfer = new DataTransfer()
  dataTransfer.setData('text/plain', value)
  element.dispatchEvent(
    new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true,
    }),
  )

  await sleep(10) // 再次延迟以确保粘贴操作完成
  element.dispatchEvent(new Event('change', { bubbles: true }))
  element.blur()
}

export const form = {
  typeText,
  insertText,
  pasteText,
  toggleCheck,
  selectOption,
  uploadFile,
}
