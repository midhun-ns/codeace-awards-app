import { z } from "zod";

export const scoreSchema = z.object({
  topicId: z.number().int().positive(),
  email: z.string().email().toLowerCase(),
  sessionToken: z.string().uuid(),
  ratings: z
    .array(
      z.object({
        presenterId: z.number().int().positive(),
        rating: z.number().int().min(1).max(10),
      })
    )
    .min(1),
});

export const sessionSchema = z.object({
  topicId: z.number().int().positive(),
});

export const createTopicSchema = z.object({
  title: z.string().trim().min(1, "Topic title is required"),
  presenterNames: z
    .array(z.string().trim().min(1, "Presenter name is required"))
    .min(1, "At least one presenter is required"),
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
