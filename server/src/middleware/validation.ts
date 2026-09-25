import { Request, Response, NextFunction } from "express";
import { ZodTypeAny, ZodError } from "zod";

export const validateRequest = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shape = (schema as any).shape || (schema as any)._def?.schema?.shape;
      if (shape && (shape.body || shape.query || shape.params)) {
        await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
      } else {
        await schema.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => {
          const path = err.path[0] === "body" || err.path[0] === "query" || err.path[0] === "params"
            ? err.path.slice(1).join(".")
            : err.path.join(".");
          return {
            field: path || "root",
            message: err.message,
          };
        });

        res.status(400).json({
          success: false,
          message: "Validation Failed",
          errors: formattedErrors,
        });
        return;
      }
      next(error);
    }
  };
};

export default validateRequest;
