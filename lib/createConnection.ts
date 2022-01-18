import {
  CreateApiDefinitionType,
  RequestType,
  ResponseType,
} from "./createApi";

function createConnection<
  ApiDefinition extends {
    request: RequestType<string, any>;
    response: ResponseType<string, any>;
    interface: { [key: string]: (...args: any) => Promise<any> };
  }
>(address: string | URL, protocols?: string | string[]) {
  type ApiRequest = ApiDefinition["request"];
  type ApiResponse = ApiDefinition["response"];
  type ApiInterface = ApiDefinition["interface"];
  type A = keyof ApiInterface;

  const socket = new WebSocket(address, protocols);

  const queries: Map<
    string,
    {
      request: ApiRequest;
      resolve: (...args: any) => void;
    }
  > = new Map();

  let requestQueue: ApiRequest[] = [];

  socket.addEventListener("message", (msg) => {
    const data: ApiResponse = JSON.parse(msg.data);

    // TODO(teemu): Handle broadcasts
    if (data.type === "RPC") {
      const { id, payload } = data;

      const query = queries.get(id);
      if (query) {
        const { resolve } = query;
        resolve(payload.returnValue);
      }
    }
  });

  function sendRequest(request: ApiRequest) {
    socket.send(JSON.stringify(request));
  }

  socket.addEventListener("open", () => {
    requestQueue.forEach(sendRequest);
    requestQueue = [];
  });

  function query<Method extends keyof ApiInterface>(
    method: Method,
    parameters: Parameters<ApiInterface[Method]>
  ): Promise<ReturnType<ApiInterface[Method]>> {
    const request: ApiRequest = {
      type: "RPC",
      id: crypto.randomUUID(),
      time: Date.now(),
      payload: {
        method,
        parameters,
      },
    };

    if (socket.readyState === WebSocket.OPEN) {
      sendRequest(request);
    } else {
      requestQueue.push(request);
    }

    return new Promise<ReturnType<ApiInterface[Method]>>((resolve) => {
      // TODO(teemu): Timeouts?
      queries.set(request.id, { request, resolve });
    });
  }

  const server = new Proxy<ApiInterface>({} as any, {
    get:
      <Method extends keyof ApiInterface>(_: any, name: string) =>
      (...parameters: Parameters<ApiInterface[Method]>) =>
        query(name as Method, parameters),
  });

  return server;
}

export default createConnection;
