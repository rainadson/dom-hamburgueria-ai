export function validChatInput(value: unknown): value is {phone:string;message:string} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const {phone,message} = value as Record<string,unknown>;
  return typeof phone === "string" && phone.trim().length > 0 && phone.length <= 20
    && typeof message === "string" && message.trim().length > 0 && message.length <= 4000;
}
