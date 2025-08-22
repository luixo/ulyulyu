export type NoNullableField<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

export type Tail<T> = T extends [unknown, ...infer Rest] ? Rest : never;

export type Equals<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

export type AssertTrue<A extends true, X> = A extends true ? X : never;
