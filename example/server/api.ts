import { createApi, CreateApiDefinitionType } from "../../lib/createApi";

const api = createApi({
  getSquare(num: number) {
    return num ** 2;
  },
});

type Api = CreateApiDefinitionType<typeof api>;

export { api, Api };
