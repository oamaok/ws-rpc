import { v4 as uuid } from 'uuid'

import { api, ApiInterface, ApiResponse, ApiRequest } from '../server/api'

const socket = new WebSocket('ws://localhost:8080', ['livingroom'])
const queries: Map<
  string,
  {
    request: ApiRequest
    resolve: (args: any) => void
  }
> = new Map()

let requestQueue: ApiRequest[] = []

socket.addEventListener('message', (msg) => {
  const data: ApiResponse = JSON.parse(msg.data)

  // TODO(teemu): Handle broadcasts
  if (data.type === 'RPC') {
    const { id, payload } = data

    const query = queries.get(id)
    if (query) {
      const { resolve } = query
      resolve(payload.returnValue)
    }
  }
})

socket.addEventListener('open', () => {
  requestQueue.forEach(sendRequest)
  requestQueue = []
})

function sendRequest(request: ApiRequest) {
  socket.send(JSON.stringify(request))
}

function query<Method extends keyof ApiInterface>(
  method: Method,
  parameters: Parameters<ApiInterface[Method]>
): Promise<ReturnType<ApiInterface[Method]>> {
  const request: ApiRequest = {
    type: 'RPC',
    id: uuid(),
    time: Date.now(),
    payload: {
      method,
      parameters,
    },
  }

  if (socket.readyState === WebSocket.OPEN) {
    sendRequest(request)
  } else {
    requestQueue.push(request)
  }

  return new Promise<ReturnType<ApiInterface[Method]>>((resolve) => {
    // TODO(teemu): Timeouts?
    queries.set(request.id, { request, resolve })
  })
}

const server = new Proxy<ApiInterface>({} as any, {
  get: <Method extends keyof ApiInterface>(_: never, name: Method) => (
    ...parameters: Parameters<ApiInterface[Method]>
  ) => query(name, parameters),
})

export { server }