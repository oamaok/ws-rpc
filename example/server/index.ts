import {
  createApi,
  CreateApiInterfaceType,
  CreateApiResponseType,
  CreateApiRequestType,
} from '../../lib/createApi'

const api = createApi({
  
})

type ApiInterface = CreateApiInterfaceType<typeof api>
type ApiResponse = CreateApiResponseType<typeof api>
type ApiRequest = CreateApiRequestType<typeof api>

export { api, ApiInterface, ApiResponse, ApiRequest }
