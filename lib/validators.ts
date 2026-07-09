import { z } from "zod";

export const scoreSchema = z.object({
  presenterId: z.number().int().positive(),
  email: z.string().email().toLowerCase(),
  rating: z.number().int().min(1).max(10),
  sessionToken: z.string().uuid(),
});

export const sessionSchema = z.object({
  presenterId: z.number().int().positive(),
});

export const createPresenterSchema = z.object({
  name: z.string().trim().min(1, "Presenter name is required"),
  title: z.string().trim().min(1, "Presentation topic is required"),
});

export const domainSchema = z.string().email().refine(
  (email) => {
    const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || "codeace.com";
    return email.endsWith(`@${allowedDomain}`);
  },
  { message: "Only company email addresses are allowed" }
);

export type ScoreInput = z.infer<typeof scoreSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;