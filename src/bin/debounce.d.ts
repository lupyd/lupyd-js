export declare function debounce<T extends (...args: any[]) => void>(callback: T, duration: number): (...args: Parameters<T>) => void;
