/**
 * Tiny recursive-descent parser for arithmetic expressions.
 * Supports + - * / % ^ ( ) and unary minus. No eval / new Function.
 */
export function evaluateExpression(expr: string): number {
  let pos = 0
  const input = expr.replace(/\s+/g, '')
  if (!input) throw new Error('Empty expression')

  const peek = () => input[pos]
  const consume = () => input[pos++]

  // expression := term (('+' | '-') term)*
  function parseExpression(): number {
    let value = parseTerm()
    while (peek() === '+' || peek() === '-') {
      const op = consume()
      const rhs = parseTerm()
      value = op === '+' ? value + rhs : value - rhs
    }
    return value
  }

  // term := factor (('*' | '/' | '%') factor)*
  function parseTerm(): number {
    let value = parseFactor()
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = consume()
      const rhs = parseFactor()
      if (op === '*') value *= rhs
      else if (op === '/') {
        if (rhs === 0) throw new Error('Division by zero')
        value /= rhs
      } else {
        if (rhs === 0) throw new Error('Modulo by zero')
        value %= rhs
      }
    }
    return value
  }

  // factor := base ('^' factor)?   (right-associative)
  function parseFactor(): number {
    const base = parseUnary()
    if (peek() === '^') {
      consume()
      return Math.pow(base, parseFactor())
    }
    return base
  }

  // unary := '-' unary | primary
  function parseUnary(): number {
    if (peek() === '-') {
      consume()
      return -parseUnary()
    }
    if (peek() === '+') {
      consume()
      return parseUnary()
    }
    return parsePrimary()
  }

  // primary := number | '(' expression ')'
  function parsePrimary(): number {
    if (peek() === '(') {
      consume()
      const value = parseExpression()
      if (peek() !== ')') throw new Error(`Expected ')' at position ${pos}`)
      consume()
      return value
    }
    const start = pos
    while (pos < input.length && /[\d.]/.test(input[pos])) pos++
    if (start === pos) throw new Error(`Unexpected character '${peek() ?? 'end'}' at position ${pos}`)
    const num = Number(input.slice(start, pos))
    if (Number.isNaN(num)) throw new Error(`Invalid number '${input.slice(start, pos)}'`)
    return num
  }

  const result = parseExpression()
  if (pos < input.length) throw new Error(`Unexpected character '${peek()}' at position ${pos}`)
  return result
}
