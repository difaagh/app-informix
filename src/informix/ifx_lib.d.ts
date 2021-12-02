export function open(connectionString: string, callback?: any): Promise<Cache>;
export function close(): Promise<void>;
export function query<T>(query: string, callback?: (err: Error, res: any) => any): Promise<Array<T>>;
