import { createApi, CreateApiDefinitionType } from "../../lib/createApi";

const api = createApi({
  getSquare(num: number) {
    return num ** 2;
  },

  async waitAndReverse(str: string) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return str.split('').reverse().join('')
  },

  getValueFromDeepObject(obj: { foo: { bar: { value: string } } }) {
    return { message: `The value is "${obj.foo.bar.value}"` }
  }

});

type Api = CreateApiDefinitionType<typeof api>;

export { api, Api };
