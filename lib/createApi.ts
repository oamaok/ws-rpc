import { connection as Connection } from 'websocket'

type SafeValue = null | number | string | boolean
type SafeObject =
  | SafeObject[]
  | Readonly<SafeValue>
  | {
      [key: string]: Readonly<SafeObject>
    }

type BaseFunction = (...args: any) => any

type ApiImplementation<Methods> = ((connection: Connection) => void) & {
  __methods: Methods
}

type CreateApiInterfaceType<Impl> = Impl extends ApiImplementation<
  infer Methods
>
  ? Methods extends {
      [Key in keyof Methods]: BaseFunction
    }
    ? {
        [Key in keyof Methods]: (
          ...args: Parameters<Methods[Key]>
        ) => ReturnType<Methods[Key]> extends Promise<any>
          ? ReturnType<Methods[Key]>
          : Promise<ReturnType<Methods[Key]>>
      }
    : never
  : never

type CreateApiResponseType<Impl> = Impl extends ApiImplementation<infer Methods>
  ? Methods extends Record<infer Method, BaseFunction>
    ? {
        type: 'RPC'
        id: string
        time: number
        payload: {
          method: Method
          returnValue: ReturnType<Methods[Method]>
        }
      }
    : never
  : never

type CreateApiRequestType<Impl> = Impl extends ApiImplementation<infer Methods>
  ? Methods extends Record<infer Method, BaseFunction>
    ? {
        type: 'RPC'
        id: string
        time: number
        payload: {
          method: Method
          parameters: Parameters<Methods[Method]>
        }
      }
    : never
  : never

function createApi<Methods extends Record<string, BaseFunction>>(
  methods: Methods extends Record<
    string,
    (...args: infer Params) => SafeObject | Promise<SafeObject>
  >
    ? Extract<Params, SafeObject[]> extends never
      ? never
      : Methods
    : never
): ApiImplementation<Methods> {
  type ApiRequest = CreateApiRequestType<ApiImplementation<Methods>>

  const controller: ApiImplementation<Methods> = (connection: Connection) => {
    connection.on('message', async (message) => {
      if (message.type !== 'utf8') return

      const { id, payload }: ApiRequest = JSON.parse(message.utf8Data)
      const controller = methods[payload.method] as any
      const returnValue = await controller(...payload.parameters)
      // FIXME: Figure out if CreateApiRequestType<> can be used here
      const response: any = {
        id,
        time: Date.now(),
        type: 'RPC',
        payload: {
          method: payload.method,
          returnValue,
        },
      }

      connection.send(JSON.stringify(response))
    })
  }

  controller.__methods = methods

  return controller
}

export {
  createApi,
  CreateApiResponseType,
  CreateApiInterfaceType,
  CreateApiRequestType,
}
