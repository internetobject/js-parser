import TypeDef from './typedef'
import MemberDef from './memberdef'
import ErrorCodes from '../errors/io-error-codes'
import KeyValueCollection from '../header'

import { TypedefRegistry } from './typedef-registry'
import { doCommonTypeCheck } from './utils'
import { ParserTreeValue, Node } from '../parser/index'
import { isParserTree, isKeyVal } from '../utils/is'
import { InternetObjectError, InternetObjectSyntaxError } from '../errors/io-error'

/**
 * Represents the ObjectTypeDef which is reponsible for parsing,
 * validating, loading and serializing Objects.
 */
class ObjectDef implements TypeDef {
  private _keys: any = null

  /**
   * Returns the type this instance is going to handle.
   * Always returns object
   */
  getType() {
    return 'object'
  }

  /**
   * Parses the object in IO format into JavaScript object.
   */
  parse = (data: ParserTreeValue, memberDef: MemberDef, vars?: KeyValueCollection): any => {
    const value = isParserTree(data) ? data.values : undefined
    return this._process(memberDef, value, data, vars)
  }

  /**
   * Loads the JavaScript object.
   */
  load = (data: any, memberDef: MemberDef): any => {
    return this._process(memberDef, data)
  }

  /**
   * Serializes the object into IO format.
   */
  public serialize = (data: any, memberDef: MemberDef, isRoot: boolean = false): string => {
    if (memberDef.type !== 'object') {
      throw new InternetObjectError(ErrorCodes.invalidObject)
    }

    const validatedData = doCommonTypeCheck(memberDef, data)
    const serialized: string[] = []
    const schema = memberDef.schema

    schema.keys.forEach((key: string, index: number) => {
      const memberDef: MemberDef = schema.defs[key]
      const typeDef = TypedefRegistry.get(memberDef.type)
      const value = validatedData[key]
      const serializedValue = typeDef.serialize(value, memberDef)
      serialized.push(serializedValue)
    })

    if (isRoot) {
      return serialized.join(',')
    }
    return `{${serialized.join(',')}}`
  }

  // Process the parse and load requests
  private _process = (
    memberDef: MemberDef,
    value: any,
    node?: ParserTreeValue,
    vars?: KeyValueCollection
  ) => {
    const validatedData = doCommonTypeCheck(memberDef, value, node)
    if (validatedData !== value || validatedData === null || validatedData === undefined) {
      return validatedData
    }

    const schema = memberDef.schema
    const object: any = {}
    const fn = isParserTree(node) ? 'parse' : 'load'

    // When indexMode is on, members are read/loaded from the index.
    let indexMode: boolean = true
    if (isParserTree(node)) {
      node.values.forEach((dataItem: any, index: number) => {
        if (isKeyVal(dataItem)) {
          indexMode = false

          const key = dataItem.key
          const memberDef: MemberDef = schema.defs[key]

          // When memberDef is not found, ignore such member
          if (memberDef === undefined) return

          const typeDef: TypeDef = TypedefRegistry.get(memberDef.type)
          object[dataItem.key] = typeDef.parse(dataItem.value, memberDef, vars)
        }
        // Process members only when the indexMode is true.
        else if (indexMode || dataItem === undefined) {
          const key = schema.keys[index]
          const memberDef: MemberDef = schema.defs[key]
          const typeDef: TypeDef = TypedefRegistry.get(memberDef.type)
          object[key] = typeDef.parse(dataItem, memberDef, vars)
        } else {
          throw new InternetObjectSyntaxError(ErrorCodes.positionalMemberAfterKeywordMember)
        }
      })
    } else {
      const keys = Object.keys(value)

      keys.forEach((key, index) => {
        const memberDef: MemberDef = schema.defs[key]

        // When memberDef is not found, ignore such member
        if (memberDef === undefined) return

        const typeDef: TypeDef = TypedefRegistry.get(memberDef.type)

        const dataItem = value[key]
        object[key] = typeDef.load(dataItem, memberDef)
      })
    }

    return object
  }
}

export default ObjectDef
