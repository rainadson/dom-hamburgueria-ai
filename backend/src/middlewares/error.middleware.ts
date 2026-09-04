import type { ErrorRequestHandler } from "express";
import { reportFailure } from "./request-context.middleware";

export const handleApiError: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) { next(error); return; }
  if (error?.type === "entity.parse.failed" && error?.status === 400) {
    res.status(400).json({message:"O corpo da requisição deve conter JSON válido."});
    return;
  }
  if (error?.type === "entity.too.large" && error?.status === 413) {
    res.status(413).json({message:"A requisição excede o tamanho permitido."});
    return;
  }
  reportFailure(res, "Falha interna ao atender requisição da API.");
  res.status(500).json({message:"Não foi possível concluir a requisição."});
};
