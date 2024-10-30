import { cursor } from './cursor'
import { form } from './form'
import { keyPress } from './key-press'

const name = 'web-interaction'
const description = 'extension web interaction methods'

export const human = {
  cursor,
  form,
  keyPress,
}

export default {
  name,
  description,
  human,
}
