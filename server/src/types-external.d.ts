declare module 'written-number' {
  interface Options { lang?: string }
  interface WrittenNumberFn {
    (n: number, options?: Options): string;
    defaults: { lang: string };
  }
  const writtenNumber: WrittenNumberFn;
  export default writtenNumber;
}
