import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { logger } from "../logger";

/**
 * Middleware to validate request body against a Zod schema
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      logger.warn("Request validation failed", {
        path: req.path,
        errors: result.error.errors,
      });

      return res.status(400).json({
        message: "Invalid request data",
        errors: result.error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      });
    }

    // Replace req.body with parsed data
    req.body = result.data;
    next();
  };
}

/**
 * Middleware to validate query parameters against a Zod schema
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      logger.warn("Query validation failed", {
        path: req.path,
        errors: result.error.errors,
      });

      return res.status(400).json({
        message: "Invalid query parameters",
        errors: result.error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      });
    }

    req.query = result.data;
    next();
  };
}

/**
 * Middleware to validate route params against a Zod schema
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      logger.warn("Params validation failed", {
        path: req.path,
        errors: result.error.errors,
      });

      return res.status(400).json({
        message: "Invalid route parameters",
        errors: result.error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      });
    }

    req.params = result.data;
    next();
  };
}
