import 'jest'
import Tokenizer from '../../src/parser/tokenizer'
import ErrorCodes from '../../src/errors/io-error-codes'

describe('String', () => {
  it('parses the simple string', () => {
    const tokenizer = new Tokenizer('Hello World')
    tokenizer.readAll()
    let token = tokenizer.get(0)
    expect(tokenizer.length).toBe(1)
    expect(token.value).toBe('Hello World')
    expect(token.type).toBe('string')
    expect(token.col).toBe(1)
    expect(token.row).toBe(1)
    expect(token.index).toBe(0)
  })

  it('String with emoji', () => {
    const tokenizer = new Tokenizer(`Hello World 😀`)
    tokenizer.readAll()
    let token = tokenizer.get(0)
    expect(tokenizer.length).toBe(1)
    expect(token.value).toBe('Hello World 😀')
    expect(token.type).toBe('string')
    expect(token.col).toBe(1)
    expect(token.row).toBe(1)
    expect(token.index).toBe(0)
  })

  it('String with surrounding white spaces', () => {
    const tokenizer = new Tokenizer(`   Hello World 😀   `)
    tokenizer.readAll()
    let token = tokenizer.get(0)
    expect(tokenizer.length).toBe(1)
    expect(token.value).toBe('Hello World 😀')
    expect(token.type).toBe('string')
    expect(token.col).toBe(4)
    expect(token.row).toBe(1)
    expect(token.index).toBe(3)
  })

  it('String with newline', () => {
    const tokenizer = new Tokenizer(`   Hello
    World 😀   `)
    tokenizer.readAll()
    let token = tokenizer.get(0)
    expect(tokenizer.length).toBe(1)
    expect(token.value).toBe(`Hello
    World 😀`)
    expect(token.type).toBe('string')
    expect(token.col).toBe(4)
    expect(token.row).toBe(1)
    expect(token.index).toBe(3)
  })

  it('Other open string tets', () => {
    expect(new Tokenizer(`    Hello World " ' " `).readAll().get(0).value).toBe(
      'Hello World " \' "'
    )

    expect(new Tokenizer(`    Hello World " ' `).readAll().get(0).value).toBe('Hello World " \'')
  })

  it('String with newline - 2', () => {
    const tokenizer = new Tokenizer(`   Hello\nWorld 😀   `)
    tokenizer.readAll()
    let token = tokenizer.get(0)
    expect(tokenizer.length).toBe(1)
    expect(token.value).toBe(`Hello\nWorld 😀`)
    expect(token.type).toBe('string')
    expect(token.col).toBe(4)
    expect(token.row).toBe(1)
    expect(token.index).toBe(3)
  })

  it('String with quotes', () => {
    const tokenizer = new Tokenizer(`   "Hello\nWorld 😀"   `)
    tokenizer.readAll()
    let token = tokenizer.get(0)
    expect(tokenizer.length).toBe(1)
    expect(token.value).toBe(`Hello\nWorld 😀`)
    expect(token.type).toBe('string')
    expect(token.col).toBe(4)
    expect(token.row).toBe(1)
    expect(token.index).toBe(3)
  })

  it('String with quotes escaped', () => {
    const tokenizer = new Tokenizer(`"Hello\\"World\\" 😀"`)
    tokenizer.readAll()
    let token = tokenizer.get(0)
    expect(tokenizer.length).toBe(1)
    expect(token.value).toBe(`Hello"World" 😀`)
    expect(token.type).toBe('string')
    expect(token.col).toBe(1)
    expect(token.row).toBe(1)
    expect(token.index).toBe(0)
  })

  it('String with other escapes escaped', () => {
    const tokenizer = new Tokenizer(`"  \\Hello\\nWorld\\t 😀  "`)
    tokenizer.readAll()
    let token = tokenizer.get(0)
    expect(tokenizer.length).toBe(1)
    expect(token.value).toBe(`  Hello\nWorld\t 😀  `)
    expect(token.type).toBe('string')
    expect(token.col).toBe(1)
    expect(token.row).toBe(1)
    expect(token.index).toBe(0)
  })

  it('Do not escape non-escaped keywords', () => {
    const tokenizer = new Tokenizer(`"Hello//\\sWorld\\a 😀"`)
    tokenizer.readAll()
    let token = tokenizer.get(0)
    expect(token.value).toBe(`Hello//sWorlda 😀`)
  })

  it('normalizes various platform specific newline modes to \\n', () => {
    expect(new Tokenizer('one\ntwo').readAll().get(0).value).toBe(`one\ntwo`)

    expect(new Tokenizer('one\r\ntwo').readAll().get(0).value).toBe(`one\ntwo`)

    expect(new Tokenizer('one\rtwo').readAll().get(0).value).toBe(`one\ntwo`)
  })

  it('Other regular string tets', () => {
    expect(() => {
      new Tokenizer(`"    Hello World  `).readAll()
    }).toThrowError()

    expect(new Tokenizer(`    " Hello [ testing ] " `).readAll().get(0).value).toBe(
      ' Hello [ testing ] '
    )

    expect(new Tokenizer(`    "---" `).readAll().get(0).value).toBe('---')

    expect(new Tokenizer(`    "123" `).readAll().get(0).value).toBe('123')
  })

  it('Raw strings', () => {
    let tokenizer = new Tokenizer(String.raw`'c:\program files\nodepad++'`)
    let token = tokenizer.readAll().get(0)
    expect(token.value).toBe(`c:\\program files\\nodepad++`)

    tokenizer = new Tokenizer(String.raw`'c:\program
    files\nodepad++'`)
    token = tokenizer.readAll().get(0)
    expect(token.value).toBe(`c:\\program
    files\\nodepad++`)

    tokenizer = new Tokenizer(String.raw`'  string with leading and trailing spaces  '`)
    token = tokenizer.readAll().get(0)
    expect(token.value).toBe(`  string with leading and trailing spaces  `)
  })

  it('Raw strings " escape', () => {
    let tokenizer = new Tokenizer(String.raw`'alert(''hello world'')'`)
    let token = tokenizer.readAll().get(0)
    expect(token.value).toBe(`alert('hello world')`)
  })

  it('Other raw string tets', () => {
    expect(() => {
      new Tokenizer(`"    Hello World  `).readAll()
    }).toThrowError()

    expect(new Tokenizer(`    ' Hello [ testing ] ' `).readAll().get(0).value).toBe(
      ' Hello [ testing ] '
    )

    expect(new Tokenizer(`    '---' `).readAll().get(0).value).toBe('---')

    expect(new Tokenizer(`    '123' `).readAll().get(0).value).toBe('123')
  })
})
