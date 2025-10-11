import type { Request, Response, NextFunction } from "express";
export type RequestExtended = Request & {
    token?: string;
};
export declare const generateToken: (req: RequestExtended, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=mpesaAuth.d.ts.map